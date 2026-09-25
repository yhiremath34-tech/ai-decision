import { normalizeValue, normalizeWeights, calculateDecisionMatrix } from './mcda.js';
import { calculateRiskScore, categorizeRisk, summarizeAlternativeRisks } from './risk.js';
import { runSensitivityAnalysis } from './sensitivity.js';
import { identifyTradeOffs } from './tradeoffs.js';
import { Alternative, Criterion, Risk } from '../types/index.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log('--- Running DecisionFlow Calculation Engine Verification ---');

// 1. Normalization tests
const testCriterionHigher: Criterion = {
  id: 'c1',
  decision_id: 'd1',
  name: 'Performance',
  criterion_type: 'quantitative',
  weight: 40,
  direction: 'higher_better',
  created_at: '',
  updated_at: '',
};

assert(normalizeValue(100, testCriterionHigher, 0, 100) === 1.0, 'Higher better: max value normalizes to 1.0');
assert(normalizeValue(0, testCriterionHigher, 0, 100) === 0.0, 'Higher better: min value normalizes to 0.0');
assert(normalizeValue(50, testCriterionHigher, 0, 100) === 0.5, 'Higher better: midpoint value normalizes to 0.5');

const testCriterionLower: Criterion = {
  id: 'c2',
  decision_id: 'd1',
  name: 'Cost',
  criterion_type: 'quantitative',
  weight: 60,
  direction: 'lower_better',
  created_at: '',
  updated_at: '',
};

assert(normalizeValue(100, testCriterionLower, 0, 100) === 0.0, 'Lower better: highest cost normalizes to 0.0');
assert(normalizeValue(0, testCriterionLower, 0, 100) === 1.0, 'Lower better: lowest cost normalizes to 1.0');
assert(normalizeValue(25, testCriterionLower, 0, 100) === 0.75, 'Lower better: 25 on 0..100 normalizes to 0.75');

// 2. Weight normalization test
const weights = normalizeWeights([testCriterionHigher, testCriterionLower]);
const sumWeight = weights.reduce((s, w) => s + w.normalizedWeight, 0);
assert(Math.abs(sumWeight - 100) < 0.01, `Normalized weights sum to 100% (got ${sumWeight})`);

// 3. Risk tests
assert(calculateRiskScore(3, 4) === 12, 'Risk score 3x4 = 12');
assert(categorizeRisk(4) === 'low', 'Risk 4 is low');
assert(categorizeRisk(8) === 'moderate', 'Risk 8 is moderate');
assert(calculateRiskScore(4, 4) === 16 && categorizeRisk(16) === 'high', 'Risk 16 is high');
assert(calculateRiskScore(5, 5) === 25 && categorizeRisk(25) === 'critical', 'Risk 25 is critical');

// 4. Decision Matrix test with 2 alternatives
const mockAlts: Alternative[] = [
  { id: 'a1', decision_id: 'd1', name: 'Option Alpha', created_at: '', updated_at: '' },
  { id: 'a2', decision_id: 'd1', name: 'Option Beta', created_at: '', updated_at: '' },
];
const mockCriteria: Criterion[] = [testCriterionHigher, testCriterionLower];
const mockScores = [
  { alternative_id: 'a1', criterion_id: 'c1', raw_value: 90 }, // Alpha high perf
  { alternative_id: 'a1', criterion_id: 'c2', raw_value: 80 }, // Alpha high cost (bad for lower_better)
  { alternative_id: 'a2', criterion_id: 'c1', raw_value: 40 }, // Beta lower perf
  { alternative_id: 'a2', criterion_id: 'c2', raw_value: 20 }, // Beta low cost (good for lower_better)
];

const mockRisks: Risk[] = [
  { id: 'r1', decision_id: 'd1', alternative_id: 'a1', name: 'Vendor lock-in', probability: 2, impact: 2, risk_score: 4, created_at: '', updated_at: '' },
  { id: 'r2', decision_id: 'd1', alternative_id: 'a2', name: 'Scale limit', probability: 4, impact: 4, risk_score: 16, created_at: '', updated_at: '' },
];
const riskSummaries = summarizeAlternativeRisks(['a1', 'a2'], mockRisks);
assert(riskSummaries['a1'].risk_level === 'low', 'Option Alpha has low risk');
assert(riskSummaries['a2'].risk_level === 'high', 'Option Beta has high risk');

const matrix = calculateDecisionMatrix(mockAlts, mockCriteria, mockScores, riskSummaries);
assert(matrix.alternatives.length === 2, 'Matrix contains 2 alternatives');
assert(matrix.alternatives[0].rank === 1, 'Top alternative assigned rank 1');
assert(matrix.alternatives[1].rank === 2, 'Second alternative assigned rank 2');
console.log(`Rank 1: ${matrix.alternatives[0].name} (Score: ${matrix.alternatives[0].total_score})`);
console.log(`Rank 2: ${matrix.alternatives[1].name} (Score: ${matrix.alternatives[1].total_score})`);

// 5. Sensitivity Analysis test
const sensitivity = runSensitivityAnalysis('d1', mockAlts, mockCriteria, mockScores as any, matrix);
assert(sensitivity.scenarios.length > 0, `Sensitivity produced ${sensitivity.scenarios.length} scenarios`);
assert(['stable', 'moderately_sensitive', 'highly_sensitive'].includes(sensitivity.stability), `Stability classified: ${sensitivity.stability}`);

// 6. Trade-off test
const tradeoffs = identifyTradeOffs(matrix);
assert(Array.isArray(tradeoffs), 'Trade-offs identified successfully');

console.log('\n All Calculation Engine Unit Tests Passed Successfully!\n');
