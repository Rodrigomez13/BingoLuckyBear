-- Server-authoritative Golden Bear rounds settled against the canonical account balance.

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
    'truco_side_bet',
    'truco_side_bet_win',
    'bingo_purchase',
    'tournament_entry',
    'game_purchase',
    'refund',
    'game_refund',
    'withdrawal_pending',
    'withdrawal_approved',
    'withdrawal_rejected',
    'adjustment',
    'golden_bear_bet',
    'golden_bear_win'
  ));

create table if not exists public.golden_bear_rounds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stake bigint not null check (stake in (25, 50, 100, 200, 500, 1000)),
  payout bigint not null check (payout >= 0),
  balance_before bigint not null check (balance_before >= 0),
  balance_after bigint not null check (balance_after >= 0),
  seed bigint not null,
  outcome jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists golden_bear_rounds_user_created_idx
  on public.golden_bear_rounds(user_id, created_at desc);

alter table public.golden_bear_rounds enable row level security;
revoke all on table public.golden_bear_rounds from public, anon, authenticated;
grant select, insert on table public.golden_bear_rounds to service_role;

create or replace function public.lbb_settle_golden_bear_round(
  p_round_id uuid,
  p_user_id uuid,
  p_stake bigint,
  p_payout bigint,
  p_seed bigint,
  p_outcome jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.golden_bear_rounds%rowtype;
  v_before bigint;
  v_after_bet bigint;
  v_after bigint;
begin
  if p_stake not in (25, 50, 100, 200, 500, 1000) then
    raise exception 'Apuesta invalida';
  end if;

  if p_payout < 0 or p_payout > p_stake * 10000 then
    raise exception 'Premio invalido';
  end if;

  select * into v_existing
  from public.golden_bear_rounds
  where id = p_round_id;

  if found then
    if v_existing.user_id <> p_user_id then
      raise exception 'Ronda invalida';
    end if;
    return jsonb_build_object(
      'roundId', v_existing.id,
      'balanceBefore', v_existing.balance_before,
      'balanceAfter', v_existing.balance_after,
      'stake', v_existing.stake,
      'payout', v_existing.payout,
      'outcome', v_existing.outcome
    );
  end if;

  select general_balance into v_before
  from public.lbb_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Saldo no encontrado';
  end if;
  if v_before < p_stake then
    raise exception 'Saldo insuficiente';
  end if;

  select * into v_existing
  from public.golden_bear_rounds
  where id = p_round_id;
  if found then
    if v_existing.user_id <> p_user_id then
      raise exception 'Ronda invalida';
    end if;
    return jsonb_build_object(
      'roundId', v_existing.id,
      'balanceBefore', v_existing.balance_before,
      'balanceAfter', v_existing.balance_after,
      'stake', v_existing.stake,
      'payout', v_existing.payout,
      'outcome', v_existing.outcome
    );
  end if;

  v_after_bet := v_before - p_stake;
  v_after := v_after_bet + p_payout;

  update public.lbb_wallets
  set general_balance = v_after
  where user_id = p_user_id;

  insert into public.golden_bear_rounds (
    id, user_id, stake, payout, balance_before, balance_after, seed, outcome
  ) values (
    p_round_id, p_user_id, p_stake, p_payout, v_before, v_after, p_seed, p_outcome
  );

  insert into public.lbb_wallet_transactions (
    user_id, wallet_kind, transaction_type, amount, balance_after,
    related_type, related_id, description, metadata
  ) values (
    p_user_id, 'general', 'golden_bear_bet', -p_stake, v_after_bet,
    'golden_bear_round', p_round_id::text, format('Apuesta Golden Bear (%s ARS)', p_stake),
    jsonb_build_object('seed', p_seed)
  );

  if p_payout > 0 then
    insert into public.lbb_wallet_transactions (
      user_id, wallet_kind, transaction_type, amount, balance_after,
      related_type, related_id, description, metadata
    ) values (
      p_user_id, 'general', 'golden_bear_win', p_payout, v_after,
      'golden_bear_round', p_round_id::text, format('Premio Golden Bear (%s ARS)', p_payout),
      jsonb_build_object('stake', p_stake, 'seed', p_seed)
    );
  end if;

  return jsonb_build_object(
    'roundId', p_round_id,
    'balanceBefore', v_before,
    'balanceAfter', v_after,
    'stake', p_stake,
    'payout', p_payout,
    'outcome', p_outcome
  );
end;
$$;

revoke execute on function public.lbb_settle_golden_bear_round(uuid, uuid, bigint, bigint, bigint, jsonb)
  from public, anon, authenticated;
grant execute on function public.lbb_settle_golden_bear_round(uuid, uuid, bigint, bigint, bigint, jsonb)
  to service_role;
