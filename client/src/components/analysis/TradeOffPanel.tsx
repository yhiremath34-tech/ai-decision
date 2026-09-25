import React from 'react';
import { Analysis } from '../../types/index.js';
import { ArrowLeftRight } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card.js';

interface TradeOffPanelProps {
  analysis: Analysis;
}

export const TradeOffPanel: React.FC<TradeOffPanelProps> = ({ analysis }) => {
  const tradeOffs = analysis.ai_response.trade_offs || [];

  if (tradeOffs.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-slate-50 border-slate-100">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Trade-Off Analysis</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-xs text-slate-500">
          Identified structural trade-offs where prioritizing one dimension creates an inverse consequence in another.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tradeOffs.map((t, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {t.dimension_a}
                </span>
                <span className="text-xs text-slate-400 font-bold">VS</span>
                <span className="font-extrabold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {t.dimension_b}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed pt-1">
                {t.explanation}
              </p>
              {t.affected_alternatives && t.affected_alternatives.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Impacts:</span>
                  {t.affected_alternatives.map((alt, aIdx) => (
                    <span key={aIdx} className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200">
                      {alt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
