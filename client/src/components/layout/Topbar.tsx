import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Decision Intelligence Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user.full_name}</span>
              <span className="text-[11px] text-slate-500">{user.email}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
