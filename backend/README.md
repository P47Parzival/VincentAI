# Backend Analytics API (FastAPI)

This backend keeps your API keys secure and exposes normalized endpoints for the frontend analytics page.

## 1. Setup

```bash
cd backend
python -m venv .venv
```

### Windows PowerShell

```bash
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

### macOS/Linux

```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill `.env` with your values.

For YouTube:
- `YOUTUBE_API_KEY` + `YOUTUBE_CHANNEL_ID` are used for channel/profile/recent videos.
- Real reach/impressions require YouTube Analytics API OAuth credentials:
	- either `YOUTUBE_OAUTH_ACCESS_TOKEN`
	- or `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
	- OAuth scope must include: `https://www.googleapis.com/auth/yt-analytics.readonly`

## 2. Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

Server default: `http://localhost:4000`

## 3. Endpoints

- `GET /api/health`
- `GET /api/analytics/instagram?igUserId=<id>&mediaLimit=10`
- `GET /api/analytics/youtube?channelId=<id>&maxResults=8`

If `igUserId` or `channelId` are omitted, backend falls back to `.env` values.

When OAuth is configured correctly, YouTube reach/impressions come from YouTube Analytics API.

Note: depending on channel/report availability, YouTube Analytics may not expose a direct `impressions` metric in this report query. In that case the backend uses Analytics-derived fallbacks (`viewerPercentage` or `views`) while still preferring Analytics over Data API totals.
