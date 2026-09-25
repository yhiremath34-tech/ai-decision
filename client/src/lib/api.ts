import {
  Decision,
  Alternative,
  Criterion,
  AlternativeScore,
  Evidence,
  Assumption,
  Risk,
  Analysis,
  SensitivityRun,
  FinalDecision,
  DecisionWorkspaceData,
} from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentAuthToken: string | null = localStorage.getItem('decisionflow_token') || 'demo-token';

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('decisionflow_token', token);
  } else {
    localStorage.removeItem('decisionflow_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentAuthToken) {
    headers.set('Authorization', `Bearer ${currentAuthToken}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, errorMsg);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; service: string; database_mode: string; gemini_active: boolean }>('/health'),

  // Dashboard
  getDashboard: () => request<{
    metrics: {
      total_decisions: number;
      active_decisions: number;
      completed_analyses: number;
      decided_count: number;
      average_confidence: number;
      high_risk_decisions: number;
    };
    recent_decisions: Decision[];
  }>('/dashboard'),

  // Decisions
  listDecisions: (params?: { search?: string; domain?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.domain) qs.set('domain', params.domain);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ decisions: Decision[] }>(`/decisions${query}`);
  },

  getDecision: (id: string) => request<DecisionWorkspaceData>(`/decisions/${id}`),

  createDecision: (data: Partial<Decision>) =>
    request<{ decision: Decision }>('/decisions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDecision: (id: string, data: Partial<Decision>) =>
    request<{ decision: Decision }>(`/decisions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDecision: (id: string) =>
    request<{ success: boolean }>(`/decisions/${id}`, {
      method: 'DELETE',
    }),

  // Alternatives
  getAlternatives: (decisionId: string) =>
    request<{ alternatives: Alternative[] }>(`/decisions/${decisionId}/alternatives`),

  createAlternative: (decisionId: string, data: Partial<Alternative>) =>
    request<{ alternative: Alternative }>(`/decisions/${decisionId}/alternatives`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAlternative: (id: string, data: Partial<Alternative>) =>
    request<{ alternative: Alternative }>(`/alternatives/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAlternative: (id: string) =>
    request<{ success: boolean }>(`/alternatives/${id}`, {
      method: 'DELETE',
    }),

  // Criteria
  getCriteria: (decisionId: string) =>
    request<{ criteria: Criterion[] }>(`/decisions/${decisionId}/criteria`),

  createCriterion: (decisionId: string, data: Partial<Criterion>) =>
    request<{ criterion: Criterion }>(`/decisions/${decisionId}/criteria`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCriterion: (id: string, data: Partial<Criterion>) =>
    request<{ criterion: Criterion }>(`/criteria/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCriterion: (id: string) =>
    request<{ success: boolean }>(`/criteria/${id}`, {
      method: 'DELETE',
    }),

  normalizeWeights: (decisionId: string) =>
    request<{ criteria: Criterion[] }>(`/decisions/${decisionId}/criteria/normalize-weights`, {
      method: 'POST',
    }),

  // Scores
  saveScores: (decisionId: string, scores: Array<Partial<AlternativeScore>>) =>
    request<{ scores: AlternativeScore[] }>(`/decisions/${decisionId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ scores }),
    }),

  // Evidence
  getEvidence: (decisionId: string) =>
    request<{ evidence: Evidence[] }>(`/decisions/${decisionId}/evidence`),

  createEvidence: (decisionId: string, data: Partial<Evidence>) =>
    request<{ evidence: Evidence }>(`/decisions/${decisionId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvidence: (id: string, data: Partial<Evidence>) =>
    request<{ evidence: Evidence }>(`/evidence/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEvidence: (id: string) =>
    request<{ success: boolean }>(`/evidence/${id}`, {
      method: 'DELETE',
    }),

  // Assumptions
  getAssumptions: (decisionId: string) =>
    request<{ assumptions: Assumption[] }>(`/decisions/${decisionId}/assumptions`),

  createAssumption: (decisionId: string, data: Partial<Assumption>) =>
    request<{ assumption: Assumption }>(`/decisions/${decisionId}/assumptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAssumption: (id: string, data: Partial<Assumption>) =>
    request<{ assumption: Assumption }>(`/assumptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteAssumption: (id: string) =>
    request<{ success: boolean }>(`/assumptions/${id}`, {
      method: 'DELETE',
    }),

  // Risks
  getRisks: (decisionId: string) =>
    request<{ risks: Risk[] }>(`/decisions/${decisionId}/risks`),

  createRisk: (decisionId: string, data: Partial<Risk>) =>
    request<{ risk: Risk }>(`/decisions/${decisionId}/risks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRisk: (id: string, data: Partial<Risk>) =>
    request<{ risk: Risk }>(`/risks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRisk: (id: string) =>
    request<{ success: boolean }>(`/risks/${id}`, {
      method: 'DELETE',
    }),

  // Analysis & Results
  analyzeDecision: (decisionId: string) =>
    request<{ analysis: Analysis; calculation: any }>(`/decisions/${decisionId}/analyze`, {
      method: 'POST',
    }),

  getResults: (decisionId: string) =>
    request<{
      decision: Decision;
      analysis: Analysis;
      alternatives: Alternative[];
      criteria: Criterion[];
      risks: Risk[];
    }>(`/decisions/${decisionId}/results`),

  runSensitivity: (decisionId: string, customWeights?: Record<string, number>) =>
    request<{ sensitivity: SensitivityRun }>(`/decisions/${decisionId}/sensitivity`, {
      method: 'POST',
      body: JSON.stringify({ custom_weights: customWeights }),
    }),

  finalizeDecision: (decisionId: string, data: { selected_alternative_id: string; rationale: string }) =>
    request<{ final_decision: FinalDecision }>(`/decisions/${decisionId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReport: (decisionId: string) =>
    request<{ report: any }>(`/decisions/${decisionId}/report`),
};
