import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, FileText, ExternalLink } from 'lucide-react'
import { FormActions } from './FormActions'

export default async function FormsPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')!

  const supabase = await createClient()

  const { data: forms } = await supabase
    .from('forms')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  const formIds = (forms || []).map(f => f.id)

  let responseCounts: Record<string, number> = {}
  if (formIds.length > 0) {
    const { data: responses } = await supabase
      .from('responses')
      .select('form_id')
      .in('form_id', formIds)
    responses?.forEach(r => {
      responseCounts[r.form_id] = (responseCounts[r.form_id] || 0) + 1
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulários</h1>
          <p className="text-gray-500 mt-1">{forms?.length || 0} formulários</p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Novo formulário
        </Link>
      </div>

      {forms && forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group">
              <Link href={`/dashboard/forms/${form.id}`} className="block p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${form.publicado ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {form.publicado ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{form.titulo}</h3>
                {form.descricao && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.descricao}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{responseCounts[form.id] || 0} respostas</span>
                  <span>{formatDate(form.updated_at)}</span>
                </div>
              </Link>
              <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                {form.publicado && (
                  <Link
                    href={`/f/${form.slug}`}
                    target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Abrir
                  </Link>
                )}
                <FormActions formId={form.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Crie seu primeiro formulário</h2>
          <p className="text-gray-500 mb-6">Comece do zero ou use IA para gerar automaticamente</p>
          <Link
            href="/dashboard/forms/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Plus size={18} />
            Criar formulário
          </Link>
        </div>
      )}
    </div>
  )
}
