import { Alternative, Criterion, AlternativeScore, CalculationSnapshot, CriterionDirection, RiskCategory } from '../types/index.js';

export interface RawScoreInput {
  alternative_id: string;
  criterion_id: string;
  raw_value?: number | null;
  qualitative_value?: string | null;
}

/**
 * Normalizes a raw value according to criterion direction and min/max bounds.
 * Clamps normalized score strictly between 0 and 1.
 */
export function normalizeValue(
  value: number | null | undefined,
  criterion: Criterion,
  minVal: number,
  maxVal: number
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  // Boolean criteria: 1 for truthy/yes, 0 for false/no
  if (criterion.criterion_type === 'boolean') {
    return value >= 1 ? 1 : 0;
  }

  // Rating criteria (1 - 5 scale)
  if (criterion.criterion_type === 'rating') {
    const clamped = Math.max(1, Math.min(5, value));
    return (clamped - 1) / 4;
  }

  // If min and max are identical (all alternatives have the same value)
  if (Math.abs(maxVal - minVal) < 1e-9) {
    return 1.0;
  }

  let normalized = 0;

  switch (criterion.direction) {
    case 'higher_better':
      // normalized = (value - min) / (max - min)
      normalized = (value - minVal) / (maxVal - minVal);
      break;

    case 'lower_better':
      // normalized = (max - value) / (max - min)
      normalized = (maxVal - value) / (maxVal - minVal);
      break;

    case 'target': {
      // normalized = 1 - abs(value - target) / max_deviation
      const target = criterion.target_value ?? (minVal + maxVal) / 2;
      const maxDeviation = Math.max(Math.abs(maxVal - target), Math.abs(minVal - target), 1e-6);
      normalized = 1 - Math.abs(value - target) / maxDeviation;
      break;
    }

    default:
      normalized = (value - minVal) / (maxVal - minVal);
  }

  // Clamp strictly between 0 and 1
  return Math.max(0, Math.min(1, Number(normalized.toFixed(4))));
}

/**
 * Normalizes an array of criterion weights so that they sum to exactly 100%.
 */
export function normalizeWeights(criteria: Criterion[]): { id: string; normalizedWeight: number }[] {
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  if (totalWeight <= 0) {
    // Equal distribution if total weight is 0
    const equalShare = 100 / (criteria.length || 1);
    return criteria.map(c => ({ id: c.id, normalizedWeight: Number(equalShare.toFixed(2)) }));
  }

  return criteria.map(c => ({
    id: c.id,
    normalizedWeight: Number(((c.weight / totalWeight) * 100).toFixed(2)),
  }));
}

/**
 * Calculates the complete MCDA Decision Matrix
 */
export function calculateDecisionMatrix(
  alternatives: Alternative[],
  criteria: Criterion[],
  rawScores: (AlternativeScore | RawScoreInput)[],
  risksPerAlternative: Record<string, { total_risk: number; risk_level: RiskCategory }> = {}
): CalculationSnapshot {
  const warnings: string[] = [];

  if (alternatives.length < 2) {
    warnings.push('A decision requires at least 2 alternatives for comparative analysis.');
  }
  if (criteria.length < 2) {
    warnings.push('A decision requires at least 2 criteria for multi-criteria analysis.');
  }

  // Normalize weights
  const weightMap = new Map(normalizeWeights(criteria).map(w => [w.id, w.normalizedWeight]));

  // Index scores by [alternative_id][criterion_id]
  const scoreLookup = new Map<string, RawScoreInput>();
  for (const s of rawScores) {
    scoreLookup.set(`${s.alternative_id}_${s.criterion_id}`, s);
  }

  // Compute min, max for each criterion across all alternatives
  const criteriaBounds: Record<string, { min: number; max: number }> = {};

  for (const criterion of criteria) {
    const values: number[] = [];
    for (const alt of alternatives) {
      const score = scoreLookup.get(`${alt.id}_${criterion.id}`);
      if (score && score.raw_value !== null && score.raw_value !== undefined) {
        values.push(Number(score.raw_value));
      }
    }

    if (values.length === 0) {
      criteriaBounds[criterion.id] = {
        min: criterion.min_value ?? 0,
        max: criterion.max_value ?? 100,
      };
      warnings.push(`Criterion "${criterion.name}" has no score values assigned.`);
    } else {
      const detectedMin = Math.min(...values);
      const detectedMax = Math.max(...values);
      criteriaBounds[criterion.id] = {
        min: criterion.min_value !== null && criterion.min_value !== undefined ? Math.min(criterion.min_value, detectedMin) : detectedMin,
        max: criterion.max_value !== null && criterion.max_value !== undefined ? Math.max(criterion.max_value, detectedMax) : detectedMax,
      };
    }
  }

  // Calculate normalized and weighted scores for each alternative
  const calculatedAlts = alternatives.map(alt => {
    let totalScore = 0;
    const scoresRecord: CalculationSnapshot['alternatives'][0]['scores'] = {};

    for (const criterion of criteria) {
      const scoreEntry = scoreLookup.get(`${alt.id}_${criterion.id}`);
      const rawVal = scoreEntry?.raw_value ?? null;
      const qualVal = scoreEntry?.qualitative_value ?? null;

      const bounds = criteriaBounds[criterion.id] || { min: 0, max: 100 };
      const normalizedScore = normalizeValue(rawVal, criterion, bounds.min, bounds.max);
      const normWeight = weightMap.get(criterion.id) ?? 0;
      // Weighted contribution: (normalized * normalized_weight)
      const weightedScore = Number((normalizedScore * normWeight).toFixed(3));

      totalScore += weightedScore;

      scoresRecord[criterion.id] = {
        raw_value: rawVal,
        qualitative_value: qualVal,
        normalized_score: normalizedScore,
        weighted_score: weightedScore,
      };
    }

    const riskInfo = risksPerAlternative[alt.id] || { total_risk: 0, risk_level: 'low' as RiskCategory };

    return {
      id: alt.id,
      name: alt.name,
      total_score: Number(totalScore.toFixed(2)),
      rank: 1, // temporary, assigned below
      risk_score: riskInfo.total_risk,
      risk_level: riskInfo.risk_level,
      scores: scoresRecord,
    };
  });

  // Assign ranks (sort descending by total_score, secondary sort: lower risk)
  calculatedAlts.sort((a, b) => {
    if (Math.abs(b.total_score - a.total_score) > 1e-4) {
      return b.total_score - a.total_score;
    }
    return a.risk_score - b.risk_score;
  });

  calculatedAlts.forEach((alt, idx) => {
    alt.rank = idx + 1;
  });

  const criteriaSnapshot: CalculationSnapshot['criteria'] = criteria.map(c => {
    const bounds = criteriaBounds[c.id] || { min: 0, max: 100 };
    return {
      id: c.id,
      name: c.name,
      weight: c.weight,
      normalized_weight: weightMap.get(c.id) ?? 0,
      direction: c.direction,
      type: c.criterion_type,
      min: bounds.min,
      max: bounds.max,
    };
  });

  return {
    calculated_at: new Date().toISOString(),
    alternatives: calculatedAlts,
    criteria: criteriaSnapshot,
    is_valid: warnings.length === 0,
    warnings,
  };
}
