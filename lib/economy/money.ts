export function normalizePositiveInteger(value: unknown) {
  const amount = Math.trunc(Number(value))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function formatCardPrice(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}
