'use client'

import { useEffect, useState } from 'react'
import { getTopFlavors, getOrdersByDayOfWeek, getTodayStats, getWeekStats, getMonthStats, getStatsForRange } from '@/lib/queries'
import WeekChart from '@/components/WeekChart'
import StatCard from '@/components/StatCard'
import { Period, PERIODS, toInputDate, formatCurrency, getDefaultDates } from './helpers'

export default function EstadisticasPage() {
  const today = toInputDate(new Date())

  const [period, setPeriod] = useState<Period>('mes')
  const [fromDate, setFromDate] = useState(() => toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [toDate, setToDate] = useState(today)

  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingOther, setLoadingOther] = useState(true)
  const [revenue, setRevenue] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [topFlavors, setTopFlavors] = useState<{ name: string; quantity: number }[]>([])
  const [chartData, setChartData] = useState<{ day: string; pedidos: number }[]>([])

  // Carga ingresos y pedidos cuando cambia el período o las fechas
  useEffect(() => {
    setLoadingStats(true)
    const fetch = period === 'hoy'    ? getTodayStats()
                : period === 'semana' ? getWeekStats()
                : period === 'mes'    ? getMonthStats()
                :                      getStatsForRange(fromDate, toDate)
    fetch
      .then(stats => { setRevenue(stats.revenue); setOrderCount(stats.orderCount) })
      .finally(() => setLoadingStats(false))
  }, [period, fromDate, toDate])

  // Carga top sabores y gráfico cuando cambia el rango de fechas
  useEffect(() => {
    setLoadingOther(true)
    Promise.all([getTopFlavors(fromDate, toDate), getOrdersByDayOfWeek()])
      .then(([flavors, byDay]) => { setTopFlavors(flavors); setChartData(byDay) })
      .finally(() => setLoadingOther(false))
  }, [fromDate, toDate])

  function handlePeriod(key: Period) {
    setPeriod(key)
    if (key !== 'custom') {
      const dates = getDefaultDates(key, today)
      setFromDate(dates.from)
      setToDate(dates.to)
    }
  }

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? ''

  return (
    <div className="px-4 pt-5 pb-8">
      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-3">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePeriod(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${period === key ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Inputs de fecha */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Desde</label>
          <input type="date" value={fromDate} max={toDate}
            onChange={e => { setFromDate(e.target.value); setPeriod('custom') }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Hasta</label>
          <input type="date" value={toDate} min={fromDate} max={today}
            onChange={e => { setToDate(e.target.value); setPeriod('custom') }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* Ingresos y pedidos */}
        {loadingStats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={`Ingresos — ${periodLabel}`} value={formatCurrency(revenue)} accent />
            <StatCard label={`Pedidos — ${periodLabel}`} value={String(orderCount)} />
          </div>
        )}

        {/* Top 3 sabores */}
        {loadingOther ? (
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-3">Top sabores — {periodLabel}</p>
            {topFlavors.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">Sin datos para este período</p>
            ) : (
              <div className="space-y-2">
                {topFlavors.map(({ name, quantity }, i) => {
                  const rankColors = ['text-yellow-500 bg-yellow-50', 'text-gray-400 bg-gray-100', 'text-orange-400 bg-orange-50']
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankColors[i]}`}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800">{name}</span>
                          <span className="text-xs text-gray-400">{quantity} und.</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${(quantity / topFlavors[0].quantity) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Gráfico */}
        {loadingOther ? (
          <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-1">Pedidos por día de la semana</p>
            <p className="text-xs text-gray-400 mb-4">Basado en pedidos del mes actual</p>
            <WeekChart data={chartData} />
          </div>
        )}
      </div>
    </div>
  )
}
