from fastapi import APIRouter
from app.api.v1 import health, terrain, intelligence, mission, ai

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(terrain.router)
api_v1_router.include_router(intelligence.router)
api_v1_router.include_router(mission.router)
api_v1_router.include_router(ai.router)
