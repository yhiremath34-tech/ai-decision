import React from 'react';
import { Alternative, Criterion, AlternativeScore, CalculationSnapshot } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';
import { Trophy, AlertTriangle } from 'lucide-react';

interface DecisionMatrixTableProps {
  alternatives: Alternative[];
  criteria: Criterion[];
  scores: AlternativeScore[];
  calculationSnapshot?: CalculationSnapshot | null;
  onEditScore?: (altId: string, critId: string, currentVal: number | null) => void;
}

export const DecisionMatrixTable: React.FC<DecisionMatrixTableProps> = ({
  alternatives,
  criteria,
  scores,
  calculationSnapshot,
  onEditScore,
}) => {
  const scoreLookup = new Map<string, AlternativeScore>();
  scores.forEach(s => scoreLookup.set(`${s.alternative_id}_${s.criterion_id}`, s));

  // Determine top alternative
  const topAltId = calculationSnapshot?.alternatives[0]?.id;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-700">
            <th className="p-4 sticky left-0 bg-slate-50/95 z-10 w-56">Alternative</th>
            {criteria.map(c => (
              <th key={c.id} className="p-4 min-w-[160px] text-center">
                <div className="font-bold text-slate-900">{c.name}</div>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-[11px] font-normal text-slate-500">
                  <span className="font-semibold text-brand-600">{c.weight}% wt</span>
                  <span>•</span>
                  <span>{c.direction === 'higher_better' ? 'Higher ↑' : c.direction === 'lower_better' ? 'Lower ↓' : 'Target 🎯'}</span>
                </div>
              </th>
            ))}
            <th className="p-4 text-center bg-brand-50/50 w-36 font-bold text-brand-900">
              Total Weighted Score
            </th>
            <th className="p-4 text-center w-28 font-bold text-slate-900">Rank</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alternatives.map(alt => {
            const calculatedAlt = calculationSnapshot?.alternatives.find(a => a.id === alt.id);
            const isWinner = alt.id === topAltId && (calculatedAlt?.total_score || 0) > 0;

            return (
              <tr
                key={alt.id}
                className={`hover:bg-slate-50/60 transition-colors ${
                  isWinner ? 'bg-amber-50/20' : ''
                }`}
              >
                {/* Alternative Name & Metadata */}
                <td className="p-4 font-semibold text-slate-900 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                    <span>{alt.name}</span>
                  </div>
                  {alt.estimated_cost !== null && alt.estimated_cost !== undefined && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Est. Cost: ${Number(alt.estimated_cost).toLocaleString()}
                    </span>
                  )}
                </td>

                {/* Criterion Cells */}
                {criteria.map(crit => {
                  const scoreEntry = scoreLookup.get(`${alt.id}_${crit.id}`);
                  const calcScore = calculatedAlt?.scores[crit.id];
                  const rawVal = scoreEntry?.raw_value ?? null;
                  const normalized = calcScore?.normalized_score ?? null;
                  const weighted = calcScore?.weighted_score ?? null;

                  return (
                    <td
                      key={crit.id}
                      onClick={() => onEditScore && onEditScore(alt.id, crit.id, rawVal)}
                      className={`p-3 text-center transition-colors ${
                        onEditScore ? 'cursor-pointer hover:bg-brand-50/40' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-bold text-slate-800 text-sm">
                          {rawVal !== null ? `${rawVal} ${crit.unit || ''}` : <span className="text-slate-300 italic">Not set</span>}
                        </span>
                        {normalized !== null && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="text-slate-400">Norm: {normalized.toFixed(2)}</span>
                            <span>•</span>
                            <span className="font-semibold text-brand-700">+{weighted?.toFixed(1)} pts</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Total Score */}
                <td className="p-4 text-center bg-brand-50/30">
                  <span className="text-base font-extrabold text-brand-700">
                    {calculatedAlt ? calculatedAlt.total_score : '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-normal">/ 100</span>
                </td>

                {/* Rank */}
                <td className="p-4 text-center">
                  {calculatedAlt ? (
                    isWinner ? (
                      <Badge variant="warning" className="px-3 py-1 font-bold shadow-xs">
                        #1 Top Choice
                      </Badge>
                    ) : (
                      <span className="font-bold text-slate-600 text-sm">#{calculatedAlt.rank}</span>
                    )
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {calculationSnapshot?.warnings && calculationSnapshot.warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50/60 border-t border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Calculation Notice: </span>
            {calculationSnapshot.warnings.join(' ')}
          </div>
        </div>
      )}
    </div>
  );
};
