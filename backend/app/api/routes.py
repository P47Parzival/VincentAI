from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.core.exceptions import UpstreamRequestError
from app.services.instagram_service import fetch_instagram_analytics
from app.services.youtube_service import fetch_youtube_analytics
from app.api.agent_routes import router as agent_router
from app.api.trend_routes import router as trend_router

router = APIRouter(prefix="/api")
router.include_router(agent_router)
router.include_router(trend_router)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/analytics/instagram")
async def get_instagram_analytics(
    igUserId: str | None = Query(default=None),
    mediaLimit: int = Query(default=10, ge=1, le=25),
) -> JSONResponse:
    try:
        payload = await fetch_instagram_analytics(igUserId, mediaLimit)
        return JSONResponse(content=payload)
    except ValueError as error:
        return JSONResponse(status_code=400, content={"message": str(error)})
    except UpstreamRequestError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={"message": error.message, "details": error.payload},
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Failed to fetch Instagram analytics.",
                "details": str(error),
            },
        )


@router.get("/analytics/youtube")
async def get_youtube_analytics(
    channelId: str | None = Query(default=None),
    maxResults: int = Query(default=8, ge=1, le=20),
) -> JSONResponse:
    try:
        payload = await fetch_youtube_analytics(channelId, maxResults)
        return JSONResponse(content=payload)
    except ValueError as error:
        return JSONResponse(status_code=400, content={"message": str(error)})
    except UpstreamRequestError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={"message": error.message, "details": error.payload},
        )
    except Exception as error:
        import traceback
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to fetch YouTube analytics.", "details": str(error), "traceback": traceback.format_exc()},
        )
