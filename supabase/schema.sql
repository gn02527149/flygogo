-- flygogo — schema v2
-- Run in the Supabase SQL editor (or via the CLI) to create the core tables.
-- v2 adds: trip_type / segments / frequency on radar_watches,
--          price_snapshots (scan history), price_alerts (below-average hits).

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- destination_groups
-- A named bucket of airport/city codes used to fan out a radar watch.
-- ----------------------------------------------------------------------------
create table if not exists public.destination_groups (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  description   text,
  airport_codes text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- radar_watches
-- A standing price watch. trip_type:
--   one_way    — origin → destination
--   round_trip — origin ⇄ destination (uses return_date)
--   multi_city — 外站票, 4+ legs stored in `segments` jsonb
-- ----------------------------------------------------------------------------
create table if not exists public.radar_watches (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid default auth.uid() references auth.users (id) on delete cascade,
  name                 text not null,
  destination_group_id uuid references public.destination_groups (id) on delete set null,
  trip_type            text not null default 'one_way'
                         check (trip_type in ('one_way', 'round_trip', 'multi_city')),
  origin               text not null,
  destination          text,
  depart_date          date,
  return_date          date,
  segments             jsonb,
  frequency_minutes    integer not null default 360,
  max_price            integer,
  status               text not null default 'active'
                         check (status in ('active', 'paused')),
  last_scanned_at      timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists radar_watches_group_idx
  on public.radar_watches (destination_group_id);

-- ----------------------------------------------------------------------------
-- price_snapshots
-- One row per scan; the monthly average of these is the alert baseline.
-- ----------------------------------------------------------------------------
create table if not exists public.price_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid default auth.uid() references auth.users (id) on delete cascade,
  watch_id   uuid not null references public.radar_watches (id) on delete cascade,
  price      integer not null,
  currency   text not null default 'TWD',
  -- Cheapest itineraries seen in this scan: [{airline, flight_number,
  -- depart_time, arrive_time, duration_minutes, carry_on_kg, checked_kg, price}]
  options    jsonb,
  seen_at    timestamptz not null default now()
);

create index if not exists price_snapshots_watch_idx
  on public.price_snapshots (watch_id, seen_at desc);

-- ----------------------------------------------------------------------------
-- price_alerts
-- Created when a scan sees a price below the same-calendar-month average
-- (or below the watch's max_price threshold). Drives the top-right toasts.
-- ----------------------------------------------------------------------------
create table if not exists public.price_alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid default auth.uid() references auth.users (id) on delete cascade,
  watch_id   uuid not null references public.radar_watches (id) on delete cascade,
  watch_name text not null,
  price      integer not null,
  baseline   integer,
  message    text not null,
  -- The 3 cheapest itineraries at alert time (same shape as price_snapshots.options).
  options    jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists price_alerts_unread_idx
  on public.price_alerts (read, created_at desc);

-- ----------------------------------------------------------------------------
-- radar_targets
-- Reserved for fanning a watch out across a destination group (future phase).
-- ----------------------------------------------------------------------------
create table if not exists public.radar_targets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid default auth.uid() references auth.users (id) on delete cascade,
  watch_id        uuid not null references public.radar_watches (id) on delete cascade,
  origin          text not null,
  destination     text not null,
  depart_date     date,
  return_date     date,
  last_price      integer,
  last_checked_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists radar_targets_watch_idx
  on public.radar_targets (watch_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- 每人只能讀寫自己的資料（user_id 由 default auth.uid() 自動填入）。
-- ----------------------------------------------------------------------------
alter table public.destination_groups enable row level security;
alter table public.radar_watches enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.price_alerts enable row level security;
alter table public.radar_targets enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'destination_groups', 'radar_watches', 'price_snapshots',
    'price_alerts', 'radar_targets'
  ] loop
    execute format(
      'create policy "own rows only" on public.%I for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;
