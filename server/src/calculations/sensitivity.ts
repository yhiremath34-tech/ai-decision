import { Alternative, Criterion, AlternativeScore, SensitivityRun, CalculationSnapshot } from '../types/index.js';
import { calculateDecisionMatrix } from './mcda.js';

export interface SensitivityScenario {
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
}

export function runSensitivityAnalysis(
  decisionId: string,
  alternatives: Alternative[],
  criteria: Criterion[],
  rawScores: AlternativeScore[],
  baseAnalysisSnapshot?: CalculationSnapshot
): SensitivityRun['result'] {
  if (alternatives.length < 2 || criteria.length < 2) {
    return {
      scenarios: [],
      stability: 'stable',
      sensitive_criteria: [],
    };
  }

  // Base matrix
  const baseMatrix = baseAnalysisSnapshot || calculateDecisionMatrix(alternatives, criteria, rawScores);
  const baseWinnerId = baseMatrix.alternatives[0]?.id;

  const scenarios: SensitivityScenario[] = [];
  const sensitiveCriteriaMap = new Map<string, { threshold_percent?: number; impact_summary: string }>();

  // Tested variations in weight: -30%, -20%, -10%, +10%, +20%, +30%
  const variations = [-30, -20, -10, 10, 20, 30];

  const totalBaseWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0) || 100;

  for (const criterion of criteria) {
    const baseWeight = (criterion.weight / totalBaseWeight) * 100;

    for (const deltaPercent of variations) {
      // Adjusted weight
      const multiplier = 1 + deltaPercent / 100;
      const targetWeight = Math.max(0, Math.min(100, baseWeight * multiplier));
      const remainingWeightNeeded = 100 - targetWeight;
      const otherCriteriaBaseSum = criteria
        .filter(c => c.id !== criterion.id)
        .reduce((sum, c) => sum + ((c.weight / totalBaseWeight) * 100), 0);

      const modifiedCriteria = criteria.map(c => {
        if (c.id === criterion.id) {
          return { ...c, weight: targetWeight };
        }
        const proportionalShare = otherCriteriaBaseSum > 0
          ? (((c.weight / totalBaseWeight) * 100) / otherCriteriaBaseSum) * remainingWeightNeeded
          : remainingWeightNeeded / (criteria.length - 1);
        return { ...c, weight: Math.max(0, proportionalShare) };
      });

      const scenarioMatrix = calculateDecisionMatrix(alternatives, modifiedCriteria, rawScores);
      const scenarioWinner = scenarioMatrix.alternatives[0];
      const winnerChanged = scenarioWinner && scenarioWinner.id !== baseWinnerId;

      scenarios.push({
        variation_percent: deltaPercent,
        criterion_id: criterion.id,
        criterion_name: criterion.name,
        adjusted_weight: Number(targetWeight.toFixed(1)),
        rankings: scenarioMatrix.alternatives.map(a => ({
          alternative_id: a.id,
          alternative_name: a.name,
          score: a.total_score,
          rank: a.rank,
        })),
        winner_changed: !!winnerChanged,
        new_winner_id: scenarioWinner ? scenarioWinner.id : '',
      });

      if (winnerChanged && !sensitiveCriteriaMap.has(criterion.id)) {
        sensitiveCriteriaMap.set(criterion.id, {
          threshold_percent: Math.abs(deltaPercent),
          impact_summary: `Modifying "${criterion.name}" by ${deltaPercent > 0 ? '+' : ''}${deltaPercent}% alters the preferred alternative to "${scenarioWinner.name}".`,
        });
      }
    }
  }

  // Determine stability:
  // - highly_sensitive: winner flips at +/-10%
  // - moderately_sensitive: winner flips at +/-20% or +/-30%
  // - stable: winner never flips across tested variations
  const flippedAtTenPercent = scenarios.some(s => s.winner_changed && Math.abs(s.variation_percent) <= 10);
  const flippedAtAny = scenarios.some(s => s.winner_changed);

  let stability: SensitivityRun['result']['stability'] = 'stable';
  if (flippedAtTenPercent) {
    stability = 'highly_sensitive';
  } else if (flippedAtAny) {
    stability = 'moderately_sensitive';
  }

  const sensitiveCriteria = Array.from(sensitiveCriteriaMap.entries()).map(([cid, data]) => {
    const crit = criteria.find(c => c.id === cid);
    return {
      criterion_id: cid,
      criterion_name: crit ? crit.name : 'Unknown Criterion',
      threshold_percent: data.threshold_percent,
      impact_summary: data.impact_summary,
    };
  });

  return {
    scenarios,
    stability,
    sensitive_criteria: sensitiveCriteria,
  };
}
