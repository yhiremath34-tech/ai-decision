import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  Sparkles,
  Shield,
  CheckCircle,
  Clock,
  ArrowLeft,
  Scale,
  Percent,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Button } from '../components/ui/Button.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { api } from '../lib/api.js';

export const DecisionReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getReport(id);
      setReportData(res.report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate decision report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Spinner size="lg" text="Compiling formal Decision Intelligence report..." className="py-24" />;
  }

  if (error || !reportData) {
    return <ErrorState message={error || 'Report data unavailable'} onRetry={loadReport} />;
  }

  const {
    decision,
    alternatives,
    criteria,
    evidence,
    assumptions,
    risks,
    decision_matrix,
    latest_analysis,
    sensitivity_summary,
    final_decision,
  } = reportData;

  const chosenAlt = alternatives.find((a: any) => a.id === final_decision?.selected_alternative_id);

  return (
    <PageContainer
      title="Executive Decision Report"
      subtitle="Formal decision intelligence record suitable for executive review, stakeholder distribution, and auditing."
      actions={
        <div className="flex items-center gap-2 print:hidden">
          <Link to={`/decisions/${id}/results`}>
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Results
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
            Print / Save as PDF
          </Button>
        </div>
      }
    >
      {/* Printable Report Document Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-lg text-slate-800 space-y-10 print:p-0 print:border-none print:shadow-none print:m-0 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-700 font-black text-sm uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>DecisionFlow • Executive Intelligence Dossier</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{decision.title}</h1>
            <p className="text-xs text-slate-500 mt-1">Domain: {decision.domain} • Workspace ID: {decision.id}</p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Status:</strong> {decision.status.toUpperCase()}</div>
            <div><strong>Model Version:</strong> v{decision.analysis_version}</div>
          </div>
        </div>

        {/* 1. Decision Problem Statement */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            1. Decision Problem & Objectives
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Core Inquiring Question:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5 leading-snug">"{decision.decision_question}"</p>
            </div>
            {decision.desired_outcome && (
              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-600">Target Outcome:</span> {decision.desired_outcome}
              </div>
            )}
            {decision.constraints && (
              <div className="text-xs">
                <span className="font-bold text-slate-600">Established Constraints:</span> {decision.constraints}
              </div>
            )}
          </div>
        </section>

        {/* 2. Final Human Decision (if committed) */}
        {final_decision && (
          <section className="space-y-3">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-emerald-900 border-b border-emerald-300 pb-1">
              2. Official Human Strategic Decision
            </h2>
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Selected Alternative: <strong>{chosenAlt?.name}</strong></span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong>Executive Strategic Rationale:</strong> {final_decision.rationale}
              </p>
              <div className="text-[10px] text-emerald-600 pt-1">
                Ratified on {new Date(final_decision.decided_at).toLocaleString()}
              </div>
            </div>
          </section>
        )}

        {/* 3. AI Recommendation & Rationale */}
        {latest_analysis && (
          <section className="space-y-3">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              {final_decision ? '3' : '2'}. AI-Assisted Recommendation Summary
            </h2>
            <div className="p-5 rounded-xl bg-brand-50/50 border border-brand-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand-900">
                  Leading Recommendation: {alternatives.find((a: any) => a.id === latest_analysis.ai_response.recommended_alternative_id)?.name}
                </span>
                <span className="text-xs font-bold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">
                  Confidence: {latest_analysis.recommendation_confidence}%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Executive Summary:</strong> {latest_analysis.ai_response.executive_summary}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Analytical Rationale:</strong> {latest_analysis.ai_response.recommendation_rationale}
              </p>
            </div>
          </section>
        )}

        {/* 4. Multi-Criteria Decision Matrix */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            {final_decision ? '4' : '3'}. Multi-Criteria Scoring Matrix
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-3">Alternative</th>
                  {criteria.map((c: any) => (
                    <th key={c.id} className="p-3 text-center">
                      <div>{c.name}</div>
                      <div className="font-normal text-[10px] text-slate-500">Weight: {c.weight}%</div>
                    </th>
                  ))}
                  <th className="p-3 text-center bg-brand-50 text-brand-900">Total Score</th>
                  <th className="p-3 text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alternatives.map((alt: any) => {
                  const calcAlt = decision_matrix?.alternatives?.find((a: any) => a.id === alt.id);
                  return (
                    <tr key={alt.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{alt.name}</td>
                      {criteria.map((c: any) => {
                        const scoreObj = calcAlt?.scores?.[c.id];
                        return (
                          <td key={c.id} className="p-3 text-center">
                            <span className="font-semibold text-slate-800">
                              {scoreObj?.raw_value !== null && scoreObj?.raw_value !== undefined ? `${scoreObj.raw_value} ${c.unit || ''}` : '—'}
                            </span>
                            {scoreObj?.normalized_score !== undefined && (
                              <div className="text-[10px] text-slate-400">
                                Norm: {scoreObj.normalized_score.toFixed(2)} (+{scoreObj.weighted_score.toFixed(1)}pts)
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-black text-brand-700 bg-brand-50/50">
                        {calcAlt ? calcAlt.total_score : '—'}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        #{calcAlt ? calcAlt.rank : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Sensitivity Analysis & Stability */}
        {sensitivity_summary && (
          <section className="space-y-3">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              {final_decision ? '5' : '4'}. Sensitivity Analysis & Stability Profile
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Overall Ranking Stability:</span>
                <span className="font-black uppercase text-brand-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {sensitivity_summary.stability.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-600">
                Testing systematic weight variations of ±10%, ±20%, and ±30% across criteria.
              </p>
              {sensitivity_summary.sensitive_criteria?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase">
                    Sensitive Criteria Observations:
                  </span>
                  {sensitivity_summary.sensitive_criteria.map((sc: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-white border border-slate-200 text-slate-700">
                      • {sc.impact_summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. Risk Register Snapshot */}
        <section className="space-y-3">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            {final_decision ? '6' : '5'}. Risk Register & Mitigations
          </h2>
          {risks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No specific risks recorded for this model.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {risks.map((r: any) => (
                <div key={r.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      r.risk_score >= 17 ? 'bg-rose-100 text-rose-800' : r.risk_score >= 10 ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Score: {r.risk_score}/25
                    </span>
                  </div>
                  {r.mitigation && (
                    <p className="text-slate-600 text-[11px]">
                      <strong>Mitigation:</strong> {r.mitigation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 7. Document Sign-Off & Footer */}
        <div className="pt-8 border-t-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong>DecisionFlow Platform</strong> • Deterministic Multi-Criteria & Explainable AI Architecture
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span>Executive Sign-Off: ___________________________</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
