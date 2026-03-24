import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@empanadas.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — llamado por el webhook de Supabase cuando se inserta un pedido nuevo
export async function POST(req: NextRequest) {
  try {
    // Payload del webhook de Supabase: { type, table, record, old_record }
    const body = await req.json()
    const record = body.record ?? body  // soporta llamado directo también

    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Nombre del cliente: primero del record, luego de la tabla customers
    let customerName: string = normalize(record.customer_name || 'Cliente')
    if (!record.customer_name && record.customer_id) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('name')
        .eq('id', record.customer_id)
        .single()
      if (customer?.name) customerName = normalize(customer.name)
    }

    const totalFormatted = record.total
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(record.total)
      : ''

    const deliveryLabel = record.delivery_type === 'delivery' ? 'A domicilio' : 'Retira en local'
    const timeLabel = record.delivery_time ? ` · ${record.delivery_time}` : ''

    const payload = JSON.stringify({
      title: 'Nuevo pedido',
      body: customerName,
      total: totalFormatted,
      method: `${deliveryLabel}${timeLabel}`,
    })

    // Obtener todas las suscripciones
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const expiredEndpoints: string[] = []
    let sent = 0

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          sent++
        } catch (err: unknown) {
          const e = err as { statusCode?: number }
          if (e.statusCode === 410 || e.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint)
          }
        }
      })
    )

    // Limpiar suscripciones expiradas
    if (expiredEndpoints.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
    }

    return NextResponse.json({ ok: true, sent, cleaned: expiredEndpoints.length })
  } catch (err) {
    console.error('Push send error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
