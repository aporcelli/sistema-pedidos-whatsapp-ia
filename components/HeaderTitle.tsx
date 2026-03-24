'use client'

import { usePathname } from 'next/navigation'

const routes: Record<string, { title: string; subtitle?: () => string }> = {
  '/': {
    title: 'Las Empanadas de Susi',
    subtitle: () => new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
  },
  '/pedidos': {
    title: 'Pedidos',
  },
  '/menu': {
    title: 'Menú',
    subtitle: () => 'Productos y sabores disponibles',
  },
  '/estadisticas': {
    title: 'Estadísticas',
    subtitle: () => new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  },
}

export default function HeaderTitle() {
  const pathname = usePathname()
  const route = routes[pathname]
  if (!route) return null

  const subtitle = route.subtitle?.()

  return (
    <div className="text-center">
      <p className="text-base font-bold text-gray-900 leading-tight">{route.title}</p>
      {subtitle && <p className="text-xs text-gray-500 capitalize mt-0.5">{subtitle}</p>}
    </div>
  )
}
