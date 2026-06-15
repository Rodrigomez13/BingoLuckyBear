-- Query indexes and trigger-function hardening for the economy module.
-- Apply after 20260619_raffle_card_price_and_economy_consistency.sql.

create index if not exists game_purchases_deposit_id_idx
  on public.game_purchases(deposit_id)
  where deposit_id is not null;

alter function public.payment_deposits_set_updated_at() set search_path = '';
alter function public.game_purchases_set_updated_at() set search_path = '';
alter function public.lbb_user_roles_set_updated_at() set search_path = '';

revoke execute on function public.payment_deposits_set_updated_at() from public, anon, authenticated;
revoke execute on function public.game_purchases_set_updated_at() from public, anon, authenticated;
revoke execute on function public.lbb_user_roles_set_updated_at() from public, anon, authenticated;

grant execute on function public.payment_deposits_set_updated_at() to service_role;
grant execute on function public.game_purchases_set_updated_at() to service_role;
grant execute on function public.lbb_user_roles_set_updated_at() to service_role;
