import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "DroneCraft / AeroOptima"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dronecraft.db")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]
    AIR_DENSITY_SEA_LEVEL: float = 1.225  # kg/m^3
    GRAVITY: float = 9.80665  # m/s^2

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
