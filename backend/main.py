import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)

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

app = FastAPI(title="Pravaah AI MVP API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import telemetry, alerts, analytics, model_management, system
app.include_router(telemetry.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(model_management.router, prefix="/api")
app.include_router(system.router, prefix="/api")

@app.get("/")
def root():
    return {
        "platform": "Pravaah AI",
        "descriptor": "Delhi Grid Intelligence Engine & Demand Forecasting API",
        "status": "online",
        "version": "2.0.0",
        "docs": "/docs",
        "frontend": "http://localhost:3000"
    }

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "platform": "Pravaah AI",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/dashboard", response_model=schemas.DashboardSchema)
@app.get("/dashboard", response_model=schemas.DashboardSchema)
def get_dashboard(db: Session = Depends(get_db)):
    data = ml_service.get_dashboard_metrics()
    return schemas.DashboardSchema(**data)

@app.get("/api/forecast", response_model=schemas.ForecastResponse)
@app.get("/forecast", response_model=schemas.ForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    data = ml_service.get_forecast_response()
    return schemas.ForecastResponse(**data)

@app.get("/api/forecast/peak", response_model=schemas.PeakForecastResponse)
def get_peak_forecast():
    data = ml_service.get_peak_forecast()
    return schemas.PeakForecastResponse(**data)

@app.get("/api/forecast/accuracy", response_model=schemas.AccuracySchema)
@app.get("/forecast/accuracy", response_model=schemas.AccuracySchema)
def get_accuracy():
    data = ml_service.get_accuracy_metrics()
    return schemas.AccuracySchema(**data)

@app.get("/api/risk", response_model=schemas.RiskResponse)
def get_risk():
    data = ml_service.get_risk_analysis()
    return schemas.RiskResponse(**data)

@app.get("/api/anomalies", response_model=List[schemas.AnomalySchema])
def get_anomalies():
    data = ml_service.get_anomalies()
    return [schemas.AnomalySchema(**item) for item in data]

@app.get("/api/explanation", response_model=schemas.ExplanationResponse)
def get_explanation():
    data = ml_service.get_shap_explanation()
    shap_drivers = [
        schemas.SHAPDriver(feature=d["feature"], percentage=d["percentage"], impact=d["impact"])
        for d in data["drivers"]
    ]
    return schemas.ExplanationResponse(
        headline=data["headline"],
        summary=data["summary"],
        shap_drivers=shap_drivers,
        primary_drivers=data["primary_drivers"]
    )

@app.get("/api/weather", response_model=schemas.WeatherResponse)
def get_weather():
    data = ml_service.get_weather_intelligence()
    series = [schemas.TempDemandPoint(**item) for item in data["series"]]
    return schemas.WeatherResponse(
        temperature=data["temperature"],
        condition=data["condition"],
        humidity=data["humidity"],
        demand_impact=data["demand_impact"],
        summary=data["summary"],
        series=series
    )

@app.get("/api/areas", response_model=List[schemas.AreaSchema])
@app.get("/areas", response_model=List[schemas.AreaSchema])
def get_areas(db: Session = Depends(get_db)):
    data = ml_service.get_areas()
    return [schemas.AreaSchema(**item) for item in data]

@app.get("/api/areas/{area_id}", response_model=schemas.AreaSchema)
@app.get("/areas/{area_id}", response_model=schemas.AreaSchema)
def get_area_detail(area_id: str, db: Session = Depends(get_db)):
    areas = get_areas(db)
    for a in areas:
        if a.id.lower() == area_id.lower() or a.name.lower() == area_id.lower():
            a.feeders = [
                schemas.FeederSchema(id=f"{a.id[:2]}-F1", name=f"{a.name} Feeder 1", current_load=round(a.current_load*0.5, 1), predicted_load=round(a.predicted_load*0.5, 1), capacity=round(a.capacity*0.5, 1), risk=a.risk_level, status=a.risk_level),
                schemas.FeederSchema(id=f"{a.id[:2]}-F2", name=f"{a.name} Feeder 2", current_load=round(a.current_load*0.5, 1), predicted_load=round(a.predicted_load*0.5, 1), capacity=round(a.capacity*0.5, 1), risk=a.risk_level, status=a.risk_level)
            ]
            return a
            
    first = areas[0]
    first.feeders = [
        schemas.FeederSchema(id="SD-F1", name="South Delhi Feeder 1", current_load=round(first.current_load*0.5, 1), predicted_load=round(first.predicted_load*0.5, 1), capacity=round(first.capacity*0.5, 1), risk=first.risk_level, status=first.risk_level),
        schemas.FeederSchema(id="SD-F2", name="South Delhi Feeder 2", current_load=round(first.current_load*0.5, 1), predicted_load=round(first.predicted_load*0.5, 1), capacity=round(first.capacity*0.5, 1), risk=first.risk_level, status=first.risk_level)
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)

