import json

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from services.analyzer import analyze
from services.models import AnalysisResponse
from services.parser import (
    EmptyDocumentError,
    UnsupportedFormatError,
    extract_text,
)

MAX_BYTES = 10 * 1024 * 1024

app = FastAPI(title="LexGuard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_contract(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File exceeds 10MB limit")
    if len(data) == 0:
        raise HTTPException(400, "Empty file")

    try:
        text = extract_text(data, file.filename or "")
    except UnsupportedFormatError as e:
        raise HTTPException(415, str(e))
    except EmptyDocumentError as e:
        raise HTTPException(422, str(e))

    try:
        return analyze(text)
    except json.JSONDecodeError:
        raise HTTPException(502, "Model returned malformed JSON")
    except ValidationError as e:
        raise HTTPException(502, f"Model output failed schema: {e.errors()[:3]}")
    except RuntimeError as e:
        raise HTTPException(500, str(e))
