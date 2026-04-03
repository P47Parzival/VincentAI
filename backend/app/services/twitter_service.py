import asyncio
import os
from typing import Any

import httpx

from app.core.http import fetch_json, parse_number


async def fetch_twitter_analytics(
    username_override: str | None,
    max_results: int,
) -> dict[str, Any]:
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN", "")
    username = username_override or os.getenv("TWITTER_DEFAULT_USERNAME", "")

    if not bearer_token:
        raise ValueError("Missing TWITTER_BEARER_TOKEN in backend environment.")

    if not username:
        raise ValueError(
            "Missing Twitter username. Provide username query param or TWITTER_DEFAULT_USERNAME in backend environment."
        )

    headers = {"Authorization": f"Bearer {bearer_token}"}

    async with httpx.AsyncClient(timeout=25.0) as client:
        # Get user ID by username
        user_url = f"https://api.twitter.com/2/users/by/username/{username}"
        user_params = {"user.fields": "public_metrics,profile_image_url"}
        user_data = await fetch_json(client, user_url, user_params, headers)

        data = user_data.get("data", {})
        if not data:
            error_detail = user_data.get("errors", [{"detail": "Unknown API error"}])[0].get("detail")
            raise ValueError(f"Could not find Twitter user '{username}'. Detail: {error_detail}")

        user_id = data.get("id")
        public_metrics = data.get("public_metrics", {})
        
        # Get user's recent tweets
        tweets_url = f"https://api.twitter.com/2/users/{user_id}/tweets"
        tweets_params = {
            "max_results": max(5, min(max_results, 100)), # twitter api max_results min is 5
            "tweet.fields": "public_metrics,created_at,attachments",
            "expansions": "attachments.media_keys",
            "media.fields": "url,preview_image_url,type"
        }
        
        timeline_data = await fetch_json(client, tweets_url, tweets_params, headers)

    tweets = timeline_data.get("data") if isinstance(timeline_data.get("data"), list) else []
    includes = timeline_data.get("includes", {})
    media_pool = includes.get("media", [])
    
    media_map = {m.get("media_key"): m for m in media_pool}
    
    items = []
    
    for t in tweets:
        t_metrics = t.get("public_metrics", {})
        
        media_url = None
        media_keys = t.get("attachments", {}).get("media_keys", [])
        if media_keys:
            key = media_keys[0]
            if key in media_map:
                media_url = media_map[key].get("url") or media_map[key].get("preview_image_url")
        
        items.append({
            "id": t.get("id"),
            "caption": t.get("text"),
            "publishedAt": t.get("created_at"),
            "like_count": parse_number(t_metrics.get("like_count"), 0),
            "retweet_count": parse_number(t_metrics.get("retweet_count"), 0),
            "media_url": media_url,
            "media_type": "TWEET",
        })

    return {
        "platform": "twitter",
        "account": {
            "id": user_id,
            "username": data.get("username"),
            "name": data.get("name"),
            "profile_image_url": data.get("profile_image_url"),
        },
        "metrics": {
            "followersCount": parse_number(public_metrics.get("followers_count"), 0),
            "followingCount": parse_number(public_metrics.get("following_count"), 0),
            "tweetCount": parse_number(public_metrics.get("tweet_count"), 0),
            "listedCount": parse_number(public_metrics.get("listed_count"), 0)
        },
        "items": items,
    }
