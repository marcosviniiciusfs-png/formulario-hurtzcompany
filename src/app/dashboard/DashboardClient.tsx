'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FileText, MessageSquare, Eye, TrendingUp, RefreshCw } from 'lucide-react'

interface FormOption {
  id: string
  titulo: string
}

interface DashboardClientProps {
  forms: FormOption[]
  userId: string
}

export function DashboardClient({ forms, userId }: DashboardClientProps) {
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [metrics, setMetrics] = useState({ forms: 0, responses: 0, views: 0, conversion: '0' })
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let formIds: string[]
    if (selectedFormId === 'all') {
      const { data } = await supabase.from('forms').select('id').eq('user_id', userId)
      formIds = (data || []).map(f => f.id)
    } else {
      formIds = [selectedFormId]
    }

    const safeIds = formIds.length > 0 ? formIds : ['00000000-0000-0000-0000-000000000000']

    let responseQuery = supabase.from('responses').select('*', { count: 'exact', head: true }).in('form_id', safeIds)
    let viewQuery = supabase.from('form_views').select('*', { count: 'exact', head: true }).in('form_id', safeIds)

    if (dateFrom) {
      responseQuery = responseQuery.gte('created_at', dateFrom)
      viewQuery = viewQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setDate(to.getDate() + 1)
      responseQuery = responseQuery.lt('created_at', to.toISOString().split('T')[0])
      viewQuery = viewQuery.lt('created_at', to.toISOString().split('T')[0])
    }

    const [responseResult, viewResult] = await Promise.all([responseQuery, viewQuery])

    const responseCount = responseResult.count || 0
    const viewCount = viewResult.count || 0
    const conversionRate = viewCount > 0 ? ((responseCount / viewCount) * 100).toFixed(1) : '0'

    setMetrics({
      forms: selectedFormId === 'all' ? safeIds.length : 1,
      responses: responseCount,
      views: viewCount,
      conversion: conversionRate,
    })
    setLoading(false)
  }, [selectedFormId, dateFrom, dateTo, userId])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={selectedFormId} onChange={e => setSelectedFormId(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 min-w-[200px]">
          <option value="all">Todos os formulários</option>
          {forms.map(f => (
            <option key={f.id} value={f.id}>{f.titulo}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700" />
          <span className="text-gray-400 text-sm">até</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700" />
        </div>
        <button onClick={fetchMetrics} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Atualizar">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard titulo="Formulários" valor={metrics.forms} icon={<FileText size={24} />}
          tooltip="Total de formulários criados na conta" />
        <MetricCard titulo="Respostas" valor={metrics.responses} icon={<MessageSquare size={24} />}
          tooltip="Total de respostas recebidas no período selecionado" />
        <MetricCard titulo="Visualizações" valor={metrics.views} icon={<Eye size={24} />}
          tooltip="Vezes que os formulários foram carregados no período" />
        <MetricCard titulo="Taxa de conversão" valor={`${metrics.conversion}%`} icon={<TrendingUp size={24} />}
          tooltip="Porcentagem de visualizações que resultaram em resposta" />
      </div>

      {loading && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <RefreshCw size={10} className="animate-spin" /> Atualizando...
        </div>
      )}
    </div>
  )
}
