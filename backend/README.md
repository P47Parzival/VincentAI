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
