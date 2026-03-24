import { OrderStatus } from '@/types/database'

export type DateFilter = 'hoy' | 'ayer' | 'semana' | 'todo' | 'custom'

export const PAGE_SIZE = 10

export const DATE_LABELS: Record<Exclude<DateFilter, 'custom'>, string> = {
  hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', todo: 'Todo',
}

export const STATUS_OPTIONS: { value: OrderStatus | 'todos'; label: string }[] = [
  { value: 'todos',     label: 'Todos' },
  { value: 'pending',   label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function getDateRange(
  filter: DateFilter,
  customFrom?: string,
  customTo?: string
): { from?: string; to?: string } {
  if (filter === 'custom') {
    return {
      from: customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : undefined,
      to:   customTo   ? new Date(customTo   + 'T23:59:59.999').toISOString() : undefined,
    }
  }
  const now = new Date()
  if (filter === 'hoy') {
    const from = new Date(now); from.setHours(0, 0, 0, 0)
    return { from: from.toISOString() }
  }
  if (filter === 'ayer') {
    const from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0)
    const to   = new Date(now); to.setHours(0, 0, 0, 0)
    return { from: from.toISOString(), to: to.toISOString() }
  }
  if (filter === 'semana') {
    const from = new Date(now); from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0)
    return { from: from.toISOString() }
  }
  return {}
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function getFilterDates(filter: Exclude<DateFilter, 'custom'>): { from: string; to: string } {
  const now = new Date()
  const today = toInputDate(now)
  if (filter === 'hoy') return { from: today, to: today }
  if (filter === 'ayer') {
    const d = new Date(now); d.setDate(d.getDate() - 1)
    const yesterday = toInputDate(d)
    return { from: yesterday, to: yesterday }
  }
  if (filter === 'semana') {
    const d = new Date(now); d.setDate(d.getDate() - 7)
    return { from: toInputDate(d), to: today }
  }
  return { from: '', to: '' }
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
