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
