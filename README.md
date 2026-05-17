# LexGuard

AI-powered contract intelligence. Upload a PDF, DOCX, or TXT legal document, get a plain-English breakdown of every clause with risk scores, red flags, real-world impact, and negotiation tips.

## Live Demo

- **App:** _TODO_
- **API:** _TODO_
- **Repo:** https://github.com/ishanavasthi/lexguard

Try the **"Try with a sample contract"** button on the landing page to skip the upload step.

## Features

- Upload PDF, DOCX, or TXT contracts (max 10 MB)
- Two-pass Gemini analysis: clause extraction + adversarial risk scoring
- 9 clause categories: `NON_COMPETE`, `IP_TRANSFER`, `ARBITRATION`, `LIABILITY`, `TERMINATION`, `DATA_PRIVACY`, `PAYMENT`, `AUTO_RENEWAL`, `OTHER`
- Overall risk gauge (0 to 10) with HIGH / MEDIUM / LOW band
- Per-clause cards: plain-English summary, red flags, real-world impact, negotiation tip, expandable original text
- Clauses sorted by risk score (worst first)
- Light / dark mode (pure black dark theme), persisted across reloads
- Bundled sample contract so judges can demo without uploading anything

## Tech Stack

**Backend**

- Python 3.11
- FastAPI + Uvicorn
- PyMuPDF (PDF parsing), python-docx (DOCX parsing)
- Google Gemini (`gemini-2.5-flash`) via `google-generativeai` SDK
- Pydantic v2 schemas

**Frontend**

- Next.js 14 (App Router) + React 18
- TypeScript (strict)
- Tailwind CSS + hand-rolled shadcn/ui primitives
- next-themes for dark mode
- lucide-react icons

**Infrastructure**

- Docker (multi-stage builds for both services)
- Google Cloud Run (target deploy)
- Next.js `output: "standalone"` for slim frontend image

## Architecture

```
+----------------+        multipart/form-data        +----------------+
|                |  POST /analyze (PDF/DOCX/TXT)     |                |
|  Next.js UI    | --------------------------------> |  FastAPI       |
|  (port 3000)   |                                   |  (port 8000)   |
|                | <-- AnalysisResponse JSON ------- |                |
+----------------+                                   +-------+--------+
                                                             |
                                                             |  2x calls
                                                             v
                                                     +----------------+
                                                     | Gemini API     |
                                                     | gemini-2.5-    |
                                                     | flash          |
                                                     +----------------+
```

**Two-pass pipeline:**

1. **Extract + classify** in one call: returns `{ contract_type, clauses[] }`
2. **Risk analysis** in second call: adversarial review of all clauses, returns risk score, red flags, plain English, negotiation tip per clause
3. Merge by `id`, aggregate to overall score, return single `AnalysisResponse`

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Google Gemini API key (free tier, 1500 req/day): https://aistudio.google.com/apikey

### 1. Clone

```bash
git clone https://github.com/ishanavasthi/lexguard.git
cd lexguard
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:GEMINI_API_KEY = "your_gemini_api_key"
uvicorn main:app --reload --port 8000
```

Verify: open http://localhost:8000/docs for the OpenAPI explorer, or `curl http://localhost:8000/health`.

### 3. Frontend

In a separate terminal:

```powershell
cd frontend
npm install
"NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -Encoding utf8 .env.local
npm run dev
```

Open http://localhost:3000.

### 4. Demo flow

1. Click **Try with a sample contract** (or drag in your own PDF, DOCX, or TXT)
2. Wait 15 to 30 seconds while two Gemini calls run
3. Results dashboard shows the overall risk gauge, summary chips, and per-clause cards

## Environment Variables

### Backend

| Var              | Required | Description                               |
| ---------------- | -------- | ----------------------------------------- |
| `GEMINI_API_KEY` | yes      | Google Gemini API key                     |
| `PORT`           | no       | Defaults to 8000. Cloud Run injects this. |

### Frontend

| Var                   | Required | Description                                                   |
| --------------------- | -------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | yes      | Backend base URL. Baked into the client bundle at build time. |

> Frontend env vars prefixed with `NEXT_PUBLIC_` are inlined at build time, not runtime. For Cloud Run, pass via `--build-arg NEXT_PUBLIC_API_URL=...`.

## API Reference

| Method | Path       | Body                                    | Returns            |
| ------ | ---------- | --------------------------------------- | ------------------ |
| `GET`  | `/health`  | -                                       | `{"status": "ok"}` |
| `POST` | `/analyze` | `multipart/form-data` with `file` field | `AnalysisResponse` |

### HTTP error mapping

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| 400  | Empty file                                  |
| 413  | File exceeds 10 MB                          |
| 415  | Unsupported format (only PDF, DOCX, or TXT) |
| 422  | Document parsed but no extractable text     |
| 500  | Backend misconfigured (missing API key)     |
| 502  | Model returned malformed JSON or off-schema |

See [backend/sample_response.json](backend/sample_response.json) for a full example response (24 clauses).

## Docker

### Backend

```bash
docker build -t lexguard-backend ./backend
docker run -p 8000:8000 -e GEMINI_API_KEY=$GEMINI_API_KEY lexguard-backend
```

### Frontend

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  -t lexguard-frontend ./frontend
docker run -p 3000:3000 lexguard-frontend
```

## Cloud Run Deploy

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# Backend
gcloud builds submit ./backend --tag gcr.io/YOUR_PROJECT_ID/lexguard-backend
gcloud run deploy lexguard-backend \
  --image gcr.io/YOUR_PROJECT_ID/lexguard-backend \
  --platform managed --region us-central1 \
  --allow-unauthenticated --memory 512Mi \
  --set-env-vars GEMINI_API_KEY=your_key

# Frontend (pass backend URL as build arg)
gcloud builds submit ./frontend \
  --tag gcr.io/YOUR_PROJECT_ID/lexguard-frontend \
  --substitutions=_API_URL=https://YOUR_BACKEND_URL
gcloud run deploy lexguard-frontend \
  --image gcr.io/YOUR_PROJECT_ID/lexguard-frontend \
  --platform managed --region us-central1 \
  --allow-unauthenticated
```

## Project Structure

```
lexguard/
+-- README.md
+-- backend/
|   +-- Dockerfile
|   +-- requirements.txt
|   +-- main.py                # FastAPI app (/analyze, /health)
|   +-- sample_response.json   # frozen reference output
|   +-- services/
|       +-- models.py          # Pydantic v2 schemas
|       +-- parser.py          # PDF/DOCX text extraction
|       +-- analyzer.py        # Gemini two-pass pipeline
+-- frontend/
    +-- Dockerfile
    +-- package.json
    +-- next.config.mjs
    +-- tailwind.config.ts
    +-- app/
    |   +-- layout.tsx
    |   +-- page.tsx           # upload landing
    |   +-- icon.png           # favicon
    |   +-- globals.css
    |   +-- results/page.tsx   # dashboard
    |   +-- components/
    |       +-- Header.tsx
    |       +-- ThemeToggle.tsx
    |       +-- UploadZone.tsx
    |       +-- LoadingState.tsx
    |       +-- RiskGauge.tsx
    |       +-- SummaryStats.tsx
    |       +-- ClauseCard.tsx
    |       +-- theme-provider.tsx
    |       +-- ui/             # shadcn primitives
    +-- lib/
    |   +-- api.ts
    |   +-- storage.ts
    |   +-- types.ts
    |   +-- utils.ts
    +-- public/
        +-- sample_contract.pdf
```

## Limitations

- **Not legal advice.** LexGuard provides informational analysis only. Always consult a licensed attorney for binding decisions.
- **No OCR.** Scanned PDFs without selectable text will fail with HTTP 422.
- **No persistence.** Files and analysis results are in-memory only. Refreshing `/results` after closing the tab loses the data (sessionStorage scope).
- **Gemini free-tier limits.** 1500 requests per day shared across both passes (so roughly 750 analyses per day).
- **English-language contracts** are best supported; other languages may degrade.
- **Single document per request.** No comparison or batch upload.

## License

This project was built for a hackathon. See repo for license details.

## Acknowledgments

- Google Gemini API for the underlying LLM
- shadcn/ui design system (primitives hand-ported)
- lucide-react icon set
