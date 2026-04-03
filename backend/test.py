import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env")

from app.services.youtube_service import fetch_youtube_analytics

async def main():
    try:
        res = await fetch_youtube_analytics(None, 8)
        print("SUCCESS")
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
