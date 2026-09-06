import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.api.v1.health import health_check

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("luna_x.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "LUNA-X — AI-Powered Lunar Ice Intelligence & Autonomous Rover Mission Control API. "
        "Provides scientific ice characterization, terrain hazard scoring, multi-criteria landing site selection, "
        "and 3D slope-weighted rover pathfinding."
    ),
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check endpoint
app.get("/health", tags=["Health"])(health_check)

# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler preventing unhandled stack traces from reaching clients."""
    logger.error(f"Unhandled error handling '{request.method} {request.url.path}': {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error encountered in LUNA-X Mission Control Engine"}
    )
