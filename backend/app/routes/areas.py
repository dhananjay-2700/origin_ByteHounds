from typing import List
from fastapi import APIRouter, HTTPException
from ..models.schemas import DelhiArea
from ..services.simulation import get_delhi_areas, get_area_by_id

router = APIRouter(prefix="/areas", tags=["Area Intelligence"])

@router.get("", response_model=List[DelhiArea])
def get_all_delhi_areas():
    """Returns regional GIS and substation telemetry for all Delhi sectors."""
    return get_delhi_areas()

@router.get("/{area_id}", response_model=DelhiArea)
def get_delhi_area_detail(area_id: str):
    """Returns telemetry and GIS hotspot metrics for a specific Delhi district."""
    area = get_area_by_id(area_id)
    if not area:
        raise HTTPException(status_code=404, detail=f"Area '{area_id}' not found.")
    return area
