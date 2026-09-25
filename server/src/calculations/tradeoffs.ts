import { CalculationSnapshot } from '../types/index.js';

export interface IdentifiedTradeOff {
  dimension_a: string;
  dimension_b: string;
  explanation: string;
  affected_alternatives: string[];
}

/**
 * Analyzes alternative scores to identify classic trade-off pairings
 * (e.g. Higher cost yields higher performance; lower risk implies longer implementation)
 */
export function identifyTradeOffs(matrix: CalculationSnapshot): IdentifiedTradeOff[] {
  const tradeOffs: IdentifiedTradeOff[] = [];
  const alts = matrix.alternatives;
  const crits = matrix.criteria;

  if (alts.length < 2 || crits.length < 2) {
    return tradeOffs;
  }

  // Look for pairs of criteria where one alternative wins on A but loses on B
  for (let i = 0; i < crits.length; i++) {
    for (let j = i + 1; j < crits.length; j++) {
      const c1 = crits[i];
      const c2 = crits[j];

      // Check opposing alternatives
      for (let a = 0; a < alts.length; a++) {
        for (let b = a + 1; b < alts.length; b++) {
          const altA = alts[a];
          const altB = alts[b];

          const a_c1 = altA.scores[c1.id]?.normalized_score ?? 0;
          const b_c1 = altB.scores[c1.id]?.normalized_score ?? 0;
          const a_c2 = altA.scores[c2.id]?.normalized_score ?? 0;
          const b_c2 = altB.scores[c2.id]?.normalized_score ?? 0;

          // Clear inverse relationship: A beats B on c1 by > 0.2, but B beats A on c2 by > 0.2
          if ((a_c1 - b_c1 > 0.2 && b_c2 - a_c2 > 0.2) || (b_c1 - a_c1 > 0.2 && a_c2 - b_c2 > 0.2)) {
            const explanation = `There is an inverse relationship between "${c1.name}" and "${c2.name}": "${altA.name}" excels at ${a_c1 > b_c1 ? c1.name : c2.name} (${Math.round((a_c1 > b_c1 ? a_c1 : a_c2) * 100)}%), while "${altB.name}" provides superior ${b_c1 > a_c1 ? c1.name : c2.name} (${Math.round((b_c1 > a_c1 ? b_c1 : b_c2) * 100)}%).`;

            const exists = tradeOffs.some(
              t => (t.dimension_a === c1.name && t.dimension_b === c2.name) ||
                   (t.dimension_a === c2.name && t.dimension_b === c1.name)
            );

            if (!exists) {
              tradeOffs.push({
                dimension_a: c1.name,
                dimension_b: c2.name,
                explanation,
                affected_alternatives: [altA.name, altB.name],
              });
            }
          }
        }
      }
    }
  }

  // Cost vs Benefit check if criteria match keywords
  const costCrit = crits.find(c => /cost|price|budget|expense/i.test(c.name));
  const benefitCrit = crits.find(c => /benefit|quality|performance|value|reliability/i.test(c.name));

  if (costCrit && benefitCrit) {
    const exists = tradeOffs.some(
      t => (t.dimension_a === costCrit.name && t.dimension_b === benefitCrit.name) ||
           (t.dimension_a === benefitCrit.name && t.dimension_b === costCrit.name)
    );
    if (!exists && alts.length >= 2) {
      tradeOffs.unshift({
        dimension_a: costCrit.name,
        dimension_b: benefitCrit.name,
        explanation: `Balancing expenditure (${costCrit.name}) against deliverable return (${benefitCrit.name}) is a primary strategic pivot for this decision.`,
        affected_alternatives: alts.map(a => a.name),
      });
    }
  }

  return tradeOffs.slice(0, 5); // top 5 most salient
}
