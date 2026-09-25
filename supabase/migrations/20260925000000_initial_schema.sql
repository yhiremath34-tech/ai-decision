-- ==============================================================================
-- DECISIONFLOW: PRODUCTION POSTGRESQL SCHEMA (OPEN ACCESS / NO LOGIN REQUIRED)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. DECISIONS TABLE
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '00000000-0000-0000-0000-000000000001'::uuid,
  title text not null,
  decision_question text not null,
  description text,
  domain text not null,
  status text not null default 'draft',
  deadline date,
  desired_outcome text,
  constraints text,
  decision_style text default 'balanced',
  analysis_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. ALTERNATIVES TABLE
create table if not exists public.alternatives (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  name text not null,
  description text,
  estimated_cost numeric,
  estimated_benefit numeric,
  implementation_effort numeric,
  duration_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. CRITERIA TABLE
create table if not exists public.criteria (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  name text not null,
  description text,
  criterion_type text not null,
  weight numeric not null,
  direction text not null,
  unit text,
  target_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint criteria_weight_check check (weight >= 0 and weight <= 100),
  constraint criteria_direction_check check (direction in ('higher_better', 'lower_better', 'target_value'))
);

-- 6. ALTERNATIVE SCORES TABLE
create table if not exists public.alternative_scores (
  id uuid primary key default gen_random_uuid(),
  alternative_id uuid not null references public.alternatives(id) on delete cascade,
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  raw_value numeric not null,
  normalized_score numeric not null default 0,
  weighted_score numeric not null default 0,
  confidence numeric not null default 80,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alternative_scores_confidence_check check (confidence >= 0 and confidence <= 100),
  constraint unique_alternative_criterion unique (alternative_id, criterion_id)
);

-- 7. EVIDENCE TABLE
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  alternative_id uuid references public.alternatives(id) on delete set null,
  criterion_id uuid references public.criteria(id) on delete set null,
  title text not null,
  source_type text not null,
  content text not null,
  url text,
  reliability_score numeric not null default 80,
  created_at timestamptz not null default now(),
  constraint evidence_reliability_check check (reliability_score >= 0 and reliability_score <= 100)
);

-- 8. ASSUMPTIONS TABLE
create table if not exists public.assumptions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  description text not null,
  impact_level text not null default 'medium',
  confidence_level numeric not null default 75,
  validation_status text not null default 'unverified',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assumptions_confidence_check check (confidence_level >= 0 and confidence_level <= 100)
);

-- 9. RISKS TABLE (WITH STORED GENERATED RISK SCORE)
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  alternative_id uuid references public.alternatives(id) on delete cascade,
  title text not null,
  description text,
  probability integer not null,
  impact integer not null,
  risk_score integer generated always as (probability * impact) stored,
  mitigation_strategy text,
  residual_probability integer,
  residual_impact integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risks_probability_check check (probability >= 1 and probability <= 5),
  constraint risks_impact_check check (impact >= 1 and impact <= 5),
  constraint risks_residual_prob_check check (residual_probability is null or (residual_probability >= 1 and residual_probability <= 5)),
  constraint risks_residual_impact_check check (residual_impact is null or (residual_impact >= 1 and residual_impact <= 5))
);

-- 10. ANALYSES TABLE
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  version integer not null default 1,
  ai_model text not null,
  recommended_alternative_id uuid references public.alternatives(id) on delete set null,
  executive_summary text not null,
  recommendation_rationale text not null,
  key_tradeoffs jsonb not null default '[]'::jsonb,
  sensitivity_summary text,
  ranked_results jsonb not null default '[]'::jsonb,
  explainability jsonb not null default '{}'::jsonb,
  confidence_score numeric not null default 85,
  created_at timestamptz not null default now()
);

-- 11. SENSITIVITY RUNS TABLE
create table if not exists public.sensitivity_runs (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  scenario_name text not null,
  weight_adjustments jsonb not null default '{}'::jsonb,
  resulting_ranks jsonb not null default '[]'::jsonb,
  winner_changed boolean not null default false,
  new_recommended_id uuid references public.alternatives(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 12. FINAL DECISIONS TABLE (HUMAN IN THE LOOP)
create table if not exists public.final_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  selected_alternative_id uuid not null references public.alternatives(id) on delete restrict,
  human_rationale text not null,
  deviated_from_ai boolean not null default false,
  deviation_reason text,
  decided_by text not null default 'Decision Maker',
  decided_at timestamptz not null default now()
);

-- 13. INDEXES
create index if not exists decisions_user_id_idx on public.decisions(user_id);
create index if not exists alternatives_decision_id_idx on public.alternatives(decision_id);
create index if not exists criteria_decision_id_idx on public.criteria(decision_id);
create index if not exists evidence_decision_id_idx on public.evidence(decision_id);
create index if not exists assumptions_decision_id_idx on public.assumptions(decision_id);
create index if not exists risks_decision_id_idx on public.risks(decision_id);
create index if not exists analyses_decision_id_idx on public.analyses(decision_id);

-- 14. UPDATED_AT TRIGGER FUNCTION
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_decisions_updated_at
  before update on public.decisions
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_alternatives_updated_at
  before update on public.alternatives
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_criteria_updated_at
  before update on public.criteria
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_alternative_scores_updated_at
  before update on public.alternative_scores
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_evidence_updated_at
  before update on public.evidence
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_assumptions_updated_at
  before update on public.assumptions
  for each row execute function public.set_current_timestamp_updated_at();

create or replace trigger set_risks_updated_at
  before update on public.risks
  for each row execute function public.set_current_timestamp_updated_at();

-- 15. ROW LEVEL SECURITY (RLS) POLICIES — OPEN ACCESS (NO LOGIN REQUIRED)
alter table public.profiles enable row level security;
alter table public.decisions enable row level security;
alter table public.alternatives enable row level security;
alter table public.criteria enable row level security;
alter table public.alternative_scores enable row level security;
alter table public.evidence enable row level security;
alter table public.assumptions enable row level security;
alter table public.risks enable row level security;
alter table public.analyses enable row level security;
alter table public.sensitivity_runs enable row level security;
alter table public.final_decisions enable row level security;

-- Drop any previous restrictive policies if they exist
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own decisions" on public.decisions;
drop policy if exists "Users can create own decisions" on public.decisions;
drop policy if exists "Users can update own decisions" on public.decisions;
drop policy if exists "Users can delete own decisions" on public.decisions;
drop policy if exists "Users can access alternatives of own decisions" on public.alternatives;
drop policy if exists "Users can access criteria of own decisions" on public.criteria;
drop policy if exists "Users can access scores of own decisions" on public.alternative_scores;
drop policy if exists "Users can access evidence of own decisions" on public.evidence;
drop policy if exists "Users can access assumptions of own decisions" on public.assumptions;
drop policy if exists "Users can access risks of own decisions" on public.risks;
drop policy if exists "Users can access analyses of own decisions" on public.analyses;
drop policy if exists "Users can access sensitivity runs of own decisions" on public.sensitivity_runs;
drop policy if exists "Users can access final decisions of own decisions" on public.final_decisions;

-- Allow unrestricted access so anyone can create, read, update and delete decisions without an account
create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all on decisions" on public.decisions for all using (true) with check (true);
create policy "Allow all on alternatives" on public.alternatives for all using (true) with check (true);
create policy "Allow all on criteria" on public.criteria for all using (true) with check (true);
create policy "Allow all on alternative_scores" on public.alternative_scores for all using (true) with check (true);
create policy "Allow all on evidence" on public.evidence for all using (true) with check (true);
create policy "Allow all on assumptions" on public.assumptions for all using (true) with check (true);
create policy "Allow all on risks" on public.risks for all using (true) with check (true);
create policy "Allow all on analyses" on public.analyses for all using (true) with check (true);
create policy "Allow all on sensitivity_runs" on public.sensitivity_runs for all using (true) with check (true);
create policy "Allow all on final_decisions" on public.final_decisions for all using (true) with check (true);
