create table if not exists public.golden_bear_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  bonus_buy_enabled boolean not null default true,
  bonus_buy_price numeric not null default 100 check (bonus_buy_price > 0),
  bonus_buy_spins integer not null default 6 check (bonus_buy_spins > 0 and bonus_buy_spins <= 50),
  bonus_buy_label text not null default 'Comprar Bonus',
  bonus_buy_description text not null default 'Activá giros gratis del Oso Dorado por un valor fijo.',
  valid_stakes jsonb not null default '[25,50,100,200,500,1000]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.golden_bear_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.golden_bear_settings enable row level security;

drop policy if exists "Golden Bear settings public read" on public.golden_bear_settings;
create policy "Golden Bear settings public read"
  on public.golden_bear_settings
  for select
  using (true);
