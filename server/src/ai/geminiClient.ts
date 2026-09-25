import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { aiExecutiveAnalysisSchema } from '../validation/schemas.js';
import {
  Decision,
  Alternative,
  Criterion,
  Risk,
  Evidence,
  Assumption,
  CalculationSnapshot,
  AIAnalysisResponse,
} from '../types/index.js';
import { identifyTradeOffs } from '../calculations/tradeoffs.js';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini-api-key')) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Builds the structured prompt adhering to Section 15.1
 */
function buildAnalysisPrompt(
  decision: Decision,
  alternatives: Alternative[],
  criteria: Criterion[],
  calculation: CalculationSnapshot,
  risks: Risk[],
  evidence: Evidence[],
  assumptions: Assumption[]
): string {
  const topAlt = calculation.alternatives[0];

  return `Analyze the following decision.

Decision:
- Title: ${decision.title}
- Question: ${decision.decision_question}
- Domain: ${decision.domain}
- Desired Outcome: ${decision.desired_outcome || 'Not explicitly specified'}
- Constraints: ${decision.constraints || 'None specified'}
- Decision Style Preference: ${decision.decision_style}

Alternatives:
${alternatives.map(a => `- [ID: ${a.id}] "${a.name}": Cost: $${a.estimated_cost ?? 'N/A'}, Benefit: $${a.estimated_benefit ?? 'N/A'}, Effort: ${a.implementation_effort ?? 'N/A'}, Notes: ${a.notes || 'None'}`).join('\n')}

Criteria:
${criteria.map(c => `- [ID: ${c.id}] "${c.name}" (Type: ${c.criterion_type}, Weight: ${c.weight}%, Direction: ${c.direction})`).join('\n')}

Calculated Scores (Quantitative Foundation):
${calculation.alternatives.map(a => `- "${a.name}" (ID: ${a.id}): Rank #${a.rank}, Total Weighted Score: ${a.total_score}/100, Risk Score: ${a.risk_score} (${a.risk_level})`).join('\n')}

Risks:
${risks.length ? risks.map(r => `- [Risk ID: ${r.id}] Alt ID: ${r.alternative_id || 'All'}: "${r.name}" (Probability: ${r.probability}/5, Impact: ${r.impact}/5, Mitigation: ${r.mitigation || 'None'})`).join('\n') : '- No specific risks recorded'}

Evidence:
${evidence.length ? evidence.map(e => `- [Evidence ID: ${e.id}] "${e.title}" (Type: ${e.evidence_type}, Reliability: ${e.reliability ?? 'N/A'}%): ${e.description}`).join('\n') : '- No specific evidence recorded'}

Assumptions:
${assumptions.length ? assumptions.map(a => `- "${a.name}": ${a.value} ${a.unit || ''} (Confidence: ${a.confidence ?? 'N/A'}%, Source: ${a.source || 'Unspecified'})`).join('\n') : '- No explicit assumptions recorded'}

Produce an explainable decision analysis in JSON format adhering strictly to this JSON schema:
{
  "executive_summary": "string",
  "recommended_alternative_id": "string",
  "recommendation_confidence": 0,
  "recommendation_rationale": "string",
  "alternative_assessments": [
    {
      "alternative_id": "string",
      "summary": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "key_risks": ["string"],
      "trade_offs": ["string"]
    }
  ],
  "key_decision_factors": [
    {
      "criterion_id": "string",
      "reason": "string",
      "importance": "high"
    }
  ],
  "uncertainties": ["string"],
  "missing_information": ["string"],
  "change_conditions": ["string"],
  "next_actions": ["string"],
  "risk_analysis": {
    "overall_risk_level": "low|moderate|high|critical",
    "critical_risks": [
      {
        "risk_id": "string",
        "reason": "string",
        "mitigation_priority": "high|medium|low"
      }
    ],
    "risk_observations": ["string"],
    "mitigation_actions": ["string"]
  },
  "trade_offs": [
    {
      "dimension_a": "string",
      "dimension_b": "string",
      "explanation": "string",
      "affected_alternatives": ["string"]
    }
  ],
  "information_gaps": [
    {
      "item": "string",
      "reason": "string",
      "impact": "high|medium|low",
      "suggested_method": "string"
    }
  ]
}

Ensure "recommended_alternative_id" strictly matches the top calculated alternative ID "${topAlt?.id || alternatives[0]?.id}".`;
}

/**
 * Deterministic Explainable AI Fallback Engine
 * Generates identical structured JSON when Gemini API key is unset or offline
 */
export function generateDeterministicFallbackAnalysis(
  decision: Decision,
  alternatives: Alternative[],
  criteria: Criterion[],
  calculation: CalculationSnapshot,
  risks: Risk[],
  evidence: Evidence[],
  assumptions: Assumption[]
): AIAnalysisResponse {
  const topAlt = calculation.alternatives[0] || {
    id: alternatives[0]?.id || 'unknown',
    name: alternatives[0]?.name || 'Option 1',
    total_score: 80,
    rank: 1,
    risk_score: 5,
    risk_level: 'low',
    scores: {},
  };

  const calculatedTradeOffs = identifyTradeOffs(calculation);

  // Identify highest weighted criteria
  const sortedCriteria = [...calculation.criteria].sort((a, b) => b.normalized_weight - a.normalized_weight);
  const primaryCriterion = sortedCriteria[0];
  const secondaryCriterion = sortedCriteria[1];

  // Base confidence on evidence reliability and assumption confidence
  const avgEvidenceReliability = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + (e.reliability ?? 60), 0) / evidence.length
    : 55;
  const avgAssumptionConfidence = assumptions.length > 0
    ? assumptions.reduce((sum, a) => sum + (a.confidence ?? 60), 0) / assumptions.length
    : 60;
  const riskPenalty = topAlt.risk_level === 'critical' ? 30 : topAlt.risk_level === 'high' ? 15 : 0;
  const confidenceScore = Math.max(25, Math.min(95, Math.round((avgEvidenceReliability * 0.4 + avgAssumptionConfidence * 0.4 + (100 - topAlt.risk_score * 3) * 0.2) - riskPenalty)));

  const assessments = alternatives.map(alt => {
    const calc = calculation.alternatives.find(a => a.id === alt.id) || topAlt;
    const altRisks = risks.filter(r => r.alternative_id === alt.id);

    // Find strengths: criteria where normalized score >= 0.7
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    criteria.forEach(crit => {
      const score = calc.scores[crit.id];
      if (score && score.normalized_score >= 0.7) {
        strengths.push(`High performance in "${crit.name}" (${Math.round(score.normalized_score * 100)}% satisfaction)`);
      } else if (score && score.normalized_score <= 0.4) {
        weaknesses.push(`Underperforming in "${crit.name}" (${Math.round(score.normalized_score * 100)}% satisfaction)`);
      }
    });

    if (strengths.length === 0) strengths.push(`Consistent baseline performance across evaluated criteria`);
    if (weaknesses.length === 0) weaknesses.push(`Potential unobserved constraints or hidden operational overheads`);

    const keyRisks = altRisks.map(r => `${r.name} (Risk score: ${r.probability * r.impact}/25)`);
    if (keyRisks.length === 0) keyRisks.push(`No critical risks formally registered for this alternative`);

    return {
      alternative_id: alt.id,
      summary: `Ranked #${calc.rank} with a total multi-criteria score of ${calc.total_score} points and a ${calc.risk_level} risk profile.`,
      strengths,
      weaknesses,
      key_risks: keyRisks,
      trade_offs: [
        `Trades off relative performance across ${criteria.slice(0, 2).map(c => c.name).join(' vs ')}.`
      ],
    };
  });

  const keyFactors = sortedCriteria.slice(0, 3).map((crit, idx) => ({
    criterion_id: crit.id,
    reason: `Represents ${crit.normalized_weight.toFixed(1)}% of total priority weight; significantly drives overall scoring dispersion.`,
    importance: idx === 0 ? 'high' : ('medium' as 'high' | 'medium'),
  }));

  const uncertainties: string[] = [];
  if (assumptions.length === 0) {
    uncertainties.push('No formal assumptions were tracked; analysis assumes current baseline operational conditions remain stable.');
  } else {
    assumptions.forEach(a => {
      if ((a.confidence ?? 100) < 70) {
        uncertainties.push(`Assumption "${a.name}" has moderate-to-low confidence (${a.confidence}%); changes could shift scoring.`);
      }
    });
  }
  if (uncertainties.length === 0) {
    uncertainties.push('External market dynamics, execution latency, and regulatory shifts introduce inherent systemic uncertainty.');
  }

  const missingInfo: string[] = [];
  if (evidence.length < 2) {
    missingInfo.push('Empirical benchmarking and internal operational telemetry are limited.');
  }
  if (!decision.constraints) {
    missingInfo.push('Explicit resource or budgetary ceiling constraints were not formally stated.');
  }
  if (missingInfo.length === 0) {
    missingInfo.push('Third-party validation or longitudinal post-implementation cost data.');
  }

  const changeConditions = [
    `If the relative importance of "${primaryCriterion?.name || 'primary objective'}" shifts by more than 20%, the ranking order may invert.`,
    `A significant variance in estimated implementation costs or delivery schedules.`,
    `Unanticipated escalation of registered critical risk factors.`,
  ];

  const nextActions = [
    `Conduct detailed team review of the trade-offs between "${topAlt.name}" and the runner-up.`,
    `Validate core assumptions regarding costs and resource availability with stakeholders.`,
    `Formulate active mitigation plans for identified risks before proceeding to final commitment.`,
    `Record the final human decision and strategic rationale in the platform.`,
  ];

  return {
    executive_summary: `The structured multi-criteria decision analysis indicates that "${topAlt.name}" is the preferred strategic alternative with a composite score of ${topAlt.total_score}/100 and a ${topAlt.risk_level} risk classification. The outcome is primarily anchored by decisive advantages in ${primaryCriterion?.name || 'key criteria'}, balanced against identified operational trade-offs.`,
    recommended_alternative_id: topAlt.id,
    recommendation_confidence: confidenceScore,
    recommendation_rationale: `Based on the supplied weights and quantitative evaluations, "${topAlt.name}" maximizes overall utility across the prioritized criteria (${sortedCriteria.map(c => c.name).slice(0, 3).join(', ')}). While it carries identifiable trade-offs, its risk-adjusted score offers the most robust path toward the desired outcome.`,
    alternative_assessments: assessments,
    key_decision_factors: keyFactors,
    uncertainties,
    missing_information: missingInfo,
    change_conditions: changeConditions,
    next_actions: nextActions,
    risk_analysis: {
      overall_risk_level: topAlt.risk_level,
      critical_risks: risks
        .filter(r => r.probability * r.impact >= 10)
        .map(r => ({
          risk_id: r.id,
          reason: `High risk severity (${r.probability * r.impact}/25) requires immediate mitigation controls.`,
          mitigation_priority: (r.probability * r.impact >= 16 ? 'high' : 'medium') as 'high' | 'medium',
        })),
      risk_observations: [
        `Risk exposure is concentrated in ${risks.filter(r => r.alternative_id === topAlt.id).length} recorded items for the top alternative.`,
        `Formal mitigation plans should be verified prior to capital or contractual commitment.`,
      ],
      mitigation_actions: risks.map(r => r.mitigation).filter(Boolean) as string[],
    },
    trade_offs: calculatedTradeOffs.map(t => ({
      dimension_a: t.dimension_a,
      dimension_b: t.dimension_b,
      explanation: t.explanation,
      affected_alternatives: t.affected_alternatives,
    })),
    information_gaps: missingInfo.map(item => ({
      item,
      reason: 'Reduces decision volatility and increases recommendation confidence.',
      impact: 'medium' as const,
      suggested_method: 'Internal data auditing or vendor proof-of-concept verification.',
    })),
  };
}

/**
 * Runs the AI decision analysis
 * 1. Checks if Gemini client is available
 * 2. If available, prompts Gemini with structured schema
 * 3. Validates output with Zod
 * 4. Falls back gracefully to deterministic explainable engine if API key is not provided or API fails
 */
export async function runAIDecisionAnalysis(
  decision: Decision,
  alternatives: Alternative[],
  criteria: Criterion[],
  calculation: CalculationSnapshot,
  risks: Risk[],
  evidence: Evidence[],
  assumptions: Assumption[]
): Promise<{ analysis: AIAnalysisResponse; modelUsed: string }> {
  const client = getGeminiClient();

  if (!client) {
    console.log('[AI Service] GEMINI_API_KEY not configured. Utilizing deterministic explainability engine.');
    return {
      analysis: generateDeterministicFallbackAnalysis(
        decision,
        alternatives,
        criteria,
        calculation,
        risks,
        evidence,
        assumptions
      ),
      modelUsed: 'deterministic-mcda-engine',
    };
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const promptText = buildAnalysisPrompt(
    decision,
    alternatives,
    criteria,
    calculation,
    risks,
    evidence,
    assumptions
  );

  try {
    console.log(`[AI Service] Invoking Gemini model: ${modelName}`);
    const response = await client.models.generateContent({
      model: modelName,
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    // Clean JSON (in case markdown fences are present)
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);
    const validated = aiExecutiveAnalysisSchema.parse(parsed);

    return {
      analysis: validated as unknown as AIAnalysisResponse,
      modelUsed: modelName,
    };
  } catch (err: any) {
    console.error('[AI Service] Gemini invocation failed or returned invalid schema:', err.message);
    console.log('[AI Service] Falling back to deterministic explainability engine.');
    return {
      analysis: generateDeterministicFallbackAnalysis(
        decision,
        alternatives,
        criteria,
        calculation,
        risks,
        evidence,
        assumptions
      ),
      modelUsed: 'deterministic-mcda-engine (fallback)',
    };
  }
}
