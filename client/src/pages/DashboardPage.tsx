import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Activity,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { MetricCard } from '../components/dashboard/MetricCard.js';
import { Button } from '../components/ui/Button.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { DecisionStatusBadge } from '../components/decisions/DecisionStatusBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';
import { Decision } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    metrics: {
      total_decisions: number;
      active_decisions: number;
      completed_analyses: number;
      decided_count: number;
      average_confidence: number;
      high_risk_decisions: number;
    };
    recent_decisions: Decision[];
  } | null>(null);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <Spinner size="lg" text="Loading Decision Intelligence Dashboard..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Unable to connect to service'} onRetry={loadData} />;
  }

  const { metrics, recent_decisions } = data;

  return (
    <PageContainer
      title="Decision Intelligence Dashboard"
      subtitle="Overview of ongoing analytical models, risk exposures, and AI-assisted recommendations."
      actions={
        <Link to="/decisions/new">
          <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            New Decision
          </Button>
        </Link>
      }
    >
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Decisions"
          value={metrics.total_decisions}
          icon={<Layers className="w-5 h-5 text-brand-600" />}
          subtitle="All created analytical workspaces"
        />
        <MetricCard
          label="Active In Progress"
          value={metrics.active_decisions}
          icon={<Activity className="w-5 h-5 text-sky-600" />}
          subtitle="Drafts and models awaiting analysis"
        />
        <MetricCard
          label="Average AI Confidence"
          value={`${metrics.average_confidence}%`}
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          subtitle="Mean recommendation certainty"
          trend="Explainable"
          trendUp
        />
        <MetricCard
          label="High-Risk Models"
          value={metrics.high_risk_decisions}
          icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
          subtitle="Decisions containing severity ≥ 12"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Recent Decisions List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recently Updated Decisions</h3>
            <Link to="/decisions" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent_decisions.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">
                <p className="text-sm">No decisions created yet.</p>
                <Link to="/decisions/new" className="mt-3 inline-block">
                  <Button variant="primary" size="sm">Create First Decision</Button>
                </Link>
              </Card>
            ) : (
              recent_decisions.map(d => (
                <Card
                  key={d.id}
                  hoverable
                  onClick={() => navigate(`/decisions/${d.id}`)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {d.domain}
                      </span>
                      <DecisionStatusBadge status={d.status} />
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(d.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug hover:text-brand-600 transition-colors">
                      {d.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      "{d.decision_question}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/decisions/${d.id}`} onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Open Workspace
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Quick Decision Intelligence Guide (1 col) */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Decision Intelligence Workflow</h3>
          <Card className="border-slate-200 bg-white">
            <CardHeader className="bg-slate-50 border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                The 8-Step Analytical Lifecycle
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">1</span>
                <div><strong>Define Context:</strong> Articulate the question, desired outcome, constraints, and decision style.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">2</span>
                <div><strong>Add Alternatives:</strong> Enter 2–10 competing options with costs and benefits.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">3</span>
                <div><strong>Assign Criteria & Weights:</strong> Define measurable metrics summing to 100%.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">4</span>
                <div><strong>Populate Matrix:</strong> Provide quantitative scores for each option.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">5</span>
                <div><strong>Add Evidence & Risks:</strong> Track supporting facts and 5×5 severity risks.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">6</span>
                <div><strong>Run Gemini Analysis:</strong> Derive explainable recommendations and trade-offs.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">7</span>
                <div><strong>Test Sensitivity:</strong> Adjust weight sliders to test outcome stability.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">8</span>
                <div><strong>Human Final Decision:</strong> Record final choice and generate executive report.</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
