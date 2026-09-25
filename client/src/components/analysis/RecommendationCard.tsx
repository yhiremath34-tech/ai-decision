import React from 'react';
import { Analysis, Alternative } from '../../types/index.js';
import { Sparkles, Shield, UserCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.js';

interface RecommendationCardProps {
  analysis: Analysis;
  alternatives: Alternative[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  analysis,
  alternatives,
}) => {
  const recommendedAlt = alternatives.find(
    a => a.id === analysis.ai_response.recommended_alternative_id
  ) || alternatives[0];

  const confidence = analysis.recommendation_confidence ?? 85;

  const getConfidenceColor = (val: number) => {
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="bg-gradient-to-br from-white via-brand-50/20 to-sky-50/40 rounded-2xl border-2 border-brand-200 shadow-md p-6 sm:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">AI-Assisted Recommendation</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {recommendedAlt?.name || 'Preferred Alternative'}
            </h2>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-sm ${getConfidenceColor(confidence)}`}>
            <Shield className="w-4 h-4" />
            <span>Confidence: {confidence}%</span>
          </div>
          <Badge variant="purple" size="md">
            {analysis.model_name || 'Gemini 2.5 Flash'}
          </Badge>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Summary</h4>
        <p className="text-base text-slate-800 leading-relaxed font-medium">
          {analysis.ai_response.executive_summary}
        </p>
      </div>

      {/* Recommendation Rationale */}
      <div className="p-4 rounded-xl bg-white border border-brand-100/80 shadow-xs space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700">Analytical Rationale</h4>
        <p className="text-sm text-slate-700 leading-relaxed">
          {analysis.ai_response.recommendation_rationale}
        </p>
      </div>

      {/* Human Decision Authority Note */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
        <UserCheck className="w-4 h-4 text-brand-600 shrink-0" />
        <span>
          <strong>Human Authority Principle:</strong> DecisionFlow functions as a decision-support system. You remain the final decision-maker.
        </span>
      </div>
    </div>
  );
};
