-- ==============================================================================
-- DECISIONFLOW: PRODUCTION POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists pgcrypto;

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. DECISIONS TABLE
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
  min_value numeric,
  max_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint criteria_weight_valid check (weight >= 0 and weight <= 100)
);

-- 6. ALTERNATIVE SCORES TABLE
create table if not exists public.alternative_scores (
  id uuid primary key default gen_random_uuid(),
  alternative_id uuid not null references public.alternatives(id) on delete cascade,
  criterion_id uuid not null references public.criteria(id) on delete cascade,
  raw_value numeric,
  qualitative_value text,
  normalized_score numeric,
  weighted_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(alternative_id, criterion_id)
);

-- 7. EVIDENCE TABLE
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  alternative_id uuid references public.alternatives(id) on delete set null,
  criterion_id uuid references public.criteria(id) on delete set null,
  title text not null,
  evidence_type text not null,
  source text,
  description text not null,
  reliability numeric,
  evidence_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_reliability_valid
    check (reliability is null or (reliability >= 0 and reliability <= 100))
);

-- 8. ASSUMPTIONS TABLE
create table if not exists public.assumptions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  name text not null,
  value text not null,
  unit text,
  confidence numeric,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assumptions_confidence_valid
    check (confidence is null or (confidence >= 0 and confidence <= 100))
);

-- 9. RISKS TABLE
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  alternative_id uuid references public.alternatives(id) on delete cascade,
  name text not null,
  description text,
  probability integer not null,
  impact integer not null,
  risk_score integer generated always as (probability * impact) stored,
  mitigation text,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint risk_probability_valid check (probability between 1 and 5),
  constraint risk_impact_valid check (impact between 1 and 5)
);

-- 10. ANALYSES TABLE
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  version integer not null,
  overall_score numeric,
  recommendation text,
  recommendation_confidence numeric,
  executive_summary text,
  ai_response jsonb,
  calculation_snapshot jsonb not null,
  model_name text,
  created_at timestamptz not null default now(),
  unique(decision_id, version)
);

-- 11. SENSITIVITY RUNS TABLE
create table if not exists public.sensitivity_runs (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  base_analysis_id uuid references public.analyses(id) on delete cascade,
  weight_changes jsonb not null,
  result jsonb not null,
  stability text,
  created_at timestamptz not null default now()
);

-- 12. FINAL DECISIONS TABLE
create table if not exists public.final_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  selected_alternative_id uuid references public.alternatives(id) on delete set null,
  rationale text,
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

-- 15. USER CREATION TRIGGER FOR PROFILES
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Profiles: Users can view and edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Decisions: Users can CRUD only their own decisions
create policy "Users can view own decisions" on public.decisions
  for select using (auth.uid() = user_id);

create policy "Users can create own decisions" on public.decisions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own decisions" on public.decisions
  for update using (auth.uid() = user_id);

create policy "Users can delete own decisions" on public.decisions
  for delete using (auth.uid() = user_id);

-- Child tables: Ownership enforced through decisions.user_id = auth.uid()

-- Alternatives
create policy "Users can access alternatives of own decisions" on public.alternatives
  for all using (
    exists (select 1 from public.decisions where id = alternatives.decision_id and user_id = auth.uid())
  );

-- Criteria
create policy "Users can access criteria of own decisions" on public.criteria
  for all using (
    exists (select 1 from public.decisions where id = criteria.decision_id and user_id = auth.uid())
  );

-- Alternative Scores
create policy "Users can access scores of own decisions" on public.alternative_scores
  for all using (
    exists (
      select 1 from public.alternatives a
      join public.decisions d on d.id = a.decision_id
      where a.id = alternative_scores.alternative_id and d.user_id = auth.uid()
    )
  );

-- Evidence
create policy "Users can access evidence of own decisions" on public.evidence
  for all using (
    exists (select 1 from public.decisions where id = evidence.decision_id and user_id = auth.uid())
  );

-- Assumptions
create policy "Users can access assumptions of own decisions" on public.assumptions
  for all using (
    exists (select 1 from public.decisions where id = assumptions.decision_id and user_id = auth.uid())
  );

-- Risks
create policy "Users can access risks of own decisions" on public.risks
  for all using (
    exists (select 1 from public.decisions where id = risks.decision_id and user_id = auth.uid())
  );

-- Analyses
create policy "Users can access analyses of own decisions" on public.analyses
  for all using (
    exists (select 1 from public.decisions where id = analyses.decision_id and user_id = auth.uid())
  );

-- Sensitivity Runs
create policy "Users can access sensitivity runs of own decisions" on public.sensitivity_runs
  for all using (
    exists (select 1 from public.decisions where id = sensitivity_runs.decision_id and user_id = auth.uid())
  );

-- Final Decisions
create policy "Users can access final decisions of own decisions" on public.final_decisions
  for all using (
    exists (select 1 from public.decisions where id = final_decisions.decision_id and user_id = auth.uid())
  );
