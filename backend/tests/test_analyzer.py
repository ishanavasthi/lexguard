import json
from unittest.mock import MagicMock

import pytest

from services import analyzer
from services.analyzer import _aggregate, _strip_and_parse, analyze
from services.models import (
    Clause,
    ClauseCategory,
    ClauseCount,
    RiskLevel,
)


def _make_clause(rid: str, level: RiskLevel, score: int = 5) -> Clause:
    return Clause(
        id=rid,
        title="t",
        category=ClauseCategory.OTHER,
        original_text="x",
        risk_level=level,
        risk_score=score,
        plain_english="x",
        red_flags=[],
        what_it_means_for_you="x",
        negotiation_tip="x",
    )


def _mock_model(*payloads):
    model = MagicMock()
    model.generate_content.side_effect = [
        MagicMock(text=json.dumps(p)) for p in payloads
    ]
    return model


# --- _strip_and_parse ---


def test_strip_and_parse_plain_json():
    assert _strip_and_parse('{"a": 1}') == {"a": 1}


def test_strip_and_parse_strips_json_fence():
    raw = '```json\n{"a": 1}\n```'
    assert _strip_and_parse(raw) == {"a": 1}


def test_strip_and_parse_strips_plain_fence():
    assert _strip_and_parse("```\n[1, 2, 3]\n```") == [1, 2, 3]


def test_strip_and_parse_malformed_raises():
    with pytest.raises(json.JSONDecodeError):
        _strip_and_parse("not actually json")


# --- _aggregate ---


def test_aggregate_empty_returns_low():
    score, level, count = _aggregate([])
    assert score == 0.0
    assert level == RiskLevel.LOW
    assert count == ClauseCount(high=0, medium=0, low=0)


def test_aggregate_avg_at_or_above_7_is_high():
    clauses = [_make_clause(f"c{i}", RiskLevel.HIGH, 8) for i in range(3)]
    score, level, _ = _aggregate(clauses)
    assert score == 8.0
    assert level == RiskLevel.HIGH


def test_aggregate_avg_between_4_and_7_is_medium():
    clauses = [_make_clause(f"c{i}", RiskLevel.MEDIUM, 5) for i in range(3)]
    _, level, _ = _aggregate(clauses)
    assert level == RiskLevel.MEDIUM


def test_aggregate_avg_below_4_is_low():
    clauses = [_make_clause(f"c{i}", RiskLevel.LOW, 2) for i in range(3)]
    _, level, _ = _aggregate(clauses)
    assert level == RiskLevel.LOW


def test_aggregate_boundary_at_7():
    clauses = [_make_clause("c1", RiskLevel.HIGH, 7)]
    _, level, _ = _aggregate(clauses)
    assert level == RiskLevel.HIGH


def test_aggregate_boundary_at_4():
    clauses = [_make_clause("c1", RiskLevel.MEDIUM, 4)]
    _, level, _ = _aggregate(clauses)
    assert level == RiskLevel.MEDIUM


def test_aggregate_count_tallies_by_level():
    clauses = [
        _make_clause("c1", RiskLevel.HIGH, 9),
        _make_clause("c2", RiskLevel.HIGH, 8),
        _make_clause("c3", RiskLevel.MEDIUM, 5),
        _make_clause("c4", RiskLevel.LOW, 2),
    ]
    _, _, count = _aggregate(clauses)
    assert count.high == 2
    assert count.medium == 1
    assert count.low == 1


def test_aggregate_score_rounded_to_one_decimal():
    clauses = [
        _make_clause("c1", RiskLevel.HIGH, 8),
        _make_clause("c2", RiskLevel.MEDIUM, 5),
        _make_clause("c3", RiskLevel.LOW, 2),
    ]
    score, _, _ = _aggregate(clauses)
    assert score == 5.0


# --- analyze (full pipeline, Gemini mocked) ---


def test_analyze_full_pipeline_merges_extracts_with_risks(monkeypatch):
    extract = {
        "contract_type": "NDA",
        "clauses": [
            {
                "id": "c1",
                "title": "Confidentiality",
                "category": "DATA_PRIVACY",
                "original_text": "Keep secret.",
            },
            {
                "id": "c2",
                "title": "Term",
                "category": "TERMINATION",
                "original_text": "Two years.",
            },
        ],
    }
    risk = [
        {
            "id": "c1",
            "risk_level": "HIGH",
            "risk_score": 8,
            "plain_english": "Strict secrecy.",
            "red_flags": ["overly broad"],
            "what_it_means_for_you": "You may breach easily.",
            "negotiation_tip": "Narrow scope.",
        },
        {
            "id": "c2",
            "risk_level": "LOW",
            "risk_score": 2,
            "plain_english": "Standard term.",
            "red_flags": [],
            "what_it_means_for_you": "Normal.",
            "negotiation_tip": "Accept.",
        },
    ]
    monkeypatch.setattr(analyzer, "_configure", lambda: _mock_model(extract, risk))

    result = analyze("contract body")

    assert result.contract_type == "NDA"
    assert len(result.clauses) == 2
    ids = {c.id for c in result.clauses}
    assert ids == {"c1", "c2"}
    c1 = next(c for c in result.clauses if c.id == "c1")
    assert c1.risk_level == RiskLevel.HIGH
    assert c1.title == "Confidentiality"  # from pass 1
    assert c1.red_flags == ["overly broad"]  # from pass 2
    assert result.overall_risk_score == 5.0
    assert result.overall_risk_level == RiskLevel.MEDIUM
    assert result.clause_count.high == 1
    assert result.clause_count.low == 1


def test_analyze_drops_clauses_missing_from_risk_pass(monkeypatch):
    extract = {
        "contract_type": "Agreement",
        "clauses": [
            {"id": "c1", "title": "x", "category": "OTHER", "original_text": "x"},
            {"id": "c2", "title": "y", "category": "OTHER", "original_text": "y"},
        ],
    }
    risk = [
        {
            "id": "c1",
            "risk_level": "MEDIUM",
            "risk_score": 5,
            "plain_english": "x",
            "red_flags": [],
            "what_it_means_for_you": "x",
            "negotiation_tip": "x",
        },
    ]
    monkeypatch.setattr(analyzer, "_configure", lambda: _mock_model(extract, risk))

    result = analyze("x")

    assert len(result.clauses) == 1
    assert result.clauses[0].id == "c1"


def test_analyze_defaults_contract_type_when_missing(monkeypatch):
    extract = {"clauses": []}  # no contract_type key
    risk = []
    monkeypatch.setattr(analyzer, "_configure", lambda: _mock_model(extract, risk))

    result = analyze("x")

    assert result.contract_type == "Unknown Contract"


def test_analyze_raises_on_malformed_json(monkeypatch):
    model = MagicMock()
    model.generate_content.return_value = MagicMock(text="not json")
    monkeypatch.setattr(analyzer, "_configure", lambda: model)

    with pytest.raises(json.JSONDecodeError):
        analyze("text")


def test_configure_raises_when_api_key_missing(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        analyzer._configure()
