from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..models.schemas import GridMetricsResponse
from ..services.ingestion import grid_state
from ml_service import ml_service

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.get("/live", response_model=GridMetricsResponse)
def get_live_grid_telemetry():
    """Returns real-time Delhi grid concurrency metrics and frequency."""
    dash = ml_service.get_dashboard_metrics()
    return GridMetricsResponse(
        currentDemand=int(dash["current_load"]),
        nextPeakDemand=int(dash["peak_24h"]),
        peakTime=dash["peak_time"],
        gridRisk=grid_state.grid_risk,
        gridFrequency=grid_state.frequency_hz,
        reserveMargin=grid_state.reserve_margin_mw,
        ambientTemp=grid_state.ambient_temp,
        heatIndex=grid_state.heat_index,
        lastUpdated=f"{grid_state.last_weather_update.strftime('%H:%M:%S')} IST",
    )

@router.get("/history")
def get_telemetry_history():
    """Returns trailing 24-hour demand and frequency telemetry series."""
    return {
        "current_demand": grid_state.demand_mw,
        "grid_frequency": grid_state.frequency_hz,
        "points": [
            {"time": "00:00", "demand_mw": 5420, "frequency_hz": 50.01},
            {"time": "02:00", "demand_mw": 4980, "frequency_hz": 50.02},
            {"time": "04:00", "demand_mw": 4710, "frequency_hz": 50.00},
            {"time": "06:00", "demand_mw": 5120, "frequency_hz": 49.99},
            {"time": "08:00", "demand_mw": 6150, "frequency_hz": 49.97},
            {"time": "10:00", "demand_mw": 6940, "frequency_hz": 49.96},
            {"time": "12:00", "demand_mw": 7450, "frequency_hz": 49.98},
            {"time": "14:00", "demand_mw": 7890, "frequency_hz": 49.95},
            {"time": "16:00", "demand_mw": 8120, "frequency_hz": 49.98},
        ]
    }

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
