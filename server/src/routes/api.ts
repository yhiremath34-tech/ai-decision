import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as dc from '../controllers/decisionController.js';
import { store } from '../services/store.js';

export const apiRouter = Router();

// Public health check and environment status
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DecisionFlow Decision Intelligence Engine',
    database_mode: store.isSupabaseActive ? 'Supabase PostgreSQL' : 'Local Storage Mode',
    gemini_active: !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your-gemini-api-key'),
  });
});

// All subsequent routes require authentication & ownership verification
apiRouter.use(authMiddleware as any);

// Dashboard
apiRouter.get('/dashboard', dc.getDashboardStats as any);

// Decisions CRUD
apiRouter.get('/decisions', dc.listDecisions as any);
apiRouter.get('/decisions/:id', dc.getDecision as any);
apiRouter.post('/decisions', dc.createDecision as any);
apiRouter.patch('/decisions/:id', dc.updateDecision as any);
apiRouter.delete('/decisions/:id', dc.deleteDecision as any);

// Alternatives
apiRouter.get('/decisions/:id/alternatives', dc.getAlternatives as any);
apiRouter.post('/decisions/:id/alternatives', dc.createAlternative as any);
apiRouter.patch('/alternatives/:id', dc.updateAlternative as any);
apiRouter.delete('/alternatives/:id', dc.deleteAlternative as any);

// Criteria
apiRouter.get('/decisions/:id/criteria', dc.getCriteria as any);
apiRouter.post('/decisions/:id/criteria', dc.createCriterion as any);
apiRouter.post('/decisions/:id/criteria/normalize-weights', dc.normalizeWeightsEndpoint as any);
apiRouter.patch('/criteria/:id', dc.updateCriterion as any);
apiRouter.delete('/criteria/:id', dc.deleteCriterion as any);

// Scores
apiRouter.post('/decisions/:id/scores', dc.saveScores as any);

// Evidence
apiRouter.get('/decisions/:id/evidence', dc.getEvidence as any);
apiRouter.post('/decisions/:id/evidence', dc.createEvidence as any);
apiRouter.patch('/evidence/:id', dc.updateEvidence as any);
apiRouter.delete('/evidence/:id', dc.deleteEvidence as any);

// Assumptions
apiRouter.get('/decisions/:id/assumptions', dc.getAssumptions as any);
apiRouter.post('/decisions/:id/assumptions', dc.createAssumption as any);
apiRouter.patch('/assumptions/:id', dc.updateAssumption as any);
apiRouter.delete('/assumptions/:id', dc.deleteAssumption as any);

// Risks
apiRouter.get('/decisions/:id/risks', dc.getRisks as any);
apiRouter.post('/decisions/:id/risks', dc.createRisk as any);
apiRouter.patch('/risks/:id', dc.updateRisk as any);
apiRouter.delete('/risks/:id', dc.deleteRisk as any);

// Analysis
apiRouter.post('/decisions/:id/analyze', dc.analyzeDecision as any);

// Results
apiRouter.get('/decisions/:id/results', dc.getDecisionResults as any);

// Sensitivity
apiRouter.post('/decisions/:id/sensitivity', dc.runSensitivity as any);

// Final Decision
apiRouter.post('/decisions/:id/finalize', dc.finalizeDecision as any);

// Report
apiRouter.get('/decisions/:id/report', dc.getDecisionReport as any);
