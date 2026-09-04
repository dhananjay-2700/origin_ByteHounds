from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GridMetricsResponse(BaseModel):
    currentDemand: int = Field(..., description="Current system electricity demand in MW")
    nextPeakDemand: int = Field(..., description="Projected peak demand in MW")
    peakTime: str = Field(..., description="Peak time in IST (e.g. 17:45)")
    gridRisk: str = Field(..., description="System risk level (STABLE, RISING, ELEVATED, HIGH, CRITICAL)")
    gridFrequency: float = Field(..., description="Grid frequency in Hz")
    reserveMargin: int = Field(..., description="Operating spinning reserve margin in MW")
    ambientTemp: float = Field(..., description="Delhi average ambient temperature in °C")
    heatIndex: float = Field(..., description="Delhi heat index in °C")
    lastUpdated: str = Field(..., description="Telemetry timestamp")

class ForecastPoint(BaseModel):
    time: str
    historical: Optional[int] = None
    predicted: int
    upperConfidence: int
    lowerConfidence: int
    isPeak: Optional[bool] = False

class ForecastResponse(BaseModel):
    horizonHours: int = 24
    accuracyMape: float = 94.8
    modelConfidence: str = "High (Ensemble v4.2)"
    peakExpectedMW: int = 8740
    peakWindow: str = "17:00 - 18:30 IST"
    points: List[ForecastPoint]

class RiskStage(BaseModel):
    time: str
    status: str
    level: str
    demandMW: int
    description: str
    contributingFactor: str
    substationMargin: str

class RiskTimelineResponse(BaseModel):
    currentRisk: str
    criticalPeakTime: str
    stages: List[RiskStage]

class ShapFactor(BaseModel):
    id: str
    name: str
    impactMW: int
    direction: str  # 'up' | 'down'
    category: str
    description: str
    percentage: int

class ShapResponse(BaseModel):
    baselineLoadMW: int
    totalPositiveMW: int
    totalNegativeMW: int
    factors: List[ShapFactor]

class AnomalyPoint(BaseModel):
    time: str
    expectedMin: int
    expectedMax: int
    expectedMid: int
    observed: int
    deviationMW: int
    deviationPercent: float
    hasAnomaly: bool

class AnomalyResponse(BaseModel):
    hasActiveAnomaly: bool
    peakDeviationMW: int
    peakDeviationPercent: float
    detectedAt: str
    durationWindow: str
    rootCauseCategory: str
    rootCauseSummary: str
    points: List[AnomalyPoint]

class DelhiArea(BaseModel):
    id: str
    name: str = Field(alias="name")
    discom: str
    currentLoadMW: int
    forecastChangePercent: float
    riskLevel: str
    peakTime: str
    capacityMW: int
    utilizationPercent: float
    feedersOnline: int
    totalFeeders: int
    description: str
    hotspotIssue: str
    coordinates: Dict[str, int]

    class Config:
        populate_by_name = True

class ScenarioRequest(BaseModel):
    temperature_delta: float = Field(0.0, ge=-5.0, le=10.0, description="Temperature change in °C")
    demand_growth_percent: float = Field(0.0, ge=-20.0, le=30.0, description="Demand growth rate %")
    renewable_delta_percent: float = Field(0.0, ge=-50.0, le=50.0, description="Solar generation change %")
    industrial_delta_percent: float = Field(0.0, ge=-30.0, le=50.0, description="Industrial load change %")

class ScenarioPoint(BaseModel):
    time: str
    baseline: int
    scenario: int

class ScenarioResponse(BaseModel):
    baselinePeakMW: int
    scenarioPeakMW: int
    deltaMW: int
    deltaPercent: float
    baselineRisk: str
    scenarioRisk: str
    thermalStressDeltaPercent: float
    points: List[ScenarioPoint]

class CopilotQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)

class CopilotMetric(BaseModel):
    label: str
    value: str

class CopilotResponse(BaseModel):
    reply: str
    timestamp: str
    metrics: Optional[List[CopilotMetric]] = None

class DiscomStatus(BaseModel):
    name: str
    code: str
    coverage: float
    status: str

class SystemHealthResponse(BaseModel):
    status: str
    lastUpdated: str
    coverage: float
    activeSubstations: int
    totalSubstations: int
    telemetryLatencyMs: int
    modelConfidenceScore: float
    ensembleVersion: str
    feederSyncStatus: str
    weatherStreamLatencySec: int
    discoms: List[DiscomStatus]

# ============================================================================
# ALERTS SCHEMAS
# ============================================================================

class AlertItem(BaseModel):
    id: int
    alert_id: str
    timestamp: str
    severity: str  # CRITICAL, HIGH, WARNING, INFO
    title: str
    message: str
    substation: str
    parameter: str
    current_value: float
    threshold_value: float
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None

class AlertListResponse(BaseModel):
    active_alerts: List[AlertItem]
    acknowledged_alerts: List[AlertItem]
    critical_count: int
    warning_count: int
    webhook_configured: bool

class AlertAcknowledgeRequest(BaseModel):
    alert_id: str
    operator_name: str = Field(default="Control Room Operator")

class AlertWebhookTestRequest(BaseModel):
    target_url: Optional[str] = None

# ============================================================================
# HISTORICAL ANALYTICS & GRID POWER MIX SCHEMAS
# ============================================================================

class HistoricalPeakRecord(BaseModel):
    year: int
    peak_mw: int
    date_time: str
    ambient_temp: float
    notes: str

class DiscomShare(BaseModel):
    name: str
    code: str
    current_demand_mw: int
    share_percent: float
    peak_forecast_mw: int
    substations_count: int

class PowerSource(BaseModel):
    source: str
    type: str  # Thermal, Hydro, Gas CCGT, Solar, Waste-to-Energy, Interstate Bilateral
    capacity_mw: int
    current_generation_mw: int
    share_percent: float

class AnalyticsSummaryResponse(BaseModel):
    all_time_peak_mw: int
    all_time_peak_date: str
    current_day_peak_mw: int
    forecast_next_peak_mw: int
    cooling_load_share_percent: float
    cooling_degree_days: float
    rooftop_solar_installed_mw: int
    discoms: List[DiscomShare]
    power_sources: List[PowerSource]
    historical_peaks: List[HistoricalPeakRecord]

# ============================================================================
# MODEL CALIBRATION & RETRAINING SCHEMAS
# ============================================================================

class ModelRetrainRequest(BaseModel):
    dataset_name: Optional[str] = "Delhi_Historical_Load_Weather_Summer.csv"
    epochs: Optional[int] = 50
    learning_rate: Optional[float] = 0.005

class ModelRetrainResponse(BaseModel):
    status: str
    message: str
    mape_percent: float
    rmse_mw: float
    r2_score: float
    samples_trained: int
    calibration_timestamp: str

class ModelMetricsResponse(BaseModel):
    active_model_name: str
    architecture: str
    last_calibrated: str
    mape_percent: float
    rmse_mw: float
    r2_score: float
    features: List[str]
