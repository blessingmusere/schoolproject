-- ─────────────────────────────────────────────────────────────
--  SmartSense – Supabase Database Schema
--  Run this in your Supabase project → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  income        numeric(12,2) default 0,
  goal          text,
  categories    text[],
  weaknesses    text[],
  reminder_time text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: users can only read/write their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);


-- 2. EXPENSES TABLE
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  amount      numeric(12,2) not null check (amount > 0),
  category    text not null,
  note        text,
  created_at  timestamptz default now()
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Policies: users can only access their own expenses
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);


-- 3. INDEX for performance
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists expenses_created_at_idx on public.expenses(created_at desc);


-- ✅ Done! Your database is ready.
