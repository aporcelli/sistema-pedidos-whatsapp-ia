'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getTodayOrders } from '@/lib/queries'
import { OrderWithDetails } from '@/types/database'
import StatusBadge from './StatusBadge'
import OrderModal, { countEmpanadas } from './OrderModal'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function playNotification() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch { /* ignorar */ }
}

export default function Dashboard() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [selected, setSelected] = useState<OrderWithDetails | null>(null)
  const isFirstRender = useRef(true)

  async function loadOrders() {
    const data = await getTodayOrders()
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const updated = await getTodayOrders()
        setOrders(updated)
        if (!isFirstRender.current) {
          setNewOrderAlert(true)
          playNotification()
          setTimeout(() => setNewOrderAlert(false), 4000)
        }
      })
      .subscribe()
    isFirstRender.current = false
    return () => { supabase.removeChannel(channel) }
  }, [])

  const todayRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)
  const orderCount = orders.filter(o => o.status !== 'cancelled').length
  return (
    <div className="px-4 pt-5">
      {newOrderAlert && (
        <div className="mb-4 bg-brand-500 text-white rounded-2xl px-4 py-3 flex items-center gap-2 animate-pulse shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="font-semibold">¡Nuevo pedido recibido!</span>
        </div>
      )}

      {/* Cards resumen */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-brand-600">{orderCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pedidos hoy</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-brand-600 leading-tight">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">Ingresos hoy</p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800">Pedidos de hoy</h2>
        {!loading && <span className="text-xs text-gray-400">{orders.length} en total</span>}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-3 text-gray-300">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p className="font-medium">Todavía no hay pedidos hoy</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => {
            const emp = countEmpanadas(order)
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{order.customers?.name ?? order.customer_name ?? 'Sin cliente'}</p>
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
      )}

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
