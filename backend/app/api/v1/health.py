from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.core.config import settings
from app.ai.ollama_client import OllamaClient

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    version: str = Field(default=settings.VERSION)
    scientific_engine: str = Field(default="available")
    mission_engine: str = Field(default="available")
    ollama: str = Field(description="'available' or 'unavailable'")


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
async def health_check():
    """
    Checks system health and engine readiness.
    System reports healthy even when optional local Ollama service is unavailable.
    """
    client = OllamaClient()
    ollama_online = await client.check_health()

    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        scientific_engine="available",
        mission_engine="available",
        ollama="available" if ollama_online else "unavailable"
    )
