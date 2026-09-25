import React from 'react';
import { Analysis, Alternative, Criterion } from '../../types/index.js';
import {
  CheckCircle,
  AlertTriangle,
  Flame,
  HelpCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card.js';

interface ExplainabilityPanelProps {
  analysis: Analysis;
  alternatives: Alternative[];
  criteria: Criterion[];
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  analysis,
  alternatives,
  criteria,
}) => {
  const { ai_response } = analysis;
  const topAltId = ai_response.recommended_alternative_id;
  const topAltAssessment = ai_response.alternative_assessments.find(a => a.alternative_id === topAltId);
  const topAlt = alternatives.find(a => a.id === topAltId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Explainable Decision Intelligence</h3>
        <p className="text-xs text-slate-500">
          Transparent breakdown answering why the recommendation was generated, what assumptions underpin it, and what conditions could alter the outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Why this Alternative? */}
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="bg-emerald-50/50 border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Why "{topAlt?.name || 'This Alternative'}"?</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-600">
              Identified core strengths and high-impact decision factors:
            </p>
            <ul className="space-y-2">
              {topAltAssessment?.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>

            {ai_response.key_decision_factors.length > 0 && (
              <div className="mt-4 pt-3 border-t border-emerald-100/60 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Dominant Decision Drivers:
                </span>
                {ai_response.key_decision_factors.map((factor, idx) => {
                  const crit = criteria.find(c => c.id === factor.criterion_id);
                  return (
                    <div key={idx} className="text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <strong>{crit?.name || 'Criterion'}:</strong> {factor.reason}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 2. What are the Weaknesses? */}
        <Card className="border-amber-200 bg-amber-50/20">
          <CardHeader className="bg-amber-50/50 border-amber-100">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>2. What are the Weaknesses & Compromises?</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-600">
              Identified disadvantages and areas where this alternative sacrifices utility:
            </p>
            <ul className="space-y-2">
              {topAltAssessment?.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* 3. What are the Risks? */}
        <Card className="border-rose-200 bg-rose-50/20">
          <CardHeader className="bg-rose-50/50 border-rose-100">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>3. What are the Critical Risks?</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-600">
              Major registered risks and severity exposure:
            </p>
            <ul className="space-y-2">
              {topAltAssessment?.key_risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
            {ai_response.risk_analysis?.mitigation_actions && ai_response.risk_analysis.mitigation_actions.length > 0 && (
              <div className="mt-3 pt-2 border-t border-rose-100 text-xs text-slate-700">
                <strong>Recommended Mitigation:</strong> {ai_response.risk_analysis.mitigation_actions[0]}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 4. What Assumptions Matter & Uncertainty? */}
        <Card className="border-sky-200 bg-sky-50/20">
          <CardHeader className="bg-sky-50/50 border-sky-100">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>4. What Assumptions & Uncertainties Matter?</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-600">
              Assumptions that materially influence results and inherent uncertainties:
            </p>
            <ul className="space-y-2">
              {ai_response.uncertainties.map((unc, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                  <span>{unc}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* 5. What Could Change the Recommendation? & Next Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-purple-200 bg-purple-50/20">
          <CardHeader className="bg-purple-50/50 border-purple-100">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>5. What Conditions Could Change the Result?</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {ai_response.change_conditions.map((cond, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 bg-white/80 p-2.5 rounded-lg border border-purple-100">
                <span className="font-bold text-purple-700">If:</span>
                <span>{cond}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ArrowRight className="w-4 h-4 text-brand-600" />
              <span>Recommended Next Steps Before Finalizing</span>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {ai_response.next_actions.map((act, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-brand-600">{idx + 1}.</span>
                <span>{act}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
