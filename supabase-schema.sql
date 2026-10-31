-- Run this file in the Supabase SQL Editor.
-- Enable email/password sign-up. Because this MVP uses username-derived auth emails,
-- disable email confirmations in Supabase Auth settings for immediate username/password access.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  home_country text not null default '',
  home_city text not null default '',
  xp integer not null default 0 check (xp >= 0),
  energy integer not null default 100 check (energy between 0 and 100),
  gold integer not null default 100 check (gold >= 0),
  power integer not null default 10 check (power >= 0),
  influence integer not null default 10 check (influence >= 0),
  intel integer not null default 10 check (intel >= 0),
  target_country text not null default '',
  target_city text not null default '',
  daily_quest_date date not null default current_date,
  game_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.city_ledgers (
  country text not null,
  city_name text not null,
  defense integer not null default 50 check (defense >= 0),
  treasury integer not null default 100 check (treasury >= 0),
  controlling_role text not null default 'Politician' check (controlling_role in ('Commander', 'Politician', 'Businessman', 'Spy')),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (country, city_name)
);

create table if not exists public.user_quests (
  user_id uuid not null references auth.users (id) on delete cascade,
  quest_id text not null,
  quest_date date not null default current_date,
  progress integer not null default 0 check (progress >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, quest_id, quest_date)
);

alter table public.profiles enable row level security;
alter table public.city_ledgers enable row level security;
alter table public.user_quests enable row level security;

drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Players can create their own profile" on public.profiles;
create policy "Players can create their own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Anyone can read city ledgers" on public.city_ledgers;
create policy "Anyone can read city ledgers" on public.city_ledgers for select using (true);
drop policy if exists "Authenticated players can create city ledgers" on public.city_ledgers;
create policy "Authenticated players can create city ledgers" on public.city_ledgers for insert to authenticated with check (auth.uid() = updated_by);
drop policy if exists "Authenticated players can update city ledgers" on public.city_ledgers;
create policy "Authenticated players can update city ledgers" on public.city_ledgers for update to authenticated using (true) with check (auth.uid() = updated_by);

drop policy if exists "Players can read their own quests" on public.user_quests;
create policy "Players can read their own quests" on public.user_quests for select using (auth.uid() = user_id);
drop policy if exists "Players can insert their own quests" on public.user_quests;
create policy "Players can insert their own quests" on public.user_quests for insert with check (auth.uid() = user_id);
drop policy if exists "Players can update their own quests" on public.user_quests;
create policy "Players can update their own quests" on public.user_quests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
