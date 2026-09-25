import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/50">
      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-rose-900">{title}</h3>
      <p className="text-sm text-rose-700 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
