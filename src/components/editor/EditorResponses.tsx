'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { useEffect, useState, useCallback } from 'react'
import { Download, Inbox, RefreshCw } from 'lucide-react'

interface ResponseData {
  id: string
  respostas: Record<string, string | string[]>
  created_at: string
}

interface EditorResponsesProps {
  formId: string
}

export function EditorResponses({ formId }: EditorResponsesProps) {
  const { fields } = useFormEditorStore()
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/responses?form_id=${formId}`)
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao carregar respostas')
      }
      const data = await res.json()
      setResponses(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (formId && formId !== 'new') fetchResponses()
  }, [formId, fetchResponses])

  const exportCSV = () => {
    const sortedFields = [...fields].sort((a, b) => a.ordem - b.ordem)
    const headers = ['Data', ...sortedFields.map(f => f.label)]
    const rows = responses.map(r => {
      const date = new Date(r.created_at).toLocaleString('pt-BR')
      const values = sortedFields.map(f => {
        const v = r.respostas[f.id]
        if (Array.isArray(v)) return v.join('; ')
        return v || ''
      })
      return [date, ...values]
    })

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respostas-${formId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (formId === 'new') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Salve o formulário para ver as respostas
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={fetchResponses} className="text-xs text-blue-600 hover:underline">Tentar novamente</button>
      </div>
    )
  }

  if (responses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
        <Inbox size={32} />
        <p className="text-sm">Nenhuma resposta ainda</p>
      </div>
    )
  }

  const sortedFields = [...fields].sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-between border-b border-gray-200 bg-white">
        <span className="text-xs text-gray-500">{responses.length} resposta{responses.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={fetchResponses} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 w-36">Data</th>
              {sortedFields.map(f => (
                <th key={f.id} className="text-left px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </td>
                {sortedFields.map(f => {
                  const v = r.respostas[f.id]
                  const display = Array.isArray(v) ? v.join(', ') : (v || '—')
                  return (
                    <td key={f.id} className="px-4 py-2.5 text-gray-700 text-xs max-w-[200px] truncate">
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
