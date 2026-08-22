alter table public.bingo_cards
  add column if not exists winner_photo_url text,
  add column if not exists winner_testimonial text;

create index if not exists bingo_cards_winner_photo_idx
  on public.bingo_cards (winner_photo_url)
  where winner_photo_url is not null;
