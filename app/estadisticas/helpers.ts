export type Period = 'hoy' | 'semana' | 'mes' | 'custom'

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes',    label: 'Mes' },
  { key: 'custom', label: 'Rango' },
]

export function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export function getDefaultDates(key: Period, today: string): { from: string; to: string } {
  const now = new Date()
  if (key === 'hoy') return { from: today, to: today }
  if (key === 'semana') {
    const from = new Date(); from.setDate(from.getDate() - 6)
    return { from: toInputDate(from), to: today }
  }
  if (key === 'mes') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toInputDate(from), to: today }
  }
  return { from: today, to: today }
}
