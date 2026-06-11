-- Applied to project ttoaqjqysdjijwnhopxi.
-- Lets an authenticated customer see existing cards purchased with their verified auth email.

drop policy if exists "Customers can read cards by verified email" on public.bingo_cards;

create policy "Customers can read cards by verified email"
  on public.bingo_cards
  for select
  to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));
