from fastapi import APIRouter
from ..models.schemas import ScenarioRequest, ScenarioResponse
from ..services.simulation import simulate_scenario

router = APIRouter(prefix="/scenario", tags=["Scenario Lab"])

@router.post("/simulate", response_model=ScenarioResponse)
def run_scenario_simulation(req: ScenarioRequest):
    """Dynamically simulates counterfactual Delhi forecast and stress based on temperature, growth, and solar."""
    return simulate_scenario(req)
