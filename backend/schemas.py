from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class LoadDataSchema(BaseModel):
    timestamp: datetime
    area_id: str
    feeder_id: str
    load_mw: float

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: int
    area_id: str
    timestamp: datetime
    predicted_load: float
    capacity: float
    risk_level: str

    class Config:
        from_attributes = True

class DashboardSchema(BaseModel):
    current_load: float
    tomorrow_peak: float
    peak_time: str
    grid_risk_score: int
    grid_risk_level: str
    critical_window: str
    data_health_score: int

class ForecastPoint(BaseModel):
    timestamp: str
    actual_load: Optional[float] = None
    predicted_load: Optional[float] = None
    baseline_load: Optional[float] = None
    lightgbm_load: Optional[float] = None

class ForecastResponse(BaseModel):
    series: List[ForecastPoint]
    peak_demand: float
    peak_time: str
    capacity: float
    risk_score: int
    risk_level: str
    critical_window: str
    ramp_rate: float

class PeakForecastResponse(BaseModel):
    critical_window: str
    peak_demand: float
    grid_risk_score: int
    grid_risk_level: str
    demand_ramp: float
    forecast_temp: float

class AccuracySchema(BaseModel):
    mae: float
    rmse: float
    mape: float
    peak_error: float
    peak_timing_error: str
    best_model: str

class RiskContributor(BaseModel):
    name: str
    weight: int

class TimelineRiskPoint(BaseModel):
    time: str
    risk_score: int
    risk_level: str

class RiskResponse(BaseModel):
    risk_score: int
    risk_level: str
    contributors: List[RiskContributor]
    timeline: List[TimelineRiskPoint]

class AnomalySchema(BaseModel):
    id: int
    timestamp: str
    area_id: str
    expected_load: float
    observed_load: float
    deviation: float
    severity: str
    why: str

class SHAPDriver(BaseModel):
    feature: str
    percentage: int
    impact: str

class ExplanationResponse(BaseModel):
    headline: str
    summary: str
    shap_drivers: List[SHAPDriver]
    primary_drivers: List[str]

class TempDemandPoint(BaseModel):
    time: str
    temperature: float
    demand: float

class WeatherResponse(BaseModel):
    temperature: float
    condition: str
    humidity: float
    demand_impact: str
    summary: str
    series: List[TempDemandPoint]

class FeederSchema(BaseModel):
    id: str
    current_load: float
    predicted_load: float
    capacity: float
    risk: str

class AreaSchema(BaseModel):
    id: str
    name: str
    risk_score: int
    risk_level: str
    current_load: float
    predicted_load: float
    capacity: float
    utilization: float
    main_driver: str
    critical_window: str
    feeders: Optional[List[FeederSchema]] = None
    disclaimer: str = "Modeled / simulated area intelligence"

class SimulationRequest(BaseModel):
    temperature: float = 41.2
    humidity: float = 52.0
    solar_contribution: float = 10.0
    demand_growth: float = 0.0

class WaitlistCreate(BaseModel):
    email: str

class WaitlistResponse(BaseModel):
    id: int
    email: str
    timestamp: datetime

    class Config:
        from_attributes = True

class SimulationResponse(BaseModel):
    base_peak: float
    scenario_peak: float
    peak_change: float
    base_risk: int
    base_risk_level: str
    scenario_risk: int
    scenario_risk_level: str
    alert_message: str

class CopilotRequest(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    query: str
    intent: str
    api_calls: List[str]
    structured_result: Dict[str, Any]
    answer: str

class DataHealthMetric(BaseModel):
    name: str
    score: int
    status: str

class DataHealthResponse(BaseModel):
    overall_score: int
    status_label: str
    metrics: List[DataHealthMetric]
    last_validated: str

