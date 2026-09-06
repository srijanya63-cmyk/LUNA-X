import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LUNA-X Mission Control API"
    VERSION: str = "0.3.0"
    API_V1_STR: str = "/api/v1"
    
    # Data directory
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "demo")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Optional Local AI (Ollama) settings
    OLLAMA_ENABLED: bool = True
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3:latest"
    OLLAMA_TIMEOUT_SECONDS: float = 3.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
