from fastapi import APIRouter
from ..models.schemas import SystemHealthResponse
from ..services.simulation import get_system_health

router = APIRouter(prefix="/system", tags=["System Diagnostics"])

@router.get("/health", response_model=SystemHealthResponse)
def get_system_telemetry_health():
    """Returns SCADA telemetry latency, coverage %, and discom synchronization status."""
    return get_system_health()
