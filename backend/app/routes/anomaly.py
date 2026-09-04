from fastapi import APIRouter
from ..models.schemas import AnomalyResponse
from ..services.simulation import get_anomaly_status

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])

@router.get("", response_model=AnomalyResponse)
@router.get("/current", response_model=AnomalyResponse)
def get_current_anomaly():
    """Returns real-time demand anomaly curve and microclimate causes."""
    return get_anomaly_status()

@router.get("/history")
def get_anomaly_history():
    """Returns historical sequence of detected load excursions and resolution states."""
    cur = get_anomaly_status()
    return {
        "recent_incidents": [
            {
                "id": "ANOM-DL-8021",
                "timestamp": "15:45 IST",
                "severity": "HIGH",
                "deviation_mw": cur.peakDeviationMW,
                "deviation_percent": cur.peakDeviationPercent,
                "root_cause": cur.rootCauseCategory,
                "status": "ACTIVE_INVESTIGATION"
            },
            {
                "id": "ANOM-DL-8019",
                "timestamp": "Yesterday 14:15 IST",
                "severity": "ELEVATED",
                "deviation_mw": 320,
                "deviation_percent": 4.1,
                "root_cause": "Unscheduled Commercial Chiller Startups",
                "status": "RESOLVED"
            }
        ],
        "points": cur.points
    }
