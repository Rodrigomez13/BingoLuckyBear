alter table public.bingo_cards
  add column if not exists payout_account_kind text,
  add column if not exists payout_account text,
  add column if not exists payout_holder_name text;

create index if not exists bingo_cards_payout_account_idx
  on public.bingo_cards (payout_account);

create table if not exists public.winner_notifications (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  card_id uuid not null references public.bingo_cards(id) on delete cascade,
  prize_number integer not null,
  row_index integer not null,
  amount text,
  phone text not null,
  status text not null default 'pending',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (raffle_id, card_id, prize_number)
);

alter table public.winner_notifications
  drop constraint if exists winner_notifications_status_check;

alter table public.winner_notifications
  add constraint winner_notifications_status_check
  check (status in ('pending', 'sent', 'failed'));

alter table public.winner_notifications
  drop constraint if exists winner_notifications_prize_number_check;

alter table public.winner_notifications
  add constraint winner_notifications_prize_number_check
  check (prize_number in (1, 2, 3));

create index if not exists winner_notifications_raffle_idx
  on public.winner_notifications (raffle_id);
