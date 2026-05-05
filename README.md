# LLM Eval Playground

Compare responses from Claude, GPT-4o, and Gemini side by side. Send the same prompt to all three simultaneously, then see latency, cost, token counts, and a blind quality score ranked in real time.

**No setup required to try it** — click "Run Demo" to see pre-computed results instantly. Bring your own API keys to run live evaluations.

---

## Table of Contents

- [What it does](#what-it-does)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Deploying](#deploying)
- [Adding a new provider](#adding-a-new-provider)
- [Pricing table](#pricing-table)
- [Troubleshooting](#troubleshooting)

---

## What it does

- **Parallel evaluation** — all provider calls run simultaneously via `asyncio.gather`, so total wait time equals the slowest single model, not the sum of all three.
- **Per-model metrics** — latency (ms), input/output token counts, estimated cost in USD.
- **Blind quality scoring** — a separate Claude call rates all responses labeled A/B/C with no model names revealed, so the score is unbiased. Requires an Anthropic key.
- **Winner badges** — fastest, cheapest, best quality, and best length are highlighted on each card.
- **Partial key support** — works with 1, 2, or all 3 API keys. Only models with a key provided are called.
- **Flexible model selection** — choose any model within each provider from a dropdown (e.g. Opus vs Sonnet vs Haiku for Anthropic).
- **Demo mode** — 3 pre-computed result sets (code, Q&A, creative) shown without any API keys.
- **Run history** — last 10 runs saved in `localStorage`, exportable as JSON. API keys are stripped before saving.
- **Zero server key storage** — keys live only in your browser and are sent per-request in the request body. The server never stores or logs them.
- **6 preset prompts** — code generation, reasoning, creative writing, summarization, Q&A, translation.

---

## Project structure

```
llm-eval-playground/
├── backend/
│   ├── main.py          # FastAPI app, CORS config, health endpoint
│   ├── evaluator.py     # Request/response schemas, parallel API calls, /evaluate route
│   ├── scorer.py        # Ranking logic + blind quality scoring via Claude
│   ├── requirements.txt
│   ├── .env             # Local env vars (gitignored)
│   └── .env.example     # Template — copy this to .env
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry point + ErrorBoundary
│   │   ├── App.jsx              # Root component — state, layout, submit logic
│   │   ├── components/
│   │   │   ├── ApiKeyPanel.jsx  # Collapsible key inputs + model dropdowns
│   │   │   ├── ModelCard.jsx    # Per-model result card with metrics
│   │   │   ├── PromptInput.jsx  # Textarea, temperature/max_tokens sliders
│   │   │   └── ScoreBar.jsx     # Rank visualization bar (green/amber/red)
│   │   └── utils/
│   │       ├── api.js           # Axios client, localStorage helpers
│   │       └── demoData.js      # Pre-computed demo result sets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js   # Dev proxy: /api → localhost:8000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vercel.json      # Production proxy: /api → Render backend URL
└── README.md
```

---

## How it works

### Request flow

```
Browser
  │
  │  POST /api/evaluate  { prompt, keys, models, temperature, max_tokens }
  ▼
Vite dev proxy  ──►  FastAPI  :8000
(or Vercel rewrite in prod)
  │
  ├── validate: at least one key present, else 400
  │
  ├── asyncio.gather(
  │     call_claude(...)   ──►  Anthropic API
  │     call_gpt4o(...)    ──►  OpenAI API       ← all run in parallel
  │     call_gemini(...)   ──►  Google API
  │   )
  │   each call:
  │     - instantiates SDK client with the user-supplied key
  │     - measures wall-clock latency with time.perf_counter()
  │     - extracts token counts from the SDK response
  │     - calculates cost from PRICING table
  │     - on any exception: returns ModelResult with error field set
  │
  ├── compute_scores(results)
  │     ├── latency_rank   — sorted ascending, rank 1 = fastest
  │     ├── cost_rank      — sorted ascending, rank 1 = cheapest
  │     ├── length_rank    — closest to median response length = rank 1
  │     └── quality_score  — separate Claude call (blind A/B/C evaluation)
  │           requires Anthropic key + at least 2 successful responses
  │           model names are hidden from the judge to prevent bias
  │
  └── EvaluateResponse → browser
        results[]:   per-model text + metrics
        scores{}:    per-model rank breakdown
        winner_by_metric{}: which model won each category
```

### Blind quality scoring

When an Anthropic key is present and at least 2 models responded successfully, a second Claude call is made to score all responses:

1. Responses are labeled A, B, C — no model names are sent to the judge.
2. Claude rates each on accuracy, completeness, clarity, and depth (1–5).
3. Scores are mapped back to model IDs and ranked.
4. If quality scoring fails for any reason (bad key, timeout, malformed JSON), all quality scores silently fall back to `null` — the rest of the evaluation still completes.

### Key security model

- Keys are entered in the browser, stored in `localStorage` under `llm_eval_keys`, and sent in the JSON request body.
- The server reads them from the request, instantiates the SDK client, and discards them — they are never written to disk, logged, or stored in any server-side state.
- Run history saved to `localStorage` explicitly strips key fields before saving.

---

## Local development

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| API keys | At least one of: Anthropic, OpenAI, Google |

### 1. Clone and enter the repo

```bash
git clone <your-repo-url>
cd llm-eval-playground
```

### 2. Set up the backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Open .env and set ALLOWED_ORIGINS (see Environment Variables below)
```

Start the backend with hot-reload:

```bash
uvicorn main:app --reload --port 8000
```

> **Important:** always use `--reload` in development. Without it, the server runs the code snapshot from startup and won't pick up your edits.

Verify it's running:

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server is pre-configured to proxy all `/api/*` requests to `http://localhost:8000`. No `.env.local` file is needed for local development — just make sure the backend is running on port 8000.

### 4. Use the app

1. Open `http://localhost:5173`
2. Click **"Use your own API keys"** to expand the key panel
3. Paste one or more API keys and choose your preferred models
4. Type a prompt (or click a preset) and hit **Run Evaluation**

Results appear as cards — one per model. If only one or two keys are provided, only those models run.

---

## Environment variables

### Backend (`backend/.env`)

Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of frontend origins FastAPI will accept CORS requests from. Example: `http://localhost:5173,https://your-app.vercel.app` |

**No API keys go in `.env`.** Keys are received per-request from the browser.

### Frontend

In local development, no `.env.local` is needed — the Vite proxy handles routing.

In production (Vercel), set:

| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | *(empty)* | When empty, `api.js` falls back to `/api`, which Vercel rewrites to your Render backend URL via `vercel.json` |

---

## API reference

### `GET /health`

Returns `{"status": "ok"}`. Used by Render for health checks.

---

### `POST /evaluate`

Run a prompt through one or more LLM providers in parallel.

**Request body**

```json
{
  "prompt": "string (1–8000 chars, required)",
  "temperature": 0.7,
  "max_tokens": 512,
  "anthropic_api_key": "sk-ant-...",
  "openai_api_key": "sk-...",
  "google_api_key": "AIza...",
  "anthropic_model": "claude-sonnet-4-20250514",
  "openai_model": "gpt-4o",
  "google_model": "gemini-1.5-flash"
}
```

- All key fields default to `""` — omit or leave blank to skip that provider.
- At least one key must be non-empty, otherwise a `400` is returned.
- `temperature`: `0.0` – `2.0` (default `0.7`)
- `max_tokens`: `64` – `4096` (default `512`)

**Available models per provider**

| Provider | Models |
|---|---|
| Anthropic | `claude-opus-4-7`, `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001` |
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `o1-mini` |
| Google | `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash` |

**Response body**

```json
{
  "prompt_echo": "the original prompt",
  "results": [
    {
      "model_id": "claude",
      "model_name": "claude-sonnet-4-20250514",
      "response_text": "...",
      "latency_ms": 1823.4,
      "input_tokens": 42,
      "output_tokens": 198,
      "total_tokens": 240,
      "estimated_cost_usd": 0.003096,
      "error": null
    }
  ],
  "scores": {
    "claude": {
      "latency_rank": 2,
      "cost_rank": 3,
      "length_chars": 842,
      "length_rank": 1,
      "quality_score": 4.0,
      "quality_rank": 2
    }
  },
  "winner_by_metric": {
    "latency": "gemini",
    "cost": "gemini",
    "length": "claude",
    "quality": "gpt4o"
  }
}
```

- `results` contains only the models that were called (1–3 items).
- If a model's API call fails, `error` is set to the exception message and `response_text` is `null`. Other models still return normally.
- `quality_score` and `quality_rank` are `null` if: only one model responded, no Anthropic key was provided, or the scoring call failed.
- All ranks are 1-indexed — rank `1` is best.

---

## Deploying

Deploy in this order: **backend first**, then frontend (because `vercel.json` needs the Render URL).

### Backend → Render

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Configure:

   | Setting | Value |
   |---|---|
   | Root directory | `backend` |
   | Runtime | Python 3 |
   | Build command | `pip install -r requirements.txt` |
   | Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. Add environment variable:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app` (fill in after you know the Vercel URL; you can update it later)

5. Deploy. Copy the URL — it looks like `https://llm-eval-xxxx.onrender.com`.

### Frontend → Vercel

1. Edit `frontend/vercel.json` — replace the placeholder with your actual Render URL:

   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://llm-eval-xxxx.onrender.com/$1" }
     ]
   }
   ```

2. Commit and push.

3. Go to [vercel.com](https://vercel.com) → **New Project** → import from GitHub.
4. Configure:

   | Setting | Value |
   |---|---|
   | Root directory | `frontend` |
   | Framework preset | Vite |
   | Build command | `npm run build` |
   | Output directory | `dist` |

5. Add environment variable: `VITE_API_URL` = *(leave the value blank)*

6. Deploy. Copy the Vercel URL.

7. Go back to Render → your service → **Environment** → update `ALLOWED_ORIGINS` to include the Vercel URL.

**Why this proxy setup?**
In production, the browser talks to `your-app.vercel.app/api/evaluate`. Vercel rewrites the request to your Render backend. Since both frontend and the proxied API share the same origin (`your-app.vercel.app`), the browser never makes a cross-origin request and CORS is not involved. FastAPI's CORS config is only relevant for non-proxied access (e.g. direct curl to Render, or local dev).

---

## Adding a new provider

1. **Backend — `evaluator.py`**
   - Add a pricing entry to `PRICING`:
     ```python
     "newprovider": {"input_per_1k": 0.001, "output_per_1k": 0.003}
     ```
   - Write an `async def call_newprovider(prompt, temperature, max_tokens, api_key, model) -> ModelResult` function following the same pattern as the existing three (try/except, measure latency, extract token counts).
   - Add a `newprovider_api_key: str = ""` and `newprovider_model: str = "default-model"` field to `EvaluateRequest`.
   - Add the conditional task in the `evaluate` endpoint:
     ```python
     if req.newprovider_api_key.strip():
         tasks.append(call_newprovider(...))
     ```

2. **Frontend — `ApiKeyPanel.jsx`**
   - Add a `NEWPROVIDER_MODELS` list.
   - Add a `<KeyRow>` for the new provider.
   - Update the `keys` and `models` state shapes in `App.jsx` to include the new provider.

3. **Frontend — `ModelCard.jsx`**
   - Add entries to `PROVIDER_LABELS`, `PROVIDER_COLORS`, and `PROVIDER_BADGE` for the new `model_id`.

---

## Pricing table

Cost is calculated as:

```
cost = (input_tokens / 1000 × input_price) + (output_tokens / 1000 × output_price)
```

Prices used in `backend/evaluator.py` (`PRICING` dict):

| Provider | Model family | Input per 1K tokens | Output per 1K tokens |
|---|---|---|---|
| Anthropic | claude (all) | $0.003 | $0.015 |
| OpenAI | gpt-4o (all) | $0.0025 | $0.010 |
| Google | gemini (all) | $0.000075 | $0.0003 |

> These are approximations. Check each provider's pricing page for exact current rates, and update the `PRICING` dict in `evaluator.py` accordingly.

---

## Troubleshooting

**White screen on clicking Run Evaluation**
The most common cause is the backend returning a non-string error that crashes React rendering. This was fixed — make sure you're running the latest frontend code (`npm run dev` after pulling).

**Backend server not updating after code changes**
Start uvicorn with `--reload`: `uvicorn main:app --reload --port 8000`. Without it, the server keeps running the code from startup.

**"At least one API key is required" error**
All three key fields were left empty. Expand the key panel and enter at least one key.

**Quality scores showing `—` (dash)**
Quality scoring requires an Anthropic API key and at least 2 models to have responded successfully. If only one model ran, there is nothing to compare and scoring is skipped.

**IDE shows "Cannot find module" warnings for backend files**
The IDE is using your system Python, not the project's virtual environment. In VS Code: `Ctrl+Shift+P` → **Python: Select Interpreter** → choose `.venv\Scripts\python.exe` inside the `backend` folder.

**CORS errors in the browser console**
In local dev: make sure the backend is running on port 8000 — the Vite proxy routes `/api/*` there automatically.
In production: make sure `ALLOWED_ORIGINS` on Render includes your exact Vercel URL (no trailing slash).

**Gemini API errors about concurrent requests**
The `google-generativeai` library uses a process-global `genai.configure()` call. Simultaneous requests from different users will overwrite each other's key. This is acceptable for a single-user or demo deployment; for multi-user production use, consider upgrading to `google-genai` (the newer client library) which supports per-client configuration.
