-- Applied to project ttoaqjqysdjijwnhopxi.
-- Links future card purchases to authenticated customer accounts.

alter table public.bingo_cards
  add column if not exists customer_id uuid references auth.users(id) on delete set null;

create index if not exists bingo_cards_customer_id_idx
  on public.bingo_cards (customer_id);
