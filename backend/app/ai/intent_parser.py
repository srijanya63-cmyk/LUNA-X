import json
import logging
from typing import Optional
from app.ai.ollama_client import OllamaClient
from app.ai.prompt_templates import INTENT_PARSER_SYSTEM_PROMPT, EXPLANATION_SYSTEM_PROMPT
from app.schemas.ai import IntentParseResponse, ExplainMissionResponse
from app.models.mission import MissionObjective, RiskTolerance

logger = logging.getLogger("luna_x.ai.intent_parser")


class IntentParser:
    """Parses user natural language prompts into structured mission parameters."""

    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.client = ollama_client or OllamaClient()

    def _fallback_parse(self, prompt: str) -> IntentParseResponse:
        """Deterministic keyword-based template fallback."""
        prompt_lower = prompt.lower()
        
        # Determine objective
        objective = MissionObjective.BALANCED
        if "safety" in prompt_lower or "danger" in prompt_lower or "cautious" in prompt_lower:
            objective = MissionObjective.MAX_SAFETY
        elif "energy" in prompt_lower or "battery" in prompt_lower or "power" in prompt_lower:
            objective = MissionObjective.MIN_ENERGY
        elif "distance" in prompt_lower or "short" in prompt_lower or "quick" in prompt_lower:
            objective = MissionObjective.MIN_DISTANCE
        elif "science" in prompt_lower or "sample" in prompt_lower:
            objective = MissionObjective.MAX_SCIENCE
        elif "ice" in prompt_lower or "water" in prompt_lower:
            objective = MissionObjective.MAX_ICE

        # Determine risk tolerance
        risk_tolerance = RiskTolerance.MEDIUM
        if "low risk" in prompt_lower or "safe" in prompt_lower or "cautious" in prompt_lower:
            risk_tolerance = RiskTolerance.LOW
        elif "high risk" in prompt_lower or "aggressive" in prompt_lower:
            risk_tolerance = RiskTolerance.HIGH

        return IntentParseResponse(
            objective=objective,
            risk_tolerance=risk_tolerance,
            energy_budget_wh=500.0,
            max_allowed_slope_deg=18.0,
            max_allowed_hazard=0.75,
            source="template_fallback",
            local_ai_available=False
        )

    async def parse_prompt(self, prompt: str) -> IntentParseResponse:
        """Parses prompt via local Ollama or template fallback."""
        raw_response = await self.client.generate(prompt, INTENT_PARSER_SYSTEM_PROMPT)
        if not raw_response:
            return self._fallback_parse(prompt)

        try:
            # Clean possible markdown wrapping ```json ... ```
            cleaned = raw_response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)

            obj_str = data.get("objective", "balanced")
            try:
                obj = MissionObjective(obj_str)
            except ValueError:
                obj = MissionObjective.BALANCED

            risk_str = data.get("risk_tolerance", "medium")
            try:
                risk = RiskTolerance(risk_str)
            except ValueError:
                risk = RiskTolerance.MEDIUM

            return IntentParseResponse(
                objective=obj,
                risk_tolerance=risk,
                energy_budget_wh=float(data.get("energy_budget_wh", 500.0)),
                max_allowed_slope_deg=float(data.get("max_allowed_slope_deg", 18.0)),
                max_allowed_hazard=float(data.get("max_allowed_hazard", 0.75)),
                source="ollama_llm",
                local_ai_available=True
            )
        except Exception as err:
            logger.info(f"Failed to parse LLM JSON output ({err}); reverting to template fallback")
            return self._fallback_parse(prompt)

    async def explain_mission(self, summary_json: dict) -> ExplainMissionResponse:
        """Generates technical mission briefing explanation."""
        prompt = f"Mission Summary JSON:\n{json.dumps(summary_json, indent=2)}"
        raw_response = await self.client.generate(prompt, EXPLANATION_SYSTEM_PROMPT)

        if raw_response:
            return ExplainMissionResponse(
                explanation_text=raw_response,
                source="ollama_llm",
                local_ai_available=True
            )

        # Template fallback explanation
        obj = summary_json.get("objective", "balanced")
        dist = summary_json.get("distance_m", 0.0)
        energy = summary_json.get("energy_wh", 0.0)
        reason = summary_json.get("reason", "Optimal route calculated")

        text = (
            f"[DETERMINISTIC MISSION BRIEFING]\n\n"
            f"The mission was calculated using the '{obj}' objective preset. "
            f"The autonomous rover pathfinder identified a safe, traversable route spanning {dist:.1f} meters "
            f"with an estimated battery power draw of {energy:.2f} Watt-hours.\n\n"
            f"Terrain slopes were kept strictly within traversable limits. Rationale: {reason}."
        )

        return ExplainMissionResponse(
            explanation_text=text,
            source="template_fallback",
            local_ai_available=False
        )
