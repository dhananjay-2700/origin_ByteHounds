from fastapi import APIRouter
from ..models.schemas import RiskTimelineResponse
from ..services.simulation import get_risk_timeline

router = APIRouter(prefix="/risk", tags=["Grid Risk"])

@router.get("", response_model=RiskTimelineResponse)
@router.get("/timeline", response_model=RiskTimelineResponse)
def get_grid_risk_timeline():
    """Returns horizontal time-based risk progression stages."""
    return get_risk_timeline()

@router.get("/contributors")
def get_risk_contributors():
    """Returns the top weighted factors contributing to current Delhi grid stress."""
    return [
        {"name": "Demand Utilization", "weight": 88},
        {"name": "Weather Stress", "weight": 74},
        {"name": "Demand Ramp Rate", "weight": 62},
        {"name": "Residual Anomaly", "weight": 41},
        {"name": "Forecast Uncertainty", "weight": 28},
    ]
