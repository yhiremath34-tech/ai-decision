import React from 'react';
import { Card } from '../ui/Card.js';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  trend,
  trendUp,
}) => {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </Card>
  );
};
