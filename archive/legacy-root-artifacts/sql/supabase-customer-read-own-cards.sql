-- Applied to project ttoaqjqysdjijwnhopxi.
-- Lets authenticated customers read only cards linked to their own auth user.

drop policy if exists "Customers can read own cards" on public.bingo_cards;

create policy "Customers can read own cards"
  on public.bingo_cards
  for select
  to authenticated
  using (customer_id = (select auth.uid()));
