'use client'

import { useEffect, useState } from 'react'
import { getOrders } from '@/lib/queries'
import { OrderWithDetails, OrderStatus } from '@/types/database'
import StatusBadge from '@/components/StatusBadge'
import OrderModal, { countEmpanadas } from '@/components/OrderModal'
import {
  DateFilter,
  DATE_LABELS,
  STATUS_OPTIONS,
  PAGE_SIZE,
  getDateRange,
  getFilterDates,
  formatCurrency,
  formatDateTime,
} from './helpers'

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('hoy')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'todos'>('todos')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OrderWithDetails | null>(null)

  useEffect(() => {
    setLoading(true)
    const range = getDateRange(dateFilter, customFrom, customTo)
    getOrders({ ...range, status: statusFilter === 'todos' ? undefined : statusFilter })
      .then(data => { setOrders(data); setPage(1) })
      .finally(() => setLoading(false))
  }, [dateFilter, customFrom, customTo, statusFilter])

  const filtered = search.trim()
    ? orders.filter(o => o.customers?.name?.toLowerCase().includes(search.toLowerCase()))
    : orders

  const totalRevenue = filtered
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-4 pt-5">
      {/* Filtro fecha */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-4 px-4 scrollbar-hide">
        {(Object.keys(DATE_LABELS) as Exclude<DateFilter, 'custom'>[]).map(key => (
          <button
            key={key}
            onClick={() => { const d = getFilterDates(key); setDateFilter(key); setCustomFrom(d.from); setCustomTo(d.to) }}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${dateFilter === key ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {DATE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Desde</label>
          <input
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={e => { setCustomFrom(e.target.value); setDateFilter('custom') }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Hasta</label>
          <input
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={e => { setCustomTo(e.target.value); setDateFilter('custom') }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {/* Filtro estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
              ${statusFilter === value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nombre..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400"
        />
      </div>

      {/* Resumen */}
      {!loading && filtered.length > 0 && (
        <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
          <span>{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-brand-700">{formatCurrency(totalRevenue)}</span>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-300">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p className="font-medium">No hay pedidos con esos filtros</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map(order => {
              const emp = countEmpanadas(order)
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{order.customers?.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(order.created_at)}
                      {emp > 0 && <span className="ml-2 text-brand-600 font-medium">{emp} emp.</span>}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                  <button
                    onClick={() => setSelected(order)}
                    className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 rounded-xl px-3 py-1.5 active:bg-brand-100"
                  >
                    Ver
                  </button>
                </div>
              )
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 mb-6 text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span className="text-gray-500">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
