import { z } from 'zod';

// Decision validation schemas
export const decisionSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title max 200 characters'),
  decision_question: z.string().trim().min(10, 'Question must be at least 10 characters').max(2000, 'Question max 2000 characters'),
  description: z.string().max(5000).optional().nullable(),
  domain: z.string().trim().min(2, 'Domain must be specified').max(100),
  deadline: z.string().optional().nullable(),
  desired_outcome: z.string().max(2000).optional().nullable(),
  constraints: z.string().max(5000).optional().nullable(),
  decision_style: z.enum([
    'conservative',
    'balanced',
    'growth-oriented',
    'risk-sensitive',
    'cost-sensitive',
  ]).default('balanced'),
});

export const updateDecisionSchema = decisionSchema.partial().extend({
  status: z.enum([
    'draft',
    'analysis_ready',
    'analyzing',
    'analyzed',
    'reviewed',
    'decided',
    'archived',
  ]).optional(),
});

// Alternative validation schemas
export const alternativeSchema = z.object({
  name: z.string().trim().min(1, 'Alternative name is required').max(150),
  description: z.string().max(3000).optional().nullable(),
  estimated_cost: z.number().min(0).optional().nullable(),
  estimated_benefit: z.number().min(0).optional().nullable(),
  implementation_effort: z.number().min(0).max(100).optional().nullable(),
  duration_days: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});

export const updateAlternativeSchema = alternativeSchema.partial();

// Criterion validation schemas
export const criterionSchema = z.object({
  name: z.string().trim().min(1, 'Criterion name is required').max(150),
  description: z.string().max(2000).optional().nullable(),
  criterion_type: z.enum([
    'quantitative',
    'qualitative',
    'boolean',
    'rating',
  ]),
  weight: z.number().min(0, 'Weight must be >= 0').max(100, 'Weight must be <= 100'),
  direction: z.enum([
    'higher_better',
    'lower_better',
    'target',
  ]),
  unit: z.string().max(50).optional().nullable(),
  target_value: z.number().optional().nullable(),
  min_value: z.number().optional().nullable(),
  max_value: z.number().optional().nullable(),
});

export const updateCriterionSchema = criterionSchema.partial();

// Alternative score schema
export const singleScoreSchema = z.object({
  alternative_id: z.string().uuid(),
  criterion_id: z.string().uuid(),
  raw_value: z.number().optional().nullable(),
  qualitative_value: z.string().max(1000).optional().nullable(),
  normalized_score: z.number().min(0).max(1).optional().nullable(),
  weighted_score: z.number().optional().nullable(),
});

export const scoreBatchSchema = z.object({
  scores: z.array(singleScoreSchema),
});

// Evidence validation schema
export const evidenceSchema = z.object({
  title: z.string().trim().min(1, 'Evidence title is required').max(200),
  evidence_type: z.enum([
    'internal_data',
    'user_observation',
    'research',
    'report',
    'historical_data',
    'estimate',
    'expert_opinion',
    'other',
  ]),
  source: z.string().max(300).optional().nullable(),
  description: z.string().trim().min(3, 'Description is required').max(3000),
  reliability: z.number().min(0).max(100).optional().nullable(),
  evidence_date: z.string().optional().nullable(),
  alternative_id: z.string().uuid().optional().nullable(),
  criterion_id: z.string().uuid().optional().nullable(),
});

export const updateEvidenceSchema = evidenceSchema.partial();

// Assumption validation schema
export const assumptionSchema = z.object({
  name: z.string().trim().min(1, 'Assumption name is required').max(200),
  value: z.string().trim().min(1, 'Assumption value is required').max(500),
  unit: z.string().max(50).optional().nullable(),
  confidence: z.number().min(0).max(100).optional().nullable(),
  source: z.string().max(300).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});

export const updateAssumptionSchema = assumptionSchema.partial();

// Risk validation schema
export const riskSchema = z.object({
  name: z.string().trim().min(1, 'Risk name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigation: z.string().max(2000).optional().nullable(),
  owner: z.string().max(150).optional().nullable(),
  alternative_id: z.string().uuid().optional().nullable(),
});

export const updateRiskSchema = riskSchema.partial();

// Final Decision validation schema
export const finalDecisionSchema = z.object({
  selected_alternative_id: z.string().uuid('A valid alternative must be chosen'),
  rationale: z.string().trim().min(5, 'Rationale must be at least 5 characters').max(5000),
});

// Sensitivity Analysis Request schema
export const sensitivitySchema = z.object({
  base_analysis_id: z.string().uuid().optional(),
  custom_weights: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

// AI Response Strict Validation Schemas (matching Section 15 & Section 16)
export const aiAlternativeAssessmentSchema = z.object({
  alternative_id: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  key_risks: z.array(z.string()),
  trade_offs: z.array(z.string()),
});

export const aiKeyDecisionFactorSchema = z.object({
  criterion_id: z.string(),
  reason: z.string(),
  importance: z.enum(['high', 'medium', 'low']),
});

export const aiExecutiveAnalysisSchema = z.object({
  executive_summary: z.string().min(10),
  recommended_alternative_id: z.string(),
  recommendation_confidence: z.number().min(0).max(100),
  recommendation_rationale: z.string().min(10),
  alternative_assessments: z.array(aiAlternativeAssessmentSchema),
  key_decision_factors: z.array(aiKeyDecisionFactorSchema),
  uncertainties: z.array(z.string()),
  missing_information: z.array(z.string()),
  change_conditions: z.array(z.string()),
  next_actions: z.array(z.string()),
  risk_analysis: z.object({
    overall_risk_level: z.enum(['low', 'moderate', 'high', 'critical']),
    critical_risks: z.array(z.object({
      risk_id: z.string(),
      reason: z.string(),
      mitigation_priority: z.enum(['high', 'medium', 'low']),
    })),
    risk_observations: z.array(z.string()),
    mitigation_actions: z.array(z.string()),
  }).optional(),
  trade_offs: z.array(z.object({
    dimension_a: z.string(),
    dimension_b: z.string(),
    explanation: z.string(),
    affected_alternatives: z.array(z.string()),
  })).optional(),
  information_gaps: z.array(z.object({
    item: z.string(),
    reason: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    suggested_method: z.string(),
  })).optional(),
});
