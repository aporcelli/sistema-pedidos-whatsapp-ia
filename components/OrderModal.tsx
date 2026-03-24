'use client'

import { OrderWithDetails } from '@/types/database'
import StatusBadge from './StatusBadge'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}


function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('54') ? digits : `54${digits}`
  return `https://wa.me/${number}`
}

export function countEmpanadas(order: OrderWithDetails): number {
  return order.order_items.reduce(
    (sum, item) => sum + item.order_item_flavors.reduce((s, f) => s + f.quantity, 0),
    0
  )
}

export default function OrderModal({ order, onClose }: { order: OrderWithDetails; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pb-6 pt-4">
          {/* Encabezado */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{order.customers?.name ?? order.customer_name ?? 'Sin cliente'}</h2>
              <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Items */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pedido</p>
            <div className="space-y-3">
              {order.order_items.map(item => (
                <div key={item.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{item.quantity}× {item.products?.name ?? '—'}</span>
                    <span className="text-gray-500">{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                  {item.order_item_flavors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.order_item_flavors.map(f => (
                        <span key={f.id} className="text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5">
                          {f.quantity > 1 ? `${f.quantity}× ` : ''}{f.flavors?.name ?? '—'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 border-t border-b border-gray-100 mb-4">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-base font-bold text-gray-900">{formatCurrency(order.total)}</span>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm text-gray-600 mb-5">
            {order.delivery_type && (
              <div className="flex gap-2 items-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-gray-400">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                <span className="capitalize">{order.delivery_type}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex gap-2 items-start">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0 text-gray-400">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>{order.delivery_address}</span>
              </div>
            )}
            {order.delivery_time && (
              <div className="flex gap-2 items-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-gray-400">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>Entrega: {order.delivery_time}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex gap-2 items-start">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-0.5 shrink-0 text-gray-400">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <span className="italic">{order.notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">
              Cerrar
            </button>
            <a
              href={whatsappUrl(order.customers?.phone ?? '')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-green-500 border border-green-500 rounded-xl py-2.5 text-sm font-semibold active:bg-green-50"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              Enviar mensaje
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
