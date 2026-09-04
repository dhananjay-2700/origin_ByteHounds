from fastapi import APIRouter
from ..models.schemas import ForecastResponse
from ..services.simulation import get_24h_forecast

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.get("/24h", response_model=ForecastResponse)
def get_twenty_four_hour_forecast():
    """Returns 24-hour predictive demand curve with 95% confidence bounds."""
    return get_24h_forecast()
