-- Guest identities, atomic wallet movements and Truco stake lifecycle.
-- The amount shown in the lobby is the total pot; entry_fee_points is each
-- player's half.

alter table public.truco_rooms
  add column if not exists host_name text not null default 'Jugador',
  add column if not exists host_avatar_key text not null default 'golden_bear',
  add column if not exists guest_name text,
  add column if not exists guest_avatar_key text,
  add column if not exists abandoned_by text,
  add column if not exists refunded_at timestamptz;

alter table public.truco_rooms drop constraint if exists truco_rooms_host_name_check;
alter table public.truco_rooms add constraint truco_rooms_host_name_check
  check (char_length(btrim(host_name)) between 3 and 24);

alter table public.truco_rooms drop constraint if exists truco_rooms_guest_name_check;
alter table public.truco_rooms add constraint truco_rooms_guest_name_check
  check (guest_name is null or char_length(btrim(guest_name)) between 3 and 24);

alter table public.truco_rooms drop constraint if exists truco_rooms_host_avatar_check;
alter table public.truco_rooms add constraint truco_rooms_host_avatar_check
  check (host_avatar_key in ('golden_bear', 'lucky_clover', 'bingo_ball', 'gold_coin', 'card_star', 'crown_bear'));

alter table public.truco_rooms drop constraint if exists truco_rooms_guest_avatar_check;
alter table public.truco_rooms add constraint truco_rooms_guest_avatar_check
  check (guest_avatar_key is null or guest_avatar_key in ('golden_bear', 'lucky_clover', 'bingo_ball', 'gold_coin', 'card_star', 'crown_bear'));

alter table public.truco_rooms drop constraint if exists truco_rooms_abandoned_by_check;
alter table public.truco_rooms add constraint truco_rooms_abandoned_by_check
  check (abandoned_by is null or abandoned_by in ('player', 'opponent'));

alter table public.truco_rooms drop constraint if exists truco_rooms_entry_fee_options_check;
alter table public.truco_rooms add constraint truco_rooms_entry_fee_options_check
  check (entry_fee_points in (0, 10, 50, 100));

create unique index if not exists lbb_wallet_transactions_once_per_reference_idx
  on public.lbb_wallet_transactions(user_id, transaction_type, related_type, related_id)
  where related_type is not null
    and related_id is not null
    and transaction_type in (
      'deposit_approved',
      'truco_entry_fee',
      'truco_prize',
      'bingo_purchase',
      'refund'
    );

create unique index if not exists truco_match_history_room_unique_idx
  on public.truco_match_history(room_id)
  where room_id is not null;

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
  v_bonus bigint;
  v_cash bigint;
  v_current bigint;
  v_next bigint;
  v_existing bigint;
begin
  if p_amount = 0 then
    raise exception 'El movimiento de wallet no puede ser cero';
  end if;

  if p_wallet_kind not in ('bonus_points', 'cash_credits') then
    raise exception 'Tipo de wallet invalido';
  end if;

  select bonus_points_balance, cash_credits_balance
    into v_bonus, v_cash
  from public.lbb_wallets
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Wallet no encontrada';
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

  v_current := case when p_wallet_kind = 'bonus_points' then v_bonus else v_cash end;
  v_next := v_current + p_amount;

  if v_next < 0 then
    raise exception 'Saldo insuficiente';
  end if;

  if p_wallet_kind = 'bonus_points' then
    update public.lbb_wallets
      set bonus_points_balance = v_next
    where user_id = p_user_id;
  else
    update public.lbb_wallets
      set cash_credits_balance = v_next
    where user_id = p_user_id;
  end if;

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
    p_wallet_kind,
    p_transaction_type,
    p_amount,
    v_next,
    p_related_type,
    p_related_id,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_next;
end;
$$;

create or replace function public.lbb_create_truco_room(
  p_room_code text,
  p_target_score integer,
  p_visibility text,
  p_state jsonb,
  p_host_secret text,
  p_host_user_id uuid,
  p_host_name text,
  p_host_avatar_key text,
  p_entry_fee_points bigint,
  p_ranked boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  if p_target_score not in (15, 30) then
    raise exception 'Puntaje objetivo invalido';
  end if;

  if p_visibility not in ('private', 'public') then
    raise exception 'Visibilidad invalida';
  end if;

  if p_entry_fee_points not in (0, 10, 50, 100) then
    raise exception 'Apuesta invalida';
  end if;

  if p_entry_fee_points > 0 and p_host_user_id is null then
    raise exception 'Las mesas con pozo requieren una cuenta';
  end if;

  insert into public.truco_rooms (
    room_code,
    target_score,
    status,
    visibility,
    state,
    host_secret,
    host_user_id,
    host_name,
    host_avatar_key,
    entry_fee_points,
    prize_pool_points,
    ranked,
    host_connected_at
  ) values (
    p_room_code,
    p_target_score,
    'waiting',
    p_visibility,
    p_state,
    p_host_secret,
    p_host_user_id,
    btrim(p_host_name),
    p_host_avatar_key,
    p_entry_fee_points,
    0,
    p_ranked,
    now()
  )
  returning * into v_room;

  if p_entry_fee_points > 0 then
    perform public.lbb_apply_wallet_transaction(
      p_host_user_id,
      'bonus_points',
      'truco_entry_fee',
      -p_entry_fee_points,
      'truco_room',
      v_room.id::text,
      format('Reserva para mesa de Truco (%s LBB)', p_entry_fee_points),
      jsonb_build_object('role', 'host', 'roomCode', p_room_code)
    );

    update public.truco_rooms
      set prize_pool_points = p_entry_fee_points
    where id = v_room.id
    returning * into v_room;
  end if;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_join_truco_room(
  p_room_id uuid,
  p_guest_user_id uuid,
  p_guest_secret text,
  p_guest_name text,
  p_guest_avatar_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status <> 'waiting' or v_room.guest_secret is not null then
    raise exception 'La mesa ya no esta disponible';
  end if;

  if v_room.host_user_id is not null and v_room.host_user_id = p_guest_user_id then
    raise exception 'No podes entrar como rival a tu propia mesa';
  end if;

  if v_room.entry_fee_points > 0 and p_guest_user_id is null then
    raise exception 'Las mesas con pozo requieren una cuenta';
  end if;

  if v_room.entry_fee_points > 0 then
    perform public.lbb_apply_wallet_transaction(
      p_guest_user_id,
      'bonus_points',
      'truco_entry_fee',
      -v_room.entry_fee_points,
      'truco_room',
      v_room.id::text,
      format('Entrada a mesa de Truco (%s LBB)', v_room.entry_fee_points),
      jsonb_build_object('role', 'guest', 'roomCode', v_room.room_code)
    );
  end if;

  update public.truco_rooms
    set guest_secret = p_guest_secret,
        guest_user_id = p_guest_user_id,
        guest_name = btrim(p_guest_name),
        guest_avatar_key = p_guest_avatar_key,
        guest_connected_at = now(),
        status = 'playing',
        prize_pool_points = v_room.entry_fee_points * 2
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_cancel_waiting_truco_room(
  p_room_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
begin
  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.status = 'abandoned' then
    return to_jsonb(v_room);
  end if;

  if v_room.status <> 'waiting' or v_room.guest_secret is not null then
    raise exception 'La mesa ya tiene rival y no puede cancelarse';
  end if;

  if v_room.prize_pool_points > 0 then
    if v_room.host_user_id is null then
      raise exception 'No se puede reintegrar una mesa sin usuario';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_room.host_user_id,
      'bonus_points',
      'refund',
      v_room.prize_pool_points,
      'truco_room',
      v_room.id::text,
      format('Reintegro de mesa de Truco (%s LBB)', v_room.prize_pool_points),
      jsonb_build_object('reason', 'cancelled_without_opponent', 'roomCode', v_room.room_code)
    );
  end if;

  update public.truco_rooms
    set status = 'abandoned',
        abandoned_by = 'player',
        prize_pool_points = 0,
        refunded_at = case when v_room.prize_pool_points > 0 then now() else refunded_at end,
        settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

create or replace function public.lbb_settle_truco_room(
  p_room_id uuid,
  p_winner_role text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.truco_rooms%rowtype;
  v_winner_user_id uuid;
  v_loser_user_id uuid;
  v_player_score integer;
  v_opponent_score integer;
  v_final_result text;
begin
  if p_winner_role not in ('player', 'opponent') then
    raise exception 'Ganador invalido';
  end if;

  select *
    into v_room
  from public.truco_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Mesa no encontrada';
  end if;

  if v_room.settled_at is not null then
    return to_jsonb(v_room);
  end if;

  if v_room.status <> 'finished' then
    raise exception 'La partida todavia no termino';
  end if;

  v_winner_user_id := case when p_winner_role = 'player' then v_room.host_user_id else v_room.guest_user_id end;
  v_loser_user_id := case when p_winner_role = 'player' then v_room.guest_user_id else v_room.host_user_id end;
  v_player_score := coalesce((v_room.state #>> '{scores,player}')::integer, 0);
  v_opponent_score := coalesce((v_room.state #>> '{scores,opponent}')::integer, 0);
  v_final_result := v_room.state ->> 'lastResult';

  if v_room.prize_pool_points > 0 then
    if v_winner_user_id is null then
      raise exception 'No se puede pagar un pozo a un invitado';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_winner_user_id,
      'bonus_points',
      'truco_prize',
      v_room.prize_pool_points,
      'truco_room',
      v_room.id::text,
      format('Premio por ganar Truco (%s LBB)', v_room.prize_pool_points),
      jsonb_build_object('roomCode', v_room.room_code)
    );
  end if;

  insert into public.truco_match_history (
    room_id,
    room_code,
    player_user_id,
    opponent_user_id,
    winner_user_id,
    loser_user_id,
    target_score,
    player_score,
    opponent_score,
    entry_fee_points,
    prize_points,
    ranked,
    metadata
  ) values (
    v_room.id,
    v_room.room_code,
    v_room.host_user_id,
    v_room.guest_user_id,
    v_winner_user_id,
    v_loser_user_id,
    v_room.target_score,
    v_player_score,
    v_opponent_score,
    v_room.entry_fee_points,
    v_room.prize_pool_points,
    v_room.ranked,
    jsonb_build_object('finalResult', v_final_result, 'abandonedBy', v_room.abandoned_by)
  )
  on conflict (room_id) where room_id is not null do nothing;

  if v_winner_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_winner_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_won = matches_won + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          ranking_points = ranking_points + case when v_room.ranked then 15 else 0 end,
          bonus_points_won = bonus_points_won + v_room.prize_pool_points,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_winner_user_id;
  end if;

  if v_loser_user_id is not null then
    insert into public.truco_player_stats(user_id)
      values (v_loser_user_id)
      on conflict (user_id) do nothing;

    update public.truco_player_stats
      set matches_played = matches_played + 1,
          matches_lost = matches_lost + 1,
          points_for = points_for + case when p_winner_role = 'player' then v_opponent_score else v_player_score end,
          points_against = points_against + case when p_winner_role = 'player' then v_player_score else v_opponent_score end,
          ranking_points = ranking_points + case when v_room.ranked then -10 else 0 end,
          bonus_points_spent = bonus_points_spent + v_room.entry_fee_points,
          last_match_at = now()
    where user_id = v_loser_user_id;
  end if;

  update public.truco_rooms
    set settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

revoke execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.lbb_create_truco_room(text, integer, text, jsonb, text, uuid, text, text, bigint, boolean) from public, anon, authenticated;
revoke execute on function public.lbb_join_truco_room(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.lbb_cancel_waiting_truco_room(uuid) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_room(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_apply_wallet_transaction(uuid, text, text, bigint, text, text, text, jsonb) to service_role;
grant execute on function public.lbb_create_truco_room(text, integer, text, jsonb, text, uuid, text, text, bigint, boolean) to service_role;
grant execute on function public.lbb_join_truco_room(uuid, uuid, text, text, text) to service_role;
grant execute on function public.lbb_cancel_waiting_truco_room(uuid) to service_role;
grant execute on function public.lbb_settle_truco_room(uuid, text) to service_role;
