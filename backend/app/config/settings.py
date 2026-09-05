from pydantic_settings import BaseSettings
from typing import List
from . import api_credentials

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pravaah AI — Delhi Grid Intelligence Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Server Host & Port
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*",
    ]

    # Database
    DATABASE_URL: str = api_credentials.DATABASE_URL

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
