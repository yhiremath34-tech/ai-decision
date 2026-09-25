import React from 'react';
import { Risk } from '../../types/index.js';

interface RiskMatrixProps {
  risks: Risk[];
  onSelectRisk?: (risk: Risk) => void;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, onSelectRisk }) => {
  // 5x5 Grid: Impact on X axis (1 to 5), Probability on Y axis (5 down to 1)
  const probabilities = [5, 4, 3, 2, 1];
  const impacts = [1, 2, 3, 4, 5];

  const getCellColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 17) return 'bg-rose-500/20 border-rose-300 text-rose-900 hover:bg-rose-500/30';
    if (score >= 10) return 'bg-orange-500/20 border-orange-300 text-orange-900 hover:bg-orange-500/30';
    if (score >= 5) return 'bg-amber-500/20 border-amber-300 text-amber-900 hover:bg-amber-500/30';
    return 'bg-emerald-500/20 border-emerald-300 text-emerald-900 hover:bg-emerald-500/30';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">5×5 Risk Heat Matrix</h3>
          <p className="text-xs text-slate-500">Visual distribution of identified risks across Probability and Impact</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /><span>Low (1-4)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /><span>Moderate (5-9)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500" /><span>High (10-16)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500" /><span>Critical (17-25)</span></div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Y Axis Label */}
        <div className="flex items-center justify-center -rotate-90 text-xs font-bold text-slate-500 uppercase tracking-widest w-6">
          Probability
        </div>

        <div className="flex-1">
          {/* Grid rows */}
          <div className="grid grid-rows-5 gap-2">
            {probabilities.map(p => (
              <div key={p} className="grid grid-cols-5 gap-2 h-16">
                {impacts.map(i => {
                  const matchingRisks = risks.filter(r => r.probability === p && r.impact === i);
                  return (
                    <div
                      key={`${p}-${i}`}
                      className={`relative rounded-xl border p-1.5 flex flex-col justify-between transition-colors overflow-hidden ${getCellColor(p, i)}`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold opacity-70">
                        <span>P{p} × I{i}</span>
                        <span>{p * i}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 overflow-y-auto max-h-10">
                        {matchingRisks.map(r => (
                          <span
                            key={r.id}
                            onClick={() => onSelectRisk && onSelectRisk(r)}
                            title={`${r.name} (${p * i}) - Mitigation: ${r.mitigation || 'None'}`}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/90 shadow-xs truncate max-w-full cursor-pointer hover:bg-white"
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* X Axis Label */}
          <div className="grid grid-cols-5 gap-2 mt-2 text-center text-xs font-semibold text-slate-500">
            <div>1 (Minimal)</div>
            <div>2 (Minor)</div>
            <div>3 (Moderate)</div>
            <div>4 (Major)</div>
            <div>5 (Severe)</div>
          </div>
          <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
            Impact
          </div>
        </div>
      </div>
    </div>
  );
};
