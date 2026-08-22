create table if not exists public.platform_games (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('sorteos', 'cartas', 'slots', 'arcade', 'roadmap')),
  release_stage text not null default 'preview' check (release_stage in ('live', 'preview', 'roadmap', 'disabled')),
  wallet_mode text not null default 'general_balance' check (wallet_mode in ('general_balance', 'progress_only', 'none')),
  play_href text not null,
  admin_href text,
  status_label text not null,
  sort_order integer not null default 100,
  featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_games enable row level security;

drop policy if exists "Platform games public read" on public.platform_games;
create policy "Platform games public read"
  on public.platform_games
  for select
  using (release_stage <> 'disabled');

insert into public.platform_games (id, slug, name, category, release_stage, wallet_mode, play_href, admin_href, status_label, sort_order, featured, metadata)
values
  ('bingo', 'bingo', 'Bingo LBB', 'sorteos', 'live', 'general_balance', '/participar', '/admin', 'Disponible', 10, true, '{"cta":"Comprar cartón"}'::jsonb),
  ('truco', 'truco', 'Truco', 'cartas', 'live', 'general_balance', '/truco', '/admin/games', 'Mesas activas', 20, true, '{"cta":"Ver mesas"}'::jsonb),
  ('golden_bear', 'golden-bear', 'Golden Bear', 'slots', 'preview', 'general_balance', '/juegos/golden-bear', '/admin/games/golden-bear', 'LBB Original', 30, true, '{"cta":"Entrar al slot","engine":"server_authoritative"}'::jsonb),
  ('viborita', 'viborita', 'Viborita LBB', 'arcade', 'preview', 'progress_only', '/juegos/viborita', '/admin/games', 'Nuevo', 40, false, '{"cta":"Jugar"}'::jsonb),
  ('future_games', 'proximos-juegos', 'Próximos juegos', 'roadmap', 'roadmap', 'none', '/juegos', '/admin/games', 'En preparación', 50, false, '{"cta":"Ver plataforma"}'::jsonb)
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name,
    category = excluded.category,
    release_stage = excluded.release_stage,
    wallet_mode = excluded.wallet_mode,
    play_href = excluded.play_href,
    admin_href = excluded.admin_href,
    status_label = excluded.status_label,
    sort_order = excluded.sort_order,
    featured = excluded.featured,
    metadata = excluded.metadata,
    updated_at = now();
