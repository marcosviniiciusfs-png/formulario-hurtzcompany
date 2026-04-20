'use client'

import { useRouter } from 'next/navigation'
import { Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function FormActions({ formId }: { formId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDuplicate = async () => {
    setLoading('duplicate')
    await fetch(`/api/forms/${formId}/duplicate`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) return
    setLoading('delete')
    await fetch(`/api/forms/${formId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2 ml-auto">
      <button
        onClick={handleDuplicate}
        disabled={loading === 'duplicate'}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-50"
      >
        <Copy size={12} />
        Duplicar
      </button>
      <button
        onClick={handleDelete}
        disabled={loading === 'delete'}
        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
      >
        <Trash2 size={12} />
        Excluir
      </button>
    </div>
  )
}
