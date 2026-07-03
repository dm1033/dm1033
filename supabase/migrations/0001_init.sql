-- SiteSafe — schema (enums + tables). Run before 0002_policies.sql and seed.sql.

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('delegate', 'trainer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type difficulty as enum ('foundation', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

-- ── Organisations (training provider tenant) ─────────────────────────────────
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stripe_customer_id text,
  plan text not null default 'free',
  seats int not null default 1,
  created_at timestamptz not null default now()
);

-- ── Profiles (1:1 with auth.users) ───────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'delegate',
  organisation_id uuid references organisations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Content: scenarios → stages → decisions ──────────────────────────────────
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  sector text not null,
  difficulty difficulty not null default 'intermediate',
  summary text not null,
  description text not null,
  image_key text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  key text not null,
  title text not null,
  phase text not null,
  learning_outcome text not null,
  prompt text not null,
  sort_order int not null default 0,
  unique (scenario_id, key)
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  choice_text text not null,
  safety_impact text not null,
  legal_impact text not null,
  explanation text not null,
  score_effect int not null default 0,
  risk_effect int not null default 0,
  is_ideal boolean not null default false,
  layout_effect jsonb not null default '{"add":[]}'::jsonb,
  sort_order int not null default 0
);

-- ── Gameplay ─────────────────────────────────────────────────────────────────
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  delegate_id uuid not null references profiles(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  status session_status not null default 'in_progress',
  total_score int not null default 0,
  max_score int not null default 0,
  risk_index int not null default 50,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists session_choices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  decision_id uuid not null references decisions(id) on delete cascade,
  score_awarded int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cpp_drafts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references game_sessions(id) on delete cascade,
  content jsonb not null,
  generated_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_stages_scenario on stages(scenario_id, sort_order);
create index if not exists idx_decisions_stage on decisions(stage_id, sort_order);
create index if not exists idx_sessions_delegate on game_sessions(delegate_id);
create index if not exists idx_choices_session on session_choices(session_id);
