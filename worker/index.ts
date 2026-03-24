/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

// Escucha notificaciones push entrantes
self.addEventListener('push', (event) => {
  let data: { title: string; body: string; items?: string; total?: string; method?: string } = {
    title: 'Nuevo pedido',
    body: 'Llegó un nuevo pedido.',
  }

  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {}

  const lines: string[] = [data.body]
  if (data.items) lines.push(`📦 ${data.items}`)
  if (data.total) lines.push(`💰 ${data.total}`)
  if (data.method) lines.push(`🏍️ ${data.method}`)

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: lines.join('\n'),
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [200, 100, 200, 100, 300],
      tag: 'new-order',
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Ver pedido' },
        { action: 'dismiss', title: 'Ignorar' },
      ],
      data: { url: '/pedidos' },
    })
  )
})

// Al tocar la notificación, abre o enfoca la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = (event.notification.data as { url: string })?.url || '/pedidos'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        const existing = list.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.postMessage({ type: 'navigate', url })
          return
        }
        return clients.openWindow(url)
      })
  )
})
