import os
import json
import logging
from typing import Optional, Dict, Any
import httpx
from ..config import api_credentials
from .simulation import get_live_metrics

logger = logging.getLogger("CustomModelAdapter")

class CustomModelAdapter:
    """
    Adapter for communicating with the team's custom in-house trained model.
    Supports:
    1. Local inference server (e.g., vLLM, Ollama, TGI, or custom FastAPI/Triton server).
    2. Local weights loading (PyTorch / ONNX / GGUF).
    3. Seamless fallback while the model is training or offline.
    """

    def __init__(self):
        self.endpoint = api_credentials.CUSTOM_MODEL_ENDPOINT
        self.weights_path = api_credentials.CUSTOM_MODEL_WEIGHTS_PATH

    async def generate_response(self, user_query: str) -> Optional[str]:
        """
        Sends the user query along with real-time Delhi SCADA context to your custom model.
        """
        if not api_credentials.has_custom_endpoint():
            return None

        live = get_live_metrics()
        system_context = (
            f"You are PRVAAH X, the custom-trained electricity grid analyst for Delhi NCT. "
            f"Live Context: Current Load={live.currentDemand} MW, Peak Projected={live.nextPeakDemand} MW, "
            f"Frequency={live.gridFrequency} Hz, Temp={live.ambientTemp}°C, Reserve={live.reserveMargin} MW."
        )

        payload = {
            "prompt": f"{system_context}\n\nUser Question: {user_query}\nAnswer:",
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_query}
            ],
            "query": user_query,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(self.endpoint, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    # Handle common inference output formats
                    if "response" in data:
                        return data["response"]
                    if "choices" in data and len(data["choices"]) > 0:
                        choice = data["choices"][0]
                        if "message" in choice and "content" in choice["message"]:
                            return choice["message"]["content"]
                        if "text" in choice:
                            return choice["text"]
                    if "generated_text" in data:
                        return data["generated_text"]
                    if "text" in data:
                        return data["text"]
        except Exception as e:
            logger.debug(f"Custom model endpoint unreachable ({e}). Using built-in grid knowledge engine.")

        return None

custom_model_adapter = CustomModelAdapter()
