'use client'

import { FormWithFields, Response as FormResponse } from '@/types'
import { formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

interface ResponsesClientProps {
  form: FormWithFields
  responses: FormResponse[]
}

export function ResponsesClient({ form, responses }: ResponsesClientProps) {
  const fields = form.fields?.sort((a, b) => a.ordem - b.ordem) || []

  const exportCSV = () => {
    const headers = ['Data', ...fields.map(f => f.label)]
    const rows = responses.map(r => {
      const data = r.respostas as Record<string, string>
      return [
        formatDate(r.created_at),
        ...fields.map(f => {
          const val = data[f.id]
          return Array.isArray(val) ? val.join('; ') : (val || '')
        }),
      ]
    })

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.slug}-respostas.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Respostas</h1>
          <p className="text-gray-500 mt-1">{form.titulo} — {responses.length} respostas</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={responses.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {responses.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                  {fields.map(field => (
                    <th key={field.id} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responses.map(response => {
                  const data = response.respostas as Record<string, string>
                  return (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(response.created_at)}
                      </td>
                      {fields.map(field => (
                        <td key={field.id} className="px-4 py-3 text-sm text-gray-700">
                          {Array.isArray(data[field.id])
                            ? (data[field.id] as unknown as string[]).join(', ')
                            : (data[field.id] || '—')}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Nenhuma resposta ainda</p>
          <p className="text-sm mt-1">As respostas aparecerão aqui quando alguém enviar o formulário</p>
        </div>
      )}
    </div>
  )
}
