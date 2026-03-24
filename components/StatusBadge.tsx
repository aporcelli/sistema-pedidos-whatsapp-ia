import { OrderStatus } from '@/types/database'

const config: Record<OrderStatus, { label: string; classes: string }> = {
  pending:   { label: 'Pendiente',  classes: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  confirmed: { label: 'Confirmado', classes: 'bg-blue-100 text-blue-800 border-blue-300' },
  cancelled: { label: 'Cancelado',  classes: 'bg-gray-100 text-gray-500 border-gray-300' },
}

export default function StatusBadge({ status }: { status: string }) {
  const { label, classes } = config[status as OrderStatus] ?? { label: status, classes: 'bg-gray-100 text-gray-500 border-gray-300' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  )
}
