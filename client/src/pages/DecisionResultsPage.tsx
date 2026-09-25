import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Printer,
  CheckCircle,
  Trophy,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { DecisionProgress } from '../components/decisions/DecisionProgress.js';
import { RecommendationCard } from '../components/analysis/RecommendationCard.js';
import { ExplainabilityPanel } from '../components/analysis/ExplainabilityPanel.js';
import { TradeOffPanel } from '../components/analysis/TradeOffPanel.js';
import { SensitivitySimulator } from '../components/analysis/SensitivitySimulator.js';
import { DecisionMatrixTable } from '../components/criteria/DecisionMatrixTable.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Textarea } from '../components/ui/Textarea.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { Modal } from '../components/ui/Modal.js';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.js';
import { DecisionWorkspaceData } from '../types/index.js';

export const DecisionResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DecisionWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Final Decision State
  const [selectedAltId, setSelectedAltId] = useState('');
  const [rationale, setRationale] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDecision(id);
      setData(res);

      if (res.final_decision?.selected_alternative_id) {
        setSelectedAltId(res.final_decision.selected_alternative_id);
        setRationale(res.final_decision.rationale || '');
      } else if (res.latest_analysis?.ai_response?.recommended_alternative_id) {
        setSelectedAltId(res.latest_analysis.ai_response.recommended_alternative_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFinalizeDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedAltId || !rationale.trim()) {
      toast.error('Please select an alternative and enter your strategic rationale.');
      return;
    }

    try {
      setFinalizing(true);
      await api.finalizeDecision(id, {
        selected_alternative_id: selectedAltId,
        rationale: rationale.trim(),
      });

      // Celebration effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Strategic decision officially finalized and recorded!');
      setFinalizeModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize decision');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" text="Loading analytical results..." className="py-24" />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'Decision not found'} onRetry={loadData} />;
  }

  const { decision, alternatives, criteria, scores, latest_analysis, final_decision, live_matrix } = data;

  if (!latest_analysis) {
    return (
      <PageContainer title="No Analysis Found" subtitle="Run analysis first to view results.">
        <DecisionProgress data={data} />
        <Card className="p-8 text-center space-y-4">
          <p className="text-sm text-slate-500">
            No analysis snapshot exists yet for this decision.
          </p>
          <Button variant="primary" onClick={() => navigate(`/decisions/${id}/analyze`)}>
            Execute Analysis
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const isDecided = decision.status === 'decided';
  const chosenAlternative = alternatives.find(a => a.id === (final_decision?.selected_alternative_id || selectedAltId));

  return (
    <PageContainer
      title="Decision Intelligence Results"
      subtitle={`Explainable recommendations, sensitivity analysis, and multi-criteria evaluation for "${decision.title}".`}
      actions={
        <div className="flex items-center gap-2">
          <Link to={`/decisions/${id}/report`}>
            <Button variant="outline" icon={<Printer className="w-4 h-4" />}>
              Generate Report
            </Button>
          </Link>
          {!isDecided && (
            <Button variant="primary" onClick={() => setFinalizeModalOpen(true)} icon={<UserCheck className="w-4 h-4" />}>
              Make Final Decision
            </Button>
          )}
        </div>
      }
    >
      <DecisionProgress data={data} />

      {/* Final Decision Banner if Recorded */}
      {final_decision && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>Final Strategic Decision Made</span>
            </div>
            <span className="text-xs text-emerald-200">
              Recorded on {new Date(final_decision.decided_at).toLocaleString()}
            </span>
          </div>

          <h3 className="text-2xl font-black">
            Selected Alternative: {chosenAlternative?.name}
          </h3>

          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-xs text-emerald-50 leading-relaxed">
            <strong>Human Executive Rationale:</strong> {final_decision.rationale}
          </div>
        </div>
      )}

      {/* 1. Recommendation Summary Card */}
      <RecommendationCard analysis={latest_analysis} alternatives={alternatives} />

      {/* 2. 5 Pillars of Explainability */}
      <ExplainabilityPanel analysis={latest_analysis} alternatives={alternatives} criteria={criteria} />

      {/* 3. Trade-Off Analysis */}
      <TradeOffPanel analysis={latest_analysis} />

      {/* 4. Interactive Sensitivity Simulator */}
      <SensitivitySimulator
        alternatives={alternatives}
        criteria={criteria}
        scores={scores}
        initialStability={latest_analysis.calculation_snapshot?.warnings?.length ? 'moderately_sensitive' : 'stable'}
      />

      {/* 5. Complete Decision Matrix Table */}
      <div className="space-y-3 pt-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Quantitative Decision Matrix Snapshot</h3>
          <p className="text-xs text-slate-500">
            Authoritative deterministic foundation utilized by the AI decision engine.
          </p>
        </div>
        <DecisionMatrixTable
          alternatives={alternatives}
          criteria={criteria}
          scores={scores}
          calculationSnapshot={latest_analysis.calculation_snapshot || live_matrix}
        />
      </div>

      {/* 6. Human Final Decision Prompt Card (if not decided yet) */}
      {!isDecided && (
        <Card className="border-2 border-brand-300 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Make the Final Human Decision</h3>
              <p className="text-xs text-slate-500">
                You retain ultimate decision authority. Select your final alternative and document your rationale.
              </p>
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={() => setFinalizeModalOpen(true)}>
            Record Final Human Decision
          </Button>
        </Card>
      )}

      {/* Final Decision Modal */}
      <Modal
        isOpen={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Record Final Strategic Decision"
        description="Select the alternative you are committing to and provide the human strategic rationale."
        maxWidth="lg"
      >
        <form onSubmit={handleFinalizeDecision} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Final Alternative *
            </label>
            <div className="space-y-2">
              {alternatives.map(alt => (
                <label
                  key={alt.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedAltId === alt.id
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="finalAlt"
                      value={alt.id}
                      checked={selectedAltId === alt.id}
                      onChange={() => setSelectedAltId(alt.id)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm">{alt.name}</span>
                  </div>
                  {alt.id === latest_analysis.ai_response.recommended_alternative_id && (
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ★ AI Recommended
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="Strategic Rationale & Business Justification *"
            required
            rows={4}
            placeholder="Explain why you are choosing this alternative. Note any accepted trade-offs, stakeholder inputs, or operational conditions..."
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            helperText="This rationale will be archived in the formal decision report."
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setFinalizeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={finalizing}>
              Confirm & Save Final Decision
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};
