alter table public.bingo_cards
  add column if not exists payment_status text not null default 'pending',
  add column if not exists receipt_amount numeric,
  add column if not exists receipt_operation_number text,
  add column if not exists receipt_destination_account text,
  add column if not exists receipt_date timestamptz,
  add column if not exists receipt_raw_text text,
  add column if not exists receipt_parse_status text not null default 'not_parsed',
  add column if not exists receipt_parse_error text,
  add column if not exists receipt_validation_notes text,
  add column if not exists receipt_parsed_at timestamptz,
  add column if not exists payment_reviewed_at timestamptz,
  add column if not exists payment_reviewed_by uuid references auth.users(id) on delete set null;

alter table public.bingo_cards
  drop constraint if exists bingo_cards_payment_status_check;

alter table public.bingo_cards
  add constraint bingo_cards_payment_status_check
  check (payment_status in ('pending', 'approved', 'rejected'));

alter table public.bingo_cards
  drop constraint if exists bingo_cards_receipt_parse_status_check;

alter table public.bingo_cards
  add constraint bingo_cards_receipt_parse_status_check
  check (receipt_parse_status in ('not_parsed', 'parsed', 'failed', 'not_configured'));

create index if not exists bingo_cards_payment_status_idx
  on public.bingo_cards (payment_status);

create index if not exists bingo_cards_receipt_operation_number_idx
  on public.bingo_cards (receipt_operation_number);

