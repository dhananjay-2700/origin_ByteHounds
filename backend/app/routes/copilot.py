from fastapi import APIRouter
from ..models.schemas import CopilotQueryRequest, CopilotResponse
from ..services.copilot_engine import answer_query

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

@router.post("/chat", response_model=CopilotResponse)
async def ask_gridwise_copilot(req: CopilotQueryRequest):
    """Processes natural language questions about Delhi power grid operations and risks."""
    return await answer_query(req.query)
