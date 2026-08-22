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
