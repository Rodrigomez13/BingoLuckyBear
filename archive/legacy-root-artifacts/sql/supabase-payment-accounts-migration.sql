create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  holder text not null,
  alias text,
  cbu text,
  bank text,
  concept text,
  note text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payment_accounts_admin_idx
  on public.payment_accounts (admin_id);

alter table public.raffles
  add column if not exists payment_account_id uuid references public.payment_accounts(id) on delete set null;

create index if not exists raffles_payment_account_idx
  on public.raffles (payment_account_id);
