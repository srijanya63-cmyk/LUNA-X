import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("luna_x.ai")


class OllamaClient:
    """Async client for local Ollama API (http://localhost:11434). Zero external cloud dependencies."""

    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_MODEL,
        timeout_seconds: float = settings.OLLAMA_TIMEOUT_SECONDS
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    async def check_health(self) -> bool:
        """Checks if local Ollama daemon is reachable within timeout."""
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception as err:
            logger.debug(f"Ollama health check failed: {err}")
            return False

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        Sends prompt to local Ollama service. Returns generated text or None on failure/timeout.
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip()
                logger.warning(f"Ollama returned non-200 status: {res.status_code}")
                return None
        except httpx.TimeoutException:
            logger.info(f"Ollama request timed out after {self.timeout_seconds}s; activating template fallback")
            return None
        except Exception as err:
            logger.info(f"Ollama unavailable ({err}); activating template fallback")
            return None
