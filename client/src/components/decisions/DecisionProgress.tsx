import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Info,
  Sliders,
  ListTree,
  FileSpreadsheet,
  FileCheck,
  AlertOctagon,
  Sparkles,
  BarChart3,
  FileText,
} from 'lucide-react';
import { DecisionWorkspaceData } from '../../types/index.js';

interface DecisionProgressProps {
  data?: DecisionWorkspaceData | null;
}

export const DecisionProgress: React.FC<DecisionProgressProps> = ({ data }) => {
  const { id } = useParams<{ id: string }>();

  const altsCount = data?.alternatives.length || 0;
  const critCount = data?.criteria.length || 0;
  const isAnalyzed = Boolean(data?.latest_analysis);
  const isDecided = data?.decision?.status === 'decided';

  const steps = [
    { to: `/decisions/${id}`, label: 'Overview', icon: <Info className="w-4 h-4" />, exact: true },
    { to: `/decisions/${id}/context`, label: 'Context', icon: <Sliders className="w-4 h-4" /> },
    {
      to: `/decisions/${id}/alternatives`,
      label: `Alternatives (${altsCount})`,
      icon: <ListTree className="w-4 h-4" />,
      badge: altsCount < 2 ? 'Need 2+' : 'Ready',
      badgeColor: altsCount < 2 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50',
    },
    {
      to: `/decisions/${id}/criteria`,
      label: `Criteria & Matrix (${critCount})`,
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: critCount < 2 ? 'Need 2+' : 'Ready',
      badgeColor: critCount < 2 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50',
    },
    { to: `/decisions/${id}/evidence`, label: 'Evidence & Assumptions', icon: <FileCheck className="w-4 h-4" /> },
    { to: `/decisions/${id}/risks`, label: 'Risks', icon: <AlertOctagon className="w-4 h-4" /> },
    {
      to: `/decisions/${id}/analyze`,
      label: 'Run Analysis',
      icon: <Sparkles className="w-4 h-4" />,
      highlight: !isAnalyzed && altsCount >= 2 && critCount >= 2,
    },
    {
      to: `/decisions/${id}/results`,
      label: 'Results & Sensitivity',
      icon: <BarChart3 className="w-4 h-4" />,
      disabled: !isAnalyzed,
    },
    { to: `/decisions/${id}/report`, label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="flex overflow-x-auto scrollbar-none divide-x divide-slate-100 border-b border-slate-100">
        {steps.map(step => (
          <NavLink
            key={step.to}
            to={step.to}
            end={step.exact}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-600'
                  : step.disabled
                  ? 'text-slate-300 pointer-events-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${step.highlight ? 'bg-amber-50/50 text-amber-700 animate-pulse' : ''}`
            }
          >
            {step.icon}
            <span>{step.label}</span>
            {step.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${step.badgeColor}`}>
                {step.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
      {isDecided && (
        <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <span>✓ Final decision officially made and recorded.</span>
          <span className="font-semibold text-emerald-900">Decided Status Active</span>
        </div>
      )}
    </div>
  );
};
