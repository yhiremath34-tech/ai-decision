import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Sliders,
  CheckCircle2,
  Lock,
  Cpu,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-brand-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">DecisionFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Launch Platform
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/20 via-slate-900/0 to-slate-900 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Instant Open Access — No Login or Account Needed</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            Turn complex data into <br />
            <span className="bg-gradient-to-r from-brand-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              confident decisions.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Organizations often make high-stakes decisions using fragmented spreadsheets, intuition, and incomplete comparisons.
            <strong> DecisionFlow</strong> transforms unclear dilemmas into structured mathematical models with explainable, Gemini-assisted analysis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              icon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto text-base px-8 py-3 shadow-lg shadow-brand-500/30"
            >
              Start Analyzing Decisions
            </Button>
            <Link to="/decisions/new" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800">
                Create New Decision
              </Button>
            </Link>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Access — Zero Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>Human-in-the-Loop Authority</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Deterministic MCDA + Gemini AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Split */}
      <section className="py-20 px-6 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">The Problem</span>
            <h2 className="text-3xl font-extrabold text-white">Why critical choices fail in modern teams</h2>
            <div className="space-y-4 text-slate-400 text-sm">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-rose-400 font-bold">✕</span>
                <p><strong className="text-slate-200">Unexamined Assumptions:</strong> Critical bets made on unvalidated premises without explicit confidence ratings.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-rose-400 font-bold">✕</span>
                <p><strong className="text-slate-200">Hidden Trade-offs:</strong> Selecting an alternative for low upfront cost while ignoring astronomical maintenance effort.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <span className="text-rose-400 font-bold">✕</span>
                <p><strong className="text-slate-200">Black-Box AI Recommendations:</strong> Unexplainable LLM advice that executives cannot audit or defend to boards.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">The DecisionFlow Solution</span>
            <h2 className="text-3xl font-extrabold text-white">Mathematical rigor paired with explainable AI</h2>
            <div className="space-y-4 text-slate-300 text-sm">
              <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-white">Deterministic MCDA Engine:</strong> Pure math normalizes criteria weights and scores with zero hallucination.</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-white">5×5 Risk Heat Matrix:</strong> Explicit probability and impact scoring per alternative.</p>
              </div>
              <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p><strong className="text-white">Auditable Rationale & Dossiers:</strong> Print-ready dossiers capturing human rationale and irreversible decision timestamps.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Domains Showcase */}
      <section className="py-20 px-6 bg-slate-950/40 border-t border-slate-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Domain Flexible</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Applicable across industries and domains
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-brand-400 block mb-1">Business & Strategy</span>
              <p className="text-slate-400">Vendor procurement, corporate expansion, marketing investments</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">Technology</span>
              <p className="text-slate-400">Cloud providers, architectural stacks, cybersecurity tools</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">Finance & Investment</span>
              <p className="text-slate-400">Portfolio allocations, capital expenditure, cost reduction plans</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-bold text-purple-400 block mb-1">Sustainability</span>
              <p className="text-slate-400">Renewable energy transitions, supply chain decarbonization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-16 px-6 border-t border-slate-800 text-center space-y-6">
        <h3 className="text-2xl font-black text-white">
          Ready to make your next high-stakes decision?
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Instant open access with DecisionFlow's explainable analytical platform.
        </p>
        <Button size="lg" onClick={() => navigate('/dashboard')} icon={<ArrowRight className="w-5 h-5" />}>
          Open Platform
        </Button>
        <div className="pt-8 text-xs text-slate-500">
          DecisionFlow © {new Date().getFullYear()} — Turn complex data into confident decisions.
        </div>
      </footer>
    </div>
  );
};
