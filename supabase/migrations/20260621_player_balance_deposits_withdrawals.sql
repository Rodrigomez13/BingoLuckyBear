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
