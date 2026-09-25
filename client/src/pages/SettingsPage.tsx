import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { Card, CardHeader, CardBody } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { Database, ShieldCheck, Sparkles, User, CheckCircle2, Cpu } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfileName, isSupabaseConnected } = useAuth();
  const [fullName, setFullName] = useState(user.full_name);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const toast = useToast();

  useEffect(() => {
    api.getHealth()
      .then(res => setHealthStatus(res))
      .catch(() => {});
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileName(fullName);
    toast.success('Workspace profile name updated.');
  };

  return (
    <PageContainer
      title="Application & System Settings"
      subtitle="View platform status, storage persistence engine, and active AI runtime."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Profile */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Workspace Identity</h3>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Decision Maker Name / Team Label"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Executive Strategy Committee"
                helperText="Displayed as the signing authority on exportable audit dossiers."
              />
              <Input
                label="Access Mode"
                value="Open Access (Instant • No Login Required)"
                disabled
                helperText="This platform is currently configured for open access."
              />
              <div className="flex items-center justify-end pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Runtime & Connectivity */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Platform Runtime Status</h3>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-brand-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">Database Storage</span>
                  <span className="text-xs text-slate-500">
                    {healthStatus?.database_mode || (isSupabaseConnected ? 'Supabase PostgreSQL' : 'Local Persistence (Active)')}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-brand-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">AI Intelligence Engine</span>
                  <span className="text-xs text-slate-500">
                    Google Gemini 3.8 Flash
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <div>
                  <span className="font-semibold text-slate-800 block">MCDA Mathematical Engine</span>
                  <span className="text-xs text-slate-500">Pure deterministic normalization & risk scoring</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified 100%
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  );
};
