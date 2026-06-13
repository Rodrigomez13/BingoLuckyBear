-- Server-authoritative Truco rooms for Lucky Bingo Bear.
-- Run this SQL in Supabase SQL Editor before switching online mode fully to server authority.

create extension if not exists pgcrypto;

create table if not exists public.truco_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-Z0-9]{5}$'),
  target_score integer not null check (target_score in (15, 30)),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'abandoned')),
  state jsonb not null,
  version bigint not null default 0,
  host_secret text not null,
  guest_secret text,
  host_connected_at timestamptz,
  guest_connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.truco_room_actions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.truco_rooms(id) on delete cascade,
  actor text not null check (actor in ('player', 'opponent')),
  action jsonb not null,
  state_version bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists truco_room_actions_room_created_idx
  on public.truco_room_actions(room_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists truco_rooms_set_updated_at on public.truco_rooms;
create trigger truco_rooms_set_updated_at
before update on public.truco_rooms
for each row execute function public.set_updated_at();

alter table public.truco_rooms enable row level security;
alter table public.truco_room_actions enable row level security;

-- No public RLS policies by default.
-- Access is performed through Next.js route handlers using SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose host_secret or guest_secret to arbitrary clients.
