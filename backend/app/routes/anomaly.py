from fastapi import APIRouter
from ..models.schemas import AnomalyResponse
from ..services.simulation import get_anomaly_status

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])

@router.get("/current", response_model=AnomalyResponse)
def get_current_anomaly():
    """Returns real-time demand anomaly curve and microclimate causes."""
    return get_anomaly_status()
