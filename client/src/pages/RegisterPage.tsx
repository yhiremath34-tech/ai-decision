import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await register(fullName, email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Account successfully created!');
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-slate-200">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 items-center justify-center text-white shadow-md shadow-brand-500/20 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create DecisionFlow Account</h2>
          <p className="text-xs text-slate-500">Transform complex data into confident decisions</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Sarah Jenkins"
          />

          <Input
            label="Work Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="sarah@enterprise.com"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Sign In
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
