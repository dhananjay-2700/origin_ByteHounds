from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List

import models
import schemas
from database import engine, get_db
from ml_service import ml_service

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GRIDWISE AI MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/dashboard", response_model=schemas.DashboardSchema)
def get_dashboard(db: Session = Depends(get_db)):
    # Calculate current load
    last_timestamp = db.query(func.max(models.LoadData.timestamp)).scalar()
    
    if not last_timestamp:
        return schemas.DashboardSchema(current_load=0, tomorrow_peak=0, grid_risk="NORMAL")
        
    current_load = db.query(func.sum(models.LoadData.load_mw)).filter(
        models.LoadData.timestamp == last_timestamp
    ).scalar() or 0
    
    # Get forecast for tomorrow
    tomorrow = last_timestamp + timedelta(days=1)
    forecast_df = ml_service.get_forecast(db, tomorrow)
    
    if forecast_df.empty:
        tomorrow_peak = current_load * 1.1 # Dummy fallback
        grid_risk = "NORMAL"
    else:
        # Group by timestamp to get system-wide load
        system_forecast = forecast_df.groupby('timestamp')[['predicted_load', 'capacity']].sum().reset_index()
        tomorrow_peak = system_forecast['predicted_load'].max()
        peak_capacity = system_forecast.loc[system_forecast['predicted_load'].idxmax(), 'capacity']
        
        grid_risk = ml_service.evaluate_risk(tomorrow_peak, peak_capacity)
        
    return schemas.DashboardSchema(
        current_load=round(current_load, 1),
        tomorrow_peak=round(tomorrow_peak, 1),
        grid_risk=grid_risk
    )

@app.get("/forecast", response_model=schemas.ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    last_timestamp = db.query(func.max(models.LoadData.timestamp)).scalar()
    
    if not last_timestamp:
        return schemas.ForecastResponse(series=[], peak_demand=0, peak_time="", capacity=0, risk="NORMAL")
        
    # Get last 12 hours of actual data
    past_12h = last_timestamp - timedelta(hours=12)
    history = db.query(
        models.LoadData.timestamp,
        func.sum(models.LoadData.load_mw).label("total_load")
    ).filter(models.LoadData.timestamp >= past_12h).group_by(models.LoadData.timestamp).order_by(models.LoadData.timestamp).all()
    
    series = []
    for row in history:
        series.append(schemas.ForecastPoint(
            timestamp=row.timestamp.strftime("%Y-%m-%d %H:%M"),
            actual_load=round(row.total_load, 1)
        ))
        
    # Get next 24 hours of prediction
    tomorrow = last_timestamp + timedelta(days=1)
    forecast_df = ml_service.get_forecast(db, tomorrow)
    
    peak_demand = 0
    peak_time = ""
    capacity = 0
    risk = "NORMAL"
    
    if not forecast_df.empty:
        system_forecast = forecast_df.groupby('timestamp')[['predicted_load', 'capacity']].sum().reset_index()
        
        for _, row in system_forecast.iterrows():
            series.append(schemas.ForecastPoint(
                timestamp=row['timestamp'].strftime("%Y-%m-%d %H:%M"),
                predicted_load=round(row['predicted_load'], 1)
            ))
            
        peak_idx = system_forecast['predicted_load'].idxmax()
        peak_demand = system_forecast.loc[peak_idx, 'predicted_load']
        peak_time = system_forecast.loc[peak_idx, 'timestamp'].strftime("%H:%M")
        capacity = system_forecast.loc[peak_idx, 'capacity']
        risk = ml_service.evaluate_risk(peak_demand, capacity)
        
    return schemas.ForecastResponse(
        series=series,
        peak_demand=round(peak_demand, 1),
        peak_time=peak_time,
        capacity=round(capacity, 1),
        risk=risk
    )

@app.get("/forecast/accuracy", response_model=schemas.AccuracySchema)
def get_accuracy():
    if not ml_service.metrics:
        return schemas.AccuracySchema(mae=0, rmse=0, mape=0)
    
    return schemas.AccuracySchema(
        mae=round(ml_service.metrics['mae'], 2),
        rmse=round(ml_service.metrics['rmse'], 2),
        mape=round(ml_service.metrics['mape'], 4)
    )

@app.get("/areas", response_model=List[schemas.AreaSchema])
def get_areas(db: Session = Depends(get_db)):
    last_timestamp = db.query(func.max(models.LoadData.timestamp)).scalar()
    
    if not last_timestamp:
        return []
        
    # Current load per area
    current = db.query(
        models.LoadData.area_id,
        func.sum(models.LoadData.load_mw).label("load")
    ).filter(models.LoadData.timestamp == last_timestamp).group_by(models.LoadData.area_id).all()
    
    current_map = {row.area_id: row.load for row in current}
    
    # Capacity per area
    capacity_data = db.query(
        models.Capacity.area_id,
        func.sum(models.Capacity.capacity_mw).label("cap")
    ).group_by(models.Capacity.area_id).all()
    
    capacity_map = {row.area_id: row.cap for row in capacity_data}
    
    # Prediction per area
    tomorrow = last_timestamp + timedelta(days=1)
    forecast_df = ml_service.get_forecast(db, tomorrow)
    
    areas_result = []
    
    if not forecast_df.empty:
        # Find peak per area
        area_forecast = forecast_df.groupby(['area_id', 'timestamp'])['predicted_load'].sum().reset_index()
        peak_forecast = area_forecast.groupby('area_id')['predicted_load'].max().to_dict()
        
        for area_id in set(current_map.keys()).union(set(capacity_map.keys())):
            curr_l = current_map.get(area_id, 0)
            cap = capacity_map.get(area_id, 1)
            pred_l = peak_forecast.get(area_id, curr_l * 1.1)
            
            risk = ml_service.evaluate_risk(pred_l, cap)
            
            areas_result.append(schemas.AreaSchema(
                id=area_id,
                current_load=round(curr_l, 1),
                predicted_load=round(pred_l, 1),
                capacity=round(cap, 1),
                risk=risk
            ))
            
    return areas_result

@app.get("/areas/{area_id}", response_model=schemas.AreaSchema)
def get_area_detail(area_id: str, db: Session = Depends(get_db)):
    last_timestamp = db.query(func.max(models.LoadData.timestamp)).scalar()
    
    if not last_timestamp:
        raise HTTPException(status_code=404, detail="Data not found")
        
    # Current load per feeder in this area
    current = db.query(
        models.LoadData.feeder_id,
        models.LoadData.load_mw
    ).filter(
        models.LoadData.timestamp == last_timestamp,
        models.LoadData.area_id == area_id
    ).all()
    
    current_map = {row.feeder_id: row.load_mw for row in current}
    
    # Capacity per feeder
    capacity_data = db.query(
        models.Capacity.feeder_id,
        models.Capacity.capacity_mw
    ).filter(models.Capacity.area_id == area_id).all()
    
    capacity_map = {row.feeder_id: row.capacity_mw for row in capacity_data}
    
    # Forecast
    tomorrow = last_timestamp + timedelta(days=1)
    forecast_df = ml_service.get_forecast(db, tomorrow)
    
    feeders = []
    
    if not forecast_df.empty:
        area_df = forecast_df[forecast_df['area_id'] == area_id]
        peak_forecast = area_df.groupby('feeder_id')['predicted_load'].max().to_dict()
        
        for feeder_id in set(current_map.keys()).union(set(capacity_map.keys())):
            curr_l = current_map.get(feeder_id, 0)
            cap = capacity_map.get(feeder_id, 1)
            pred_l = peak_forecast.get(feeder_id, curr_l * 1.1)
            risk = ml_service.evaluate_risk(pred_l, cap)
            
            feeders.append(schemas.FeederSchema(
                id=feeder_id,
                current_load=round(curr_l, 1),
                predicted_load=round(pred_l, 1),
                capacity=round(cap, 1),
                risk=risk
            ))
            
    # Calculate area totals
    area_curr = sum([f.current_load for f in feeders])
    area_cap = sum([f.capacity for f in feeders])
    area_pred = sum([f.predicted_load for f in feeders])
    area_risk = ml_service.evaluate_risk(area_pred, area_cap)
    
    return schemas.AreaSchema(
        id=area_id,
        current_load=round(area_curr, 1),
        predicted_load=round(area_pred, 1),
        capacity=round(area_cap, 1),
        risk=area_risk,
        feeders=feeders
    )

@app.get("/alerts", response_model=List[schemas.AlertSchema])
def get_alerts(db: Session = Depends(get_db)):
    # In a real app we'd fetch from alerts table.
    # For MVP, we'll calculate on the fly for tomorrow based on predictions.
    last_timestamp = db.query(func.max(models.LoadData.timestamp)).scalar()
    
    if not last_timestamp:
        return []
        
    tomorrow = last_timestamp + timedelta(days=1)
    forecast_df = ml_service.get_forecast(db, tomorrow)
    
    alerts = []
    alert_id = 1
    if not forecast_df.empty:
        area_forecast = forecast_df.groupby(['area_id', 'timestamp'])[['predicted_load', 'capacity']].sum().reset_index()
        
        for area_id in area_forecast['area_id'].unique():
            area_df = area_forecast[area_forecast['area_id'] == area_id]
            peak_idx = area_df['predicted_load'].idxmax()
            
            pred = area_df.loc[peak_idx, 'predicted_load']
            cap = area_df.loc[peak_idx, 'capacity']
            time_val = area_df.loc[peak_idx, 'timestamp']
            
            risk = ml_service.evaluate_risk(pred, cap)
            
            if risk in ["HIGH", "CRITICAL"]:
                alerts.append(schemas.AlertSchema(
                    id=alert_id,
                    area_id=area_id,
                    timestamp=time_val,
                    predicted_load=round(pred, 1),
                    capacity=round(cap, 1),
                    risk_level=risk
                ))
                alert_id += 1
                
    return alerts

@app.get("/insights", response_model=schemas.InsightSchema)
def get_insights(db: Session = Depends(get_db)):
    importances = ml_service.get_feature_importances()
    top_drivers = list(importances.keys())[:3] if importances else ["Historical pattern", "Temperature", "Time of day"]
    
    # Get highest risk area
    alerts = get_alerts(db)
    attention = "All areas normal."
    headline = "Grid conditions are stable."
    body = "Our AI model predicts normal capacity utilization for tomorrow."
    
    if alerts:
        criticals = [a for a in alerts if a.risk_level == "CRITICAL"]
        if criticals:
            worst = criticals[0]
            attention = f"{worst.area_id} Zone"
            headline = f"Tomorrow's peak demand is expected to exceed capacity in {worst.area_id}."
            body = f"{worst.area_id} Zone is the highest-risk area with an expected overload around {worst.timestamp.strftime('%I:%M %p')}."
        else:
            worst = alerts[0]
            attention = f"{worst.area_id} Zone"
            headline = f"High demand expected in {worst.area_id} tomorrow."
            body = f"Please monitor {worst.area_id} closely around {worst.timestamp.strftime('%I:%M %p')}."
            
    return schemas.InsightSchema(
        headline=headline,
        body=body,
        primary_drivers=[f"• {d}" for d in top_drivers],
        recommended_attention=attention
    )
