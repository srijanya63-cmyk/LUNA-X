from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.models.mission import MissionObjective, RiskTolerance


class AIStatusResponse(BaseModel):
    """Status payload for local Ollama AI layer."""
    enabled: bool = Field(description="Whether local AI feature flag is active")
    provider: str = Field(default="ollama", description="AI provider name")
    local: bool = Field(default=True, description="Always true; zero cloud LLM calls")
    available: bool = Field(description="Whether local Ollama service responded to health check")
    model: str = Field(description="Target local model name")
    fallback_enabled: bool = Field(default=True, description="Whether deterministic template fallback is ready")


class IntentParseRequest(BaseModel):
    """Natural language mission prompt request."""
    prompt: str = Field(description="User prompt e.g. 'I want a high safety mission targeting ice'")


class IntentParseResponse(BaseModel):
    """Structured mission parameters derived from prompt or template fallback."""
    objective: MissionObjective
    risk_tolerance: RiskTolerance
    energy_budget_wh: float = Field(default=500.0)
    max_allowed_slope_deg: float = Field(default=18.0)
    max_allowed_hazard: float = Field(default=0.75)
    source: str = Field(description="'ollama_llm' or 'template_fallback'")
    local_ai_available: bool = Field(description="Whether local Ollama was reachable")


class ExplainMissionRequest(BaseModel):
    """Request payload for scientific briefing generation."""
    mission_summary: Dict[str, Any] = Field(description="Deterministic calculation outputs JSON")


class ExplainMissionResponse(BaseModel):
    """Narrative mission summary payload."""
    explanation_text: str = Field(description="Structured scientific mission briefing")
    source: str = Field(description="'ollama_llm' or 'template_fallback'")
    local_ai_available: bool = Field(description="Whether local Ollama was reachable")
