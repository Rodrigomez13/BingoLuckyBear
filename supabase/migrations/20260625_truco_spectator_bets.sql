-- Truco spectator bets against the house.
-- Run after 20260624_truco_house_fee_and_call_raises.sql.

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
    'adjustment'
  ));

create table if not exists public.truco_side_bets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.truco_rooms(id) on delete cascade,
  room_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  predicted_winner_role text not null check (predicted_winner_role in ('player', 'opponent')),
  amount_points bigint not null check (amount_points > 0),
  potential_payout_points bigint not null check (potential_payout_points > 0),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'cancelled')),
  payout_transaction_id uuid references public.lbb_wallet_transactions(id) on delete set null,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists truco_side_bets_room_user_pending_idx
  on public.truco_side_bets(room_id, user_id)
  where status = 'pending';

create index if not exists truco_side_bets_user_created_idx
  on public.truco_side_bets(user_id, created_at desc);

create index if not exists truco_side_bets_room_status_idx
  on public.truco_side_bets(room_id, status);

alter table public.truco_side_bets enable row level security;

drop policy if exists "Users can read their truco side bets" on public.truco_side_bets;
create policy "Users can read their truco side bets"
  on public.truco_side_bets
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.lbb_truco_side_bet_max(p_prize_pool_points bigint)
returns bigint
language sql
immutable
security invoker
set search_path = ''
as $$
  select greatest(0, floor(coalesce(p_prize_pool_points, 0) * 0.25)::bigint);
$$;

create or replace function public.lbb_place_truco_side_bet(
  p_room_id uuid,
  p_user_id uuid,
  p_predicted_winner_role text,
  p_amount_points bigint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
  v_max_amount bigint;
  v_bet public.truco_side_bets%rowtype;
begin
  if p_predicted_winner_role not in ('player', 'opponent') then
    raise exception 'Jugador elegido invalido';
  end if;

  if p_amount_points <= 0 then
    raise exception 'La apuesta debe ser mayor a cero';
  end if;

  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status <> 'playing' then
    raise exception 'Solo se puede apostar en mesas en juego';
  end if;

  if coalesce(v_room.visibility, 'private') <> 'public' then
    raise exception 'Solo se puede apostar en mesas publicas';
  end if;

  if v_room.host_user_id = p_user_id or v_room.guest_user_id = p_user_id then
    raise exception 'No podes apostar en tu propia mesa';
  end if;

  if coalesce(v_room.state #>> '{phase}', '') <> 'playing' then
    raise exception 'La ventana de apuestas ya cerro';
  end if;

  if coalesce((v_room.state #>> '{scores,player}')::integer, 0) > 0
    or coalesce((v_room.state #>> '{scores,opponent}')::integer, 0) > 0
    or coalesce((v_room.state #>> '{currentTrick}'), '0')::integer > 0
    or jsonb_array_length(coalesce(v_room.state -> 'played', '[]'::jsonb)) > 2 then
    raise exception 'La ventana de apuestas ya cerro';
  end if;

  v_max_amount := public.lbb_truco_side_bet_max(v_room.prize_pool_points);
  if v_max_amount <= 0 then
    raise exception 'Esta mesa no tiene pozo habilitado para apuestas';
  end if;

  if p_amount_points > v_max_amount then
    raise exception 'La apuesta maxima para esta mesa es %', v_max_amount;
  end if;

  perform public.lbb_apply_wallet_transaction(
    p_user_id,
    'general',
    'truco_side_bet',
    -p_amount_points,
    'truco_room',
    v_room.id::text || ':side-bet',
    format('Apuesta lateral en mesa de Truco %s (%s ARS)', v_room.room_code, p_amount_points),
    jsonb_build_object(
      'roomCode', v_room.room_code,
      'predictedWinnerRole', p_predicted_winner_role,
      'maxAmount', v_max_amount
    )
  );

  insert into public.truco_side_bets (
    room_id,
    room_code,
    user_id,
    predicted_winner_role,
    amount_points,
    potential_payout_points,
    metadata
  ) values (
    v_room.id,
    v_room.room_code,
    p_user_id,
    p_predicted_winner_role,
    p_amount_points,
    p_amount_points * 2,
    jsonb_build_object(
      'houseSide', case when p_predicted_winner_role = 'player' then 'opponent' else 'player' end,
      'maxAmount', v_max_amount
    )
  )
  returning * into v_bet;

  return to_jsonb(v_bet);
end;
$$;

create or replace function public.lbb_settle_truco_side_bets(
  p_room_id uuid,
  p_winner_role text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_bet public.truco_side_bets%rowtype;
  v_count integer := 0;
  v_next_balance bigint;
  v_transaction_id uuid;
begin
  if p_winner_role not in ('player', 'opponent') then
    raise exception 'Ganador invalido';
  end if;

  for v_bet in
    select *
    from public.truco_side_bets
    where room_id = p_room_id
      and status = 'pending'
    for update
  loop
    if v_bet.predicted_winner_role = p_winner_role then
      v_next_balance := public.lbb_apply_wallet_transaction(
        v_bet.user_id,
        'general',
        'truco_side_bet_win',
        v_bet.potential_payout_points,
        'truco_side_bet',
        v_bet.id::text,
        format('Acierto de apuesta lateral en mesa de Truco %s (%s ARS)', v_bet.room_code, v_bet.potential_payout_points),
        jsonb_build_object(
          'roomCode', v_bet.room_code,
          'stake', v_bet.amount_points,
          'predictedWinnerRole', v_bet.predicted_winner_role
        )
      );

      select id
        into v_transaction_id
      from public.lbb_wallet_transactions
      where user_id = v_bet.user_id
        and transaction_type = 'truco_side_bet_win'
        and related_type = 'truco_side_bet'
        and related_id = v_bet.id::text
      order by created_at desc
      limit 1;

      update public.truco_side_bets
        set status = 'won',
            payout_transaction_id = v_transaction_id,
            settled_at = now(),
            metadata = metadata || jsonb_build_object('winnerRole', p_winner_role, 'balanceAfter', v_next_balance)
      where id = v_bet.id;
    else
      update public.truco_side_bets
        set status = 'lost',
            settled_at = now(),
            metadata = metadata || jsonb_build_object('winnerRole', p_winner_role, 'houseKept', amount_points)
      where id = v_bet.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke execute on function public.lbb_truco_side_bet_max(bigint) from public, anon, authenticated;
revoke execute on function public.lbb_place_truco_side_bet(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_side_bets(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_truco_side_bet_max(bigint) to service_role;
grant execute on function public.lbb_place_truco_side_bet(uuid, uuid, text, bigint) to service_role;
grant execute on function public.lbb_settle_truco_side_bets(uuid, text) to service_role;
