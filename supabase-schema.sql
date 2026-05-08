-- SmartSense Supabase database schema
-- Run this in your Supabase project SQL editor.

create table if not exists public.profiles (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  income                 numeric(12,2) default 0,
  currency               text default 'USD',
  goal                   text,
  monthly_savings_target numeric(12,2) default 0,
  budget_limit           numeric(12,2) default 0,
  categories             text[],
  weaknesses             text[],
  reminder_time          text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

alter table public.profiles add column if not exists currency text default 'USD';
alter table public.profiles add column if not exists monthly_savings_target numeric(12,2) default 0;
alter table public.profiles add column if not exists budget_limit numeric(12,2) default 0;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  amount         numeric(12,2) not null check (amount > 0),
  category       text not null,
  merchant       text,
  payment_method text,
  note           text,
  spent_at       timestamptz default now(),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.expenses add column if not exists merchant text;
alter table public.expenses add column if not exists payment_method text;
alter table public.expenses add column if not exists spent_at timestamptz default now();
alter table public.expenses add column if not exists updated_at timestamptz default now();
update public.expenses set spent_at = created_at where spent_at is null;

alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_spent_at_idx on public.expenses(spent_at desc);
create index if not exists expenses_user_spent_idx on public.expenses(user_id, spent_at desc);
