from fastapi import APIRouter
from ..models.schemas import RiskTimelineResponse
from ..services.simulation import get_risk_timeline

router = APIRouter(prefix="/risk", tags=["Grid Risk"])

@router.get("/timeline", response_model=RiskTimelineResponse)
def get_grid_risk_timeline():
    """Returns horizontal time-based risk progression stages."""
    return get_risk_timeline()
