import React from 'react';
import { Menu, PlusCircle, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button.js';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Decision Intelligence Platform
          </span>
          <span className="hidden md:inline-block text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
            Open Access Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/decisions/new">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            New Decision
          </Button>
        </Link>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</span>
            <span className="text-[10px] text-slate-400 font-medium">Workspace Active</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
