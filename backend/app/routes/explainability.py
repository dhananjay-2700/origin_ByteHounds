from fastapi import APIRouter
from ..models.schemas import ShapResponse
from ..services.simulation import get_shap_factors

router = APIRouter(prefix="/explainability", tags=["Explainability"])

@router.get("/shap", response_model=ShapResponse)
def get_shap_attribution():
    """Returns SHAP-style contribution breakdown of grid demand drivers."""
    return get_shap_factors()
