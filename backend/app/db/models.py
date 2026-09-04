from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text, ForeignKey, JSON
from .session import Base

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    demand_mw = Column(Integer, nullable=False)
    frequency_hz = Column(Float, nullable=False)
    ambient_temp = Column(Float, nullable=False)
    heat_index = Column(Float, nullable=False)
    reserve_margin_mw = Column(Integer, nullable=False)
    grid_risk = Column(String(50), nullable=False)
    source = Column(String(100), default="SCADA_SIM")

class ForecastRecord(Base):
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, index=True)
    run_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    target_time = Column(String(50), nullable=False)
    historical_mw = Column(Integer, nullable=True)
    predicted_mw = Column(Integer, nullable=False)
    upper_confidence_mw = Column(Integer, nullable=False)
    lower_confidence_mw = Column(Integer, nullable=False)
    is_peak = Column(Boolean, default=False)

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    time_label = Column(String(50), nullable=False)
    expected_mid_mw = Column(Integer, nullable=False)
    observed_mw = Column(Integer, nullable=False)
    deviation_mw = Column(Integer, nullable=False)
    deviation_percent = Column(Float, nullable=False)
    root_cause_category = Column(String(100), nullable=False)
    root_cause_summary = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)

class AreaSnapshot(Base):
    __tablename__ = "area_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    discom = Column(String(50), nullable=False)
    current_load_mw = Column(Integer, nullable=False)
    forecast_change_percent = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    peak_time = Column(String(50), nullable=False)
    capacity_mw = Column(Integer, nullable=False)
    utilization_percent = Column(Float, nullable=False)
    feeders_online = Column(Integer, nullable=False)
    total_feeders = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

class ScenarioAudit(Base):
    __tablename__ = "scenario_audits"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    temperature_delta = Column(Float, nullable=False)
    demand_growth_percent = Column(Float, nullable=False)
    renewable_delta_percent = Column(Float, nullable=False)
    industrial_delta_percent = Column(Float, nullable=False)
    baseline_peak_mw = Column(Integer, nullable=False)
    scenario_peak_mw = Column(Integer, nullable=False)
    delta_mw = Column(Integer, nullable=False)
    delta_percent = Column(Float, nullable=False)
    scenario_risk = Column(String(50), nullable=False)

class CopilotChatLog(Base):
    __tablename__ = "copilot_chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), default="default", index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_query = Column(Text, nullable=False)
    assistant_reply = Column(Text, nullable=False)
    metrics_json = Column(JSON, nullable=True)
    llm_provider = Column(String(50), default="local_expert")

class GridAlert(Base):
    __tablename__ = "grid_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, WARNING, INFO
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    substation = Column(String(100), nullable=False)
    parameter = Column(String(100), nullable=False)
    current_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

class ModelCalibrationLog(Base):
    __tablename__ = "model_calibration_logs"

    id = Column(Integer, primary_key=True, index=True)
    calibrated_at = Column(DateTime, default=datetime.utcnow, index=True)
    dataset_name = Column(String(150), nullable=False)
    samples_count = Column(Integer, nullable=False)
    mape_percent = Column(Float, nullable=False)
    rmse_mw = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    base_temp_coeff = Column(Float, nullable=False)
    status = Column(String(50), default="SUCCESS")
