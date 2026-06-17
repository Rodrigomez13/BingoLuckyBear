export function formatAccountBalance(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

// Guaraní-style display used across the dashboard mockups: "Gs. 250.000"
export function formatGs(value: number) {
  const amount = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))
  return `Gs. ${amount}`
}
