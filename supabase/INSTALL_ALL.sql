-- Lucky Bingo Bear / Truco - consolidated Supabase installer
-- Generated from supabase/migrations in filename order.
-- Run in Supabase SQL Editor. Safe to rerun where migrations are idempotent.

-- ============================================================
-- supabase/migrations/20260613_truco_server_authority.sql
-- ============================================================
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


-- ============================================================
-- supabase/migrations/20260614_truco_lobby_visibility.sql
-- ============================================================
alter table public.truco_rooms add column if not exists visibility text not null default 'private';

alter table public.truco_rooms drop constraint if exists truco_rooms_visibility_check;

alter table public.truco_rooms add constraint truco_rooms_visibility_check check (visibility in ('private', 'public'));

create index if not exists truco_rooms_lobby_visibility_idx on public.truco_rooms (visibility, status, updated_at desc);


-- ============================================================
-- supabase/migrations/20260615_profiles_wallet_truco_economy.sql
-- ============================================================
-- Profiles, wallet ledger, Truco ranking/history and room entry-fee support.
-- Run after the previous Truco migrations.

alter table public.customer_profiles
  add column if not exists alias text,
  add column if not exists avatar_key text not null default 'golden_bear';

create table if not exists public.lbb_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bonus_points_balance bigint not null default 0 check (bonus_points_balance >= 0),
  cash_credits_balance bigint not null default 0 check (cash_credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lbb_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_kind text not null check (wallet_kind in ('bonus_points', 'cash_credits')),
  transaction_type text not null check (transaction_type in (
    'signup_bonus',
    'admin_credit',
    'admin_debit',
    'deposit_pending',
    'deposit_approved',
    'deposit_rejected',
    'truco_entry_fee',
    'truco_prize',
    'bingo_purchase',
    'refund',
    'withdrawal_pending',
    'withdrawal_approved',
    'withdrawal_rejected',
    'adjustment'
  )),
  amount bigint not null,
  balance_after bigint,
  related_type text,
  related_id text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lbb_wallet_transactions_user_created_idx
  on public.lbb_wallet_transactions(user_id, created_at desc);

create table if not exists public.truco_player_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  matches_played integer not null default 0 check (matches_played >= 0),
  matches_won integer not null default 0 check (matches_won >= 0),
  matches_lost integer not null default 0 check (matches_lost >= 0),
  points_for integer not null default 0,
  points_against integer not null default 0,
  ranking_points integer not null default 1000,
  bonus_points_won bigint not null default 0,
  bonus_points_spent bigint not null default 0,
  last_match_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.truco_match_history (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.truco_rooms(id) on delete set null,
  room_code text not null,
  player_user_id uuid references auth.users(id) on delete set null,
  opponent_user_id uuid references auth.users(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,
  loser_user_id uuid references auth.users(id) on delete set null,
  target_score integer not null check (target_score in (15, 30)),
  player_score integer not null default 0,
  opponent_score integer not null default 0,
  entry_fee_points bigint not null default 0,
  prize_points bigint not null default 0,
  ranked boolean not null default false,
  finished_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists truco_match_history_player_idx
  on public.truco_match_history(player_user_id, finished_at desc);

create index if not exists truco_match_history_opponent_idx
  on public.truco_match_history(opponent_user_id, finished_at desc);

create index if not exists truco_player_stats_ranking_idx
  on public.truco_player_stats(ranking_points desc, matches_won desc, matches_played asc);

alter table public.truco_rooms
  add column if not exists host_user_id uuid references auth.users(id) on delete set null,
  add column if not exists guest_user_id uuid references auth.users(id) on delete set null,
  add column if not exists entry_fee_points bigint not null default 0 check (entry_fee_points >= 0),
  add column if not exists prize_pool_points bigint not null default 0 check (prize_pool_points >= 0),
  add column if not exists ranked boolean not null default false,
  add column if not exists settled_at timestamptz;

drop trigger if exists lbb_wallets_set_updated_at on public.lbb_wallets;
create trigger lbb_wallets_set_updated_at
before update on public.lbb_wallets
for each row execute function public.set_updated_at();

create or replace function public.truco_player_stats_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists truco_player_stats_set_updated_at on public.truco_player_stats;
create trigger truco_player_stats_set_updated_at
before update on public.truco_player_stats
for each row execute function public.truco_player_stats_set_updated_at();

alter table public.lbb_wallets enable row level security;
alter table public.lbb_wallet_transactions enable row level security;
alter table public.truco_player_stats enable row level security;
alter table public.truco_match_history enable row level security;

-- Server route handlers use SUPABASE_SERVICE_ROLE_KEY for writes.
-- Client reads should go through /api/customer/* to keep wallet logic centralized.


-- ============================================================
-- supabase/migrations/20260616_truco_guest_stakes_wallet_atomic.sql
-- ============================================================
-- Guest identities, atomic wallet movements and Truco stake lifecycle.
-- The amount shown in the lobby is the total pot; entry_fee_points is each
-- player's half.

alter table public.truco_rooms
  add column if not exists host_name text not null default 'Jugador',
  add column if not exists host_avatar_key text not null default 'golden_bear',
  add column if not exists guest_name text,
  add column if not exists guest_avatar_key text,
  add column if not exists abandoned_by text,
  add column if not exists refunded_at timestamptz;

alter table public.truco_rooms drop constraint if exists truco_rooms_host_name_check;
alter table public.truco_rooms add constraint truco_rooms_host_name_check
  check (char_length(btrim(host_name)) between 3 and 24);

alter table public.truco_rooms drop constraint if exists truco_rooms_guest_name_check;
alter table public.truco_rooms add constraint truco_rooms_guest_name_check
  check (guest_name is null or char_length(btrim(guest_name)) between 3 and 24);

alter table public.truco_rooms drop constraint if exists truco_rooms_host_avatar_check;
alter table public.truco_rooms add constraint truco_rooms_host_avatar_check
  check (host_avatar_key in ('golden_bear', 'lucky_clover', 'bingo_ball', 'gold_coin', 'card_star', 'crown_bear'));

alter table public.truco_rooms drop constraint if exists truco_rooms_guest_avatar_check;
alter table public.truco_rooms add constraint truco_rooms_guest_avatar_check
  check (guest_avatar_key is null or guest_avatar_key in ('golden_bear', 'lucky_clover', 'bingo_ball', 'gold_coin', 'card_star', 'crown_bear'));

alter table public.truco_rooms drop constraint if exists truco_rooms_abandoned_by_check;
alter table public.truco_rooms add constraint truco_rooms_abandoned_by_check
  check (abandoned_by is null or abandoned_by in ('player', 'opponent'));

alter table public.truco_rooms drop constraint if exists truco_rooms_entry_fee_options_check;
alter table public.truco_rooms add constraint truco_rooms_entry_fee_options_check
  check (entry_fee_points in (0, 10, 50, 100));

create unique index if not exists lbb_wallet_transactions_once_per_reference_idx
  on public.lbb_wallet_transactions(user_id, transaction_type, related_type, related_id)
  where related_type is not null
    and related_id is not null
    and transaction_type in (
      'deposit_approved',
      'truco_entry_fee',
      'truco_prize',
      'bingo_purchase',
      'refund'
    );

create unique index if not exists truco_match_history_room_unique_idx
  on public.truco_match_history(room_id)
  where room_id is not null;

create or replace function public.lbb_apply_wallet_transaction(
  p_user_id uuid,
  p_wallet_kind text,
  p_transaction_type text,
  p_amount bigint,
  p_related_type text default null,
  p_related_id text default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_bonus bigint;
  v_cash bigint;
  v_current bigint;
  v_next bigint;
  v_existing bigint;
begin
  if p_amount = 0 then
    raise exception 'El movimiento de wallet no puede ser cero';
  end if;

  if p_wallet_kind not in ('bonus_points', 'cash_credits') then
    raise exception 'Tipo de wallet invalido';
  end if;

  select bonus_points_balance, cash_credits_balance
    into v_bonus, v_cash
  from public.lbb_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Wallet no encontrada';
  end if;

  if p_related_type is not null and p_related_id is not null then
    select balance_after
      into v_existing
    from public.lbb_wallet_transactions
    where user_id = p_user_id
      and transaction_type = p_transaction_type
      and related_type = p_related_type
      and related_id = p_related_id
    limit 1;

    if found then
      return v_existing;
    end if;
  end if;

  v_current := case when p_wallet_kind = 'bonus_points' then v_bonus else v_cash end;
  v_next := v_current + p_amount;

  if v_next < 0 then
    raise exception 'Saldo insuficiente';
  end if;

  if p_wallet_kind = 'bonus_points' then
    update public.lbb_wallets
      set bonus_points_balance = v_next
    where user_id = p_user_id;
  else
    update public.lbb_wallets
      set cash_credits_balance = v_next
    where user_id = p_user_id;
  end if;

  insert into public.lbb_wallet_transactions (
    user_id,
    wallet_kind,
    transaction_type,
    amount,
    balance_after,
    related_type,
    related_id,
    description,
    metadata
  ) values (
    p_user_id,
    p_wallet_kind,
    p_transaction_type,
    p_amount,
    v_next,
    p_related_type,
    p_related_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_next;
end;
$$;

create or replace function public.lbb_create_truco_room(
  p_room_code text,
  p_target_score integer,
  p_visibility text,
  p_state jsonb,
  p_host_secret text,
  p_host_user_id uuid,
  p_host_name text,
  p_host_avatar_key text,
  p_entry_fee_points bigint,
  p_ranked boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  if p_target_score not in (15, 30) then
    raise exception 'Puntaje objetivo invalido';
  end if;

  if p_visibility not in ('private', 'public') then
    raise exception 'Visibilidad invalida';
  end if;

  if p_entry_fee_points not in (0, 10, 50, 100) then
    raise exception 'Apuesta invalida';
  end if;

  if p_entry_fee_points > 0 and p_host_user_id is null then
    raise exception 'Las mesas con pozo requieren una cuenta';
  end if;

  insert into public.truco_rooms (
    room_code,
    target_score,
    status,
    visibility,
    state,
    host_secret,
    host_user_id,
    host_name,
    host_avatar_key,
    entry_fee_points,
    prize_pool_points,
    ranked,
    host_connected_at
  ) values (
    p_room_code,
    p_target_score,
    'waiting',
    p_visibility,
    p_state,
    p_host_secret,
    p_host_user_id,
    btrim(p_host_name),
    p_host_avatar_key,
    p_entry_fee_points,
    0,
    p_ranked,
    now()
  )
  returning * into v_room;

  if p_entry_fee_points > 0 then
    perform public.lbb_apply_wallet_transaction(
      p_host_user_id,
      'bonus_points',
      'truco_entry_fee',
      -p_entry_fee_points,
      'truco_room',
      v_room.id::text,
      format('Reserva para mesa de Truco (%s LBB)', p_entry_fee_points),
      jsonb_build_object('role', 'host', 'roomCode', p_room_code)
    );

    update public.truco_rooms
      set prize_pool_points = p_entry_fee_points
    where id = v_room.id
    returning * into v_room;
  end if;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_join_truco_room(
  p_room_id uuid,
  p_guest_user_id uuid,
  p_guest_secret text,
  p_guest_name text,
  p_guest_avatar_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status <> 'waiting' or v_room.guest_secret is not null then
    raise exception 'La mesa ya no esta disponible';
  end if;

  if v_room.host_user_id is not null and v_room.host_user_id = p_guest_user_id then
    raise exception 'No podes entrar como rival a tu propia mesa';
  end if;

  if v_room.entry_fee_points > 0 and p_guest_user_id is null then
    raise exception 'Las mesas con pozo requieren una cuenta';
  end if;

  if v_room.entry_fee_points > 0 then
    perform public.lbb_apply_wallet_transaction(
      p_guest_user_id,
      'bonus_points',
      'truco_entry_fee',
      -v_room.entry_fee_points,
      'truco_room',
      v_room.id::text,
      format('Entrada a mesa de Truco (%s LBB)', v_room.entry_fee_points),
      jsonb_build_object('role', 'guest', 'roomCode', v_room.room_code)
    );
  end if;

  update public.truco_rooms
    set guest_secret = p_guest_secret,
        guest_user_id = p_guest_user_id,
        guest_name = btrim(p_guest_name),
        guest_avatar_key = p_guest_avatar_key,
        guest_connected_at = now(),
        status = 'playing',
        prize_pool_points = v_room.entry_fee_points * 2
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_cancel_waiting_truco_room(
  p_room_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status = 'abandoned' then
    return to_jsonb(v_room);
  end if;

  if v_room.status <> 'waiting' or v_room.guest_secret is not null then
    raise exception 'La mesa ya tiene rival y no puede cancelarse';
  end if;

  if v_room.prize_pool_points > 0 then
    if v_room.host_user_id is null then
      raise exception 'No se puede reintegrar una mesa sin usuario';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_room.host_user_id,
      'bonus_points',
      'refund',
      v_room.prize_pool_points,
      'truco_room',
      v_room.id::text,
      format('Reintegro de mesa de Truco (%s LBB)', v_room.prize_pool_points),
      jsonb_build_object('reason', 'cancelled_without_opponent', 'roomCode', v_room.room_code)
    );
  end if;

  update public.truco_rooms
    set status = 'abandoned',
        abandoned_by = 'player',
        prize_pool_points = 0,
        refunded_at = case when v_room.prize_pool_points > 0 then now() else refunded_at end,
        settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_settle_truco_room(
  p_room_id uuid,
  p_winner_role text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
  v_winner_user_id uuid;
  v_loser_user_id uuid;
  v_player_score integer;
  v_opponent_score integer;
  v_final_result text;
begin
  if p_winner_role not in ('player', 'opponent') then
    raise exception 'Ganador invalido';
  end if;

  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.settled_at is not null then
    return to_jsonb(v_room);
  end if;

  if v_room.status <> 'finished' then
    raise exception 'La partida todavia no termino';
  end if;

  v_winner_user_id := case when p_winner_role = 'player' then v_room.host_user_id else v_room.guest_user_id end;
  v_loser_user_id := case when p_winner_role = 'player' then v_room.guest_user_id else v_room.host_user_id end;
  v_player_score := coalesce((v_room.state #>> '{scores,player}')::integer, 0);
  v_opponent_score := coalesce((v_room.state #>> '{scores,opponent}')::integer, 0);
  v_final_result := v_room.state ->> 'lastResult';

  if v_room.prize_pool_points > 0 then
    if v_winner_user_id is null then
      raise exception 'No se puede pagar un pozo a un invitado';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_winner_user_id,
      'bonus_points',
      'truco_prize',
      v_room.prize_pool_points,
      'truco_room',
      v_room.id::text,
      format('Premio por ganar Truco (%s LBB)', v_room.prize_pool_points),
      jsonb_build_object('roomCode', v_room.room_code)
    );
  end if;

  insert into public.truco_match_history (
    room_id,
    room_code,
    player_user_id,
    opponent_user_id,
    winner_user_id,
    loser_user_id,
    target_score,
    player_score,
    opponent_score,
    entry_fee_points,
    prize_points,
    ranked,
    metadata
  ) values (
    v_room.id,
    v_room.room_code,
    v_room.host_user_id,
    v_room.guest_user_id,
    v_winner_user_id,
    v_loser_user_id,
    v_room.target_score,
    v_player_score,
    v_opponent_score,
    v_room.entry_fee_points,
    v_room.prize_pool_points,
    v_room.ranked,
    jsonb_build_object('finalResult', v_final_result, 'abandonedBy', v_room.abandoned_by)
  )
  on conflict (room_id) where room_id is not null do nothing;

  if v_winner_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_winner_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_won = matches_won + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          ranking_points = ranking_points + case when v_room.ranked then 15 else 0 end,
          bonus_points_won = bonus_points_won + v_room.prize_pool_points,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_winner_user_id;
  end if;

  if v_loser_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_loser_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_lost = matches_lost + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          ranking_points = ranking_points + case when v_room.ranked then -10 else 0 end,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_loser_user_id;
  end if;

  update public.truco_rooms
    set settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

revoke execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.lbb_create_truco_room(text, integer, text, jsonb, text, uuid, text, text, bigint, boolean) from public, anon, authenticated;
revoke execute on function public.lbb_join_truco_room(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.lbb_cancel_waiting_truco_room(uuid) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_room(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb) to service_role;
grant execute on function public.lbb_create_truco_room(text, integer, text, jsonb, text, uuid, text, text, bigint, boolean) to service_role;
grant execute on function public.lbb_join_truco_room(uuid, uuid, text, text, text) to service_role;
grant execute on function public.lbb_cancel_waiting_truco_room(uuid) to service_role;
grant execute on function public.lbb_settle_truco_room(uuid, text) to service_role;


-- ============================================================
-- supabase/migrations/20260617_user_roles_admin_audit.sql
-- ============================================================
-- Role-based access control and admin audit log.
-- Apply this after the wallet/truco migrations.

create table if not exists public.lbb_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('admin', 'operator', 'player')),
  permissions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lbb_user_roles_role_idx
  on public.lbb_user_roles(role);

create table if not exists public.lbb_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lbb_admin_audit_logs_admin_created_idx
  on public.lbb_admin_audit_logs(admin_user_id, created_at desc);

create index if not exists lbb_admin_audit_logs_entity_idx
  on public.lbb_admin_audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.lbb_user_roles_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lbb_user_roles_set_updated_at on public.lbb_user_roles;
create trigger lbb_user_roles_set_updated_at
before update on public.lbb_user_roles
for each row execute function public.lbb_user_roles_set_updated_at();

alter table public.lbb_user_roles enable row level security;
alter table public.lbb_admin_audit_logs enable row level security;

-- Server route handlers use SUPABASE_SERVICE_ROLE_KEY for admin reads/writes.
-- Grant an admin manually after creating the first account, for example:
-- insert into public.lbb_user_roles (user_id, role)
-- select id, 'admin' from auth.users where lower(email) = lower('TU_EMAIL_ADMIN@DOMINIO.COM')
-- on conflict (user_id) do update set role = excluded.role;


-- ============================================================
-- supabase/migrations/20260617_wallet_bootstrap_and_function_hardening.sql
-- ============================================================
-- Make first-login wallet setup observable and idempotent.
with duplicate_signup_bonus as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, id asc
    ) as row_number
  from public.lbb_wallet_transactions
  where transaction_type = 'signup_bonus'
)
delete from public.lbb_wallet_transactions transactions
using duplicate_signup_bonus duplicates
where transactions.id = duplicates.id
  and duplicates.row_number > 1;

create unique index if not exists lbb_wallet_signup_bonus_once_idx
  on public.lbb_wallet_transactions (user_id)
  where transaction_type = 'signup_bonus';

-- Cover the foreign keys used by room and match-history lookups.
create index if not exists truco_rooms_host_user_id_idx
  on public.truco_rooms (host_user_id);

create index if not exists truco_rooms_guest_user_id_idx
  on public.truco_rooms (guest_user_id);

create index if not exists truco_match_history_winner_user_id_idx
  on public.truco_match_history (winner_user_id);

create index if not exists truco_match_history_loser_user_id_idx
  on public.truco_match_history (loser_user_id);

-- Trigger helpers are invoked by PostgreSQL, never directly by browser roles.
alter function public.set_updated_at() set search_path = '';
alter function public.truco_player_stats_set_updated_at() set search_path = '';
alter function public.link_bingo_card_customer() set search_path = '';
alter function public.sync_customer_profile_to_cards() set search_path = '';

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.truco_player_stats_set_updated_at() from public, anon, authenticated;
revoke execute on function public.link_bingo_card_customer() from public, anon, authenticated;
revoke execute on function public.sync_customer_profile_to_cards() from public, anon, authenticated;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.truco_player_stats_set_updated_at() to service_role;
grant execute on function public.link_bingo_card_customer() to service_role;
grant execute on function public.sync_customer_profile_to_cards() to service_role;


-- ============================================================
-- supabase/migrations/20260618_economy_deposits_purchases_bingo_card_refactor.sql
-- ============================================================
-- Economy refactor foundation: deposits, game purchases and cleaner bingo-card linkage.
-- This migration is additive and keeps legacy bingo_cards columns working.
-- Apply after 20260617_user_roles_admin_audit.sql.

create table if not exists public.payment_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  amount bigint not null check (amount > 0),
  currency text not null default 'ARS',
  wallet_kind text not null default 'cash_credits' check (wallet_kind in ('cash_credits', 'bonus_points')),
  payment_method text not null,
  payment_reference text,
  receipt_url text,
  receipt_amount bigint,
  receipt_operation_number text,
  receipt_destination_account text,
  receipt_date timestamptz,
  receipt_raw_text text,
  receipt_parse_status text default 'pending' check (receipt_parse_status in ('pending', 'parsed', 'failed', 'manual')),
  receipt_parse_error text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  wallet_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_deposits_user_created_idx
  on public.payment_deposits(user_id, created_at desc);

create index if not exists payment_deposits_status_created_idx
  on public.payment_deposits(status, created_at desc);

create index if not exists payment_deposits_reference_idx
  on public.payment_deposits(payment_reference)
  where payment_reference is not null;

create table if not exists public.game_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  game_type text not null check (game_type in ('bingo', 'truco', 'tournament')),
  purchase_type text not null check (purchase_type in ('bingo_card', 'truco_entry_fee', 'tournament_entry', 'pack', 'manual')),
  wallet_kind text not null default 'cash_credits' check (wallet_kind in ('cash_credits', 'bonus_points')),
  amount bigint not null check (amount >= 0),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded', 'failed')),
  wallet_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  deposit_id uuid references public.payment_deposits(id) on delete set null,
  related_type text,
  related_id text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_purchases_user_created_idx
  on public.game_purchases(user_id, created_at desc);

create index if not exists game_purchases_game_status_idx
  on public.game_purchases(game_type, status, created_at desc);

create index if not exists game_purchases_related_idx
  on public.game_purchases(related_type, related_id)
  where related_type is not null and related_id is not null;

alter table public.bingo_cards
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists purchase_id uuid references public.game_purchases(id) on delete set null,
  add column if not exists deposit_id uuid references public.payment_deposits(id) on delete set null,
  add column if not exists card_status text not null default 'reserved' check (card_status in ('reserved', 'active', 'cancelled', 'winner')),
  add column if not exists generated_seed text,
  add column if not exists issued_at timestamptz,
  add column if not exists buyer_snapshot jsonb not null default '{}'::jsonb;

-- Backfill user_id from the legacy customer_id column when it exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bingo_cards'
      and column_name = 'customer_id'
  ) then
    execute 'update public.bingo_cards set user_id = customer_id where user_id is null and customer_id is not null';
  end if;
end $$;

update public.bingo_cards
  set card_status = case
    when coalesce(payment_status, 'pending') = 'approved' then 'active'
    when coalesce(payment_status, 'pending') = 'rejected' then 'cancelled'
    else card_status
  end;

create index if not exists bingo_cards_user_created_idx
  on public.bingo_cards(user_id, created_at desc);

create index if not exists bingo_cards_purchase_idx
  on public.bingo_cards(purchase_id);

create index if not exists bingo_cards_deposit_idx
  on public.bingo_cards(deposit_id);

create index if not exists bingo_cards_status_idx
  on public.bingo_cards(card_status, created_at desc);

-- Expand wallet transaction types without losing existing data.
alter table public.lbb_wallet_transactions
  drop constraint if exists lbb_wallet_transactions_transaction_type_check;

alter table public.lbb_wallet_transactions
  add constraint lbb_wallet_transactions_transaction_type_check check (transaction_type in (
    'signup_bonus',
    'admin_credit',
    'admin_debit',
    'deposit_pending',
    'deposit_approved',
    'deposit_rejected',
    'truco_entry_fee',
    'truco_prize',
    'bingo_purchase',
    'tournament_entry',
    'game_purchase',
    'refund',
    'game_refund',
    'withdrawal_pending',
    'withdrawal_approved',
    'withdrawal_rejected',
    'adjustment'
  ));

-- Updated unique idempotency index with new transaction types.
drop index if exists public.lbb_wallet_transactions_once_per_reference_idx;
create unique index if not exists lbb_wallet_transactions_once_per_reference_idx
  on public.lbb_wallet_transactions(user_id, transaction_type, related_type, related_id)
  where related_type is not null
    and related_id is not null
    and transaction_type in (
      'deposit_approved',
      'truco_entry_fee',
      'truco_prize',
      'bingo_purchase',
      'tournament_entry',
      'game_purchase',
      'refund',
      'game_refund'
    );

create or replace function public.payment_deposits_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists payment_deposits_set_updated_at on public.payment_deposits;
create trigger payment_deposits_set_updated_at
before update on public.payment_deposits
for each row execute function public.payment_deposits_set_updated_at();

create or replace function public.game_purchases_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists game_purchases_set_updated_at on public.game_purchases;
create trigger game_purchases_set_updated_at
before update on public.game_purchases
for each row execute function public.game_purchases_set_updated_at();

alter table public.payment_deposits enable row level security;
alter table public.game_purchases enable row level security;

-- Service role routes own writes. Client reads/writes must go through /api/customer/* or /api/admin/*.


-- ============================================================
-- supabase/migrations/20260619_raffle_card_price_and_economy_consistency.sql
-- ============================================================
-- Numeric bingo-card pricing and indexes used by the admin economy views.
-- Apply after 20260618_economy_deposits_purchases_bingo_card_refactor.sql.

alter table public.raffles
  add column if not exists card_price bigint;

update public.raffles
set card_price = nullif(regexp_replace(coalesce(amount, ''), '[^0-9]', '', 'g'), '')::bigint
where card_price is null
  and nullif(regexp_replace(coalesce(amount, ''), '[^0-9]', '', 'g'), '') is not null;

alter table public.raffles
  drop constraint if exists raffles_card_price_check;

alter table public.raffles
  add constraint raffles_card_price_check
  check (card_price is null or card_price > 0);

create index if not exists lbb_wallet_transactions_type_created_idx
  on public.lbb_wallet_transactions(transaction_type, created_at desc);

create index if not exists lbb_wallet_transactions_related_idx
  on public.lbb_wallet_transactions(related_type, related_id)
  where related_type is not null and related_id is not null;

create or replace function public.sync_bingo_purchase_from_deposit_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.game_purchases
    set status = 'paid',
        updated_at = now()
    where deposit_id = new.id
      and status = 'pending';

    update public.bingo_cards
    set payment_status = 'approved',
        card_status = 'active',
        issued_at = coalesce(issued_at, now()),
        payment_reviewed_at = coalesce(new.reviewed_at, now()),
        payment_reviewed_by = new.reviewed_by
    where deposit_id = new.id;
  elsif new.status in ('rejected', 'cancelled') then
    update public.game_purchases
    set status = 'cancelled',
        updated_at = now()
    where deposit_id = new.id
      and status = 'pending';

    update public.bingo_cards
    set payment_status = 'rejected',
        card_status = 'cancelled',
        payment_reviewed_at = coalesce(new.reviewed_at, now()),
        payment_reviewed_by = new.reviewed_by
    where deposit_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists payment_deposits_sync_bingo_purchase on public.payment_deposits;
create trigger payment_deposits_sync_bingo_purchase
after update of status on public.payment_deposits
for each row execute function public.sync_bingo_purchase_from_deposit_review();

revoke execute on function public.sync_bingo_purchase_from_deposit_review() from public, anon, authenticated;
grant execute on function public.sync_bingo_purchase_from_deposit_review() to service_role;


-- ============================================================
-- supabase/migrations/20260620_economy_query_indexes_and_function_hardening.sql
-- ============================================================
-- Query indexes and trigger-function hardening for the economy module.
-- Apply after 20260619_raffle_card_price_and_economy_consistency.sql.

create index if not exists game_purchases_deposit_id_idx
  on public.game_purchases(deposit_id)
  where deposit_id is not null;

alter function public.payment_deposits_set_updated_at() set search_path = '';
alter function public.game_purchases_set_updated_at() set search_path = '';
alter function public.lbb_user_roles_set_updated_at() set search_path = '';

revoke execute on function public.payment_deposits_set_updated_at() from public, anon, authenticated;
revoke execute on function public.game_purchases_set_updated_at() from public, anon, authenticated;
revoke execute on function public.lbb_user_roles_set_updated_at() from public, anon, authenticated;

grant execute on function public.payment_deposits_set_updated_at() to service_role;
grant execute on function public.game_purchases_set_updated_at() to service_role;
grant execute on function public.lbb_user_roles_set_updated_at() to service_role;


-- ============================================================
-- supabase/migrations/20260621_player_balance_deposits_withdrawals.sql
-- ============================================================
-- Player cash deposits and withdrawals with atomic wallet reservations.
-- Cash Credits are withdrawable. LBB Points remain an internal game balance.

create table if not exists public.payment_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null default 'ARS',
  wallet_kind text not null default 'cash_credits' check (wallet_kind = 'cash_credits'),
  payout_account_kind text not null check (payout_account_kind in ('Alias', 'CBU', 'CVU')),
  payout_account text not null,
  payout_holder_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  settlement_reference text,
  wallet_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  reversal_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_withdrawals_user_created_idx
  on public.payment_withdrawals(user_id, created_at desc);

create index if not exists payment_withdrawals_status_created_idx
  on public.payment_withdrawals(status, created_at desc);

drop index if exists public.lbb_wallet_transactions_once_per_reference_idx;
create unique index if not exists lbb_wallet_transactions_once_per_reference_idx
  on public.lbb_wallet_transactions(user_id, transaction_type, related_type, related_id)
  where related_type is not null
    and related_id is not null
    and transaction_type in (
      'deposit_approved',
      'truco_entry_fee',
      'truco_prize',
      'bingo_purchase',
      'tournament_entry',
      'game_purchase',
      'refund',
      'game_refund',
      'withdrawal_pending',
      'withdrawal_rejected'
    );

create or replace function public.payment_withdrawals_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payment_withdrawals_set_updated_at on public.payment_withdrawals;
create trigger payment_withdrawals_set_updated_at
before update on public.payment_withdrawals
for each row execute function public.payment_withdrawals_set_updated_at();

create or replace function public.lbb_request_withdrawal(
  p_user_id uuid,
  p_amount bigint,
  p_payout_account_kind text,
  p_payout_account text,
  p_payout_holder_name text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_withdrawal public.payment_withdrawals%rowtype;
  v_balance_after bigint;
  v_transaction_id uuid;
begin
  if p_user_id is null then
    raise exception 'Usuario invalido';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto del retiro debe ser mayor a cero';
  end if;

  if p_payout_account_kind not in ('Alias', 'CBU', 'CVU') then
    raise exception 'Tipo de cuenta de cobro invalido';
  end if;

  if nullif(btrim(p_payout_account), '') is null
    or nullif(btrim(p_payout_holder_name), '') is null then
    raise exception 'Completa la cuenta y el titular para retirar';
  end if;

  insert into public.payment_withdrawals (
    user_id,
    amount,
    payout_account_kind,
    payout_account,
    payout_holder_name,
    metadata
  ) values (
    p_user_id,
    p_amount,
    p_payout_account_kind,
    btrim(p_payout_account),
    btrim(p_payout_holder_name),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_withdrawal;

  v_balance_after := public.lbb_apply_wallet_transaction(
    p_user_id,
    'cash_credits',
    'withdrawal_pending',
    -p_amount,
    'payment_withdrawal',
    v_withdrawal.id::text,
    format('Saldo reservado para retiro (%s ARS)', p_amount),
    jsonb_build_object('withdrawalId', v_withdrawal.id)
  );

  select id
    into v_transaction_id
  from public.lbb_wallet_transactions
  where user_id = p_user_id
    and transaction_type = 'withdrawal_pending'
    and related_type = 'payment_withdrawal'
    and related_id = v_withdrawal.id::text
  limit 1;

  update public.payment_withdrawals
    set wallet_transaction_id = v_transaction_id,
        metadata = coalesce(metadata, '{}'::jsonb)
          || jsonb_build_object('balanceAfterReservation', v_balance_after)
  where id = v_withdrawal.id
  returning * into v_withdrawal;

  return to_jsonb(v_withdrawal);
end;
$$;

create or replace function public.lbb_review_withdrawal(
  p_withdrawal_id uuid,
  p_admin_user_id uuid,
  p_action text,
  p_notes text default null,
  p_settlement_reference text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_withdrawal public.payment_withdrawals%rowtype;
  v_reversal_transaction_id uuid;
begin
  if p_action not in ('approve', 'reject') then
    raise exception 'Accion de retiro invalida';
  end if;

  select *
    into v_withdrawal
  from public.payment_withdrawals
  where id = p_withdrawal_id
  for update;

  if not found then
    raise exception 'Retiro no encontrado';
  end if;

  if v_withdrawal.status <> 'pending' then
    if (p_action = 'approve' and v_withdrawal.status = 'approved')
      or (p_action = 'reject' and v_withdrawal.status = 'rejected') then
      return to_jsonb(v_withdrawal);
    end if;
    raise exception 'Solo se pueden revisar retiros pendientes';
  end if;

  if p_action = 'reject' then
    perform public.lbb_apply_wallet_transaction(
      v_withdrawal.user_id,
      'cash_credits',
      'withdrawal_rejected',
      v_withdrawal.amount,
      'payment_withdrawal',
      v_withdrawal.id::text,
      format('Saldo reintegrado por retiro rechazado (%s ARS)', v_withdrawal.amount),
      jsonb_build_object('withdrawalId', v_withdrawal.id, 'reviewedBy', p_admin_user_id)
    );

    select id
      into v_reversal_transaction_id
    from public.lbb_wallet_transactions
    where user_id = v_withdrawal.user_id
      and transaction_type = 'withdrawal_rejected'
      and related_type = 'payment_withdrawal'
      and related_id = v_withdrawal.id::text
    limit 1;
  end if;

  update public.payment_withdrawals
    set status = case when p_action = 'approve' then 'approved' else 'rejected' end,
        reviewed_by = p_admin_user_id,
        reviewed_at = now(),
        review_notes = nullif(btrim(p_notes), ''),
        settlement_reference = case
          when p_action = 'approve' then nullif(btrim(p_settlement_reference), '')
          else settlement_reference
        end,
        reversal_transaction_id = coalesce(v_reversal_transaction_id, reversal_transaction_id)
  where id = v_withdrawal.id
  returning * into v_withdrawal;

  return to_jsonb(v_withdrawal);
end;
$$;

create or replace function public.lbb_cancel_withdrawal(
  p_withdrawal_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_withdrawal public.payment_withdrawals%rowtype;
  v_reversal_transaction_id uuid;
begin
  select *
    into v_withdrawal
  from public.payment_withdrawals
  where id = p_withdrawal_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Retiro no encontrado';
  end if;

  if v_withdrawal.status = 'cancelled' then
    return to_jsonb(v_withdrawal);
  end if;

  if v_withdrawal.status <> 'pending' then
    raise exception 'Solo se pueden cancelar retiros pendientes';
  end if;

  perform public.lbb_apply_wallet_transaction(
    v_withdrawal.user_id,
    'cash_credits',
    'withdrawal_rejected',
    v_withdrawal.amount,
    'payment_withdrawal',
    v_withdrawal.id::text,
    format('Saldo reintegrado por retiro cancelado (%s ARS)', v_withdrawal.amount),
    jsonb_build_object('withdrawalId', v_withdrawal.id, 'reason', 'customer_cancelled')
  );

  select id
    into v_reversal_transaction_id
  from public.lbb_wallet_transactions
  where user_id = v_withdrawal.user_id
    and transaction_type = 'withdrawal_rejected'
    and related_type = 'payment_withdrawal'
    and related_id = v_withdrawal.id::text
  limit 1;

  update public.payment_withdrawals
    set status = 'cancelled',
        reviewed_at = now(),
        review_notes = 'Cancelado por el jugador',
        reversal_transaction_id = v_reversal_transaction_id
  where id = v_withdrawal.id
  returning * into v_withdrawal;

  return to_jsonb(v_withdrawal);
end;
$$;

alter table public.payment_withdrawals enable row level security;

revoke execute on function public.payment_withdrawals_set_updated_at() from public, anon, authenticated;
revoke execute on function public.lbb_request_withdrawal(uuid, bigint, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.lbb_review_withdrawal(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.lbb_cancel_withdrawal(uuid, uuid) from public, anon, authenticated;

grant select, insert, update, delete on public.payment_withdrawals to service_role;
grant execute on function public.payment_withdrawals_set_updated_at() to service_role;
grant execute on function public.lbb_request_withdrawal(uuid, bigint, text, text, text, jsonb) to service_role;
grant execute on function public.lbb_review_withdrawal(uuid, uuid, text, text, text) to service_role;
grant execute on function public.lbb_cancel_withdrawal(uuid, uuid) to service_role;


-- ============================================================
-- supabase/migrations/20260622_withdrawal_indexes_and_legacy_function_hardening.sql
-- ============================================================
create index if not exists payment_withdrawals_reviewed_by_idx
  on public.payment_withdrawals(reviewed_by)
  where reviewed_by is not null;

create index if not exists payment_withdrawals_wallet_transaction_idx
  on public.payment_withdrawals(wallet_transaction_id)
  where wallet_transaction_id is not null;

create index if not exists payment_withdrawals_reversal_transaction_idx
  on public.payment_withdrawals(reversal_transaction_id)
  where reversal_transaction_id is not null;

alter function public.set_updated_at() set search_path = '';
alter function public.truco_player_stats_set_updated_at() set search_path = '';


-- ============================================================
-- supabase/migrations/20260623_general_balance_and_truco_preferences.sql
-- ============================================================
-- Canonical player balance.
-- Legacy bonus/cash columns and wallet kinds remain readable for historical
-- reports, but every new movement is applied to general_balance.

alter table public.lbb_wallets
  add column if not exists general_balance bigint not null default 0;

alter table public.lbb_wallets
  drop constraint if exists lbb_wallets_general_balance_check;

alter table public.lbb_wallets
  add constraint lbb_wallets_general_balance_check
  check (general_balance >= 0);

update public.lbb_wallets
set general_balance =
  coalesce(bonus_points_balance, 0) + coalesce(cash_credits_balance, 0);

alter table public.lbb_wallet_transactions
  drop constraint if exists lbb_wallet_transactions_wallet_kind_check;

alter table public.lbb_wallet_transactions
  add constraint lbb_wallet_transactions_wallet_kind_check
  check (wallet_kind in ('general', 'bonus_points', 'cash_credits'));

alter table public.payment_deposits
  drop constraint if exists payment_deposits_wallet_kind_check;

alter table public.payment_deposits
  add constraint payment_deposits_wallet_kind_check
  check (wallet_kind in ('general', 'bonus_points', 'cash_credits'));

alter table public.payment_deposits
  alter column wallet_kind set default 'general';

alter table public.game_purchases
  drop constraint if exists game_purchases_wallet_kind_check;

alter table public.game_purchases
  add constraint game_purchases_wallet_kind_check
  check (wallet_kind in ('general', 'bonus_points', 'cash_credits'));

alter table public.game_purchases
  alter column wallet_kind set default 'general';

alter table public.payment_withdrawals
  drop constraint if exists payment_withdrawals_wallet_kind_check;

alter table public.payment_withdrawals
  add constraint payment_withdrawals_wallet_kind_check
  check (wallet_kind in ('general', 'cash_credits'));

alter table public.payment_withdrawals
  alter column wallet_kind set default 'general';

create or replace function public.lbb_apply_wallet_transaction(
  p_user_id uuid,
  p_wallet_kind text,
  p_transaction_type text,
  p_amount bigint,
  p_related_type text default null,
  p_related_id text default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current bigint;
  v_next bigint;
  v_existing bigint;
begin
  if p_amount = 0 then
    raise exception 'El movimiento de saldo no puede ser cero';
  end if;

  if p_wallet_kind not in ('general', 'bonus_points', 'cash_credits') then
    raise exception 'Tipo de saldo invalido';
  end if;

  select general_balance
    into v_current
  from public.lbb_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Saldo no encontrado';
  end if;

  if p_related_type is not null and p_related_id is not null then
    select balance_after
      into v_existing
    from public.lbb_wallet_transactions
    where user_id = p_user_id
      and transaction_type = p_transaction_type
      and related_type = p_related_type
      and related_id = p_related_id
    limit 1;

    if found then
      return v_existing;
    end if;
  end if;

  v_next := v_current + p_amount;

  if v_next < 0 then
    raise exception 'Saldo insuficiente';
  end if;

  update public.lbb_wallets
    set general_balance = v_next
  where user_id = p_user_id;

  insert into public.lbb_wallet_transactions (
    user_id,
    wallet_kind,
    transaction_type,
    amount,
    balance_after,
    related_type,
    related_id,
    description,
    metadata
  ) values (
    p_user_id,
    'general',
    p_transaction_type,
    p_amount,
    v_next,
    p_related_type,
    p_related_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object('requestedWalletKind', p_wallet_kind)
  );

  return v_next;
end;
$$;

revoke execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb)
  to service_role;


-- ============================================================
-- supabase/migrations/20260624054500_golden_bear_settings.sql
-- ============================================================
create table if not exists public.golden_bear_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  bonus_buy_enabled boolean not null default true,
  bonus_buy_price numeric not null default 100 check (bonus_buy_price > 0),
  bonus_buy_spins integer not null default 6 check (bonus_buy_spins > 0 and bonus_buy_spins <= 50),
  bonus_buy_label text not null default 'Comprar Bonus',
  bonus_buy_description text not null default 'Activá giros gratis del Oso Dorado por un valor fijo.',
  valid_stakes jsonb not null default '[25,50,100,200,500,1000]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.golden_bear_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.golden_bear_settings enable row level security;

drop policy if exists "Golden Bear settings public read" on public.golden_bear_settings;
create policy "Golden Bear settings public read"
  on public.golden_bear_settings
  for select
  using (true);


-- ============================================================
-- supabase/migrations/20260624_truco_house_fee_and_call_raises.sql
-- ============================================================
-- Truco: escalated stake options and house fee settlement.
-- Run after 20260623_general_balance_and_truco_preferences.sql.

alter table public.truco_rooms
  add column if not exists house_fee_rate numeric(5, 4) not null default 0,
  add column if not exists house_fee_points bigint not null default 0 check (house_fee_points >= 0),
  add column if not exists prize_awarded_points bigint not null default 0 check (prize_awarded_points >= 0);

alter table public.truco_match_history
  add column if not exists gross_prize_pool_points bigint not null default 0 check (gross_prize_pool_points >= 0),
  add column if not exists house_fee_rate numeric(5, 4) not null default 0,
  add column if not exists house_fee_points bigint not null default 0 check (house_fee_points >= 0);

alter table public.truco_rooms drop constraint if exists truco_rooms_entry_fee_options_check;
alter table public.truco_rooms add constraint truco_rooms_entry_fee_options_check
  check (entry_fee_points in (0, 10, 50, 100, 250, 500, 2500));

create index if not exists truco_match_history_house_fee_finished_idx
  on public.truco_match_history(finished_at desc)
  where house_fee_points > 0;

create or replace function public.lbb_truco_house_fee_rate(p_prize_pool_points bigint)
returns numeric
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when coalesce(p_prize_pool_points, 0) <= 0 then 0::numeric
    when p_prize_pool_points <= 200 then 0.1000::numeric
    when p_prize_pool_points <= 1000 then 0.0800::numeric
    when p_prize_pool_points <= 5000 then 0.0600::numeric
    else 0.0500::numeric
  end;
$$;

create or replace function public.lbb_settle_truco_room(
  p_room_id uuid,
  p_winner_role text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
  v_winner_user_id uuid;
  v_loser_user_id uuid;
  v_player_score integer;
  v_opponent_score integer;
  v_final_result text;
  v_house_fee_rate numeric(5, 4);
  v_house_fee_points bigint;
  v_prize_awarded_points bigint;
begin
  if p_winner_role not in ('player', 'opponent') then
    raise exception 'Ganador invalido';
  end if;

  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.settled_at is not null then
    return to_jsonb(v_room);
  end if;

  if v_room.status <> 'finished' then
    raise exception 'La partida todavia no termino';
  end if;

  v_winner_user_id := case when p_winner_role = 'player' then v_room.host_user_id else v_room.guest_user_id end;
  v_loser_user_id := case when p_winner_role = 'player' then v_room.guest_user_id else v_room.host_user_id end;
  v_player_score := coalesce((v_room.state #>> '{scores,player}')::integer, 0);
  v_opponent_score := coalesce((v_room.state #>> '{scores,opponent}')::integer, 0);
  v_final_result := v_room.state ->> 'lastResult';
  v_house_fee_rate := public.lbb_truco_house_fee_rate(v_room.prize_pool_points);
  v_house_fee_points := floor(coalesce(v_room.prize_pool_points, 0) * v_house_fee_rate)::bigint;
  v_prize_awarded_points := greatest(0, coalesce(v_room.prize_pool_points, 0) - v_house_fee_points);

  if v_room.prize_pool_points > 0 then
    if v_winner_user_id is null then
      raise exception 'No se puede pagar un pozo a un invitado';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_winner_user_id,
      'general',
      'truco_prize',
      v_prize_awarded_points,
      'truco_room',
      v_room.id::text,
      format('Premio neto por ganar Truco (%s ARS)', v_prize_awarded_points),
      jsonb_build_object(
        'roomCode', v_room.room_code,
        'grossPrizePool', v_room.prize_pool_points,
        'houseFeePoints', v_house_fee_points,
        'houseFeeRate', v_house_fee_rate
      )
    );
  end if;

  insert into public.truco_match_history (
    room_id,
    room_code,
    player_user_id,
    opponent_user_id,
    winner_user_id,
    loser_user_id,
    target_score,
    player_score,
    opponent_score,
    entry_fee_points,
    prize_points,
    gross_prize_pool_points,
    house_fee_rate,
    house_fee_points,
    ranked,
    metadata
  ) values (
    v_room.id,
    v_room.room_code,
    v_room.host_user_id,
    v_room.guest_user_id,
    v_winner_user_id,
    v_loser_user_id,
    v_room.target_score,
    v_player_score,
    v_opponent_score,
    v_room.entry_fee_points,
    v_prize_awarded_points,
    v_room.prize_pool_points,
    v_house_fee_rate,
    v_house_fee_points,
    v_room.ranked,
    jsonb_build_object(
      'finalResult', v_final_result,
      'abandonedBy', v_room.abandoned_by,
      'grossPrizePool', v_room.prize_pool_points,
      'netPrize', v_prize_awarded_points,
      'houseFeePoints', v_house_fee_points,
      'houseFeeRate', v_house_fee_rate
    )
  )
  on conflict (room_id) where room_id is not null do nothing;

  if v_winner_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_winner_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_won = matches_won + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          ranking_points = ranking_points + case when v_room.ranked then 15 else 0 end,
          bonus_points_won = bonus_points_won + v_prize_awarded_points,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_winner_user_id;
  end if;

  if v_loser_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_loser_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_lost = matches_lost + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          ranking_points = ranking_points + case when v_room.ranked then -10 else 0 end,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_loser_user_id;
  end if;

  update public.truco_rooms
    set house_fee_rate = v_house_fee_rate,
        house_fee_points = v_house_fee_points,
        prize_awarded_points = v_prize_awarded_points,
        settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

revoke execute on function public.lbb_truco_house_fee_rate(bigint) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_room(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_truco_house_fee_rate(bigint) to service_role;
grant execute on function public.lbb_settle_truco_room(uuid, text) to service_role;


-- ============================================================
-- supabase/migrations/20260625_reconcile_general_wallet_balances.sql
-- ============================================================
-- Reconcile canonical general balances after the general_balance migration.
-- The first general_balance migration copied legacy bonus/cash balances, but
-- some production users already had wallet_kind = 'general' movements. For
-- those users, the ledger's latest balance_after is the canonical balance.

with latest_general_transaction as (
  select distinct on (user_id)
    user_id,
    balance_after
  from public.lbb_wallet_transactions
  where wallet_kind = 'general'
  order by user_id, created_at desc, id desc
)
update public.lbb_wallets wallets
set general_balance = latest.balance_after
from latest_general_transaction latest
where wallets.user_id = latest.user_id
  and wallets.general_balance <> latest.balance_after;


-- ============================================================
-- supabase/migrations/20260625_truco_spectator_bets.sql
-- ============================================================
-- Truco spectator bets against the house.
-- Run after 20260624_truco_house_fee_and_call_raises.sql.

alter table public.lbb_wallet_transactions
  drop constraint if exists lbb_wallet_transactions_transaction_type_check;

alter table public.lbb_wallet_transactions
  add constraint lbb_wallet_transactions_transaction_type_check check (transaction_type in (
    'signup_bonus',
    'admin_credit',
    'admin_debit',
    'deposit_pending',
    'deposit_approved',
    'deposit_rejected',
    'truco_entry_fee',
    'truco_prize',
    'truco_side_bet',
    'truco_side_bet_win',
    'bingo_purchase',
    'tournament_entry',
    'game_purchase',
    'refund',
    'game_refund',
    'withdrawal_pending',
    'withdrawal_approved',
    'withdrawal_rejected',
    'adjustment'
  ));

create table if not exists public.truco_side_bets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.truco_rooms(id) on delete cascade,
  room_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  predicted_winner_role text not null check (predicted_winner_role in ('player', 'opponent')),
  amount_points bigint not null check (amount_points > 0),
  potential_payout_points bigint not null check (potential_payout_points > 0),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'cancelled')),
  payout_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists truco_side_bets_room_user_pending_idx
  on public.truco_side_bets(room_id, user_id)
  where status = 'pending';

create index if not exists truco_side_bets_user_created_idx
  on public.truco_side_bets(user_id, created_at desc);

create index if not exists truco_side_bets_room_status_idx
  on public.truco_side_bets(room_id, status);

alter table public.truco_side_bets enable row level security;

drop policy if exists "Users can read their truco side bets" on public.truco_side_bets;
create policy "Users can read their truco side bets"
  on public.truco_side_bets
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.lbb_truco_side_bet_max(p_prize_pool_points bigint)
returns bigint
language sql
immutable
security invoker
set search_path = ''
as $$
  select greatest(0, floor(coalesce(p_prize_pool_points, 0) * 0.25)::bigint);
$$;

create or replace function public.lbb_place_truco_side_bet(
  p_room_id uuid,
  p_user_id uuid,
  p_predicted_winner_role text,
  p_amount_points bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
  v_max_amount bigint;
  v_bet public.truco_side_bets%rowtype;
begin
  if p_predicted_winner_role not in ('player', 'opponent') then
    raise exception 'Jugador elegido invalido';
  end if;

  if p_amount_points <= 0 then
    raise exception 'La apuesta debe ser mayor a cero';
  end if;

  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status <> 'playing' then
    raise exception 'Solo se puede apostar en mesas en juego';
  end if;

  if coalesce(v_room.visibility, 'private') <> 'public' then
    raise exception 'Solo se puede apostar en mesas publicas';
  end if;

  if v_room.host_user_id = p_user_id or v_room.guest_user_id = p_user_id then
    raise exception 'No podes apostar en tu propia mesa';
  end if;

  if coalesce(v_room.state #>> '{phase}', '') <> 'playing' then
    raise exception 'La ventana de apuestas ya cerro';
  end if;

  if coalesce((v_room.state #>> '{scores,player}')::integer, 0) > 0
    or coalesce((v_room.state #>> '{scores,opponent}')::integer, 0) > 0
    or coalesce((v_room.state #>> '{currentTrick}'), '0')::integer > 0
    or jsonb_array_length(coalesce(v_room.state -> 'played', '[]'::jsonb)) > 2 then
    raise exception 'La ventana de apuestas ya cerro';
  end if;

  v_max_amount := public.lbb_truco_side_bet_max(v_room.prize_pool_points);
  if v_max_amount <= 0 then
    raise exception 'Esta mesa no tiene pozo habilitado para apuestas';
  end if;

  if p_amount_points > v_max_amount then
    raise exception 'La apuesta maxima para esta mesa es %', v_max_amount;
  end if;

  perform public.lbb_apply_wallet_transaction(
    p_user_id,
    'general',
    'truco_side_bet',
    -p_amount_points,
    'truco_room',
    v_room.id::text || ':side-bet',
    format('Apuesta lateral en mesa de Truco %s (%s ARS)', v_room.room_code, p_amount_points),
    jsonb_build_object(
      'roomCode', v_room.room_code,
      'predictedWinnerRole', p_predicted_winner_role,
      'maxAmount', v_max_amount
    )
  );

  insert into public.truco_side_bets (
    room_id,
    room_code,
    user_id,
    predicted_winner_role,
    amount_points,
    potential_payout_points,
    metadata
  ) values (
    v_room.id,
    v_room.room_code,
    p_user_id,
    p_predicted_winner_role,
    p_amount_points,
    p_amount_points * 2,
    jsonb_build_object(
      'houseSide', case when p_predicted_winner_role = 'player' then 'opponent' else 'player' end,
      'maxAmount', v_max_amount
    )
  )
  returning * into v_bet;

  return to_jsonb(v_bet);
end;
$$;

create or replace function public.lbb_settle_truco_side_bets(
  p_room_id uuid,
  p_winner_role text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_bet public.truco_side_bets%rowtype;
  v_count integer := 0;
  v_next_balance bigint;
  v_transaction_id uuid;
begin
  if p_winner_role not in ('player', 'opponent') then
    raise exception 'Ganador invalido';
  end if;

  for v_bet in
    select *
    from public.truco_side_bets
    where room_id = p_room_id
      and status = 'pending'
    for update
  loop
    if v_bet.predicted_winner_role = p_winner_role then
      v_next_balance := public.lbb_apply_wallet_transaction(
        v_bet.user_id,
        'general',
        'truco_side_bet_win',
        v_bet.potential_payout_points,
        'truco_side_bet',
        v_bet.id::text,
        format('Acierto de apuesta lateral en mesa de Truco %s (%s ARS)', v_bet.room_code, v_bet.potential_payout_points),
        jsonb_build_object(
          'roomCode', v_bet.room_code,
          'stake', v_bet.amount_points,
          'predictedWinnerRole', v_bet.predicted_winner_role
        )
      );

      select id
        into v_transaction_id
      from public.lbb_wallet_transactions
      where user_id = v_bet.user_id
        and transaction_type = 'truco_side_bet_win'
        and related_type = 'truco_side_bet'
        and related_id = v_bet.id::text
      order by created_at desc
      limit 1;

      update public.truco_side_bets
        set status = 'won',
            payout_transaction_id = v_transaction_id,
            settled_at = now(),
            metadata = metadata || jsonb_build_object('winnerRole', p_winner_role, 'balanceAfter', v_next_balance)
      where id = v_bet.id;
    else
      update public.truco_side_bets
        set status = 'lost',
            settled_at = now(),
            metadata = metadata || jsonb_build_object('winnerRole', p_winner_role, 'houseKept', amount_points)
      where id = v_bet.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.lbb_truco_side_bet_max(bigint) from public, anon, authenticated;
revoke execute on function public.lbb_place_truco_side_bet(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_side_bets(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_truco_side_bet_max(bigint) to service_role;
grant execute on function public.lbb_place_truco_side_bet(uuid, uuid, text, bigint) to service_role;
grant execute on function public.lbb_settle_truco_side_bets(uuid, text) to service_role;


-- ============================================================
-- supabase/migrations/20260626_golden_bear_wallet_rounds.sql
-- ============================================================
-- Server-authoritative Golden Bear rounds settled against the canonical account balance.

alter table public.lbb_wallet_transactions
  drop constraint if exists lbb_wallet_transactions_transaction_type_check;

alter table public.lbb_wallet_transactions
  add constraint lbb_wallet_transactions_transaction_type_check check (transaction_type in (
    'signup_bonus',
    'admin_credit',
    'admin_debit',
    'deposit_pending',
    'deposit_approved',
    'deposit_rejected',
    'truco_entry_fee',
    'truco_prize',
    'truco_side_bet',
    'truco_side_bet_win',
    'bingo_purchase',
    'tournament_entry',
    'game_purchase',
    'refund',
    'game_refund',
    'withdrawal_pending',
    'withdrawal_approved',
    'withdrawal_rejected',
    'adjustment',
    'golden_bear_bet',
    'golden_bear_win'
  ));

create table if not exists public.golden_bear_rounds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stake bigint not null check (stake in (25, 50, 100, 200, 500, 1000)),
  payout bigint not null check (payout >= 0),
  balance_before bigint not null check (balance_before >= 0),
  balance_after bigint not null check (balance_after >= 0),
  seed bigint not null,
  outcome jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists golden_bear_rounds_user_created_idx
  on public.golden_bear_rounds(user_id, created_at desc);

alter table public.golden_bear_rounds enable row level security;
revoke all on table public.golden_bear_rounds from public, anon, authenticated;
grant select, insert on table public.golden_bear_rounds to service_role;

create or replace function public.lbb_settle_golden_bear_round(
  p_round_id uuid,
  p_user_id uuid,
  p_stake bigint,
  p_payout bigint,
  p_seed bigint,
  p_outcome jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.golden_bear_rounds%rowtype;
  v_before bigint;
  v_after_bet bigint;
  v_after bigint;
begin
  if p_stake not in (25, 50, 100, 200, 500, 1000) then
    raise exception 'Apuesta invalida';
  end if;

  if p_payout < 0 or p_payout > p_stake * 10000 then
    raise exception 'Premio invalido';
  end if;

  select * into v_existing
  from public.golden_bear_rounds
  where id = p_round_id;

  if found then
    if v_existing.user_id <> p_user_id then
      raise exception 'Ronda invalida';
    end if;
    return jsonb_build_object(
      'roundId', v_existing.id,
      'balanceBefore', v_existing.balance_before,
      'balanceAfter', v_existing.balance_after,
      'stake', v_existing.stake,
      'payout', v_existing.payout,
      'outcome', v_existing.outcome
    );
  end if;

  select general_balance into v_before
  from public.lbb_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Saldo no encontrado';
  end if;
  if v_before < p_stake then
    raise exception 'Saldo insuficiente';
  end if;

  select * into v_existing
  from public.golden_bear_rounds
  where id = p_round_id;
  if found then
    if v_existing.user_id <> p_user_id then
      raise exception 'Ronda invalida';
    end if;
    return jsonb_build_object(
      'roundId', v_existing.id,
      'balanceBefore', v_existing.balance_before,
      'balanceAfter', v_existing.balance_after,
      'stake', v_existing.stake,
      'payout', v_existing.payout,
      'outcome', v_existing.outcome
    );
  end if;

  v_after_bet := v_before - p_stake;
  v_after := v_after_bet + p_payout;

  update public.lbb_wallets
  set general_balance = v_after
  where user_id = p_user_id;

  insert into public.golden_bear_rounds (
    id, user_id, stake, payout, balance_before, balance_after, seed, outcome
  ) values (
    p_round_id, p_user_id, p_stake, p_payout, v_before, v_after, p_seed, p_outcome
  );

  insert into public.lbb_wallet_transactions (
    user_id, wallet_kind, transaction_type, amount, balance_after,
    related_type, related_id, description, metadata
  ) values (
    p_user_id, 'general', 'golden_bear_bet', -p_stake, v_after_bet,
    'golden_bear_round', p_round_id::text, format('Apuesta Golden Bear (%s ARS)', p_stake),
    jsonb_build_object('seed', p_seed)
  );

  if p_payout > 0 then
    insert into public.lbb_wallet_transactions (
      user_id, wallet_kind, transaction_type, amount, balance_after,
      related_type, related_id, description, metadata
    ) values (
      p_user_id, 'general', 'golden_bear_win', p_payout, v_after,
      'golden_bear_round', p_round_id::text, format('Premio Golden Bear (%s ARS)', p_payout),
      jsonb_build_object('stake', p_stake, 'seed', p_seed)
    );
  end if;

  return jsonb_build_object(
    'roundId', p_round_id,
    'balanceBefore', v_before,
    'balanceAfter', v_after,
    'stake', p_stake,
    'payout', p_payout,
    'outcome', p_outcome
  );
end;
$$;

revoke execute on function public.lbb_settle_golden_bear_round(uuid, uuid, bigint, bigint, bigint, jsonb)
  from public, anon, authenticated;
grant execute on function public.lbb_settle_golden_bear_round(uuid, uuid, bigint, bigint, bigint, jsonb)
  to service_role;


-- ============================================================
-- supabase/migrations/20260627_platform_games_registry.sql
-- ============================================================
create table if not exists public.platform_games (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('sorteos', 'cartas', 'slots', 'arcade', 'roadmap')),
  release_stage text not null default 'preview' check (release_stage in ('live', 'preview', 'roadmap', 'disabled')),
  wallet_mode text not null default 'general_balance' check (wallet_mode in ('general_balance', 'progress_only', 'none')),
  play_href text not null,
  admin_href text,
  status_label text not null,
  sort_order integer not null default 100,
  featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_games enable row level security;

drop policy if exists "Platform games public read" on public.platform_games;
create policy "Platform games public read"
  on public.platform_games
  for select
  using (release_stage <> 'disabled');

insert into public.platform_games (id, slug, name, category, release_stage, wallet_mode, play_href, admin_href, status_label, sort_order, featured, metadata)
values
  ('bingo', 'bingo', 'Bingo LBB', 'sorteos', 'live', 'general_balance', '/participar', '/admin', 'Disponible', 10, true, '{"cta":"Comprar cartón"}'::jsonb),
  ('truco', 'truco', 'Truco', 'cartas', 'live', 'general_balance', '/truco', '/admin/games', 'Mesas activas', 20, true, '{"cta":"Ver mesas"}'::jsonb),
  ('golden_bear', 'golden-bear', 'Golden Bear', 'slots', 'preview', 'general_balance', '/juegos/golden-bear', '/admin/games/golden-bear', 'LBB Original', 30, true, '{"cta":"Entrar al slot","engine":"server_authoritative"}'::jsonb),
  ('viborita', 'viborita', 'Viborita LBB', 'arcade', 'preview', 'progress_only', '/juegos/viborita', '/admin/games', 'Nuevo', 40, false, '{"cta":"Jugar"}'::jsonb),
  ('future_games', 'proximos-juegos', 'Próximos juegos', 'roadmap', 'roadmap', 'none', '/juegos', '/admin/games', 'En preparación', 50, false, '{"cta":"Ver plataforma"}'::jsonb)
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name,
    category = excluded.category,
    release_stage = excluded.release_stage,
    wallet_mode = excluded.wallet_mode,
    play_href = excluded.play_href,
    admin_href = excluded.admin_href,
    status_label = excluded.status_label,
    sort_order = excluded.sort_order,
    featured = excluded.featured,
    metadata = excluded.metadata,
    updated_at = now();

