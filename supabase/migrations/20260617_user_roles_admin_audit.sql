-- Role-based access control and admin audit log.
-- Apply this after the wallet/truco migrations.

create table if not exists public.lbb_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'player' check (role in ('admin', 'operator', 'player')),
  permissions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lbb_user_roles_role_idx
  on public.lbb_user_roles(role);

create table if not exists public.lbb_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lbb_admin_audit_logs_admin_created_idx
  on public.lbb_admin_audit_logs(admin_user_id, created_at desc);

create index if not exists lbb_admin_audit_logs_entity_idx
  on public.lbb_admin_audit_logs(entity_type, entity_id, created_at desc);

create or replace function public.lbb_user_roles_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lbb_user_roles_set_updated_at on public.lbb_user_roles;
create trigger lbb_user_roles_set_updated_at
before update on public.lbb_user_roles
for each row execute function public.lbb_user_roles_set_updated_at();

alter table public.lbb_user_roles enable row level security;
alter table public.lbb_admin_audit_logs enable row level security;

-- Server route handlers use SUPABASE_SERVICE_ROLE_KEY for admin reads/writes.
-- Grant an admin manually after creating the first account, for example:
-- insert into public.lbb_user_roles (user_id, role)
-- select id, 'admin' from auth.users where lower(email) = lower('TU_EMAIL_ADMIN@DOMINIO.COM')
-- on conflict (user_id) do update set role = excluded.role;
