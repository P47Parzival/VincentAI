import json
import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from app.services.agent_service import agent_app

router = APIRouter(prefix="/agents")

@router.get("/stream-post")
async def stream_post(companyDescription: str, socialGoal: str, request: Request):
    async def event_generator():
        initial_state = {
            "company_description": companyDescription,
            "social_goal": socialGoal,
            "target_audience": "",
            "keywords": [],
            "research_data": "",
            "strategy": "",
            "draft": "",
        }
        
        yield {"data": json.dumps({"step": "starting", "status": "Initializing agents..."})}
        
        try:
            async for event in agent_app.astream(initial_state):
                if await request.is_disconnected():
                    break
                
                for node_name, state_update in event.items():
                    payload = {
                        "step": node_name,
                        "state_update": state_update
                    }
                    yield {"data": json.dumps(payload)}
                    
            yield {"data": json.dumps({"step": "finished", "status": "Post generated successfully!"})}
                    
        except Exception as e:
            yield {"data": json.dumps({"step": "error", "error": str(e)})}
            
    return EventSourceResponse(event_generator())

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
async def generate_tts(body: TTSRequest):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set.")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "canopylabs/orpheus-v1-english",
                "input": body.text[:4000],  # safety trim
                "voice": "austin",
                "response_format": "wav"
            },
            timeout=30.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"TTS error: {response.text}")
        
        return Response(content=response.content, media_type="audio/wav")

class AnalyzeURLRequest(BaseModel):
    url: str

@router.post("/analyze-url")
async def analyze_url(req: AnalyzeURLRequest):
    # 1. Scrape with APIFY
    apify_token = os.getenv("APIFY_API_TOKEN")
    scraped_text = ""
    domain = "unknown"
    scrape_error = None
    
    if "instagram.com" in req.url: domain = "instagram"
    elif "linkedin.com" in req.url: domain = "linkedin"
    elif "youtube.com" in req.url or "youtu.be" in req.url: domain = "youtube"
    elif "twitter.com" in req.url or "x.com" in req.url: domain = "twitter"
    
    if apify_token:
        actor_map = {
            "instagram": "apify/instagram-scraper", # Changed from instagram-post-scraper to avoid explicit username dependency
            "youtube": "apify/youtube-scraper",
            "twitter": "quacker/twitter-scraper",
            "linkedin": "curious_coder/linkedin-post-scraper"
        }
        actor = actor_map.get(domain, "apify/web-scraper")
        actor_path = actor.replace("/", "~")
        try:
            print(f"Starting Apify scrape for {domain} using actor {actor}. This can take 30-60 secs...")
            async with httpx.AsyncClient() as client:
                # Provide multiple standard URL keys to ensure schema compliance across disparate actors
                payload = {"startUrls": [{"url": req.url}], "directUrls": [req.url]}
                
                res = await client.post(
                    f"https://api.apify.com/v2/acts/{actor_path}/run-sync-get-dataset-items",
                    params={"token": apify_token},
                    json=payload,
                    timeout=60.0
                )
                if res.status_code in (200, 201):
                    data = res.json()
                    if len(data) > 0:
                        scraped_text = data[0].get("caption", data[0].get("text", str(data[0])))
                    else:
                        scrape_error = "Apify returned an empty dataset []."
                        print(scrape_error)
                else:
                    scrape_error = f"Apify HTTP {res.status_code}: {res.text}"
                    print(scrape_error)
        except Exception as e:
            scrape_error = f"Apify network exception: {str(e)}"
            print(scrape_error)
            
    if not scraped_text:
        if domain == "instagram": scraped_text = "Just launched my new desk setup! Check out the mechanical keyboard and ultrawide monitor! So productive today. #wfh #setup"
        elif domain == "linkedin": scraped_text = "I am thrilled to announce my new venture. Hard work pays off, and I want to thank my entire team for grinding 80 hour weeks."
        elif domain == "youtube": scraped_text = "In this video I review the new AI gadgets of 2026. Watch till the end to see the giveaway!"
        elif domain == "twitter": scraped_text = "Building tools for AI is the best thing ever. Engagement is crazy."
        else: scraped_text = "Wow this is an amazing post!"
        
    # 2. AI REWRITE via GROQ
    groq_api_key = os.environ.get("GROQ_API_KEY")
    enhanced_text = "AIfied content should appear here. Check GROQ_API_KEY."
    video_frames = []
    
    if groq_api_key:
        prompt = f"""You are an elite Digital Marketing AI. Analyze the following post content:
"{scraped_text}"

You must output a JSON object with EXACTLY two keys:
1. "enhanced_text": A viral, beautifully formatted, high-converting rewrite of this content.
2. "video_analysis": An array of objects to simulate frame-by-frame engagement advice for the video. Give exactly 3 actionable tips spaced by timestamps. Format: [{{"timestamp": "0:05", "issue": "...", "tip": "..."}}]

Return ONLY a raw, pure JSON object. No Markdown wrappers.
"""
        try:
            async with httpx.AsyncClient() as client:
                g_res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_api_key}"},
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=20.0
                )
                if g_res.status_code == 200:
                    content = g_res.json()["choices"][0]["message"]["content"]
                    try:
                        parsed = json.loads(content)
                        enhanced_text = parsed.get("enhanced_text", "")
                        video_frames = parsed.get("video_analysis", [])
                    except json.JSONDecodeError:
                        enhanced_text = content
        except Exception as e:
            print("Groq rewrite failed:", str(e))
            
    return {
        "platform": domain, 
        "original_text": scraped_text, 
        "enhanced_text": enhanced_text, 
        "video_analysis": video_frames,
        "scrape_error": scrape_error
    }
