import os
import base64
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import re
from collections import Counter

router = APIRouter(prefix="/trends")

@router.get("/hashtags")
async def get_hashtags():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return JSONResponse(status_code=400, content={"message": "Missing YOUTUBE_API_KEY"})
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "snippet",
                    "chart": "mostPopular",
                    "regionCode": "US",
                    "maxResults": 50,
                    "key": api_key,
                }
            )
            
            if response.status_code != 200:
                raise Exception(response.text)
                
            payload = response.json()
            
            hashtags_counter = Counter()
            
            for item in payload.get("items", []):
                snippet = item.get("snippet", {})
                title = snippet.get("title", "")
                desc = snippet.get("description", "")
                tags = snippet.get("tags", [])
                
                video_tags = set()
                
                # Extract authentic # tags from title and description
                for text in [title, desc]:
                    extracted = re.findall(r'#(\w+)', text.lower())
                    for t in extracted:
                        if len(t) > 2:
                            video_tags.add(t)
                            
                # Add YouTube SEO tags (stripping spaces to mimic hashtags)
                for t in tags:
                    clean_tag = t.lower().replace(" ", "")
                    # Ignore overly long sentences in tags
                    if 2 < len(clean_tag) < 20: 
                        video_tags.add(clean_tag)
                        
                # Count each tag only ONCE per video for an authentic Penetration Metric
                for t in video_tags:
                    hashtags_counter[f"#{t}"] += 1
                
            top_tags = hashtags_counter.most_common(10)
            
            data = [{"name": tag, "count": count} for tag, count in top_tags]
            
        return JSONResponse(content={"items": data})
    except Exception as e:
        print("Hashtag Scraper Error:", str(e))
        mock_data = [
            {"name": "#shorts", "count": 142},
            {"name": "#funny", "count": 98},
            {"name": "#podcast", "count": 76},
            {"name": "#viral", "count": 65},
            {"name": "#music", "count": 54},
            {"name": "#vlog", "count": 41},
            {"name": "#gaming", "count": 38},
            {"name": "#ai", "count": 29},
        ]
        return JSONResponse(content={"items": mock_data, "mocked": True})


@router.get("/youtube")
async def get_youtube_trends():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return JSONResponse(status_code=400, content={"message": "Missing YOUTUBE_API_KEY"})
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "snippet,statistics",
                    "chart": "mostPopular",
                    "regionCode": "US",
                    "maxResults": 6,
                    "key": api_key,
                }
            )
            
            if response.status_code != 200:
                raise Exception(response.text)
                
            payload = response.json()
            items = []
            for item in payload.get("items", []):
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                thumbnails = snippet.get("thumbnails", {})
                thumb_url = thumbnails.get("maxres", {}).get("url") or thumbnails.get("high", {}).get("url")
                
                items.append({
                    "id": item.get("id"),
                    "title": snippet.get("title"),
                    "channelTitle": snippet.get("channelTitle"),
                    "thumbnail": thumb_url,
                    "viewCount": int(stats.get("viewCount", 0)),
                    "likeCount": int(stats.get("likeCount", 0)),
                })
                
            return JSONResponse(content={"items": items})
    except Exception as e:
        print("YouTube API Error:", str(e))
        mock_videos = [
            {
                "id": "mock1",
                "title": "Tech Review: The Future is Here",
                "channelTitle": "TechDaily",
                "thumbnail": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60",
                "viewCount": 5400000,
                "likeCount": 120000
            },
            {
                "id": "mock2",
                "title": "I Built an AI Agent to edit my videos",
                "channelTitle": "CreatorLabs",
                "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60",
                "viewCount": 2100000,
                "likeCount": 85000
            }
        ]
        return JSONResponse(content={"items": mock_videos, "mocked": True})


def _mock_spotify_viral():
    return [
        {"id": "1", "title": "Magnetic", "artist": "ILLIT", "popularity": 95, "image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop"},
        {"id": "2", "title": "TEXAS HOLD 'EM", "artist": "Beyoncé", "popularity": 92, "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop"},
        {"id": "3", "title": "End of Beginning", "artist": "Djo", "popularity": 88, "image": "https://images.unsplash.com/photo-1493225457224-05eb102f7e0a?w=100&h=100&fit=crop"},
        {"id": "4", "title": "Beautiful Things", "artist": "Benson Boone", "popularity": 85, "image": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop"},
    ]

@router.get("/spotify")
async def get_spotify_trends():
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        # Fallback Mock Data
        return JSONResponse(content={"items": _mock_spotify_viral(), "mocked": True})
        
    try:
        # Client Credentials Flow
        async with httpx.AsyncClient() as client:
            auth_str = f"{client_id}:{client_secret}"
            b64_auth_str = base64.b64encode(auth_str.encode()).decode()
            
            token_res = await client.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {b64_auth_str}", "Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if token_res.status_code != 200:
                return JSONResponse(content={"items": _mock_spotify_viral(), "mocked": True})
                
            access_token = token_res.json().get("access_token")
            
            # Search for recent tracks to find popular ones
            playlist_res = await client.get(
                "https://api.spotify.com/v1/search?q=year:2024-2026&type=track&limit=50",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if playlist_res.status_code != 200:
                print("Spotify API Error:", playlist_res.text)
                return JSONResponse(content={"items": _mock_spotify_viral(), "mocked": True})
                
            payload = playlist_res.json()
            all_items = []
            
            tracks_data = payload.get("tracks", {}).get("items", [])
            for track in tracks_data:
                if not track: continue
                
                album = track.get("album", {})
                images = album.get("images", [])
                image_url = images[0].get("url") if images else "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop"
                
                artists = ", ".join([a.get("name") for a in track.get("artists", [])])
                
                all_items.append({
                    "id": track.get("id"),
                    "title": track.get("name"),
                    "artist": artists,
                    "popularity": track.get("popularity", 0),
                    "image": image_url
                })
                
            # Sort by popularity descending and take top 6
            all_items.sort(key=lambda x: x["popularity"], reverse=True)
            items = all_items[:6]
                
            return JSONResponse(content={"items": items, "mocked": False})
    except Exception as e:
        print(f"Spotify exception triggered fallback: {e}")
        return JSONResponse(content={"items": _mock_spotify_viral(), "mocked": True})


@router.get("/social")
async def get_social_trends():
    apify_key = os.getenv("APIFY_API_TOKEN")
    # For initial implementation, since webscraping via Apify requires specific Actors which can take a minute to run, 
    # we return a structured mock array simulating what Apify returns for viral TikToks/Reels.
    
    mock_posts = [
        {"id": "v1", "platform": "tiktok", "author": "@creator_hub", "likes": 2400000, "views": 18000000, "thumbnail": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60", "caption": "The ultimate creator setup 2026 🚀 #tech #setup"},
        {"id": "v2", "platform": "instagram", "author": "@aesthetics", "likes": 1200000, "views": 8500000, "thumbnail": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&auto=format&fit=crop&q=60", "caption": "POV: desk tour aesthetic ☁️"},
        {"id": "v3", "platform": "tiktok", "author": "@ai_daily", "likes": 950000, "views": 4200000, "thumbnail": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60", "caption": "New AI models changed the game today 🤯"},
        {"id": "v4", "platform": "instagram", "author": "@nomad_life", "likes": 640000, "views": 3100000, "thumbnail": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60", "caption": "Remote work spots that aren't overhyped 🌴"},
    ]
    return JSONResponse(content={"items": mock_posts, "mocked": True, "note": "Add APIFY_API_TOKEN to enable live scraping"})
