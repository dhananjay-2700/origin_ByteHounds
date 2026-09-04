from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..models.schemas import GridMetricsResponse
from ..services.ingestion import grid_state
from ..services.simulation import get_live_metrics

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/live", response_model=GridMetricsResponse)
def get_live_grid_telemetry():
    """Returns real-time Delhi grid concurrency metrics and frequency."""
    # Incorporate live state values from background ingestion worker
    return GridMetricsResponse(
        currentDemand=grid_state.demand_mw,
        nextPeakDemand=8740,
        peakTime="17:45",
        gridRisk=grid_state.grid_risk,
        gridFrequency=grid_state.frequency_hz,
        reserveMargin=grid_state.reserve_margin_mw,
        ambientTemp=grid_state.ambient_temp,
        heatIndex=grid_state.heat_index,
        lastUpdated=f"{grid_state.last_weather_update.strftime('%H:%M:%S')} IST",
    )

@router.websocket("/ws")
async def telemetry_websocket_stream(websocket: WebSocket):
    """
    Real-time streaming WebSocket endpoint.
    Broadcasts live grid frequency oscillations (Hz) and demand MW ticks every second.
    """
    await websocket.accept()
    grid_state.active_websockets.add(websocket)
    try:
        # Initial greeting packet
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to PRVAAH X Live Telemetry Stream",
            "initialDemandMW": grid_state.demand_mw,
            "initialFrequencyHz": grid_state.frequency_hz,
        })
        # Keep socket open and listen for any client ping
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        grid_state.active_websockets.discard(websocket)
    except Exception:
        grid_state.active_websockets.discard(websocket)
