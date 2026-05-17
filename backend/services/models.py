from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


class ClauseCategory(str, Enum):
    NON_COMPETE = "NON_COMPETE"
    IP_TRANSFER = "IP_TRANSFER"
    ARBITRATION = "ARBITRATION"
    LIABILITY = "LIABILITY"
    TERMINATION = "TERMINATION"
    DATA_PRIVACY = "DATA_PRIVACY"
    PAYMENT = "PAYMENT"
    AUTO_RENEWAL = "AUTO_RENEWAL"
    OTHER = "OTHER"


class RiskLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ExtractedClause(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    category: ClauseCategory
    original_text: str


class RiskAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=10)
    plain_english: str
    red_flags: list[str]
    what_it_means_for_you: str
    negotiation_tip: str


class Clause(ExtractedClause, RiskAnalysis):
    pass


class ClauseCount(BaseModel):
    model_config = ConfigDict(extra="ignore")

    high: int
    medium: int
    low: int


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    contract_type: str
    overall_risk_score: float
    overall_risk_level: RiskLevel
    clause_count: ClauseCount
    clauses: list[Clause]
