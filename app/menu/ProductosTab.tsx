'use client'

import { useEffect, useState, useRef } from 'react'
import { getProducts, updateProduct } from '@/lib/queries'
import { Product } from '@/types/database'

function ProductRow({ product, onSave }: {
  product: Product
  onSave: (id: string, price: number) => Promise<void>
}) {
  const [value, setValue] = useState(String(product.price))
  const [saving, setSaving] = useState(false)
  const original = useRef(product.price)

  async function save() {
    const newPrice = parseInt(value.replace(/\D/g, ''), 10)
    if (isNaN(newPrice) || newPrice === original.current) return
    setSaving(true)
    try {
      await onSave(product.id, newPrice)
      original.current = newPrice
    } catch {
      setValue(String(original.current))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <span className="flex-1 font-medium text-gray-900">{product.name}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-400">$</span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            disabled={saving}
            className="w-24 text-right border border-gray-200 rounded-xl px-2 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-400 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductosTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  async function handleSave(id: string, price: number) {
    await updateProduct(id, { price })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, price } : p))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">Tocá el precio para editarlo y presioná Enter o salí del campo para guardar.</p>
      {products.map(product => (
        <ProductRow key={product.id} product={product} onSave={handleSave} />
      ))}
      {products.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No hay productos cargados todavía</p>
        </div>
      )}
    </div>
  )
}
