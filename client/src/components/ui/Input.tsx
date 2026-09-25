import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixText?: string;
  suffixText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  prefixText,
  suffixText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center rounded-lg shadow-sm">
        {prefixText && (
          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
            {prefixText}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors ${
            error ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400' : 'border-slate-300 hover:border-slate-400'
          } ${prefixText ? 'rounded-l-none' : ''} ${suffixText ? 'rounded-r-none' : ''} ${className}`}
          {...props}
        />
        {suffixText && (
          <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
            {suffixText}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
