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
