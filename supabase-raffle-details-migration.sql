alter table public.raffles
  add column if not exists prize text,
  add column if not exists amount text,
  add column if not exists draw_date timestamptz,
  add column if not exists additional_prizes text[] not null default '{}';
