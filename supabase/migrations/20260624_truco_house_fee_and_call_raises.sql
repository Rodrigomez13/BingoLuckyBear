-- Truco: escalated stake options and house fee settlement.
-- Run after 20260623_general_balance_and_truco_preferences.sql.

alter table public.truco_rooms
  add column if not exists house_fee_rate numeric(5, 4) not null default 0,
  add column if not exists house_fee_points bigint not null default 0 check (house_fee_points >= 0),
  add column if not exists prize_awarded_points bigint not null default 0 check (prize_awarded_points >= 0);

alter table public.truco_match_history
  add column if not exists gross_prize_pool_points bigint not null default 0 check (gross_prize_pool_points >= 0),
  add column if not exists house_fee_rate numeric(5, 4) not null default 0,
  add column if not exists house_fee_points bigint not null default 0 check (house_fee_points >= 0);

alter table public.truco_rooms drop constraint if exists truco_rooms_entry_fee_options_check;
alter table public.truco_rooms add constraint truco_rooms_entry_fee_options_check
  check (entry_fee_points in (0, 10, 50, 100, 250, 500, 2500));

create index if not exists truco_match_history_house_fee_finished_idx
  on public.truco_match_history(finished_at desc)
  where house_fee_points > 0;

create or replace function public.lbb_truco_house_fee_rate(p_prize_pool_points bigint)
returns numeric
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when coalesce(p_prize_pool_points, 0) <= 0 then 0::numeric
    when p_prize_pool_points <= 200 then 0.1000::numeric
    when p_prize_pool_points <= 1000 then 0.0800::numeric
    when p_prize_pool_points <= 5000 then 0.0600::numeric
    else 0.0500::numeric
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
  v_house_fee_rate numeric(5, 4);
  v_house_fee_points bigint;
  v_prize_awarded_points bigint;
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
  v_house_fee_rate := public.lbb_truco_house_fee_rate(v_room.prize_pool_points);
  v_house_fee_points := floor(coalesce(v_room.prize_pool_points, 0) * v_house_fee_rate)::bigint;
  v_prize_awarded_points := greatest(0, coalesce(v_room.prize_pool_points, 0) - v_house_fee_points);

  if v_room.prize_pool_points > 0 then
    if v_winner_user_id is null then
      raise exception 'No se puede pagar un pozo a un invitado';
    end if;

    perform public.lbb_apply_wallet_transaction(
      v_winner_user_id,
      'general',
      'truco_prize',
      v_prize_awarded_points,
      'truco_room',
      v_room.id::text,
      format('Premio neto por ganar Truco (%s ARS)', v_prize_awarded_points),
      jsonb_build_object(
        'roomCode', v_room.room_code,
        'grossPrizePool', v_room.prize_pool_points,
        'houseFeePoints', v_house_fee_points,
        'houseFeeRate', v_house_fee_rate
      )
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
    gross_prize_pool_points,
    house_fee_rate,
    house_fee_points,
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
    v_prize_awarded_points,
    v_room.prize_pool_points,
    v_house_fee_rate,
    v_house_fee_points,
    v_room.ranked,
    jsonb_build_object(
      'finalResult', v_final_result,
      'abandonedBy', v_room.abandoned_by,
      'grossPrizePool', v_room.prize_pool_points,
      'netPrize', v_prize_awarded_points,
      'houseFeePoints', v_house_fee_points,
      'houseFeeRate', v_house_fee_rate
    )
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
          bonus_points_won = bonus_points_won + v_prize_awarded_points,
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
    set house_fee_rate = v_house_fee_rate,
        house_fee_points = v_house_fee_points,
        prize_awarded_points = v_prize_awarded_points,
        settled_at = now()
  where id = v_room.id
  returning * into v_room;

  return to_jsonb(v_room);
end;
$$;

revoke execute on function public.lbb_truco_house_fee_rate(bigint) from public, anon, authenticated;
revoke execute on function public.lbb_settle_truco_room(uuid, text) from public, anon, authenticated;

grant execute on function public.lbb_truco_house_fee_rate(bigint) to service_role;
grant execute on function public.lbb_settle_truco_room(uuid, text) to service_role;
