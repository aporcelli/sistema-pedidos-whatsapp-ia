export default function StatCard({ label, value, accent = false }: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm border ${
      accent ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-100'
    }`}>
      <p className={`text-xs font-medium mb-1 ${accent ? 'text-brand-100' : 'text-gray-400'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold leading-tight ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
