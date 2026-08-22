-- Numeric bingo-card pricing and indexes used by the admin economy views.
-- Apply after 20260618_economy_deposits_purchases_bingo_card_refactor.sql.

alter table public.raffles
  add column if not exists card_price bigint;

update public.raffles
set card_price = nullif(regexp_replace(coalesce(amount, ''), '[^0-9]', '', 'g'), '')::bigint
where card_price is null
  and nullif(regexp_replace(coalesce(amount, ''), '[^0-9]', '', 'g'), '') is not null;

alter table public.raffles
  drop constraint if exists raffles_card_price_check;

alter table public.raffles
  add constraint raffles_card_price_check
  check (card_price is null or card_price > 0);

create index if not exists lbb_wallet_transactions_type_created_idx
  on public.lbb_wallet_transactions(transaction_type, created_at desc);

create index if not exists lbb_wallet_transactions_related_idx
  on public.lbb_wallet_transactions(related_type, related_id)
  where related_type is not null and related_id is not null;

create or replace function public.sync_bingo_purchase_from_deposit_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.game_purchases
    set status = 'paid',
        updated_at = now()
    where deposit_id = new.id
      and status = 'pending';

    update public.bingo_cards
    set payment_status = 'approved',
        card_status = 'active',
        issued_at = coalesce(issued_at, now()),
        payment_reviewed_at = coalesce(new.reviewed_at, now()),
        payment_reviewed_by = new.reviewed_by
    where deposit_id = new.id;
  elsif new.status in ('rejected', 'cancelled') then
    update public.game_purchases
    set status = 'cancelled',
        updated_at = now()
    where deposit_id = new.id
      and status = 'pending';

    update public.bingo_cards
    set payment_status = 'rejected',
        card_status = 'cancelled',
        payment_reviewed_at = coalesce(new.reviewed_at, now()),
        payment_reviewed_by = new.reviewed_by
    where deposit_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists payment_deposits_sync_bingo_purchase on public.payment_deposits;
create trigger payment_deposits_sync_bingo_purchase
after update of status on public.payment_deposits
for each row execute function public.sync_bingo_purchase_from_deposit_review();

revoke execute on function public.sync_bingo_purchase_from_deposit_review() from public, anon, authenticated;
grant execute on function public.sync_bingo_purchase_from_deposit_review() to service_role;
