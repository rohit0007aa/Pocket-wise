-- =============================================================================
-- PocketWise AI – Supabase Postgres Schema & Row-Level Security Policies
-- Academic Project: Digital Data & AI Literacy (JECRC University, Jaipur)
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. User Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  monthly_pocket_money numeric(12, 2) not null default 5000 check (monthly_pocket_money >= 0),
  savings_target numeric(12, 2) not null default 1000 check (savings_target >= 0),
  onboarding_completed boolean not null default false,
  team_members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Monthly Budgets (per user + month YYYY-MM)
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  pocket_money numeric(12, 2) not null check (pocket_money >= 0),
  savings_target numeric(12, 2) not null default 0 check (savings_target >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);

-- 3. Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null check (
    category in (
      'Food',
      'Transport',
      'Education',
      'Shopping',
      'Entertainment',
      'Hostel and Rent',
      'Mobile and Internet',
      'Health',
      'Other'
    )
  ),
  transaction_date date not null,
  payment_method text not null default 'UPI',
  notes text default '',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Category Budgets
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  category text not null,
  limit_amount numeric(12, 2) not null check (limit_amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, month_key, category)
);

-- 5. Savings Goals
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  deadline date,
  category text default 'Personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Savings Contributions
create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text default '',
  contributed_at timestamptz not null default now()
);

-- 7. Shared Bills (Roommate & Friend Expense Splitter)
create table if not exists public.shared_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  total_amount numeric(12, 2) not null check (total_amount > 0),
  paid_by text not null,
  split_mode text not null check (split_mode in ('equal', 'custom')),
  participants jsonb not null default '[]'::jsonb,
  added_to_personal boolean not null default false,
  bill_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 8. Smart Alerts
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_key text not null,
  month_key text not null,
  severity text not null check (severity in ('info', 'warning', 'danger', 'success')),
  title text not null,
  message text not null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, alert_key)
);

-- =============================================================================
-- Enable Row-Level Security (RLS) on all tables
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.category_budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.shared_bills enable row level security;
alter table public.alerts enable row level security;

-- Policies: Users can only read/write their own rows
create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own monthly_budgets"
  on public.monthly_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own category_budgets"
  on public.category_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own savings_goals"
  on public.savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own savings_contributions"
  on public.savings_contributions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own shared_bills"
  on public.shared_bills for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
