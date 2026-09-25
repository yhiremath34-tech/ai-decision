import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ListTree,
  FileSpreadsheet,
  FileCheck,
  AlertOctagon,
  Trophy,
  CheckCircle,
  Clock,
  Printer,
  Edit3,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { DecisionStatusBadge } from '../components/decisions/DecisionStatusBadge.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { DecisionWorkspaceData } from '../types/index.js';

export const DecisionOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecision(id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load decision workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <Spinner size="lg" text="Loading decision workspace..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { decision, alternatives, criteria, evidence, assumptions, risks, latest_analysis, final_decision } = data;

  const isModelReady = alternatives.length >= 2 && criteria.length >= 2;

  return (
    <PageContainer
      title={decision.title}
      subtitle={`Created on ${new Date(decision.created_at).toLocaleDateString()} • Domain: ${decision.domain}`}
      actions={
        <div className="flex items-center gap-2">
          <DecisionStatusBadge status={decision.status} />
          <Link to={`/decisions/${id}/report`}>
            <Button variant="outline" size="sm" icon={<Printer className="w-3.5 h-3.5" />}>
              Report
            </Button>
          </Link>
          <Link to={`/decisions/${id}/context`}>
            <Button variant="secondary" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />}>
              Edit Context
            </Button>
          </Link>
        </div>
      }
    >
      <DecisionProgress data={data} />

      {/* Decision Question Callout Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-sky-700 text-white shadow-md space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-200">The Decision Question</span>
        <h2 className="text-xl sm:text-2xl font-bold leading-snug">
          "{decision.decision_question}"
        </h2>
        {decision.desired_outcome && (
          <p className="text-xs text-brand-100 border-t border-brand-500/30 pt-2">
            <strong>Target Outcome:</strong> {decision.desired_outcome}
          </p>
        )}
      </div>

      {/* Final Decision Banner if Decided */}
      {final_decision && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Human Decision Finalized</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            <strong>Selected Alternative:</strong>{' '}
            {alternatives.find(a => a.id === final_decision.selected_alternative_id)?.name || 'Chosen Alternative'}
          </p>
          <p className="text-xs text-emerald-700">
            <strong>Executive Rationale:</strong> {final_decision.rationale}
          </p>
          <span className="text-[10px] text-emerald-600 block pt-1">
            Recorded at {new Date(final_decision.decided_at).toLocaleString()}
          </span>
        </div>
      )}

      {/* Model Inventory Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to={`/decisions/${id}/alternatives`} className="block">
          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Alternatives</span>
              <ListTree className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{alternatives.length}</div>
            <span className="text-[11px] text-slate-400">{alternatives.length >= 2 ? 'Requirement met (2+)' : 'Needs at least 2'}</span>
          </Card>
        </Link>

        <Link to={`/decisions/${id}/criteria`} className="block">
          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Criteria</span>
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{criteria.length}</div>
            <span className="text-[11px] text-slate-400">{criteria.length >= 2 ? 'Requirement met (2+)' : 'Needs at least 2'}</span>
          </Card>
        </Link>

        <Link to={`/decisions/${id}/evidence`} className="block">
          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Evidence & Assump.</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{evidence.length + assumptions.length}</div>
            <span className="text-[11px] text-slate-400">{evidence.length} evidence, {assumptions.length} assumptions</span>
          </Card>
        </Link>

        <Link to={`/decisions/${id}/risks`} className="block">
          <Card hoverable className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Risks Identified</span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{risks.length}</div>
            <span className="text-[11px] text-slate-400">{risks.filter(r => r.risk_score >= 12).length} high/critical</span>
          </Card>
        </Link>
      </div>

      {/* Analysis Status / Action Card */}
      {latest_analysis ? (
        <Card className="border-brand-200 bg-gradient-to-br from-white to-brand-50/30 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-700 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Analysis Active (Version {latest_analysis.version})</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Top Recommendation: {alternatives.find(a => a.id === latest_analysis.ai_response.recommended_alternative_id)?.name || 'Preferred Option'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl line-clamp-2">
                {latest_analysis.ai_response.executive_summary}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/decisions/${id}/results`}>
                <Button variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  View Full Results & Sensitivity
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Analysis Readiness</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isModelReady
                  ? 'Your decision model contains sufficient alternatives and criteria to execute quantitative and AI analysis.'
                  : 'Please configure at least 2 alternatives and 2 criteria before triggering the analysis engine.'}
              </p>
            </div>
            <Button
              variant="primary"
              disabled={!isModelReady}
              onClick={() => navigate(`/decisions/${id}/analyze`)}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Run Decision Analysis
            </Button>
          </div>
        </Card>
      )}

      {/* Workspace Quick Jump Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Alternatives ({alternatives.length})</h4>
            <Link to={`/decisions/${id}/alternatives`} className="text-xs font-semibold text-brand-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {alternatives.slice(0, 3).map(alt => (
              <div key={alt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{alt.name}</span>
                <span className="text-slate-500 font-mono">
                  {alt.estimated_cost !== null && alt.estimated_cost !== undefined ? `$${Number(alt.estimated_cost).toLocaleString()}` : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Criteria & Weights ({criteria.length})</h4>
            <Link to={`/decisions/${id}/criteria`} className="text-xs font-semibold text-brand-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {criteria.slice(0, 3).map(crit => (
              <div key={crit.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{crit.name}</span>
                <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {crit.weight}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
