import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ..config import api_credentials

DATABASE_URL = api_credentials.DATABASE_URL

# For SQLite, ensure check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes and creates all database tables and seeds initial data."""
    from . import models
    Base.metadata.create_all(bind=engine)
    seed_initial_data()

def seed_initial_data():
    """Seeds initial baseline records if database is empty."""
    from .models import TelemetryLog, AreaSnapshot, AnomalyLog, GridAlert, ModelCalibrationLog
    from ..services.simulation import get_delhi_areas, get_anomaly_status
    
    db = SessionLocal()
    try:
        if db.query(TelemetryLog).count() == 0:
            initial_log = TelemetryLog(
                demand_mw=8120,
                frequency_hz=49.98,
                ambient_temp=41.4,
                heat_index=46.2,
                reserve_margin_mw=460,
                grid_risk="HIGH",
                source="SYSTEM_INITIAL_SEED",
            )
            db.add(initial_log)

        if db.query(AreaSnapshot).count() == 0:
            areas = get_delhi_areas()
            for a in areas:
                snap = AreaSnapshot(
                    area_id=a.id,
                    name=a.name,
                    discom=a.discom,
                    current_load_mw=a.currentLoadMW,
                    forecast_change_percent=a.forecastChangePercent,
                    risk_level=a.riskLevel,
                    peak_time=a.peakTime,
                    capacity_mw=a.capacityMW,
                    utilization_percent=a.utilizationPercent,
                    feeders_online=a.feedersOnline,
                    total_feeders=a.totalFeeders,
                )
                db.add(snap)

        if db.query(AnomalyLog).count() == 0:
            anom = get_anomaly_status()
            log = AnomalyLog(
                time_label=anom.detectedAt,
                expected_mid_mw=7820,
                observed_mw=8350,
                deviation_mw=anom.peakDeviationMW,
                deviation_percent=anom.peakDeviationPercent,
                root_cause_category=anom.rootCauseCategory,
                root_cause_summary=anom.rootCauseSummary,
            )
            db.add(log)

        if db.query(GridAlert).count() == 0:
            sample_alerts = [
                GridAlert(
                    alert_id="ALT-DL-4001",
                    severity="CRITICAL",
                    title="Transformer Oil Overheating at 400kV Najafgarh ICT-2",
                    message="Inter-Connecting Transformer 2 winding and top oil temperature measured 78.4°C exceeding safety limit of 75°C under 94% continuous loading.",
                    substation="Najafgarh 400kV",
                    parameter="OIL_TEMP_C",
                    current_value=78.4,
                    threshold_value=75.0,
                    acknowledged=False,
                ),
                GridAlert(
                    alert_id="ALT-DL-4002",
                    severity="HIGH",
                    title="Inter-Regional Drawal Deviation Beyond IEGC Band",
                    message="Delhi drawal from Northern Regional Grid exceeded scheduled schedule by 184 MW while system frequency dipped to 49.92 Hz.",
                    substation="State Boundary / NRLDC Ring",
                    parameter="DRAWAL_DEVIATION_MW",
                    current_value=184.0,
                    threshold_value=150.0,
                    acknowledged=False,
                ),
                GridAlert(
                    alert_id="ALT-DL-4003",
                    severity="WARNING",
                    title="Bawana Gas Turbine GT-1 Secondary Cooling Water Flow Restricted",
                    message="Secondary loop heat exchanger differential pressure higher than baseline; generation capped at 210 MW.",
                    substation="Bawana CCGT 400kV",
                    parameter="COOLING_FLOW_PCT",
                    current_value=81.2,
                    threshold_value=88.0,
                    acknowledged=True,
                    acknowledged_by="Control Room Operator (Shift-B)",
                    acknowledged_at=datetime.utcnow(),
                ),
            ]
            for alert in sample_alerts:
                db.add(alert)

        if db.query(ModelCalibrationLog).count() == 0:
            calib = ModelCalibrationLog(
                dataset_name="Delhi_Summer_Load_Weather_Ensemble_2024.parquet",
                samples_count=8760,
                mape_percent=2.38,
                rmse_mw=84.5,
                r2_score=0.982,
                base_temp_coeff=142.5,
                status="CALIBRATED",
            )
            db.add(calib)

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
