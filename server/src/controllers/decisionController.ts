import { Response } from 'express';
import { AuthenticatedRequest, verifyDecisionOwnership } from '../middleware/auth.js';
import { store } from '../services/store.js';
import {
  decisionSchema,
  updateDecisionSchema,
  alternativeSchema,
  updateAlternativeSchema,
  criterionSchema,
  updateCriterionSchema,
  scoreBatchSchema,
  evidenceSchema,
  updateEvidenceSchema,
  assumptionSchema,
  updateAssumptionSchema,
  riskSchema,
  updateRiskSchema,
  finalDecisionSchema,
  sensitivitySchema,
} from '../validation/schemas.js';
import { calculateDecisionMatrix, normalizeWeights } from '../calculations/mcda.js';
import { summarizeAlternativeRisks } from '../calculations/risk.js';
import { runSensitivityAnalysis } from '../calculations/sensitivity.js';
import { runAIDecisionAnalysis } from '../ai/geminiClient.js';

// --- Dashboard & Metrics ---
export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await store.seedSampleDecisionIfEmpty(userId);

    const decisions = await store.listDecisions(userId);
    const total = decisions.length;
    const active = decisions.filter(d => ['draft', 'analysis_ready', 'analyzing'].includes(d.status)).length;
    const completed = decisions.filter(d => ['analyzed', 'reviewed', 'decided'].includes(d.status)).length;
    const decided = decisions.filter(d => d.status === 'decided').length;

    // Gather analyses to compute average confidence & high-risk count
    let confidenceSum = 0;
    let confidenceCount = 0;
    let highRiskCount = 0;

    for (const d of decisions) {
      const analysis = await store.getLatestAnalysis(d.id);
      if (analysis?.recommendation_confidence) {
        confidenceSum += Number(analysis.recommendation_confidence);
        confidenceCount++;
      }
      const risks = await store.getRisks(d.id);
      if (risks.some(r => r.risk_score >= 12)) {
        highRiskCount++;
      }
    }

    const avgConfidence = confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 85;

    res.json({
      metrics: {
        total_decisions: total,
        active_decisions: active,
        completed_analyses: completed,
        decided_count: decided,
        average_confidence: avgConfidence,
        high_risk_decisions: highRiskCount,
      },
      recent_decisions: decisions.slice(0, 6),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Decisions CRUD ---
export async function listDecisions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await store.seedSampleDecisionIfEmpty(userId);

    const { search, domain, status } = req.query as { search?: string; domain?: string; status?: string };
    const decisions = await store.listDecisions(userId, { search, domain, status });
    res.json({ decisions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const decision = await store.getDecision(id, userId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    const [alternatives, criteria, scores, evidence, assumptions, risks, latestAnalysis, finalDecision] = await Promise.all([
      store.getAlternatives(id),
      store.getCriteria(id),
      store.getScoresForDecision(id),
      store.getEvidence(id),
      store.getAssumptions(id),
      store.getRisks(id),
      store.getLatestAnalysis(id),
      store.getFinalDecision(id),
    ]);

    // Compute live matrix if >= 2 alts and criteria exist
    const riskSummary = summarizeAlternativeRisks(alternatives.map(a => a.id), risks);
    const liveMatrix = (alternatives.length >= 2 && criteria.length >= 2)
      ? calculateDecisionMatrix(alternatives, criteria, scores, riskSummary)
      : null;

    res.json({
      decision,
      alternatives,
      criteria,
      scores,
      evidence,
      assumptions,
      risks,
      latest_analysis: latestAnalysis,
      final_decision: finalDecision,
      live_matrix: liveMatrix,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const validated = decisionSchema.parse(req.body);

    const created = await store.createDecision({
      user_id: userId,
      ...validated,
      status: 'draft',
    } as any);

    res.status(201).json({ decision: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const validated = updateDecisionSchema.parse(req.body);

    const updated = await store.updateDecision(id, userId, validated);
    if (!updated) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    res.json({ decision: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const ok = await store.deleteDecision(id, userId);
    if (!ok) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    res.json({ success: true, message: 'Decision deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Alternatives CRUD ---
export async function getAlternatives(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const alternatives = await store.getAlternatives(id);
    res.json({ alternatives });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAlternative(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const validated = alternativeSchema.parse(req.body);
    const created = await store.createAlternative(id, validated as any);
    res.status(201).json({ alternative: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateAlternative(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateAlternativeSchema.parse(req.body);
    const updated = await store.updateAlternative(id, validated);
    if (!updated) {
      res.status(404).json({ error: 'Alternative not found' });
      return;
    }
    res.json({ alternative: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteAlternative(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = await store.deleteAlternative(id);
    if (!ok) {
      res.status(404).json({ error: 'Alternative not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Criteria CRUD ---
export async function getCriteria(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const criteria = await store.getCriteria(id);
    res.json({ criteria });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createCriterion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const validated = criterionSchema.parse(req.body);
    const created = await store.createCriterion(id, validated as any);
    res.status(201).json({ criterion: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateCriterion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateCriterionSchema.parse(req.body);
    const updated = await store.updateCriterion(id, validated);
    if (!updated) {
      res.status(404).json({ error: 'Criterion not found' });
      return;
    }
    res.json({ criterion: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteCriterion(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = await store.deleteCriterion(id);
    if (!ok) {
      res.status(404).json({ error: 'Criterion not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function normalizeWeightsEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const criteria = await store.getCriteria(id);
    const normalized = normalizeWeights(criteria);

    for (const item of normalized) {
      await store.updateCriterion(item.id, { weight: item.normalizedWeight });
    }

    const updated = await store.getCriteria(id);
    res.json({ criteria: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Scores CRUD ---
export async function saveScores(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const validated = scoreBatchSchema.parse(req.body);
    const saved = await store.saveScores(validated.scores as any);
    res.json({ scores: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

// --- Evidence CRUD ---
export async function getEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const evidence = await store.getEvidence(id);
    res.json({ evidence });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const validated = evidenceSchema.parse(req.body);
    const created = await store.createEvidence(id, validated as any);
    res.status(201).json({ evidence: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateEvidenceSchema.parse(req.body);
    const updated = await store.updateEvidence(id, validated);
    if (!updated) {
      res.status(404).json({ error: 'Evidence record not found' });
      return;
    }
    res.json({ evidence: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = await store.deleteEvidence(id);
    if (!ok) {
      res.status(404).json({ error: 'Evidence not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Assumptions CRUD ---
export async function getAssumptions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const assumptions = await store.getAssumptions(id);
    res.json({ assumptions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAssumption(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const validated = assumptionSchema.parse(req.body);
    const created = await store.createAssumption(id, validated as any);
    res.status(201).json({ assumption: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateAssumption(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateAssumptionSchema.parse(req.body);
    const updated = await store.updateAssumption(id, validated);
    if (!updated) {
      res.status(404).json({ error: 'Assumption record not found' });
      return;
    }
    res.json({ assumption: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteAssumption(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = await store.deleteAssumption(id);
    if (!ok) {
      res.status(404).json({ error: 'Assumption not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Risks CRUD ---
export async function getRisks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const risks = await store.getRisks(id);
    res.json({ risks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;
    const validated = riskSchema.parse(req.body);
    const created = await store.createRisk(id, validated as any);
    res.status(201).json({ risk: created });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function updateRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateRiskSchema.parse(req.body);
    const updated = await store.updateRisk(id, validated);
    if (!updated) {
      res.status(404).json({ error: 'Risk record not found' });
      return;
    }
    res.json({ risk: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

export async function deleteRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const ok = await store.deleteRisk(id);
    if (!ok) {
      res.status(404).json({ error: 'Risk not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Run AI & Quantitative Analysis ---
export async function analyzeDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const decision = await store.getDecision(id, userId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    const [alternatives, criteria, scores, evidence, assumptions, risks] = await Promise.all([
      store.getAlternatives(id),
      store.getCriteria(id),
      store.getScoresForDecision(id),
      store.getEvidence(id),
      store.getAssumptions(id),
      store.getRisks(id),
    ]);

    // Validation according to Section 7 & 12
    if (alternatives.length < 2) {
      res.status(400).json({ error: 'A minimum of 2 alternatives is required for multi-criteria analysis.' });
      return;
    }
    if (criteria.length < 2) {
      res.status(400).json({ error: 'A minimum of 2 criteria is required for evaluation.' });
      return;
    }

    // Calculate quantitative decision matrix
    const riskSummary = summarizeAlternativeRisks(alternatives.map(a => a.id), risks);
    const calculation = calculateDecisionMatrix(alternatives, criteria, scores, riskSummary);

    // Run AI analysis (Gemini with strict JSON & deterministic explainable fallback)
    const { analysis: aiResult, modelUsed } = await runAIDecisionAnalysis(
      decision,
      alternatives,
      criteria,
      calculation,
      risks,
      evidence,
      assumptions
    );

    const nextVersion = (decision.analysis_version || 0) + 1;
    const topAlt = calculation.alternatives[0];

    const savedAnalysis = await store.saveAnalysis({
      decision_id: id,
      version: nextVersion,
      overall_score: topAlt ? topAlt.total_score : 0,
      recommendation: aiResult.recommended_alternative_id,
      recommendation_confidence: aiResult.recommendation_confidence,
      executive_summary: aiResult.executive_summary,
      ai_response: aiResult,
      calculation_snapshot: calculation,
      model_name: modelUsed,
    });

    // Update decision status and version
    await store.updateDecision(id, userId, {
      status: 'analyzed',
      analysis_version: nextVersion,
    });

    res.json({
      analysis: savedAnalysis,
      calculation,
    });
  } catch (err: any) {
    console.error('[Analyze Endpoint Error]:', err);
    res.status(500).json({ error: err.message || 'Analysis processing failed' });
  }
}

// --- Results ---
export async function getDecisionResults(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const analysis = await store.getLatestAnalysis(id);
    if (!analysis) {
      res.status(404).json({ error: 'No analysis has been run for this decision yet.' });
      return;
    }

    const [decision, alternatives, criteria, risks] = await Promise.all([
      store.getDecision(id, req.user!.id),
      store.getAlternatives(id),
      store.getCriteria(id),
      store.getRisks(id),
    ]);

    res.json({
      decision,
      analysis,
      alternatives,
      criteria,
      risks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// --- Sensitivity ---
export async function runSensitivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!(await verifyDecisionOwnership(id, req.user!.id, res))) return;

    const validated = sensitivitySchema.parse(req.body);
    const [alternatives, criteria, scores] = await Promise.all([
      store.getAlternatives(id),
      store.getCriteria(id),
      store.getScoresForDecision(id),
    ]);

    let criteriaToUse = criteria;
    if (validated.custom_weights) {
      criteriaToUse = criteria.map(c => ({
        ...c,
        weight: validated.custom_weights![c.id] !== undefined ? validated.custom_weights![c.id] : c.weight,
      }));
    }

    const sensitivityResult = runSensitivityAnalysis(id, alternatives, criteriaToUse, scores);

    const saved = await store.saveSensitivityRun({
      decision_id: id,
      base_analysis_id: validated.base_analysis_id || null,
      weight_changes: validated.custom_weights || {},
      result: sensitivityResult,
      stability: sensitivityResult.stability,
    });

    res.json({ sensitivity: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// --- Final Decision ---
export async function finalizeDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    if (!(await verifyDecisionOwnership(id, userId, res))) return;

    const validated = finalDecisionSchema.parse(req.body);
    const saved = await store.saveFinalDecision({
      decision_id: id,
      selected_alternative_id: validated.selected_alternative_id,
      rationale: validated.rationale,
    });

    await store.updateDecision(id, userId, { status: 'decided' });

    res.json({ final_decision: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message });
  }
}

// --- Comprehensive Report ---
export async function getDecisionReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const decision = await store.getDecision(id, userId);
    if (!decision) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    const [alternatives, criteria, scores, evidence, assumptions, risks, latestAnalysis, finalDecision] = await Promise.all([
      store.getAlternatives(id),
      store.getCriteria(id),
      store.getScoresForDecision(id),
      store.getEvidence(id),
      store.getAssumptions(id),
      store.getRisks(id),
      store.getLatestAnalysis(id),
      store.getFinalDecision(id),
    ]);

    const riskSummary = summarizeAlternativeRisks(alternatives.map(a => a.id), risks);
    const matrix = calculateDecisionMatrix(alternatives, criteria, scores, riskSummary);
    const sensitivity = runSensitivityAnalysis(id, alternatives, criteria, scores, matrix);

    res.json({
      report: {
        generated_at: new Date().toISOString(),
        decision,
        alternatives,
        criteria,
        scores,
        evidence,
        assumptions,
        risks,
        decision_matrix: matrix,
        latest_analysis: latestAnalysis,
        sensitivity_summary: sensitivity,
        final_decision: finalDecision,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
