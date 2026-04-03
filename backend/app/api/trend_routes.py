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


@router.get("/predict")
async def get_trend_predictions():
    # 1. Scrape Reddit Signals
    reddit_data = []
    subreddits = ["marketing", "tiktokcringe", "memes"]
    headers = {"User-Agent": "AIfyBackend/1.0 (Trend research agent)"}
    
    try:
        async with httpx.AsyncClient() as client:
            for sub in subreddits:
                res = await client.get(f"https://www.reddit.com/r/{sub}/top.json?t=day&limit=5", headers=headers, timeout=5.0)
                if res.status_code == 200:
                    data = res.json().get("data", {}).get("children", [])
                    for item in data:
                        post = item.get("data", {})
                        # Ignore pinned posts or empty titles
                        if post.get("title") and not post.get("stickied"):
                            reddit_data.append({
                                "title": post.get("title"),
                                "subreddit": sub,
                                "score": post.get("score"),
                                "text": post.get("selftext", "")[:200]
                            })
    except Exception as e:
        print("Reddit scrape failed:", e)
        
    # 2. Scrape Tavily Signals (if key exists)
    tavily_key = os.getenv("TAVILY_API_KEY")
    tavily_data = []
    if tavily_key:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": tavily_key, "query": "New emerging digital marketing trends TikTok audio this week", "search_depth": "basic", "include_answer": False},
                    timeout=10.0
                )
                if res.status_code == 200:
                    t_payload = res.json().get("results", [])
                    for t in t_payload[:4]:
                        tavily_data.append({"title": t.get("title"), "content": t.get("content")})
        except Exception as e:
            print("Tavily scrape failed:", e)
            
    # Mock fallback if both APIs fail completely to ensure UX
    if not reddit_data and not tavily_data:
        reddit_data = [{"title": "We found a new AI hook format that is going crazy viral right now", "subreddit": "marketing", "score": 2500, "text": "Just put the hook in a purple box."}]
     
    # 3. Brain Synthesis via Groq Llama 3
    import json
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        return JSONResponse(status_code=400, content={"message": "GROQ_API_KEY is required for synthesis."})
        
    raw_dump = f"REDDIT POSTS:\n{json.dumps(reddit_data)}\n\nTAVILY SEARCH:\n{json.dumps(tavily_data)}"
    
    prompt = f"""Act as an expert Digital Marketing Trend Forecaster. 

I am providing you with a raw data dump of top daily Reddit posts from meme/creator subreddits, and recent AI search summaries about emerging creator formats.

RAW DATA:
{raw_dump}

Your task is to analyze this noisy data and identify EXACTLY 3 "Micro-Trends" that are currently bubbling under the surface but have a high probability of going viral in the next 7-14 days. Look for cross-pollination.

Return the output in strictly formatted JSON with the following structure:
{{
  "trends": [
    {{
      "trend_name": "Name of the predicted trend",
      "origin_signal": "Where is this starting? (e.g., Niche TikTok community, Reddit)",
      "virality_hypothesis": "A 2-sentence explanation of WHY human psychology will make this go viral.",
      "how_to_leverage": "Actionable advice for a brand to use this trend early."
    }}
  ]
}}

Return ONLY the pure JSON object. No Markdown wrappers.
"""
    try:
        async with httpx.AsyncClient() as client:
            g_res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_api_key}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.8,
                    "response_format": {"type": "json_object"}
                },
                timeout=30.0
            ) 
            if g_res.status_code == 200:
                content = g_res.json()["choices"][0]["message"]["content"]
                clean = content.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean)
                return JSONResponse(content={"items": parsed.get("trends", [])})
            else:
                print("Groq API Error in Trends Predict:", g_res.text)
                return JSONResponse(status_code=500, content={"message": "Synthesis API Error"})
    except Exception as e:
        print("Groq failed in Trends Predict:", str(e))
        return JSONResponse(status_code=500, content={"message": "Synthesis Exception"})
