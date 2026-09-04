import logging
from typing import Optional, Dict, Any, List
import httpx
from ..config import api_credentials
from ..models.schemas import (
    ForecastResponse,
    RiskTimelineResponse,
    ShapResponse,
    AnomalyResponse,
    DelhiArea,
    ScenarioRequest,
    ScenarioResponse,
    CopilotResponse,
)

logger = logging.getLogger("UnifiedModelPipeline")

class UnifiedModelPipeline:
    """
    Unified interface for the team's custom in-house trained multi-task AI model.
    Handles all 7 operational intelligence capabilities:
    1. 24h Load Forecasting
    2. Grid Risk & Headroom Staging
    3. SHAP Feature Attribution
    4. Anomaly Detection & Diagnosis
    5. Substation GIS Intelligence
    6. What-If Scenario Counterfactuals
    7. Conversational Copilot Guidance
    """

    def __init__(self):
        self.endpoint = api_credentials.CUSTOM_MODEL_ENDPOINT
        self.weights_path = api_credentials.CUSTOM_MODEL_WEIGHTS_PATH

    async def invoke_task(self, task_name: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Sends an inference request to your custom model server.
        Expects payload with task identifier and context parameters.
        """
        if not api_credentials.has_custom_endpoint():
            return None

        request_body = {
            "task": task_name,
            "data": payload,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(self.endpoint, json=request_body)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.debug(f"Custom model task {task_name} unavailable on endpoint ({e}). Using engineering baseline.")

        return None

unified_pipeline = UnifiedModelPipeline()
