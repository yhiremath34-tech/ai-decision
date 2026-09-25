import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, isSupabaseConnected } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Welcome back to DecisionFlow!');
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    await login('architect@decisionflow.ai', 'demopassword123');
    setLoading(false);
    toast.success('Logged in as Demo Decision Architect');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-slate-200">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to DecisionFlow</h2>
          <p className="text-xs text-slate-500">Access your structured decision intelligence workspaces</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="architect@organization.com"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleQuickDemo}
            className="w-full text-xs text-slate-700 font-semibold border-dashed"
          >
            ⚡ Quick Demo Access (1-Click)
          </Button>

          <p className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Create Account
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link to="/" className="text-[11px] font-medium text-slate-400 hover:text-slate-600">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
