import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings
from .config import api_credentials
from .db.session import init_db
from .services.ingestion import start_background_ingestion
from .routes import (
    telemetry,
    forecast,
    risk,
    explainability,
    anomaly,
    areas,
    scenario,
    copilot,
    system,
    alerts,
    analytics,
    model_management,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Database Tables and Seeds
    init_db()
    
    # 2. Start Background Weather, SLDC & Telemetry Ingestion Worker
    worker_task = asyncio.create_task(start_background_ingestion())
    
    yield
    
    # Clean up worker on shutdown
    worker_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI electricity demand forecasting, physical load simulation, and grid-risk intelligence platform for Delhi NCT.",
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(forecast.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(explainability.router, prefix=settings.API_V1_STR)
app.include_router(anomaly.router, prefix=settings.API_V1_STR)
app.include_router(areas.router, prefix=settings.API_V1_STR)
app.include_router(scenario.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(model_management.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "platform": "PRVAAH X",
        "descriptor": "Delhi Grid Intelligence Engine",
        "status": "online",
        "version": settings.VERSION,
        "database": "connected (SQLAlchemy)",
        "docs": "/docs",
        "websocket": "ws://127.0.0.1:8000/api/telemetry/ws",
        "model_config_file": "backend/app/config/api_credentials.py",
        "credentials_config_file": "backend/app/config/api_credentials.py",
    }

@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "prvaah-x-production-backend"}

@app.get("/api/credentials/status", tags=["Configuration"])
def get_credentials_status():
    """
    Returns non-sensitive status of configured model, data, and database endpoints.
    Shows the active inference mode for your custom in-house trained model.
    """
    return {
        "custom_model": {
            "active_mode": api_credentials.get_active_model_mode(),
            "inference_endpoint": api_credentials.CUSTOM_MODEL_ENDPOINT,
            "weights_path": api_credentials.CUSTOM_MODEL_WEIGHTS_PATH,
            "has_weights": api_credentials.has_custom_weights(),
            "has_custom_forecaster": api_credentials.has_custom_forecaster(),
            "config_file": "backend/app/config/api_credentials.py",
        },
        "weather_service": {
            "source": "OpenWeatherMap" if api_credentials.has_openweather() else "Open-Meteo (Free Real Delhi Feed)",
            "openweather_configured": api_credentials.has_openweather(),
        },
        "notifications": {
            "webhook_configured": api_credentials.has_alert_webhook(),
            "slack_configured": bool(api_credentials.SLACK_WEBHOOK_URL),
            "discord_configured": bool(api_credentials.DISCORD_WEBHOOK_URL),
        },
        "grid_sources": {
            "delhi_sldc_url": api_credentials.DELHI_SLDC_API_URL,
            "delhi_sldc_key_configured": bool(api_credentials.DELHI_SLDC_API_KEY),
        },
        "database": {
            "url_type": "SQLite (Local File)" if "sqlite" in api_credentials.DATABASE_URL else "PostgreSQL/TimescaleDB",
            "connected": True,
        },
    }
