import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string; text?: string }> = ({
  size = 'md',
  className = '',
  text,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-brand-600`} />
      {text && <p className="text-sm font-medium text-slate-600 animate-pulse">{text}</p>}
    </div>
  );
};
