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

app = FastAPI(title="PRVAAH X MVP API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/dashboard", response_model=schemas.DashboardSchema)
@app.get("/dashboard", response_model=schemas.DashboardSchema)
def get_dashboard(db: Session = Depends(get_db)):
    return schemas.DashboardSchema(
        current_load=7840.0,
        tomorrow_peak=8620.0,
        peak_time="15:15 Tomorrow",
        grid_risk_score=82,
        grid_risk_level="HIGH",
        critical_window="14:15 — 16:00",
        data_health_score=94
    )

@app.get("/api/forecast", response_model=schemas.ForecastResponse)
@app.get("/forecast", response_model=schemas.ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    # Generate 24-hour demand curve matching Delhi MVP profile
    hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "15:15", "16:00", "18:00", "20:00", "22:00", "24:00"]
    actuals = [7100, 6800, 6650, 6900, 7400, 7840, None, None, None, None, None, None, None, None]
    predictions = [7050, 6780, 6620, 6920, 7410, 7840, 8150, 8510, 8620, 8580, 8250, 7920, 7550, 7200]
    baselines = [7000, 6700, 6500, 6800, 7300, 7700, 8000, 8300, 8420, 8380, 8100, 7800, 7450, 7100]
    lightgbm = [7030, 6760, 6600, 6900, 7390, 7820, 8120, 8490, 8590, 8550, 8220, 7900, 7530, 7180]
    
    series = []
    for h, act, pred, base, lgb in zip(hours, actuals, predictions, baselines, lightgbm):
        series.append(schemas.ForecastPoint(
            timestamp=h,
            actual_load=act,
            predicted_load=pred,
            baseline_load=base,
            lightgbm_load=lgb
        ))
        
    return schemas.ForecastResponse(
        series=series,
        peak_demand=8620.0,
        peak_time="15:15",
        capacity=9800.0,
        risk_score=82,
        risk_level="HIGH",
        critical_window="14:15 — 16:00",
        ramp_rate=640.0
    )

@app.get("/api/forecast/peak", response_model=schemas.PeakForecastResponse)
def get_peak_forecast():
    return schemas.PeakForecastResponse(
        critical_window="14:15 — 16:00",
        peak_demand=8620.0,
        grid_risk_score=82,
        grid_risk_level="HIGH",
        demand_ramp=640.0,
        forecast_temp=41.2
    )

@app.get("/api/forecast/accuracy", response_model=schemas.AccuracySchema)
@app.get("/forecast/accuracy", response_model=schemas.AccuracySchema)
def get_accuracy():
    return schemas.AccuracySchema(
        mae=48.5,
        rmse=62.3,
        mape=0.0142, # 1.42%
        peak_error=0.85, # 0.85%
        peak_timing_error="0 mins",
        best_model="XGBoost (Main)"
    )

@app.get("/api/risk", response_model=schemas.RiskResponse)
def get_risk():
    contributors = [
        schemas.RiskContributor(name="Demand Utilization", weight=88),
        schemas.RiskContributor(name="Weather Stress", weight=74),
        schemas.RiskContributor(name="Demand Ramp Rate", weight=62),
        schemas.RiskContributor(name="Residual Anomaly", weight=41),
        schemas.RiskContributor(name="Forecast Uncertainty", weight=28)
    ]
    
    timeline = [
        schemas.TimelineRiskPoint(time="10:00", risk_score=38, risk_level="LOW"),
        schemas.TimelineRiskPoint(time="12:00", risk_score=62, risk_level="MODERATE"),
        schemas.TimelineRiskPoint(time="14:00", risk_score=79, risk_level="HIGH"),
        schemas.TimelineRiskPoint(time="15:00", risk_score=91, risk_level="CRITICAL"),
        schemas.TimelineRiskPoint(time="16:00", risk_score=82, risk_level="HIGH"),
        schemas.TimelineRiskPoint(time="18:00", risk_score=58, risk_level="MODERATE")
    ]
    
    return schemas.RiskResponse(
        risk_score=82,
        risk_level="HIGH",
        contributors=contributors,
        timeline=timeline
    )

@app.get("/api/anomalies", response_model=List[schemas.AnomalySchema])
def get_anomalies():
    return [
        schemas.AnomalySchema(
            id=1,
            timestamp="14:15 Tomorrow",
            area_id="South Delhi",
            expected_load=7820.0,
            observed_load=8430.0,
            deviation=610.0,
            severity="HIGH",
            why="Demand is significantly above the model's expected statistical residual range due to rapid localized HVAC ramp."
        )
    ]

@app.get("/api/explanation", response_model=schemas.ExplanationResponse)
def get_explanation():
    shap_data = ml_service.get_shap_explanation()
    shap_drivers = [
        schemas.SHAPDriver(feature=d["feature"], percentage=d["percentage"], impact=d["impact"])
        for d in shap_data["drivers"]
    ]
    return schemas.ExplanationResponse(
        headline=shap_data["headline"],
        summary=shap_data["summary"],
        shap_drivers=shap_drivers,
        primary_drivers=shap_data["primary_drivers"]
    )

@app.get("/api/weather", response_model=schemas.WeatherResponse)
def get_weather():
    series = [
        schemas.TempDemandPoint(time="08:00", temperature=32.5, demand=7400),
        schemas.TempDemandPoint(time="10:00", temperature=35.8, demand=7840),
        schemas.TempDemandPoint(time="12:00", temperature=38.4, demand=8150),
        schemas.TempDemandPoint(time="14:00", temperature=40.6, demand=8510),
        schemas.TempDemandPoint(time="15:15", temperature=41.2, demand=8620),
        schemas.TempDemandPoint(time="16:00", temperature=40.8, demand=8580),
        schemas.TempDemandPoint(time="18:00", temperature=37.2, demand=8250),
        schemas.TempDemandPoint(time="20:00", temperature=34.1, demand=7920),
    ]
    return schemas.WeatherResponse(
        temperature=41.2,
        condition="Extreme Heat",
        humidity=52.0,
        demand_impact="↑ HIGH",
        summary="High temperature is increasing cooling-driven demand sharply across all grid sectors.",
        series=series
    )

@app.get("/api/areas", response_model=List[schemas.AreaSchema])
@app.get("/areas", response_model=List[schemas.AreaSchema])
def get_areas(db: Session = Depends(get_db)):
    return [
        schemas.AreaSchema(
            id="South Delhi",
            name="South Delhi Grid",
            risk_score=86,
            risk_level="CRITICAL",
            current_load=1880.0,
            predicted_load=2140.0,
            capacity=2280.0,
            utilization=94.0,
            main_driver="Extreme Temperature",
            critical_window="14:30 – 16:00",
            disclaimer="Modeled / simulated area intelligence"
        ),
        schemas.AreaSchema(
            id="North Delhi",
            name="North Delhi Grid",
            risk_score=78,
            risk_level="HIGH",
            current_load=1520.0,
            predicted_load=1720.0,
            capacity=1950.0,
            utilization=88.2,
            main_driver="Baseline Ramp",
            critical_window="14:15 – 15:45",
            disclaimer="Modeled / simulated area intelligence"
        ),
        schemas.AreaSchema(
            id="West Delhi",
            name="West Delhi Grid",
            risk_score=64,
            risk_level="HIGH",
            current_load=1310.0,
            predicted_load=1480.0,
            capacity=1750.0,
            utilization=84.5,
            main_driver="Diurnal Peak",
            critical_window="14:45 – 16:15",
            disclaimer="Modeled / simulated area intelligence"
        ),
        schemas.AreaSchema(
            id="East Delhi",
            name="East Delhi Grid",
            risk_score=51,
            risk_level="MODERATE",
            current_load=1180.0,
            predicted_load=1280.0,
            capacity=1600.0,
            utilization=80.0,
            main_driver="Humidity Load",
            critical_window="15:00 – 16:30",
            disclaimer="Modeled / simulated area intelligence"
        )
    ]

@app.get("/api/areas/{area_id}", response_model=schemas.AreaSchema)
@app.get("/areas/{area_id}", response_model=schemas.AreaSchema)
def get_area_detail(area_id: str, db: Session = Depends(get_db)):
    areas = get_areas(db)
    for a in areas:
        if a.id.lower() == area_id.lower() or a.name.lower() == area_id.lower():
            a.feeders = [
                schemas.FeederSchema(id=f"{a.id[:2]}-F1", current_load=round(a.current_load*0.5, 1), predicted_load=round(a.predicted_load*0.5, 1), capacity=round(a.capacity*0.5, 1), risk=a.risk_level),
                schemas.FeederSchema(id=f"{a.id[:2]}-F2", current_load=round(a.current_load*0.5, 1), predicted_load=round(a.predicted_load*0.5, 1), capacity=round(a.capacity*0.5, 1), risk=a.risk_level)
            ]
            return a
            
    # Default fallback if area not matched exactly
    first = areas[0]
    first.feeders = [
        schemas.FeederSchema(id="SD-F1", current_load=940.0, predicted_load=1070.0, capacity=1140.0, risk="CRITICAL"),
        schemas.FeederSchema(id="SD-F2", current_load=940.0, predicted_load=1070.0, capacity=1140.0, risk="CRITICAL")
    ]
    return first

@app.get("/api/data-health", response_model=schemas.DataHealthResponse)
def get_data_health():
    metrics = [
        schemas.DataHealthMetric(name="Load Data", score=98, status="EXCELLENT"),
        schemas.DataHealthMetric(name="Weather Data", score=95, status="EXCELLENT"),
        schemas.DataHealthMetric(name="Missing Values", score=96, status="EXCELLENT"),
        schemas.DataHealthMetric(name="Timestamp Quality", score=100, status="PERFECT"),
        schemas.DataHealthMetric(name="Duplicates", score=99, status="EXCELLENT"),
        schemas.DataHealthMetric(name="Data Freshness", score=91, status="GOOD")
    ]
    return schemas.DataHealthResponse(
        overall_score=94,
        status_label="EXCELLENT",
        metrics=metrics,
        last_validated="04 Sep 2026 · 18:42"
    )

@app.post("/api/simulation", response_model=schemas.SimulationResponse)
def run_simulation(req: schemas.SimulationRequest):
    res = ml_service.run_simulation(
        temp=req.temperature,
        humidity=req.humidity,
        solar=req.solar_contribution,
        demand_growth=req.demand_growth
    )
    return schemas.SimulationResponse(**res)

@app.post("/api/copilot", response_model=schemas.CopilotResponse)
def run_copilot(req: schemas.CopilotRequest):
    res = ml_service.process_copilot_query(req.query)
    return schemas.CopilotResponse(**res)

@app.post("/api/waitlist", response_model=schemas.WaitlistResponse)
def join_waitlist(req: schemas.WaitlistCreate, db: Session = Depends(get_db)):
    db_waitlist = models.Waitlist(email=req.email)
    db.add(db_waitlist)
    try:
        db.commit()
        db.refresh(db_waitlist)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    return db_waitlist

