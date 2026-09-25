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
import { useAuth } from '../context/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

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
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Enter Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/20 via-slate-900/0 to-slate-900 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered Decision Intelligence Platform</span>
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
              onClick={handleDemoAccess}
              icon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto text-base px-8 py-3 shadow-lg shadow-brand-500/30"
            >
              Start Analyzing Decisions
            </Button>
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-slate-800">
                Create Free Account
              </Button>
            </Link>
          </div>

          {/* Social Proof / Security Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Row-Level Data Isolation</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>Human-in-the-Loop Authority</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Supabase PostgreSQL + JWT Auth</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Decision-Support Manifesto */}
      <section className="py-16 px-6 bg-slate-950/60 border-y border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
            The DecisionFlow Principle
          </span>
          <blockquote className="text-xl sm:text-2xl font-semibold text-slate-200 italic max-w-4xl mx-auto leading-relaxed">
            "Given the information, objectives, constraints, alternatives, and risks provided by the user, what does the structured analysis indicate, why does it indicate it, and what information could change the result?"
          </blockquote>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            The system does not blindly make decisions for you. The AI acts as an objective analytical advisor, clearly separating facts, user assumptions, derived calculations, trade-offs, and uncertainty.
          </p>
        </div>
      </section>

      {/* 6 Key Capabilities Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Engine Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Built for rigorous, explainable evaluation
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Combining multi-criteria decision analysis (MCDA), quantitative risk modeling, and Gemini reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Criteria Decision Matrix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic normalization formulas (higher-better, lower-better, target-value) with 100% weight rebalancing and transparent score contributions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">5×5 Quantitative Risk Register</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluate probability (1-5) and impact (1-5) to calculate risk severity scores (1-25) and establish mitigation strategies per alternative.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Gemini 2.5 Explainable AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strictly validated JSON synthesis explaining why an alternative was chosen, its key weaknesses, trade-offs, and critical assumptions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Sensitivity Simulator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag interactive weight sliders to observe outcome stability and immediately identify which criteria could trigger a ranking flip.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Evidence & Assumption Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explicitly catalogue empirical evidence with reliability ratings, separating verified data from user assumptions and subjective estimates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Print-Ready Executive Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate structured, audit-ready decision intelligence dossiers complete with executive summaries, matrices, and formal human rationales.
            </p>
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
          Start for free today with DecisionFlow's explainable analytical platform.
        </p>
        <Button size="lg" onClick={handleDemoAccess} icon={<ArrowRight className="w-5 h-5" />}>
          Get Started Now
        </Button>
        <div className="pt-8 text-xs text-slate-500">
          DecisionFlow © {new Date().getFullYear()} — Turn complex data into confident decisions.
        </div>
      </footer>
    </div>
  );
};
