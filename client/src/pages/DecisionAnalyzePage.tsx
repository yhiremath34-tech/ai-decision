import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { DecisionWorkspaceData } from '../types/index.js';

export const DecisionAnalyzePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecision(id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load decision data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;

    try {
      setAnalyzing(true);
      setAnalyzeStep('Step 1/4: Calculating normalized multi-criteria scores...');
      await new Promise(r => setTimeout(r, 600));

      setAnalyzeStep('Step 2/4: Computing risk concentration and matrix trade-offs...');
      await new Promise(r => setTimeout(r, 600));

      setAnalyzeStep('Step 3/4: Invoking Gemini AI for explainable reasoning...');
      const result = await api.analyzeDecision(id);

      setAnalyzeStep('Step 4/4: Validating structured analytical schemas...');
      await new Promise(r => setTimeout(r, 500));

      toast.success('Decision analysis successfully synthesized!');
      navigate(`/decisions/${id}/results`);
    } catch (err: any) {
      toast.error(err.message || 'Analysis run failed');
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Verifying decision model readiness..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { decision, alternatives, criteria, risks, evidence, assumptions, latest_analysis } = data;

  const hasEnoughAlts = alternatives.length >= 2;
  const hasEnoughCrits = criteria.length >= 2;
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightBalanced = Math.abs(totalWeight - 100) < 0.1;
  const isModelValid = hasEnoughAlts && hasEnoughCrits;

  return (
    <PageContainer
      title="Run Decision Intelligence Analysis"
      subtitle="Verify model completeness and trigger deterministic MCDA calculations with explainable Gemini AI synthesis."
    >
      <DecisionProgress data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Checklist (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Model Readiness Checklist</h3>
            </CardHeader>
            <CardBody className="divide-y divide-slate-100">
              {/* Question check */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Decision Question Defined</h4>
                    <p className="text-xs text-slate-500">"{decision.decision_question}"</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Ready
                </span>
              </div>

              {/* Alternatives check */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasEnoughAlts ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">At Least 2 Competing Alternatives</h4>
                    <p className="text-xs text-slate-500">{alternatives.length} alternatives currently registered</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    hasEnoughAlts ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                  }`}
                >
                  {hasEnoughAlts ? 'Ready' : 'Need 2+'}
                </span>
              </div>

              {/* Criteria check */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasEnoughCrits ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Evaluation Criteria & Matrix</h4>
                    <p className="text-xs text-slate-500">{criteria.length} criteria defined</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    hasEnoughCrits ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                  }`}
                >
                  {hasEnoughCrits ? 'Ready' : 'Need 2+'}
                </span>
              </div>

              {/* Weight check */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isWeightBalanced ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-sky-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Criterion Weights Sum to 100%</h4>
                    <p className="text-xs text-slate-500">Current sum: {totalWeight.toFixed(1)}% (auto-normalizes if skewed)</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {isWeightBalanced ? 'Balanced' : 'Auto-Normalized'}
                </span>
              </div>

              {/* Risks & Evidence context */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Contextual Telemetry & Risks</h4>
                    <p className="text-xs text-slate-500">
                      {risks.length} risks, {evidence.length} evidence items, {assumptions.length} assumptions
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Loaded
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Execution Trigger Card (1 col) */}
        <div className="space-y-4">
          <Card className="border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/20 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Synthesize Analysis</h3>
                <span className="text-[11px] font-semibold text-brand-600">Gemini 2.5 Flash + MCDA</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Executes deterministic multi-criteria scoring, normalizes weights, computes risk-adjusted rankings, and prompts Gemini to provide an explainable recommendation with trade-off analysis.
            </p>

            {analyzing ? (
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-3">
                <Spinner size="sm" />
                <p className="text-xs font-bold text-brand-800 text-center animate-pulse">
                  {analyzeStep}
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={!isModelValid}
                onClick={handleRunAnalysis}
                icon={<Sparkles className="w-4 h-4" />}
                className="w-full text-sm font-bold shadow-md shadow-brand-500/20"
              >
                {latest_analysis ? 'Rerun Analysis (New Version)' : 'Run Decision Analysis'}
              </Button>
            )}

            {!isModelValid && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Please add at least 2 alternatives and 2 criteria to unlock analysis execution.
              </p>
            )}

            {latest_analysis && (
              <div className="pt-3 border-t border-slate-200 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/decisions/${id}/results`)}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  View Previous Results (v{latest_analysis.version})
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
