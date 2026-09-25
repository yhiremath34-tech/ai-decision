import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between ${className}`}>{children}</div>
);
