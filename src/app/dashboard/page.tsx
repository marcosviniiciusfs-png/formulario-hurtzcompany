import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FileText, MessageSquare, Eye, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  const supabase = await createClient()

  const { data: forms } = await supabase
    .from('forms')
    .select('id')
    .eq('user_id', userId!)

  const formIds = (forms || []).map(f => f.id)
  const safeIds = formIds.length > 0 ? formIds : ['00000000-0000-0000-0000-000000000000']

  const [responseResult, viewResult, recentFormsResult] = await Promise.all([
    supabase.from('responses').select('*', { count: 'exact', head: true }).in('form_id', safeIds),
    supabase.from('form_views').select('*', { count: 'exact', head: true }).in('form_id', safeIds),
    supabase.from('forms').select('*').eq('user_id', userId!).order('updated_at', { ascending: false }).limit(5),
  ])

  const responseCount = responseResult.count || 0
  const viewCount = viewResult.count || 0
  const conversionRate = viewCount > 0 ? ((responseCount / viewCount) * 100).toFixed(1) : '0'
  const recentForms = recentFormsResult.data

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Visão geral</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao Hurtz Forms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard titulo="Formulários" valor={forms?.length || 0} icon={<FileText size={24} />} />
        <MetricCard titulo="Respostas" valor={responseCount} icon={<MessageSquare size={24} />} />
        <MetricCard titulo="Visualizações" valor={viewCount} icon={<Eye size={24} />} />
        <MetricCard titulo="Taxa de conversão" valor={`${conversionRate}%`} icon={<TrendingUp size={24} />} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Formulários recentes</h2>
          <Link href="/dashboard/forms" className="text-sm text-blue-600 hover:text-blue-700">Ver todos</Link>
        </div>
        {recentForms && recentForms.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentForms.map(form => (
              <Link key={form.id} href={`/dashboard/forms/${form.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{form.titulo}</p>
                  <p className="text-sm text-gray-400 mt-0.5">Atualizado em {formatDate(form.updated_at)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${form.publicado ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {form.publicado ? 'Publicado' : 'Rascunho'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum formulário ainda</p>
            <Link href="/dashboard/forms/new" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
              Criar primeiro formulário
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
