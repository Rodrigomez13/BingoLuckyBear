-- Applied to project ttoaqjqysdjijwnhopxi.
-- Keeps customer accounts, purchased cards and the admin Clients section connected.

create or replace function public.link_bingo_card_customer()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.customer_id is null and new.email is not null then
    select users.id
      into new.customer_id
      from auth.users
      where lower(users.email) = lower(new.email)
      limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists link_bingo_card_customer_before_write on public.bingo_cards;

create trigger link_bingo_card_customer_before_write
  before insert or update of email, customer_id
  on public.bingo_cards
  for each row
  execute function public.link_bingo_card_customer();

create or replace function public.sync_customer_profile_to_cards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bingo_cards
    set
      customer_id = new.id,
      full_name = coalesce(new.full_name, full_name),
      dni = coalesce(new.dni, dni),
      address = coalesce(new.address, address),
      phone = coalesce(new.phone, phone),
      email = coalesce(new.email, email),
      payout_account_kind = new.payout_account_kind,
      payout_account = new.payout_account,
      payout_holder_name = new.payout_holder_name,
      updated_at = now()
    where customer_id = new.id
       or (new.email is not null and lower(email) = lower(new.email));

  return new;
end;
$$;

drop trigger if exists sync_customer_profile_to_cards_after_write on public.customer_profiles;

create trigger sync_customer_profile_to_cards_after_write
  after insert or update
  on public.customer_profiles
  for each row
  execute function public.sync_customer_profile_to_cards();
