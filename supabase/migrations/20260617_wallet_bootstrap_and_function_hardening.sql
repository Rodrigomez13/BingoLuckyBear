-- Make first-login wallet setup observable and idempotent.
with duplicate_signup_bonus as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, id asc
    ) as row_number
  from public.lbb_wallet_transactions
  where transaction_type = 'signup_bonus'
)
delete from public.lbb_wallet_transactions transactions
using duplicate_signup_bonus duplicates
where transactions.id = duplicates.id
  and duplicates.row_number > 1;

create unique index if not exists lbb_wallet_signup_bonus_once_idx
  on public.lbb_wallet_transactions (user_id)
  where transaction_type = 'signup_bonus';

-- Cover the foreign keys used by room and match-history lookups.
create index if not exists truco_rooms_host_user_id_idx
  on public.truco_rooms (host_user_id);

create index if not exists truco_rooms_guest_user_id_idx
  on public.truco_rooms (guest_user_id);

create index if not exists truco_match_history_winner_user_id_idx
  on public.truco_match_history (winner_user_id);

create index if not exists truco_match_history_loser_user_id_idx
  on public.truco_match_history (loser_user_id);

-- Trigger helpers are invoked by PostgreSQL, never directly by browser roles.
alter function public.set_updated_at() set search_path = '';
alter function public.truco_player_stats_set_updated_at() set search_path = '';
alter function public.link_bingo_card_customer() set search_path = '';
alter function public.sync_customer_profile_to_cards() set search_path = '';

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.truco_player_stats_set_updated_at() from public, anon, authenticated;
revoke execute on function public.link_bingo_card_customer() from public, anon, authenticated;
revoke execute on function public.sync_customer_profile_to_cards() from public, anon, authenticated;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.truco_player_stats_set_updated_at() to service_role;
grant execute on function public.link_bingo_card_customer() to service_role;
grant execute on function public.sync_customer_profile_to_cards() to service_role;
