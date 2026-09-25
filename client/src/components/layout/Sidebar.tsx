import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { isSupabaseConnected } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/decisions', label: 'Decision Library', icon: <Layers className="w-4 h-4" /> },
    { to: '/decisions/new', label: 'New Decision', icon: <PlusCircle className="w-4 h-4" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-full flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-extrabold text-white tracking-tight">DecisionFlow</span>
          <span className="block text-[10px] font-semibold text-brand-400 uppercase tracking-wider">Decision Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Platform Workspace
        </div>
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* Persistence & Security Badge */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold">
          <Database className="w-3.5 h-3.5 text-brand-400" />
          <span>Storage Engine</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <div className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-sky-400 animate-pulse'}`} />
          <span>{isSupabaseConnected ? 'Supabase PostgreSQL' : 'Local Persistence (Active)'}</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Row-Level Isolation Enabled</span>
        </div>
      </div>
    </aside>
  );
};
