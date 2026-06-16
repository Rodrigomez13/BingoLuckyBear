-- Applied to project ttoaqjqysdjijwnhopxi.
-- Purpose:
-- 1) prevent public direct access to sensitive participant/card data,
-- 2) add indexes used by the approved-payment flow,
-- 3) prepare a safe customer profile table for future user login.

drop policy if exists "Anyone can read cards" on public.bingo_cards;
drop policy if exists "Anyone can insert cards" on public.bingo_cards;
drop policy if exists "Public can read cards for public raffle results" on public.bingo_cards;
drop policy if exists "Admins can update cards" on public.bingo_cards;
drop policy if exists "Admins can delete cards" on public.bingo_cards;
drop policy if exists "Admins can insert raffles" on public.raffles;

create index if not exists bingo_cards_raffle_payment_status_idx
  on public.bingo_cards (raffle_id, payment_status);

create index if not exists bingo_cards_session_raffle_idx
  on public.bingo_cards (session_token, raffle_id);

create index if not exists bingo_cards_payment_reviewed_by_idx
  on public.bingo_cards (payment_reviewed_by);

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  dni text,
  address text,
  phone text,
  email text,
  payout_account_kind text check (payout_account_kind is null or payout_account_kind in ('Alias', 'CBU', 'CVU')),
  payout_account text,
  payout_holder_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.customer_profiles enable row level security;

drop policy if exists "Users can read own customer profile" on public.customer_profiles;
drop policy if exists "Users can insert own customer profile" on public.customer_profiles;
drop policy if exists "Users can update own customer profile" on public.customer_profiles;

create policy "Users can read own customer profile"
  on public.customer_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own customer profile"
  on public.customer_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own customer profile"
  on public.customer_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
