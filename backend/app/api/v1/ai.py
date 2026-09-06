from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.ai.ollama_client import OllamaClient
from app.ai.intent_parser import IntentParser
from app.schemas.ai import (
    AIStatusResponse,
    IntentParseRequest,
    IntentParseResponse,
    ExplainMissionRequest,
    ExplainMissionResponse
)

router = APIRouter(prefix="/ai", tags=["Local AI"])


@router.get("/status", response_model=AIStatusResponse, summary="Get Local AI Readiness Status")
async def get_ai_status():
    """
    Exposes local Ollama AI availability status. Zero external cloud API calls.
    """
    client = OllamaClient()
    available = await client.check_health()

    return AIStatusResponse(
        enabled=settings.OLLAMA_ENABLED,
        provider="ollama",
        local=True,
        available=available,
        model=settings.OLLAMA_MODEL,
        fallback_enabled=True
    )


@router.post("/parse-intent", response_model=IntentParseResponse, summary="Parse Natural Language Intent")
async def parse_natural_language_intent(request: IntentParseRequest):
    """
    Converts user prompt e.g. 'I want a high safety mission' into structured MissionConfig parameters.
    Uses local Ollama or template fallback if Ollama is unreachable.
    """
    parser = IntentParser()
    result = await parser.parse_prompt(request.prompt)
    return result


@router.post("/explain", response_model=ExplainMissionResponse, summary="Generate Technical Briefing")
async def explain_mission_rationale(request: ExplainMissionRequest):
    """
    Generates technical Flight Director summary for a completed mission output JSON.
    Uses local Ollama or deterministic template fallback.
    """
    parser = IntentParser()
    result = await parser.explain_mission(request.mission_summary)
    return result
