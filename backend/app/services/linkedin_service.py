"""
LinkedIn Official Developer API Service
=========================================
Combines two LinkedIn products for maximum data:

  1. "Sign In with LinkedIn using OpenID Connect"  (openid profile email)
     → GET /v2/userinfo  →  name, email, profile photo

  2. "Share on LinkedIn"  (w_member_social)
     → GET /v2/ugcPosts  →  user's posts (text, timestamp, media)

The OAuth flow at /linkedin/auth requests all scopes at once.
Both products must be enabled on your LinkedIn Developer App.
After adding both products, re-authenticate at /linkedin/auth to get a
combined token, then your posts will appear automatically.
"""

import os
import urllib.parse
from typing import Any

import httpx


_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
_UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts"


def _get_token() -> str:
    token = os.getenv("LINKEDIN_ACCESS_TOKEN", "").strip()
    if not token:
        raise ValueError(
            "LINKEDIN_ACCESS_TOKEN is not set. "
            "Open http://localhost:4000/linkedin/auth in your browser to connect LinkedIn."
        )
    return token


def _name_from_profile_url(url: str) -> str:
    try:
        slug = url.rstrip("/").split("/in/")[-1].replace("-", " ").replace("_", " ")
        return slug.title() if slug else "LinkedIn User"
    except Exception:
        return "LinkedIn User"


def _parse_post(element: dict) -> dict | None:
    """Parse a LinkedIn UGC Post element into our standard item shape."""
    try:
        post_id = element.get("id", "")

        # Text content
        content = element.get("specificContent", {})
        share   = content.get("com.linkedin.ugc.ShareContent", {})
        text    = share.get("shareCommentary", {}).get("text", "")

        # Media
        media_items  = share.get("media", [])
        media_url    = None
        media_type   = share.get("shareMediaCategory", "NONE")
        if media_items:
            media_url = media_items[0].get("originalUrl") or media_items[0].get("thumbnailUrl")

        # Timestamp (LinkedIn returns epoch milliseconds)
        created_ms   = element.get("created", {}).get("time", 0)
        published_at = None
        if created_ms:
            from datetime import datetime, timezone
            published_at = datetime.fromtimestamp(
                created_ms / 1000, tz=timezone.utc
            ).isoformat()

        # Lifecycle
        state = element.get("lifecycleState", "")
        if state != "PUBLISHED":
            return None  # skip drafts / deleted

        return {
            "id":          post_id,
            "caption":     text or "(no text)",
            "publishedAt": published_at,
            "like_count":  0,   # social stats require Marketing API
            "media_url":   media_url,
            "media_type":  f"LINKEDIN_{media_type}",
        }
    except Exception:
        return None


async def fetch_linkedin_analytics(
    profile_url_override: str | None,
    max_results: int,
) -> dict[str, Any]:
    token = _get_token()
    profile_url = profile_url_override or os.getenv(
        "LINKEDIN_DEFAULT_PROFILE_URL", "https://www.linkedin.com/in/unknown"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    member_id  = ""
    full_name  = ""
    email      = ""
    photo_url  = None
    items      = []
    notes      = []

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:

            # ─────────────────────────────────────────────────────────────────
            # Step 1: OpenID Connect — profile info
            # ─────────────────────────────────────────────────────────────────
            ui_resp = await client.get(_USERINFO_URL, headers=headers)

            if ui_resp.status_code == 401:
                raise ValueError(
                    "LinkedIn access token is expired (401). "
                    "Re-authenticate at http://localhost:4000/linkedin/auth"
                )

            if ui_resp.status_code == 403:
                raise ValueError(
                    "LinkedIn token lacks OpenID Connect scope (403). "
                    "Add 'Sign In with LinkedIn using OpenID Connect' to your app at "
                    "linkedin.com/developers/apps → Products tab, then re-authenticate."
                )

            ui_resp.raise_for_status()
            ui = ui_resp.json()

            member_id = ui.get("sub", "")
            first     = ui.get("given_name", "")
            last      = ui.get("family_name", "")
            full_name = f"{first} {last}".strip() or ui.get("name", "")
            email     = ui.get("email", "")
            photo_url = ui.get("picture")

            # ─────────────────────────────────────────────────────────────────
            # Step 2: w_member_social — fetch the user's posts (UGC Posts)
            # Requires "Share on LinkedIn" product + re-authentication after
            # adding the product.
            # ─────────────────────────────────────────────────────────────────
            if member_id:
                try:
                    author_urn = f"urn:li:person:{member_id}"
                    encoded    = urllib.parse.quote(author_urn, safe="")
                    posts_url  = (
                        f"{_UGC_POSTS_URL}"
                        f"?q=authors"
                        f"&authors=List({encoded})"
                        f"&count={min(max_results, 20)}"
                        f"&sortBy=LAST_MODIFIED"
                    )
                    pr = await client.get(posts_url, headers=headers)

                    if pr.status_code == 200:
                        elements = pr.json().get("elements", [])
                        for el in elements:
                            parsed = _parse_post(el)
                            if parsed:
                                items.append(parsed)
                        notes.append(f"Found {len(items)} post(s) via Share on LinkedIn API.")

                    elif pr.status_code == 403:
                        # Token doesn't have w_member_social yet
                        notes.append(
                            "Posts not available: add 'Share on LinkedIn' product to your LinkedIn app, "
                            "then re-authenticate at http://localhost:4000/linkedin/auth"
                        )
                    else:
                        notes.append(f"Posts endpoint returned HTTP {pr.status_code} — skipped.")

                except Exception as posts_err:
                    notes.append(f"Could not fetch posts: {posts_err}")

    except httpx.HTTPStatusError as exc:
        raise ValueError(
            f"LinkedIn API HTTP {exc.response.status_code}: {exc.response.text}"
        ) from exc
    except httpx.RequestError as exc:
        raise ValueError(f"Network error: {exc}") from exc

    if not full_name:
        full_name = _name_from_profile_url(profile_url)

    return {
        "platform": "linkedin",
        "account": {
            "id":                member_id,
            "username":          full_name,
            "name":              full_name,
            "email":             email,
            "profile_image_url": photo_url,
            "profile_url":       profile_url,
        },
        "metrics": {
            "followersCount":     0,
            "connectionsCount":   0,
            "postsCount":         len(items),
            "certificationsCount": 0,
            "experiencesCount":   0,
        },
        "notes": notes,
        "items": items,
    }
