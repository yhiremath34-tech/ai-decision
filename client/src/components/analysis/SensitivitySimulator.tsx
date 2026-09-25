import React, { useState, useMemo } from 'react';
import { Alternative, Criterion, AlternativeScore } from '../../types/index.js';
import { Card, CardHeader, CardBody } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Sliders, RefreshCw, Trophy, AlertTriangle } from 'lucide-react';

interface SensitivitySimulatorProps {
  alternatives: Alternative[];
  criteria: Criterion[];
  scores: AlternativeScore[];
  initialStability?: 'stable' | 'moderately_sensitive' | 'highly_sensitive';
}

export const SensitivitySimulator: React.FC<SensitivitySimulatorProps> = ({
  alternatives,
  criteria,
  scores,
  initialStability = 'stable',
}) => {
  // Store custom weights in local state initialized from criteria weights
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    criteria.forEach(c => {
      map[c.id] = c.weight;
    });
    return map;
  });

  const resetWeights = () => {
    const map: Record<string, number> = {};
    criteria.forEach(c => {
      map[c.id] = c.weight;
    });
    setWeights(map);
  };

  const handleSliderChange = (criterionId: string, newVal: number) => {
    setWeights(prev => ({
      ...prev,
      [criterionId]: newVal,
    }));
  };

  // Score lookup
  const scoreLookup = useMemo(() => {
    const map = new Map<string, number>();
    scores.forEach(s => {
      if (s.raw_value !== null && s.raw_value !== undefined) {
        map.set(`${s.alternative_id}_${s.criterion_id}`, Number(s.raw_value));
      }
    });
    return map;
  }, [scores]);

  // Dynamically calculate scores based on current slider weights
  const simulatedResults = useMemo(() => {
    const totalW = Object.values(weights).reduce((s, w) => s + w, 0) || 100;

    // Normalize weights
    const normWeights: Record<string, number> = {};
    criteria.forEach(c => {
      normWeights[c.id] = ((weights[c.id] || 0) / totalW) * 100;
    });

    // Min and Max per criterion
    const bounds: Record<string, { min: number; max: number }> = {};
    criteria.forEach(c => {
      const vals: number[] = [];
      alternatives.forEach(a => {
        const val = scoreLookup.get(`${a.id}_${c.id}`);
        if (val !== undefined) vals.push(val);
      });
      bounds[c.id] = {
        min: vals.length ? Math.min(...vals) : 0,
        max: vals.length ? Math.max(...vals) : 100,
      };
    });

    const calculated = alternatives.map(alt => {
      let total = 0;
      criteria.forEach(c => {
        const raw = scoreLookup.get(`${alt.id}_${c.id}`);
        const b = bounds[c.id] || { min: 0, max: 100 };
        let norm = 0;

        if (raw !== undefined) {
          if (c.criterion_type === 'rating') {
            norm = (Math.max(1, Math.min(5, raw)) - 1) / 4;
          } else if (c.criterion_type === 'boolean') {
            norm = raw >= 1 ? 1 : 0;
          } else if (Math.abs(b.max - b.min) < 1e-9) {
            norm = 1.0;
          } else if (c.direction === 'higher_better') {
            norm = (raw - b.min) / (b.max - b.min);
          } else if (c.direction === 'lower_better') {
            norm = (b.max - raw) / (b.max - b.min);
          } else {
            const target = c.target_value ?? (b.min + b.max) / 2;
            const maxDev = Math.max(Math.abs(b.max - target), Math.abs(b.min - target), 1e-6);
            norm = 1 - Math.abs(raw - target) / maxDev;
          }
        }

        const clampedNorm = Math.max(0, Math.min(1, norm));
        total += clampedNorm * (normWeights[c.id] || 0);
      });

      return {
        id: alt.id,
        name: alt.name,
        score: Number(total.toFixed(1)),
      };
    });

    calculated.sort((a, b) => b.score - a.score);

    return {
      alternatives: calculated,
      normWeights,
      winner: calculated[0],
    };
  }, [weights, alternatives, criteria, scoreLookup]);

  // Original winner from base weights
  const originalWinnerId = alternatives[0]?.id;
  const winnerHasChanged = simulatedResults.winner && simulatedResults.winner.id !== originalWinnerId;

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-slate-50 border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Interactive Sensitivity Simulator</h3>
              <p className="text-xs text-slate-500">
                Adjust criterion weights to test outcome stability and ranking flips in real time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                initialStability === 'stable' ? 'success' : initialStability === 'moderately_sensitive' ? 'warning' : 'danger'
              }
              size="md"
            >
              Model: {initialStability.replace('_', ' ').toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={resetWeights} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Dynamic Simulation Result Card */}
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            winnerHasChanged
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                winnerHasChanged ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            >
              {winnerHasChanged ? <AlertTriangle className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider block">
                {winnerHasChanged ? 'Ranking Order Inverted!' : 'Current Leading Alternative:'}
              </span>
              <span className="text-base font-black">
                {simulatedResults.winner?.name} ({simulatedResults.winner?.score} pts)
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 flex items-center gap-2">
            {winnerHasChanged ? (
              <span className="font-semibold text-amber-800">
                Custom weight shifts have altered the preferred choice.
              </span>
            ) : (
              <span className="font-medium text-emerald-800">
                Leading alternative remains resilient to these weight adjustments.
              </span>
            )}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Adjust Weight Distribution
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteria.map(crit => {
              const currentVal = weights[crit.id] ?? crit.weight;
              const normPct = simulatedResults.normWeights[crit.id] || 0;

              return (
                <div key={crit.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{crit.name}</span>
                    <span className="font-extrabold text-brand-600">
                      {currentVal}% <span className="text-slate-400 font-normal">({normPct.toFixed(1)}% eff)</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={currentVal}
                    onChange={e => handleSliderChange(crit.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Ignore)</span>
                    <span>100% (Maximum Priority)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Recalculated Ranking Leaderboard */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Live Re-Ranked Alternatives
          </h4>
          <div className="space-y-2">
            {simulatedResults.alternatives.map((alt, idx) => (
              <div
                key={alt.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{alt.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, alt.score)}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 w-12 text-right">
                    {alt.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
