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
