import asyncio
import os
from typing import Any

import httpx

from app.core.http import fetch_json, parse_number


async def fetch_instagram_analytics(
    ig_user_id_override: str | None,
    media_limit: int,
) -> dict[str, Any]:
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
    ig_user_id = ig_user_id_override or os.getenv("INSTAGRAM_IG_USER_ID", "")

    if not access_token:
        raise ValueError("Missing INSTAGRAM_ACCESS_TOKEN in backend environment.")

    if not ig_user_id:
        raise ValueError(
            "Missing Instagram user ID. Provide igUserId query param or INSTAGRAM_IG_USER_ID in backend environment."
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
        "limit": media_limit,
        "access_token": access_token,
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        profile_task = fetch_json(client, f"{graph_base}/{ig_user_id}", profile_params)
        insights_task = fetch_json(client, f"{graph_base}/{ig_user_id}/insights", insights_params)
        media_task = fetch_json(client, f"{graph_base}/{ig_user_id}/media", media_params)

        profile, insights, media = await asyncio.gather(profile_task, insights_task, media_task)

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

    return {
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
