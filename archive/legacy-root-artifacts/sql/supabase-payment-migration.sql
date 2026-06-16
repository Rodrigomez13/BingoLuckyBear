alter table public.bingo_cards
  add column if not exists payment_method text,
  add column if not exists payment_reference text;

create index if not exists bingo_cards_payment_reference_idx
  on public.bingo_cards (payment_reference);
