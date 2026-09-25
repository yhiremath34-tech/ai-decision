import { Risk, RiskCategory } from '../types/index.js';

export function calculateRiskScore(probability: number, impact: number): number {
  const p = Math.max(1, Math.min(5, Math.round(probability)));
  const i = Math.max(1, Math.min(5, Math.round(impact)));
  return p * i;
}

export function categorizeRisk(score: number): RiskCategory {
  if (score <= 4) return 'low';
  if (score <= 9) return 'moderate';
  if (score <= 16) return 'high';
  return 'critical';
}

export interface AlternativeRiskSummary {
  alternative_id: string;
  total_risk: number;
  max_risk: number;
  critical_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  risk_level: RiskCategory;
}

export function summarizeAlternativeRisks(
  alternativeIds: string[],
  risks: Risk[]
): Record<string, AlternativeRiskSummary> {
  const summaries: Record<string, AlternativeRiskSummary> = {};

  for (const altId of alternativeIds) {
    summaries[altId] = {
      alternative_id: altId,
      total_risk: 0,
      max_risk: 0,
      critical_count: 0,
      high_count: 0,
      moderate_count: 0,
      low_count: 0,
      risk_level: 'low',
    };
  }

  for (const risk of risks) {
    const altId = risk.alternative_id;
    if (!altId || !summaries[altId]) continue;

    const score = calculateRiskScore(risk.probability, risk.impact);
    const cat = categorizeRisk(score);
    const s = summaries[altId];

    s.total_risk += score;
    s.max_risk = Math.max(s.max_risk, score);

    if (cat === 'critical') s.critical_count++;
    else if (cat === 'high') s.high_count++;
    else if (cat === 'moderate') s.moderate_count++;
    else s.low_count++;
  }

  // Determine overall risk category per alternative
  for (const altId of alternativeIds) {
    const s = summaries[altId];
    if (s.critical_count > 0 || s.max_risk >= 17) {
      s.risk_level = 'critical';
    } else if (s.high_count > 0 || s.max_risk >= 10 || s.total_risk >= 20) {
      s.risk_level = 'high';
    } else if (s.moderate_count > 0 || s.max_risk >= 5 || s.total_risk >= 10) {
      s.risk_level = 'moderate';
    } else {
      s.risk_level = 'low';
    }
  }

  return summaries;
}
