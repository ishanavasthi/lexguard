from unittest.mock import patch

from fastapi.testclient import TestClient

import main
from services.models import (
    AnalysisResponse,
    Clause,
    ClauseCategory,
    ClauseCount,
    RiskLevel,
)

client = TestClient(main.app)


def _fake_response() -> AnalysisResponse:
    return AnalysisResponse(
        contract_type="NDA",
        overall_risk_score=5.0,
        overall_risk_level=RiskLevel.MEDIUM,
        clause_count=ClauseCount(high=1, medium=0, low=1),
        clauses=[
            Clause(
                id="c1",
                title="t",
                category=ClauseCategory.OTHER,
                original_text="x",
                risk_level=RiskLevel.HIGH,
                risk_score=8,
                plain_english="x",
                red_flags=[],
                what_it_means_for_you="x",
                negotiation_tip="x",
            ),
        ],
    )


def test_health_returns_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_analyze_empty_file_returns_400():
    r = client.post(
        "/analyze",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert r.status_code == 400


def test_analyze_oversize_file_returns_413():
    big = b"x" * (10 * 1024 * 1024 + 1)
    r = client.post(
        "/analyze",
        files={"file": ("big.pdf", big, "application/pdf")},
    )
    assert r.status_code == 413


def test_analyze_unsupported_extension_returns_415():
    r = client.post(
        "/analyze",
        files={"file": ("foo.doc", b"some bytes", "application/msword")},
    )
    assert r.status_code == 415


def test_analyze_whitespace_only_text_returns_422():
    r = client.post(
        "/analyze",
        files={"file": ("blank.txt", b"   \n  ", "text/plain")},
    )
    assert r.status_code == 422


def test_analyze_happy_path_returns_full_response():
    with patch("main.analyze", return_value=_fake_response()):
        r = client.post(
            "/analyze",
            files={"file": ("doc.txt", b"some contract text", "text/plain")},
        )
    assert r.status_code == 200
    body = r.json()
    assert body["contract_type"] == "NDA"
    assert body["overall_risk_level"] == "MEDIUM"
    assert len(body["clauses"]) == 1
    assert body["clauses"][0]["id"] == "c1"


def test_analyze_runtime_error_returns_500():
    with patch("main.analyze", side_effect=RuntimeError("GEMINI_API_KEY not set")):
        r = client.post(
            "/analyze",
            files={"file": ("doc.txt", b"text body", "text/plain")},
        )
    assert r.status_code == 500


def test_analyze_malformed_model_output_returns_502():
    import json as json_mod

    err = json_mod.JSONDecodeError("Expecting value", "doc", 0)
    with patch("main.analyze", side_effect=err):
        r = client.post(
            "/analyze",
            files={"file": ("doc.txt", b"text body", "text/plain")},
        )
    assert r.status_code == 502


def test_cors_preflight_allowed():
    r = client.options(
        "/analyze",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "*"
