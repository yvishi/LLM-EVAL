# LLM Eval Playground

Compare Claude, GPT-4o, and Gemini side by side — latency, cost, response quality, and length — all in one run.

**Live demo works without any setup.** Bring your own API keys to run real evaluations.

---

## Features

- **Parallel evaluation** — all three providers called simultaneously via `asyncio.gather`
- **Scoring** — latency rank, cost rank, response length rank, quality score (Claude judges GPT-4o and Gemini 1–5)
- **Winner badges** — fastest, cheapest, best quality, best length highlighted per run
- **Model selection** — choose any model within each provider (e.g. Opus vs Sonnet vs Haiku)
- **Demo mode** — pre-computed results shown instantly, no keys required
- **Run history** — last 10 runs saved in localStorage, exportable as JSON
- **Preset prompts** — 6 ready-made prompts covering code, reasoning, creative, Q&A, summarization, translation
- **Zero server key storage** — your API keys stay in your browser and are sent only per-request

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys for Anthropic, OpenAI, and Google

### Backend

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Edit .env — only ALLOWED_ORIGINS is needed (no API keys on server)

uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
# Opens at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed frontend origins |

No API keys are stored on the server. They are sent per-request from the browser.

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL for local dev (e.g. `http://localhost:8000`). Leave empty in production to use the Vercel proxy. |

---

## Deploying

### Backend → Render

1. Push repo to GitHub
2. New Web Service on [render.com](https://render.com)
   - **Root directory:** `backend`
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Set environment variable: `ALLOWED_ORIGINS=https://your-app.vercel.app`
4. Deploy. Copy the `https://your-backend.onrender.com` URL.

### Frontend → Vercel

1. Update `frontend/vercel.json` — replace `your-backend.onrender.com` with the actual Render URL
2. New Project on [vercel.com](https://vercel.com)
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable: `VITE_API_URL` = *(leave empty)*
4. Deploy.
5. Copy the Vercel URL and update `ALLOWED_ORIGINS` on Render.

---

## How It Works

```
Browser
  │  user pastes prompt + API keys
  ▼
FastAPI /evaluate
  ├── asyncio.gather([call_claude, call_gpt4o, call_gemini])  ← parallel
  │     each call: instantiate client with user key, call API, measure latency
  │
  └── compute_scores(results)
        ├── rank by latency, cost, length
        └── call Claude to rate GPT-4o & Gemini quality (1–5)
              Claude doesn't rate itself (avoids self-serving bias)

  → EvaluateResponse returned to browser
  → Results displayed in 3-column card grid
  → Saved to localStorage history (keys stripped before saving)
```

---

## Adding a New Provider

1. Add a `call_newprovider()` async function in `backend/evaluator.py` with the same `ModelResult` return shape
2. Add pricing to the `PRICING` dict in `evaluator.py`
3. Add it to `asyncio.gather()` in the `/evaluate` endpoint
4. Add a key field and model list to `ApiKeyPanel.jsx`
5. Add the model card color/label to `ModelCard.jsx`

---

## Smoke Tests (post-deploy)

```bash
curl https://your-backend.onrender.com/health

curl -X POST https://your-backend.onrender.com/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello in one word.",
    "temperature": 0.5,
    "max_tokens": 64,
    "anthropic_api_key": "sk-ant-...",
    "openai_api_key": "sk-...",
    "google_api_key": "AIza...",
    "anthropic_model": "claude-sonnet-4-20250514",
    "openai_model": "gpt-4o",
    "google_model": "gemini-1.5-flash"
  }'
```
