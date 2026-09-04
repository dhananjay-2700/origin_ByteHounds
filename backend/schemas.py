from pydantic import BaseModel
from typing import List, Optional
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
    grid_risk: str

class ForecastPoint(BaseModel):
    timestamp: str
    actual_load: Optional[float] = None
    predicted_load: Optional[float] = None

class ForecastResponse(BaseModel):
    series: List[ForecastPoint]
    peak_demand: float
    peak_time: str
    capacity: float
    risk: str

class AccuracySchema(BaseModel):
    mae: float
    rmse: float
    mape: float

class FeederSchema(BaseModel):
    id: str
    current_load: float
    predicted_load: float
    capacity: float
    risk: str

class AreaSchema(BaseModel):
    id: str
    current_load: float
    predicted_load: float
    capacity: float
    risk: str
    feeders: Optional[List[FeederSchema]] = None

class InsightSchema(BaseModel):
    headline: str
    body: str
    primary_drivers: List[str]
    recommended_attention: str
