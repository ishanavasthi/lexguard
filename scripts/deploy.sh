#!/usr/bin/env bash
# Fast deploy LexGuard backend + frontend to GCP Cloud Run.
#
# Usage:
#   ./scripts/deploy.sh <PROJECT_ID> [REGION]
#
# Reads GEMINI_API_KEY from .env at repo root if not exported in the shell.

set -euo pipefail

PROJECT_ID="${1:?Usage: $0 <PROJECT_ID> [REGION]}"
REGION="${2:-us-central1}"
BACKEND_SERVICE="lexguard-backend"
FRONTEND_SERVICE="lexguard-frontend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

info() { printf "\033[36m==> %s\033[0m\n" "$*"; }
ok()   { printf "\033[32m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[33m==> %s\033[0m\n" "$*"; }

# Resolve API key
if [[ -z "${GEMINI_API_KEY:-}" && -f .env ]]; then
  GEMINI_API_KEY="$(grep -E '^GEMINI_API_KEY=' .env | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs)"
fi
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "ERROR: GEMINI_API_KEY missing. Export it or set in .env" >&2
  exit 1
fi

command -v gcloud >/dev/null || { echo "gcloud not found"; exit 1; }

info "Project: $PROJECT_ID | Region: $REGION"
gcloud config set project "$PROJECT_ID" >/dev/null

info "Enabling required APIs (idempotent)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --quiet

# Backend
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:latest"
info "Building backend image: $BACKEND_IMAGE"
gcloud builds submit ./backend --tag "$BACKEND_IMAGE" --quiet

info "Deploying backend..."
gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi --cpu 1 --timeout 120 --port 8000 \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --quiet

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" --region "$REGION" --format 'value(status.url)')"
ok "Backend live: $BACKEND_URL"

# Frontend
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE}:latest"
info "Building frontend image with NEXT_PUBLIC_API_URL=$BACKEND_URL"
gcloud builds submit ./frontend \
  --config ./frontend/cloudbuild.yaml \
  --substitutions "_API_URL=${BACKEND_URL},_IMAGE=${FRONTEND_IMAGE}" \
  --quiet

info "Deploying frontend..."
gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 512Mi --cpu 1 --port 3000 \
  --quiet

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE" --region "$REGION" --format 'value(status.url)')"
ok "Frontend live: $FRONTEND_URL"

echo
ok "Deploy complete."
echo "   App:    $FRONTEND_URL"
echo "   API:    $BACKEND_URL"
echo "   Health: $BACKEND_URL/health"
warn "GEMINI_API_KEY stored as plain env var on Cloud Run."
warn "For prod, migrate to Secret Manager."
