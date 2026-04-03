import asyncio
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Backend Analytics API", version="1.0.0")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
allow_origins = ["*"] if FRONTEND_ORIGIN == "*" else [FRONTEND_ORIGIN]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UpstreamRequestError(Exception):
    def __init__(self, status_code: int, message: str, payload: Any | None = None) -> None:
        self.status_code = status_code
        self.message = message
        self.payload = payload
        super().__init__(message)


def parse_number(value: Any, fallback: int | float = 0) -> int | float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return fallback

    if parsed.is_integer():
        return int(parsed)
    return parsed


async def fetch_json(client: httpx.AsyncClient, url: str, params: dict[str, Any]) -> dict[str, Any]:
    response = await client.get(url, params=params)

    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if response.status_code >= 400:
        message = (
            payload.get("error", {}).get("message")
            if isinstance(payload, dict)
            else None
        ) or f"Upstream request failed: {response.status_code}"
        raise UpstreamRequestError(response.status_code, message, payload)

    if isinstance(payload, dict):
        return payload
    return {}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/analytics/instagram")
async def get_instagram_analytics(
    igUserId: str | None = Query(default=None),
    mediaLimit: int = Query(default=10, ge=1, le=25),
) -> JSONResponse:
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    ig_user_id = igUserId or os.getenv("INSTAGRAM_IG_USER_ID", "")

    if not access_token:
        return JSONResponse(
            status_code=400,
            content={"message": "Missing INSTAGRAM_ACCESS_TOKEN in backend environment."},
        )

    if not ig_user_id:
        return JSONResponse(
            status_code=400,
            content={
                "message": (
                    "Missing Instagram user ID. Provide igUserId query param "
                    "or INSTAGRAM_IG_USER_ID in backend environment."
                )
            },
        )

    graph_base = "https://graph.facebook.com/v20.0"

    profile_params = {
        "fields": "id,username,followers_count,media_count",
        "access_token": access_token,
    }
    insights_params = {
        "metric": "reach,impressions",
        "period": "day",
        "access_token": access_token,
    }
    media_params = {
        "fields": (
            "id,caption,media_type,media_url,thumbnail_url,timestamp,"
            "permalink,like_count,comments_count"
        ),
        "limit": mediaLimit,
        "access_token": access_token,
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            profile_task = fetch_json(client, f"{graph_base}/{ig_user_id}", profile_params)
            insights_task = fetch_json(client, f"{graph_base}/{ig_user_id}/insights", insights_params)
            media_task = fetch_json(client, f"{graph_base}/{ig_user_id}/media", media_params)

            profile, insights, media = await asyncio.gather(
                profile_task, insights_task, media_task
            )

        insight_data = insights.get("data") if isinstance(insights.get("data"), list) else []

        def latest_metric(metric_name: str) -> int | float:
            for item in insight_data:
                if item.get("name") == metric_name:
                    values = item.get("values") if isinstance(item.get("values"), list) else []
                    if values:
                        return parse_number(values[-1].get("value"), 0)
            return 0

        latest_reach = latest_metric("reach")
        latest_impressions = latest_metric("impressions")

        media_items = media.get("data") if isinstance(media.get("data"), list) else []
        reels_uploaded = sum(1 for item in media_items if item.get("media_type") == "REELS")

        return JSONResponse(
            content={
                "platform": "instagram",
                "account": {
                    "id": profile.get("id"),
                    "username": profile.get("username"),
                },
                "metrics": {
                    "followersCount": parse_number(profile.get("followers_count"), 0),
                    "reach": latest_reach,
                    "impressions": latest_impressions,
                    "reelsUploaded": reels_uploaded,
                    "totalMediaUploaded": parse_number(profile.get("media_count"), 0),
                },
                "items": media_items,
            }
        )
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


@app.get("/api/analytics/youtube")
async def get_youtube_analytics(
    channelId: str | None = Query(default=None),
    maxResults: int = Query(default=8, ge=1, le=20),
) -> JSONResponse:
    api_key = os.getenv("YOUTUBE_API_KEY", "")
    channel_id = channelId or os.getenv("YOUTUBE_CHANNEL_ID", "")

    if not api_key:
        return JSONResponse(
            status_code=400,
            content={"message": "Missing YOUTUBE_API_KEY in backend environment."},
        )

    if not channel_id:
        return JSONResponse(
            status_code=400,
            content={
                "message": (
                    "Missing YouTube channel ID. Provide channelId query param "
                    "or YOUTUBE_CHANNEL_ID in backend environment."
                )
            },
        )

    channels_params = {
        "part": "snippet,statistics",
        "id": channel_id,
        "key": api_key,
    }
    recent_videos_params = {
        "part": "snippet",
        "channelId": channel_id,
        "order": "date",
        "type": "video",
        "maxResults": maxResults,
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            channels_payload = await fetch_json(
                client,
                "https://www.googleapis.com/youtube/v3/channels",
                channels_params,
            )

            items = channels_payload.get("items") if isinstance(channels_payload.get("items"), list) else []
            channel = items[0] if items else None

            if not channel:
                return JSONResponse(
                    status_code=404,
                    content={"message": "No YouTube channel found for the given channelId."},
                )

            recent_payload = await fetch_json(
                client,
                "https://www.googleapis.com/youtube/v3/search",
                recent_videos_params,
            )

        recent_items = recent_payload.get("items") if isinstance(recent_payload.get("items"), list) else []
        recent_videos = [
            {
                "videoId": item.get("id", {}).get("videoId"),
                "title": item.get("snippet", {}).get("title"),
                "publishedAt": item.get("snippet", {}).get("publishedAt"),
                "thumbnail": (
                    item.get("snippet", {})
                    .get("thumbnails", {})
                    .get("medium", {})
                    .get("url")
                    or item.get("snippet", {})
                    .get("thumbnails", {})
                    .get("default", {})
                    .get("url")
                ),
            }
            for item in recent_items
        ]

        statistics = channel.get("statistics", {}) if isinstance(channel, dict) else {}
        snippet = channel.get("snippet", {}) if isinstance(channel, dict) else {}

        subscribers_count = parse_number(statistics.get("subscriberCount"), 0)
        total_views = parse_number(statistics.get("viewCount"), 0)
        videos_uploaded = parse_number(statistics.get("videoCount"), 0)

        return JSONResponse(
            content={
                "platform": "youtube",
                "account": {"channelId": channel_id, "title": snippet.get("title")},
                "metrics": {
                    "subscribersCount": subscribers_count,
                    "estimatedReach": total_views,
                    "estimatedImpressions": total_views,
                    "videosUploaded": videos_uploaded,
                },
                "notes": [
                    "YouTube Data API key does not provide direct impressions/reach metrics.",
                    "Estimated values are currently mapped from total channel views. For exact impressions/reach, use YouTube Analytics API with OAuth.",
                ],
                "items": recent_videos,
            }
        )
    except UpstreamRequestError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={"message": error.message, "details": error.payload},
        )
    except Exception as error:
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to fetch YouTube analytics.", "details": str(error)},
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "4000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
