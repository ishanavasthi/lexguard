import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from services.models import (
    AnalysisResponse,
    ClauseCategory,
    ExtractedClause,
    RiskAnalysis,
    RiskLevel,
)

SAMPLE = Path(__file__).resolve().parent.parent / "sample_response.json"


def test_risk_level_enum_values():
    assert RiskLevel.HIGH.value == "HIGH"
    assert RiskLevel("LOW") == RiskLevel.LOW


def test_clause_category_has_nine_values():
    assert len(ClauseCategory) == 9
    assert ClauseCategory.NON_COMPETE.value == "NON_COMPETE"


def test_risk_analysis_score_above_range_rejected():
    with pytest.raises(ValidationError):
        RiskAnalysis(
            id="c1",
            risk_level="HIGH",
            risk_score=11,
            plain_english="x",
            red_flags=[],
            what_it_means_for_you="x",
            negotiation_tip="x",
        )


def test_risk_analysis_score_negative_rejected():
    with pytest.raises(ValidationError):
        RiskAnalysis(
            id="c1",
            risk_level="HIGH",
            risk_score=-1,
            plain_english="x",
            red_flags=[],
            what_it_means_for_you="x",
            negotiation_tip="x",
        )


def test_extracted_clause_unknown_category_rejected():
    with pytest.raises(ValidationError):
        ExtractedClause(
            id="c1",
            title="t",
            category="FAKE_CATEGORY",
            original_text="x",
        )


def test_extra_fields_silently_ignored():
    c = ExtractedClause.model_validate(
        {
            "id": "c1",
            "title": "t",
            "category": "OTHER",
            "original_text": "x",
            "extra_field_from_model": "ignored",
        }
    )
    assert c.id == "c1"
    assert not hasattr(c, "extra_field_from_model")


@pytest.mark.skipif(not SAMPLE.exists(), reason="sample_response.json missing")
def test_analysis_response_roundtrip_from_sample():
    data = json.loads(SAMPLE.read_text(encoding="utf-8"))
    parsed = AnalysisResponse.model_validate(data)
    assert parsed.contract_type
    assert len(parsed.clauses) == 24
    assert parsed.overall_risk_score == 5.1
    assert parsed.overall_risk_level == RiskLevel.MEDIUM
    assert parsed.clause_count.high == 6
    assert parsed.clause_count.medium == 11
    assert parsed.clause_count.low == 7
    for c in parsed.clauses:
        assert 0 <= c.risk_score <= 10
