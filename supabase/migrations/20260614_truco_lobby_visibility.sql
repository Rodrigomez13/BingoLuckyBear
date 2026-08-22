alter table public.truco_rooms add column if not exists visibility text not null default 'private';

alter table public.truco_rooms drop constraint if exists truco_rooms_visibility_check;

alter table public.truco_rooms add constraint truco_rooms_visibility_check check (visibility in ('private', 'public'));

create index if not exists truco_rooms_lobby_visibility_idx on public.truco_rooms (visibility, status, updated_at desc);
