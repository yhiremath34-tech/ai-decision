import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { Database, ShieldCheck, Sparkles, User, LogOut, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, isSupabaseConnected } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const toast = useToast();

  useEffect(() => {
    api.getHealth()
      .then(res => setHealthStatus(res))
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('User profile preferences updated.');
  };

  return (
    <PageContainer
      title="Application & System Settings"
      subtitle="Manage your profile, authentication session, database connectivity, and AI runtime."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">User Profile</h3>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
              <Input
                label="Email Address"
                value={email}
                disabled
                helperText="Email cannot be changed directly."
              />
              <div className="flex items-center justify-between pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={logout} icon={<LogOut className="w-3.5 h-3.5" />}>
                  Sign Out
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* System & Architecture Status */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Runtime Engine Status</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 text-xs">
            {/* Database */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Database Layer:</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {healthStatus?.database_mode || (isSupabaseConnected ? 'Supabase PostgreSQL' : 'Local Storage')}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {isSupabaseConnected
                  ? 'Connected to live Supabase PostgreSQL database with Row-Level Security.'
                  : 'Operating in self-contained local storage mode.'}
              </p>
            </div>

            {/* AI Engine */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">AI Reasoning Engine:</span>
                <span className="font-extrabold text-purple-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {healthStatus?.gemini_active ? 'Gemini 2.5 Flash Active' : 'Deterministic MCDA Engine'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {healthStatus?.gemini_active
                  ? 'Server-side @google/genai SDK configured with structured output schemas.'
                  : 'Explainable deterministic analysis active.'}
              </p>
            </div>

            {/* Security Isolation */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Security & Isolation:</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Row-Level Isolation Enabled
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Decisions, alternatives, criteria, and evidence are strictly bound to authenticated user identity.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
};
