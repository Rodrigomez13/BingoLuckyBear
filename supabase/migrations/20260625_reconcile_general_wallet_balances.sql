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
