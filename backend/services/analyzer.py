import json
import os
import re

import google.generativeai as genai

from .models import (
    AnalysisResponse,
    Clause,
    ClauseCount,
    ExtractedClause,
    RiskAnalysis,
    RiskLevel,
)

MODEL_NAME = "gemini-1.5-flash"
_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _configure() -> genai.GenerativeModel:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not set")
    genai.configure(api_key=key)
    return genai.GenerativeModel(MODEL_NAME)


def _strip_and_parse(raw: str):
    cleaned = _FENCE_RE.sub("", raw.strip()).strip()
    return json.loads(cleaned)


EXTRACT_PROMPT = """You are a legal analyst extracting contractual clauses from a document.

First, identify the contract type in 2-5 words (e.g. "Employment Agreement", "SaaS Terms of Service", "Residential Lease").

Then extract all distinct clauses. For each clause return a JSON object.

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.

Schema:
{{
  "contract_type": "short type label",
  "clauses": [
    {{
      "id": "clause_1",
      "title": "Short descriptive title",
      "category": one of [NON_COMPETE, IP_TRANSFER, ARBITRATION, LIABILITY, TERMINATION, DATA_PRIVACY, PAYMENT, AUTO_RENEWAL, OTHER],
      "original_text": "The exact relevant text from the document"
    }}
  ]
}}

Contract text:
{CONTRACT_TEXT}
"""

RISK_PROMPT = """You are an adversarial legal analyst reviewing contract clauses strictly from the perspective of the individual signing this agreement.

Analyze the following clauses for risks, unfair terms, hidden liabilities, and ambiguous language.

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.

Schema for each item:
{{
  "id": "clause_1",
  "risk_level": one of [HIGH, MEDIUM, LOW],
  "risk_score": integer 0-10,
  "plain_english": "What this clause actually means in simple terms",
  "red_flags": ["specific concern 1", "specific concern 2"],
  "what_it_means_for_you": "Practical real-world impact on the signer",
  "negotiation_tip": "One concrete thing you could ask to change"
}}

Clauses to analyze:
{CLAUSES_JSON}
"""


def extract_clauses(
    model: genai.GenerativeModel, text: str
) -> tuple[str, list[ExtractedClause]]:
    resp = model.generate_content(EXTRACT_PROMPT.format(CONTRACT_TEXT=text))
    data = _strip_and_parse(resp.text)
    contract_type = data.get("contract_type", "Unknown Contract")
    clauses = [ExtractedClause.model_validate(c) for c in data.get("clauses", [])]
    return contract_type, clauses


def analyze_risks(
    model: genai.GenerativeModel, clauses: list[ExtractedClause]
) -> list[RiskAnalysis]:
    payload = json.dumps([c.model_dump() for c in clauses])
    resp = model.generate_content(RISK_PROMPT.format(CLAUSES_JSON=payload))
    data = _strip_and_parse(resp.text)
    return [RiskAnalysis.model_validate(r) for r in data]


def _aggregate(merged: list[Clause]) -> tuple[float, RiskLevel, ClauseCount]:
    if not merged:
        return 0.0, RiskLevel.LOW, ClauseCount(high=0, medium=0, low=0)
    avg = sum(c.risk_score for c in merged) / len(merged)
    if avg >= 7:
        level = RiskLevel.HIGH
    elif avg >= 4:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW
    count = ClauseCount(
        high=sum(1 for c in merged if c.risk_level == RiskLevel.HIGH),
        medium=sum(1 for c in merged if c.risk_level == RiskLevel.MEDIUM),
        low=sum(1 for c in merged if c.risk_level == RiskLevel.LOW),
    )
    return round(avg, 1), level, count


def analyze(text: str) -> AnalysisResponse:
    model = _configure()
    contract_type, extracted = extract_clauses(model, text)
    risks = analyze_risks(model, extracted)
    risk_map = {r.id: r for r in risks}
    merged = [
        Clause(**{**c.model_dump(), **risk_map[c.id].model_dump()})
        for c in extracted
        if c.id in risk_map
    ]
    score, level, count = _aggregate(merged)
    return AnalysisResponse(
        contract_type=contract_type,
        overall_risk_score=score,
        overall_risk_level=level,
        clause_count=count,
        clauses=merged,
    )
