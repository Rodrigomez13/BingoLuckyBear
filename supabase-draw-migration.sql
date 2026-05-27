alter table public.raffles
  add column if not exists draw_status text not null default 'idle',
  add column if not exists countdown_seconds integer,
  add column if not exists draw_started_at timestamptz,
  add column if not exists drawn_numbers integer[] not null default '{}';

alter table public.raffles
  drop constraint if exists raffles_draw_status_check;

alter table public.raffles
  add constraint raffles_draw_status_check
  check (draw_status in ('idle', 'running', 'finished'));
