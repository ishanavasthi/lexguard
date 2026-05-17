export type ClauseCategory =
  | "NON_COMPETE"
  | "IP_TRANSFER"
  | "ARBITRATION"
  | "LIABILITY"
  | "TERMINATION"
  | "DATA_PRIVACY"
  | "PAYMENT"
  | "AUTO_RENEWAL"
  | "OTHER";

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export interface Clause {
  id: string;
  title: string;
  category: ClauseCategory;
  original_text: string;
  risk_level: RiskLevel;
  risk_score: number;
  plain_english: string;
  red_flags: string[];
  what_it_means_for_you: string;
  negotiation_tip: string;
}

export interface ClauseCount {
  high: number;
  medium: number;
  low: number;
}

export interface AnalysisResponse {
  contract_type: string;
  overall_risk_score: number;
  overall_risk_level: RiskLevel;
  clause_count: ClauseCount;
  clauses: Clause[];
}
