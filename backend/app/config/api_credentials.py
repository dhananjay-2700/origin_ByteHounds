"""
=============================================================================
PRVAAH X — MODEL & SERVICE CONFIGURATION
=============================================================================

This file manages your custom in-house trained model endpoints, meteorological
telemetry, SCADA sources, and database connections.

Since you are training your own model, NO external third-party LLM keys
(OpenAI/Gemini/Anthropic) are required!
=============================================================================
"""

import os
from typing import Optional


# =============================================================================
# 1. YOUR CUSTOM IN-HOUSE TRAINED MODEL
# =============================================================================
# If you run your custom model on a local inference server (e.g., vLLM, Ollama,
# FastAPI inference server, Triton, or Hugging Face text-generation):
# Example: "http://localhost:8000/predict" or "http://localhost:11434/api/generate"
CUSTOM_MODEL_ENDPOINT: str = os.getenv("CUSTOM_MODEL_ENDPOINT", "http://localhost:11434/api/generate")

# Path to your local model checkpoint or weights file (PyTorch, ONNX, GGUF, or Safetensors):
# Example: "backend/models/custom_grid_weights.pt" or "models/delhi_load_net.onnx"
CUSTOM_MODEL_WEIGHTS_PATH: str = os.getenv("CUSTOM_MODEL_WEIGHTS_PATH", "backend/models/custom_model.pt")

# Custom Time-Series Forecaster Model Path (e.g. Informer, PatchTST, XGBoost, or LSTM):
CUSTOM_FORECASTER_WEIGHTS_PATH: str = os.getenv("CUSTOM_FORECASTER_WEIGHTS_PATH", "backend/models/forecaster.onnx")

# Preferred inference mode: "custom_endpoint" | "local_weights" | "auto"
MODEL_INFERENCE_MODE: str = os.getenv("MODEL_INFERENCE_MODE", "auto")


# =============================================================================
# 2. WEATHER & METEOROLOGICAL TELEMETRY
# =============================================================================
# Delhi Coordinates (Safdarjung / Central Delhi): 28.6139° N, 77.2090° E
# Automatically uses free real-time Open-Meteo API for live Delhi weather.
#
# (Optional) If you have a private weather station or OpenWeather key:
OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")


# =============================================================================
# 3. DELHI POWER UTILITY & SCADA DATA SOURCES
# =============================================================================
# Delhi State Load Despatch Centre (SLDC) / POSOCO / Northern Regional Grid
DELHI_SLDC_API_URL: str = os.getenv("DELHI_SLDC_API_URL", "https://delhisldc.org/live-telemetry")
DELHI_SLDC_API_KEY: str = os.getenv("DELHI_SLDC_API_KEY", "")

# Discom Sub-station Ingestion Endpoints (BRPL, BYPL, TPDDL)
BRPL_SCADA_ENDPOINT: str = os.getenv("BRPL_SCADA_ENDPOINT", "")
BYPL_SCADA_ENDPOINT: str = os.getenv("BYPL_SCADA_ENDPOINT", "")
TPDDL_SCADA_ENDPOINT: str = os.getenv("TPDDL_SCADA_ENDPOINT", "")


# =============================================================================
# 4. NOTIFICATIONS & ALERTS
# =============================================================================
# Webhooks to receive notifications when grid safety limits or thermal margins trip:
SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")
DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")
CUSTOM_ALERT_WEBHOOK_URL: str = os.getenv("CUSTOM_ALERT_WEBHOOK_URL", "")


# =============================================================================
# 5. DATABASE CONFIGURATION
<<<<<<< Updated upstream
# =============================================================================
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./prvaah_x.db")
=======
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(_BACKEND_DIR, 'gridwise.db')}")
>>>>>>> Stashed changes


# =============================================================================
# HELPER STATUS CHECKS
# =============================================================================

def has_custom_endpoint() -> bool:
    """Checks if a custom model endpoint URL is provided."""
    return bool(CUSTOM_MODEL_ENDPOINT and len(CUSTOM_MODEL_ENDPOINT.strip()) > 5)

def has_custom_weights() -> bool:
    """Checks if a local weights file exists on disk."""
    return bool(CUSTOM_MODEL_WEIGHTS_PATH and os.path.exists(CUSTOM_MODEL_WEIGHTS_PATH))

def has_custom_forecaster() -> bool:
    """Checks if a custom time-series forecaster weights file exists."""
    return bool(CUSTOM_FORECASTER_WEIGHTS_PATH and os.path.exists(CUSTOM_FORECASTER_WEIGHTS_PATH))

def has_openweather() -> bool:
    return bool(OPENWEATHER_API_KEY and len(OPENWEATHER_API_KEY.strip()) > 5)

def has_alert_webhook() -> bool:
    return bool(SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL or CUSTOM_ALERT_WEBHOOK_URL)

def get_active_model_mode() -> str:
    """Returns the active AI model mode."""
    if has_custom_weights():
        return "custom_weights_file"
    if has_custom_endpoint():
        return "custom_inference_server"
    return "built_in_grid_expert"
