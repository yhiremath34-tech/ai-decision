import React from 'react';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '5xl' | '7xl' | 'full';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  actions,
  children,
  maxWidth = '7xl',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '5xl': 'max-w-5xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} space-y-6 pb-12 animate-in fade-in duration-300`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
