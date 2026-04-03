"""
LinkedIn Analytics via Apify actor: dev_fusion/linkedin-profile-scraper
Confirmed output schema (from official docs):
{
  "linkedinUrl": "...",
  "firstName": "Bill", "lastName": "Gates", "fullName": "Bill Gates",
  "headline": "...",
  "connections": 500,    ← NOT connectionsCount
  "followers": 15000,    ← NOT followersCount
  "publicIdentifier": "williamhgates",
  "experiences": [{ "title": "...", "companyName": "...", ... }],
  "skills": [{ "name": "..." }],
  "educations": [...],
}
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
        print(f"[APIFY {actor_path}] items={len(data)}, sample_keys={list(data[0].keys())[:20]}")
    else:
        print(f"[APIFY {actor_path}] EMPTY RESULT")
    return data


def _safe_int(val) -> int:
    try:
        return int(str(val).replace(",", "").replace("+", "").strip())
    except Exception:
        return 0


async def fetch_linkedin_analytics(
    profile_url_override: str | None,
    max_results: int,
) -> dict[str, Any]:
    apify_token = os.getenv("APIFY_API_TOKEN", "")
    profile_url = profile_url_override or os.getenv("LINKEDIN_DEFAULT_PROFILE_URL", "")

    if not apify_token:
        raise ValueError("Missing APIFY_API_TOKEN in backend environment.")
    if not profile_url:
        raise ValueError(
            "Missing LinkedIn profile URL. "
            "Provide ?profileUrl= query param or set LINKEDIN_DEFAULT_PROFILE_URL in .env"
        )

    data = await _run_apify("dev_fusion~linkedin-profile-scraper", {
        "profileUrls": [profile_url],
    }, apify_token)

    if not data:
        raise ValueError("Apify returned no LinkedIn profile data.")

    profile = data[0]
    print(f"[LI DEBUG] connections={profile.get('connections')} followers={profile.get('followers')}")

    # Confirmed field names from docs: "connections" and "followers" (no "Count" suffix)
    connections = _safe_int(profile.get("connections") or profile.get("connectionsCount") or 0)
    followers   = _safe_int(profile.get("followers") or profile.get("followersCount") or 0)

    full_name  = profile.get("fullName") or f"{profile.get('firstName','')} {profile.get('lastName','')}".strip() or "LinkedIn User"
    headline   = profile.get("headline") or profile.get("title") or ""
    location   = profile.get("location") or profile.get("geoLocation") or ""
    summary    = profile.get("summary") or profile.get("about") or ""
    photo_url  = profile.get("profilePicture") or profile.get("photoUrl") or profile.get("photo")
    profile_id = profile.get("publicIdentifier") or profile.get("username") or profile_url

    # Experiences: field is "experiences" with "title" and "companyName"
    experience_raw = profile.get("experiences") or profile.get("experience") or []
    experiences = []
    if isinstance(experience_raw, list):
        for exp in experience_raw[:6]:
            if isinstance(exp, dict):
                experiences.append({
                    "title"   : exp.get("title") or exp.get("position") or "",
                    "company" : exp.get("companyName") or exp.get("company") or "",
                    "duration": exp.get("currentJobDuration") or exp.get("duration") or exp.get("jobStartedOn") or "",
                })

    # Skills: field is "skills" with "name"
    skills_raw = profile.get("skills") or []
    skills = []
    if isinstance(skills_raw, list):
        for s in skills_raw[:12]:
            if isinstance(s, dict):
                skills.append(s.get("name") or s.get("title") or str(s))
            elif isinstance(s, str):
                skills.append(s)

    # Certifications
    certs_raw = profile.get("certifications") or profile.get("licenses") or []
    cert_count = len(certs_raw) if isinstance(certs_raw, list) else 0

    return {
        "platform": "linkedin",
        "account": {
            "id"               : profile_id,
            "username"         : full_name,
            "name"             : full_name,
            "headline"         : headline,
            "location"         : location,
            "summary"          : summary,
            "profile_image_url": photo_url,
            "profile_url"      : profile_url,
        },
        "metrics": {
            "followersCount"   : followers,
            "connectionsCount" : connections,
            "experiencesCount" : len(experiences),
            "skillsCount"      : len(skills),
            "certificationsCount": cert_count,
        },
        "experiences": experiences,
        "skills"     : skills,
        "items"      : [],  # LinkedIn scraper doesn't return posts in this actor
    }
