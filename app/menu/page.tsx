'use client'

import { useState } from 'react'
import ProductosTab from './ProductosTab'
import SaboresTab from './SaboresTab'

type Tab = 'productos' | 'sabores'

export default function MenuPage() {
  const [tab, setTab] = useState<Tab>('productos')

  return (
    <div className="px-4 pt-5">
      {/* Pestañas */}
      <div className="flex gap-2 mb-5">
        {(['productos', 'sabores'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize
              ${tab === t ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {t === 'productos' ? 'Productos' : 'Sabores'}
          </button>
        ))}
      </div>

      {tab === 'productos' ? <ProductosTab /> : <SaboresTab />}
    </div>
  )
}
