import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none px-3.5 py-2 pr-10 text-sm bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer ${
            error ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400' : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
