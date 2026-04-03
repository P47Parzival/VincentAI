import os

from dotenv import load_dotenv

load_dotenv()


def get_frontend_origin() -> str:
    return os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


def get_backend_port() -> int:
    try:
        return int(os.getenv("PORT", "4000"))
    except ValueError:
        return 4000


def get_youtube_analytics_lookback_days() -> int:
    try:
        return int(os.getenv("YOUTUBE_ANALYTICS_LOOKBACK_DAYS", "28"))
    except ValueError:
        return 28
