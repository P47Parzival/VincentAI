import json
from fastapi import APIRouter, Request
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
