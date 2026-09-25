export type DecisionStatus =
  | 'draft'
  | 'analysis_ready'
  | 'analyzing'
  | 'analyzed'
  | 'reviewed'
  | 'decided'
  | 'archived';

export type DecisionStyle =
  | 'conservative'
  | 'balanced'
  | 'growth-oriented'
  | 'risk-sensitive'
  | 'cost-sensitive';

export type CriterionType =
  | 'quantitative'
  | 'qualitative'
  | 'boolean'
  | 'rating';

export type CriterionDirection =
  | 'higher_better'
  | 'lower_better'
  | 'target';

export type RiskCategory =
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical';

export type EvidenceType =
  | 'internal_data'
  | 'user_observation'
  | 'research'
  | 'report'
  | 'historical_data'
  | 'estimate'
  | 'expert_opinion'
  | 'other';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  decision_question: string;
  description?: string | null;
  domain: string;
  status: DecisionStatus;
  deadline?: string | null;
  desired_outcome?: string | null;
  constraints?: string | null;
  decision_style: DecisionStyle;
  analysis_version: number;
  created_at: string;
  updated_at: string;
}

export interface Alternative {
  id: string;
  decision_id: string;
  name: string;
  description?: string | null;
  estimated_cost?: number | null;
  estimated_benefit?: number | null;
  implementation_effort?: number | null;
  duration_days?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Criterion {
  id: string;
  decision_id: string;
  name: string;
  description?: string | null;
  criterion_type: CriterionType;
  weight: number;
  direction: CriterionDirection;
  unit?: string | null;
  target_value?: number | null;
  min_value?: number | null;
  max_value?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AlternativeScore {
  id: string;
  alternative_id: string;
  criterion_id: string;
  raw_value?: number | null;
  qualitative_value?: string | null;
  normalized_score?: number | null;
  weighted_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  decision_id: string;
  alternative_id?: string | null;
  criterion_id?: string | null;
  title: string;
  evidence_type: EvidenceType;
  source?: string | null;
  description: string;
  reliability?: number | null; // 0 - 100
  evidence_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assumption {
  id: string;
  decision_id: string;
  name: string;
  value: string;
  unit?: string | null;
  confidence?: number | null; // 0 - 100
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Risk {
  id: string;
  decision_id: string;
  alternative_id?: string | null;
  name: string;
  description?: string | null;
  probability: number; // 1 - 5
  impact: number;      // 1 - 5
  risk_score: number;  // probability * impact (1 - 25)
  mitigation?: string | null;
  owner?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalculationSnapshot {
  calculated_at: string;
  alternatives: Array<{
    id: string;
    name: string;
    total_score: number;
    rank: number;
    risk_score: number;
    risk_level: RiskCategory;
    scores: Record<string, {
      raw_value: number | null;
      qualitative_value: string | null;
      normalized_score: number;
      weighted_score: number;
    }>;
  }>;
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    normalized_weight: number;
    direction: CriterionDirection;
    type: CriterionType;
    min: number;
    max: number;
  }>;
  is_valid: boolean;
  warnings: string[];
}

export interface Analysis {
  id: string;
  decision_id: string;
  version: number;
  overall_score?: number | null;
  recommendation?: string | null;
  recommendation_confidence?: number | null;
  executive_summary?: string | null;
  ai_response: AIAnalysisResponse;
  calculation_snapshot: CalculationSnapshot;
  model_name?: string | null;
  created_at: string;
}

export interface SensitivityRun {
  id: string;
  decision_id: string;
  base_analysis_id?: string | null;
  weight_changes: Record<string, number>;
  result: {
    scenarios: Array<{
      variation_percent: number;
      criterion_id: string;
      criterion_name: string;
      adjusted_weight: number;
      rankings: Array<{
        alternative_id: string;
        alternative_name: string;
        score: number;
        rank: number;
      }>;
      winner_changed: boolean;
      new_winner_id: string;
    }>;
    stability: 'stable' | 'moderately_sensitive' | 'highly_sensitive';
    sensitive_criteria: Array<{
      criterion_id: string;
      criterion_name: string;
      threshold_percent?: number;
      impact_summary: string;
    }>;
  };
  stability: 'stable' | 'moderately_sensitive' | 'highly_sensitive';
  created_at: string;
}

export interface FinalDecision {
  id: string;
  decision_id: string;
  selected_alternative_id?: string | null;
  rationale?: string | null;
  decided_at: string;
}

// AI Output Types (matching Section 15 schemas)
export interface AIAlternativeAssessment {
  alternative_id: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  key_risks: string[];
  trade_offs: string[];
}

export interface AIKeyDecisionFactor {
  criterion_id: string;
  reason: string;
  importance: 'high' | 'medium' | 'low';
}

export interface AIAnalysisResponse {
  executive_summary: string;
  recommended_alternative_id: string;
  recommendation_confidence: number; // 0 - 100
  recommendation_rationale: string;
  alternative_assessments: AIAlternativeAssessment[];
  key_decision_factors: AIKeyDecisionFactor[];
  uncertainties: string[];
  missing_information: string[];
  change_conditions: string[];
  next_actions: string[];
  risk_analysis?: {
    overall_risk_level: 'low' | 'moderate' | 'high' | 'critical';
    critical_risks: Array<{
      risk_id: string;
      reason: string;
      mitigation_priority: 'high' | 'medium' | 'low';
    }>;
    risk_observations: string[];
    mitigation_actions: string[];
  };
  trade_offs?: Array<{
    dimension_a: string;
    dimension_b: string;
    explanation: string;
    affected_alternatives: string[];
  }>;
  information_gaps?: Array<{
    item: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
    suggested_method: string;
  }>;
}
