from typing import List
from fastapi import APIRouter
from ..models.schemas import DelhiArea
from ..services.simulation import get_delhi_areas

router = APIRouter(prefix="/areas", tags=["Area Intelligence"])

@router.get("", response_model=List[DelhiArea])
def get_all_delhi_areas():
    """Returns regional GIS and substation telemetry for all Delhi sectors."""
    return get_delhi_areas()
