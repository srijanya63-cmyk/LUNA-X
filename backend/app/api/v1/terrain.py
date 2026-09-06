from fastapi import APIRouter, HTTPException
from app.services.terrain_service import terrain_service
from app.models.terrain import TerrainSummary

router = APIRouter(prefix="/terrain", tags=["Terrain"])


@router.get("", response_model=TerrainSummary, summary="Get Lunar South Pole Terrain Summary")
async def get_terrain_summary():
    """
    Returns lightweight DEM terrain morphology metadata, elevation bounds, 
    slope ranges, hazard areas, and data mode provenance disclosure for 3D visualizers.
    """
    try:
        summary = terrain_service.get_terrain_summary()
        return summary
    except FileNotFoundError as err:
        raise HTTPException(status_code=503, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to load terrain summary: {err}")
