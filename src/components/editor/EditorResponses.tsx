'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Download, Inbox, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

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
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null)
  const [cellPopover, setCellPopover] = useState<{ rect: DOMRect; content: string } | null>(null)
  const [copiedCell, setCopiedCell] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const sortedFields = useMemo(() => [...fields].sort((a, b) => a.ordem - b.ordem), [fields])

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

  useEffect(() => {
    if (!cellPopover) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCellPopover(null) }
    const handleClick = () => setCellPopover(null)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleClick, true)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleClick, true)
    }
  }, [cellPopover])

  const sortedResponses = useMemo(() => {
    if (!sortField) return responses
    return [...responses].sort((a, b) => {
      if (sortField === 'created_at') {
        return sortDir === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      const va = String(a.respostas[sortField] || '')
      const vb = String(b.respostas[sortField] || '')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [responses, sortField, sortDir])

  const toggleSort = (fieldId: string) => {
    if (sortField === fieldId) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(fieldId)
      setSortDir('asc')
    }
  }

  const todayCount = useMemo(() => {
    const today = new Date().toDateString()
    return responses.filter(r => new Date(r.created_at).toDateString() === today).length
  }, [responses])

  const weekCount = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return responses.filter(r => new Date(r.created_at) >= weekAgo).length
  }, [responses])

  const exportCSV = () => {
    const headers = ['Data', ...sortedFields.map(f => f.label)]
    const rows = sortedResponses.map(r => {
      const date = new Date(r.created_at).toLocaleString('pt-BR')
      const values = sortedFields.map(f => {
        const v = r.respostas[f.id]
        if (Array.isArray(v)) return v.join('; ')
        return v || ''
      })
      return [date, ...values]
    })
    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(',')
    ).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respostas-${formId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="text-gray-300" />
    return sortDir === 'asc' ? <ArrowUp size={10} className="text-blue-500" /> : <ArrowDown size={10} className="text-blue-500" />
  }

  const getCellValue = (r: ResponseData, fieldId: string) => {
    const v = r.respostas[fieldId]
    if (Array.isArray(v)) return v.join(', ')
    return v || ''
  }

  const handleCellClick = (e: React.MouseEvent, r: ResponseData, fieldId: string) => {
    e.stopPropagation()
    const content = getCellValue(r, fieldId)
    if (!content) return
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setCellPopover({ rect, content })
  }

  const copyCellContent = async () => {
    if (!cellPopover) return
    await navigator.clipboard.writeText(cellPopover.content)
    setCopiedCell(true)
    setTimeout(() => setCopiedCell(false), 1500)
  }

  const selectedResponseIndex = selectedResponse
    ? sortedResponses.findIndex(r => r.id === selectedResponse.id)
    : -1

  const navigateResponse = (dir: -1 | 1) => {
    const next = selectedResponseIndex + dir
    if (next >= 0 && next < sortedResponses.length) {
      setSelectedResponse(sortedResponses[next])
    }
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Stats Bar */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-between border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-700">{responses.length} resposta{responses.length !== 1 ? 's' : ''}</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500">{todayCount} hoje</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500">{weekCount} esta semana</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchResponses} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Atualizar">
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr className="border-b-2 border-gray-400 bg-gray-100">
              <th className="sticky left-0 z-30 bg-gray-100 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-44 min-w-[176px] border-r-2 border-gray-400">
                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-gray-800">
                  Data/Hora <SortIcon field="created_at" />
                </button>
              </th>
              {sortedFields.map(f => (
                <th key={f.id} className="sticky top-0 z-20 bg-gray-100 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 min-w-[160px] border-r border-gray-300">
                  <button onClick={() => toggleSort(f.id)} className="flex items-center gap-1 hover:text-gray-800 whitespace-nowrap">
                    <span className="truncate max-w-[140px]">{f.label}</span>
                    <SortIcon field={f.id} />
                  </button>
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-gray-100 min-w-[40px] border-l border-gray-300" />
            </tr>
          </thead>
          <tbody>
            {sortedResponses.map((r, ri) => (
              <tr
                key={r.id}
                onClick={() => setSelectedResponse(r)}
                className={`cursor-pointer border-b border-gray-300 group ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="sticky left-0 z-10 bg-inherit group-hover:bg-blue-100/60 px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap border-r-2 border-gray-400 font-mono">
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </td>
                {sortedFields.map(f => {
                  const val = getCellValue(r, f.id)
                  return (
                    <td key={f.id}
                      onClick={e => handleCellClick(e, r, f.id)}
                      className={`px-3 py-2.5 text-xs border-r border-gray-200 max-w-[200px] truncate ${val ? 'text-gray-700 cursor-pointer hover:bg-blue-100/60' : 'text-gray-300'}`}>
                      {val || '—'}
                    </td>
                  )
                })}
                <td className="border-l border-gray-200" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell Popover */}
      {cellPopover && createPortal(
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-sm"
          style={{ top: cellPopover.rect.bottom + 4, left: Math.min(cellPopover.rect.left, window.innerWidth - 340) }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Conteúdo</span>
            <button onClick={copyCellContent} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700">
              {copiedCell ? <Check size={10} /> : <Copy size={10} />} {copiedCell ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-gray-700 whitespace-pre-wrap break-words max-h-40 overflow-auto">{cellPopover.content}</p>
          <button onClick={() => setCellPopover(null)} className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-gray-600 shadow-sm">
            <X size={10} />
          </button>
        </div>,
        document.body
      )}

      {/* Response Detail Modal */}
      {selectedResponse && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedResponse(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Detalhe da resposta</h3>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedResponse.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {sortedFields.map((f, i) => {
                const val = selectedResponse.respostas[f.id]
                const display = Array.isArray(val) ? val : (val || '')
                return (
                  <div key={f.id} className="flex gap-4">
                    <div className="w-36 shrink-0">
                      <span className="text-xs font-medium text-gray-500">{f.label}</span>
                      <span className="text-[10px] text-gray-300 ml-1">#{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {Array.isArray(val) && val.length > 0 ? (
                        <ul className="space-y-1">
                          {val.map((v, vi) => (
                            <li key={vi} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">{v}</li>
                          ))}
                        </ul>
                      ) : display ? (
                        <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{display}</p>
                      ) : (
                        <span className="text-xs text-gray-300">Sem resposta</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Modal Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => navigateResponse(-1)}
                disabled={selectedResponseIndex <= 0}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="text-xs text-gray-400">{selectedResponseIndex + 1} de {sortedResponses.length}</span>
              <button
                onClick={() => navigateResponse(1)}
                disabled={selectedResponseIndex >= sortedResponses.length - 1}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
