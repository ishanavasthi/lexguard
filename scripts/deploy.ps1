#!/usr/bin/env pwsh
# Fast deploy LexGuard backend + frontend to GCP Cloud Run.
#
# Usage:
#   .\scripts\deploy.ps1 -ProjectId my-gcp-project
#   .\scripts\deploy.ps1 -ProjectId my-gcp-project -Region us-east1
#   .\scripts\deploy.ps1 -ProjectId my-gcp-project -GeminiApiKey AIza...
#
# If -GeminiApiKey is omitted, the script reads GEMINI_API_KEY from .env at repo root.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $ProjectId,
    [string] $Region = "us-central1",
    [string] $BackendService = "lexguard-backend",
    [string] $FrontendService = "lexguard-frontend",
    [string] $GeminiApiKey
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

function Info($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "==> $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "==> $msg" -ForegroundColor Yellow }

# --- Resolve API key from .env if not passed ---
if (-not $GeminiApiKey) {
    $envFile = Join-Path $RepoRoot ".env"
    if (Test-Path $envFile) {
        $line = Select-String -Path $envFile -Pattern "^GEMINI_API_KEY=" | Select-Object -First 1
        if ($line) {
            $GeminiApiKey = ($line.Line -split "=", 2)[1].Trim().Trim('"').Trim("'")
        }
    }
}
if (-not $GeminiApiKey) {
    Write-Error "GEMINI_API_KEY missing. Pass -GeminiApiKey or set it in .env at repo root."
    exit 1
}

# --- Pre-flight ---
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
}

Info "Project: $ProjectId | Region: $Region"
gcloud config set project $ProjectId | Out-Null

Info "Enabling required APIs (idempotent)..."
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    --quiet

# --- Backend ---
$BackendImage = "gcr.io/$ProjectId/${BackendService}:latest"

Info "Building backend image: $BackendImage"
gcloud builds submit ./backend --tag $BackendImage --quiet

Info "Deploying backend to Cloud Run..."
gcloud run deploy $BackendService `
    --image $BackendImage `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 120 `
    --port 8000 `
    --set-env-vars "GEMINI_API_KEY=$GeminiApiKey" `
    --quiet

$BackendUrl = (gcloud run services describe $BackendService --region $Region --format "value(status.url)").Trim()
if (-not $BackendUrl) {
    Write-Error "Failed to resolve backend URL after deploy"
    exit 1
}
Ok "Backend live: $BackendUrl"

# --- Frontend ---
$FrontendImage = "gcr.io/$ProjectId/${FrontendService}:latest"

Info "Building frontend image with NEXT_PUBLIC_API_URL=$BackendUrl"
gcloud builds submit ./frontend `
    --config ./frontend/cloudbuild.yaml `
    --substitutions "_API_URL=$BackendUrl,_IMAGE=$FrontendImage" `
    --quiet

Info "Deploying frontend to Cloud Run..."
gcloud run deploy $FrontendService `
    --image $FrontendImage `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --port 3000 `
    --quiet

$FrontendUrl = (gcloud run services describe $FrontendService --region $Region --format "value(status.url)").Trim()
Ok "Frontend live: $FrontendUrl"

Write-Host ""
Ok "Deploy complete."
Write-Host "   App:     $FrontendUrl"
Write-Host "   API:     $BackendUrl"
Write-Host "   Health:  $BackendUrl/health"
Warn "Note: GEMINI_API_KEY is stored as a plain env var on the Cloud Run service."
Warn "For production, migrate to Secret Manager (gcloud secrets create...)."
