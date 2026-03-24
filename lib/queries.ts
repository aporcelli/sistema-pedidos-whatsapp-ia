import { supabase } from './supabase'
import { OrderStatus, OrderWithDetails, Flavor, Product } from '@/types/database'

// ─── PEDIDOS ────────────────────────────────────────────────────────────────

/**
 * Trae todos los pedidos de hoy con cliente, items y sabores incluidos.
 * El join anidado replica el esquema: orders → order_items → order_item_flavors
 */
export async function getTodayOrders(): Promise<OrderWithDetails[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      order_items (
        *,
        products (*),
        order_item_flavors (
          *,
          flavors (*)
        )
      )
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as OrderWithDetails[]
}

/**
 * Trae pedidos con filtros opcionales de fecha y estado.
 * Si no se pasa ningún filtro devuelve los últimos 100 pedidos.
 */
export async function getOrders(params?: {
  from?: string
  to?: string
  status?: OrderStatus
}): Promise<OrderWithDetails[]> {
  let query = supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      order_items (
        *,
        products (*),
        order_item_flavors (
          *,
          flavors (*)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (params?.from) query = query.gte('created_at', params.from)
  if (params?.to)   query = query.lte('created_at', params.to)
  if (params?.status) query = query.eq('status', params.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as OrderWithDetails[]
}

/**
 * Cambia el estado de un pedido. Devuelve el pedido actualizado.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}

// ─── PRODUCTOS ──────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('price')
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function updateProduct(
  productId: string,
  updates: { price?: number; available?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
  if (error) throw error
}

// ─── SABORES ────────────────────────────────────────────────────────────────

/**
 * Trae todos los sabores ordenados por nombre.
 */
export async function getFlavors(): Promise<Flavor[]> {
  const { data, error } = await supabase
    .from('flavors')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Flavor[]
}

/**
 * Activa o desactiva un sabor.
 */
export async function addFlavor(name: string): Promise<Flavor> {
  const { data, error } = await supabase
    .from('flavors')
    .insert({ name, available: true })
    .select()
    .single()
  if (error) throw error
  return data as Flavor
}

export async function renameFlavor(flavorId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('flavors')
    .update({ name })
    .eq('id', flavorId)
  if (error) throw error
}

export async function deleteFlavor(flavorId: string): Promise<void> {
  const { error } = await supabase
    .from('flavors')
    .delete()
    .eq('id', flavorId)
  if (error) throw error
}

export async function toggleFlavor(
  flavorId: string,
  available: boolean
): Promise<void> {
  const { error } = await supabase
    .from('flavors')
    .update({ available })
    .eq('id', flavorId)

  if (error) throw error
}

// ─── ESTADÍSTICAS ───────────────────────────────────────────────────────────

/**
 * Función base: ingresos y pedidos entre dos fechas.
 */
async function getStatsBetween(from: Date, to?: Date): Promise<{ revenue: number; orderCount: number }> {
  let query = supabase
    .from('orders')
    .select('total')
    .gte('created_at', from.toISOString())
    .neq('status', 'cancelled')

  if (to) query = query.lte('created_at', to.toISOString())

  const { data, error } = await query
  if (error) throw error
  const orders = data ?? []
  return {
    revenue: orders.reduce((sum, o) => sum + (o.total ?? 0), 0),
    orderCount: orders.length,
  }
}

export async function getStatsForRange(
  from: string,
  to: string
): Promise<{ revenue: number; orderCount: number }> {
  return getStatsBetween(new Date(from + 'T00:00:00'), new Date(to + 'T23:59:59.999'))
}

export async function getTodayRevenue(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const stats = await getStatsBetween(today)
  return stats.revenue
}

export async function getTodayStats(): Promise<{ revenue: number; orderCount: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return getStatsBetween(today)
}

export async function getWeekStats(): Promise<{ revenue: number; orderCount: number }> {
  const from = new Date()
  from.setDate(from.getDate() - 6)
  from.setHours(0, 0, 0, 0)
  return getStatsBetween(from)
}

export async function getMonthStats(): Promise<{ revenue: number; orderCount: number }> {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return getStatsBetween(from)
}

/**
 * Devuelve el top N de sabores más pedidos en un rango de fechas.
 */
export async function getTopFlavors(
  from: string,
  to: string,
  limit = 3
): Promise<{ name: string; quantity: number }[]> {
  // Parsear como hora LOCAL (sin 'Z') para evitar el bug de UTC:
  // new Date("2026-03-16") = medianoche UTC = 9pm del día anterior en Argentina
  const fromDate = new Date(from + 'T00:00:00')
  const toEnd = new Date(to + 'T23:59:59.999')

  // Arrancamos desde orders para filtrar fecha y status directamente,
  // luego bajamos a los sabores. Evita el problema de filtros en joins anidados.
  const { data, error } = await supabase
    .from('orders')
    .select(`
      order_items (
        order_item_flavors (
          quantity,
          flavors (name)
        )
      )
    `)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toEnd.toISOString())
    .neq('status', 'cancelled')

  if (error) throw error

  type OrderRow = {
    order_items: {
      order_item_flavors: { quantity: number; flavors: { name: string } | null }[]
    }[]
  }

  const counts: Record<string, number> = {}
  for (const order of (data ?? []) as unknown as OrderRow[]) {
    for (const item of order.order_items ?? []) {
      for (const f of item.order_item_flavors ?? []) {
        const name = f.flavors?.name
        if (!name) continue
        counts[name] = (counts[name] ?? 0) + (f.quantity ?? 1)
      }
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, quantity]) => ({ name, quantity }))
}

/**
 * Devuelve la cantidad de pedidos agrupados por día de la semana del mes actual.
 * Devuelve un array de 7 elementos: [Dom, Lun, Mar, Mié, Jue, Vie, Sáb]
 */
export async function getOrdersByDayOfWeek(): Promise<
  { day: string; pedidos: number }[]
> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .gte('created_at', firstOfMonth.toISOString())
    .neq('status', 'cancelled')

  if (error) throw error

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const counts = [0, 0, 0, 0, 0, 0, 0]

  for (const row of data ?? []) {
    const d = new Date(row.created_at)
    counts[d.getDay()]++
  }

  return days.map((day, i) => ({ day, pedidos: counts[i] }))
}
