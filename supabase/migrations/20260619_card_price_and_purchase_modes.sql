-- Compra de cartones con saldo o por comprobante.
-- Agrega un precio numerico por carton al sorteo y deja trazabilidad de la
-- forma de pago en game_purchases. Es aditiva y no rompe datos existentes.
-- Aplicar despues de 20260618_economy_deposits_purchases_bingo_card_refactor.sql.

-- Precio del carton definido al crear el sorteo (en la moneda del sorteo, sin decimales).
alter table public.raffles
  add column if not exists card_price bigint check (card_price is null or card_price >= 0);

-- Forma de pago de la compra: saldo (wallet) o comprobante pendiente de aprobacion.
alter table public.game_purchases
  add column if not exists payment_source text not null default 'receipt'
    check (payment_source in ('wallet', 'receipt'));

create index if not exists game_purchases_payment_source_idx
  on public.game_purchases(payment_source, status, created_at desc);

-- Indice util para listar depositos pendientes en el panel admin.
create index if not exists payment_deposits_pending_idx
  on public.payment_deposits(created_at desc)
  where status = 'pending';
