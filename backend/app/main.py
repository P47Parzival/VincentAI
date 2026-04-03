from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.api.linkedin_auth import router as linkedin_oauth_router
from app.core.config import get_backend_port, get_frontend_origin
from app.core.live_store import live_store

app = FastAPI(title="Backend Analytics API", version="1.0.0")

frontend_origin = get_frontend_origin()
allow_origins = ["*"] if frontend_origin == "*" else [frontend_origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(linkedin_oauth_router)


@app.websocket("/ws/live-store")
async def live_store_ws(websocket: WebSocket):
    await live_store.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await live_store.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    port = get_backend_port()
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
