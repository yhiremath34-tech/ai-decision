import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'brand' | 'success' | 'warning' | 'danger' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  const variantStyles = {
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
