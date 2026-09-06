from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.intelligence_service import intelligence_service
from app.models.scientific import (
    ScientificWeights,
    LandingSiteWeights,
    IceLikelihoodResult,
    LandingCandidate
)

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


class LandingSiteRequestPayload(BaseModel):
    weights: Optional[LandingSiteWeights] = None
    candidates_override: Optional[List[Dict[str, Any]]] = None


@router.get("/ice-likelihood", response_model=IceLikelihoodResult, summary="Calculate Ice Likelihood & Confidence")
async def get_ice_likelihood(
    w_cpr: float = 0.35,
    w_psr: float = 0.35,
    w_albedo: float = 0.20,
    w_slope: float = 0.10
):
    """
    Evaluates multi-criteria ice likelihood and prediction confidence.
    Returns statistical summary and metadata without bloating network payloads.
    """
    try:
        weights = ScientificWeights(
            w_cpr=w_cpr,
            w_psr=w_psr,
            w_albedo=w_albedo,
            w_slope=w_slope
        )
        _, _, _, summary = intelligence_service.get_ice_intelligence(weights)
        return summary
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to calculate ice intelligence: {err}")


@router.post("/landing-sites", response_model=List[LandingCandidate], summary="Generate & Rank Landing Candidates")
async def rank_landing_sites(payload: Optional[LandingSiteRequestPayload] = None):
    """
    Ranks candidate landing zones using multi-attribute suitability utility function.
    Exposes component scores (ice, safety, illumination, comms) for UI rationale displays.
    """
    try:
        weights = payload.weights if payload else None
        override = payload.candidates_override if payload else None
        ranked = intelligence_service.rank_landing_sites(weights=weights, candidates_override=override)
        return ranked
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to rank landing sites: {err}")
