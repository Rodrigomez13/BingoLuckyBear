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
