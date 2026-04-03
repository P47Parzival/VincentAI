"""
Twitter Analytics via Apify actor: apidojo/tweet-scraper
Confirmed output schema (from official docs):
{
  "type": "tweet",
  "id": "...",
  "url": "...",
  "text": "...",
  "likeCount": 104121,
  "retweetCount": 11311,
  "replyCount": 6526,
  "quoteCount": 2915,
  "createdAt": "Fri Nov 24 17:49:36 +0000 2023",
  "author": {
    "type": "user",
    "userName": "elonmusk",
    "name": "Elon Musk",
    "id": "44196397",
    "followers": 172669889,   ← NESTED under author
    "following": 538,
    "profilePicture": "https://..."
  }
}
NOTE: author.followers is NESTED, NOT a flat authorFollowers field.
"""

import os
from typing import Any
import httpx


async def _run_apify(actor_path: str, payload: dict, token: str) -> list:
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(
            f"https://api.apify.com/v2/acts/{actor_path}/run-sync-get-dataset-items",
            params={"token": token},
            json=payload,
        )
    print(f"[APIFY {actor_path}] status={res.status_code}")
    if res.status_code not in (200, 201):
        raise ValueError(f"Apify HTTP {res.status_code}: {res.text[:400]}")
    data = res.json()
    if not isinstance(data, list):
        raise ValueError(f"Unexpected Apify response: {str(data)[:300]}")
    if data:
        print(f"[APIFY {actor_path}] items={len(data)}, sample_keys={list(data[0].keys())[:18]}")
        author = data[0].get("author") or {}
        print(f"[TWITTER DEBUG] author keys={list(author.keys())}")
    else:
        print(f"[APIFY {actor_path}] EMPTY RESULT")
    return data


def _safe_int(val) -> int:
    try:
        return int(str(val).replace(",", "").replace("+", "").strip())
    except Exception:
        return 0


async def fetch_twitter_analytics(
    username_override: str | None,
    max_results: int,
) -> dict[str, Any]:
    apify_token = os.getenv("APIFY_API_TOKEN", "")
    username = (username_override or os.getenv("TWITTER_DEFAULT_USERNAME", "")).lstrip("@")

    if not apify_token:
        raise ValueError("Missing APIFY_API_TOKEN in backend environment.")
    if not username:
        raise ValueError(
            "Missing Twitter username. "
            "Provide ?username= query param or set TWITTER_DEFAULT_USERNAME in .env"
        )

    data = await _run_apify("apidojo~tweet-scraper", {
        "searchTerms": [f"from:{username} -filter:retweets"],
        "maxItems"   : max(max_results, 50),  # actor requires min 50
        "sort"       : "Latest",
    }, apify_token)

    first = data[0] if data else {}
    # author is a NESTED object: { userName, name, followers, following, profilePicture }
    author = first.get("author") or {}

    followers = _safe_int(author.get("followers") or author.get("followersCount") or 0)
    following = _safe_int(author.get("following") or author.get("followingCount") or 0)
    name      = author.get("name") or author.get("userName") or username
    pic       = author.get("profilePicture") or author.get("profilePic") or author.get("avatar")

    # tweetCount: use statusesCount from author if available
    tweet_count = _safe_int(
        author.get("statusesCount") or
        author.get("tweetsCount") or
        len(data)
    )

    items = []
    for tweet in data[:max_results]:
        likes    = _safe_int(tweet.get("likeCount") or tweet.get("likes") or 0)
        retweets = _safe_int(tweet.get("retweetCount") or tweet.get("retweets") or 0)
        replies  = _safe_int(tweet.get("replyCount") or tweet.get("replies") or 0)

        # Media thumbnail
        media_url = None
        ext_media = tweet.get("extendedEntities") or {}
        media_list = ext_media.get("media") or tweet.get("media") or tweet.get("mediaUrls") or []
        if isinstance(media_list, list) and media_list:
            m = media_list[0]
            if isinstance(m, dict):
                media_url = m.get("media_url_https") or m.get("mediaUrl") or m.get("previewImageUrl") or m.get("url")
            elif isinstance(m, str):
                media_url = m

        tweet_id = tweet.get("id") or tweet.get("tweetId")
        items.append({
            "id"           : tweet_id,
            "caption"      : tweet.get("text") or tweet.get("full_text") or "(no text)",
            "publishedAt"  : tweet.get("createdAt") or tweet.get("created_at"),
            "like_count"   : likes,
            "retweet_count": retweets,
            "reply_count"  : replies,
            "media_url"    : media_url,
            "media_type"   : "TWEET",
            "permalink"    : tweet.get("url") or tweet.get("twitterUrl") or (f"https://x.com/{username}/status/{tweet_id}" if tweet_id else None),
        })

    return {
        "platform": "twitter",
        "account": {
            "id"               : username,
            "username"         : username,
            "name"             : name,
            "profile_image_url": pic,
        },
        "metrics": {
            "followersCount": followers,
            "followingCount": following,
            "tweetCount"    : tweet_count,
            "listedCount"   : _safe_int(author.get("listedCount") or 0),
        },
        "items": items,
    }
