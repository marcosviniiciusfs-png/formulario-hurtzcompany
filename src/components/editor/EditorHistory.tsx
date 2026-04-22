'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, Loader2, User } from 'lucide-react'

interface ActivityEntry {
  id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  user_id: string | null
  collaborator_id: string | null
  user_nome: string | null
  user_avatar: string | null
}

interface EditorHistoryProps {
  formId: string
}

const ACTION_LABELS: Record<string, string> = {
  form_created: 'criou o formulário',
  form_updated: 'atualizou o formulário',
  form_published: 'publicou o formulário',
  form_unpublished: 'despublicou o formulário',
  field_added: 'adicionou um campo',
  field_updated: 'editou um campo',
  field_removed: 'removeu um campo',
  design_updated: 'alterou o design',
  collaborator_added: 'adicionou um colaborador',
  collaborator_removed: 'removeu um colaborador',
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  return new Date(date).toLocaleDateString('pt-BR')
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

export function EditorHistory({ formId }: EditorHistoryProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${formId}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (formId && formId !== 'new') fetchActivities()
  }, [formId, fetchActivities])

  if (formId === 'new') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Salve o formulário para ver o histórico
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
        <Clock size={32} />
        <p className="text-sm">Nenhuma atividade registrada</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={16} /> Histórico de atividades
        </h3>
        <div className="space-y-0">
          {activities.map(entry => {
            const nome = entry.user_nome || 'Usuário'
            const actionText = ACTION_LABELS[entry.action] || entry.action
            const details = entry.details?.label ? `"${entry.details.label}"` : ''

            return (
              <div key={entry.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="shrink-0 mt-0.5">
                  {entry.user_avatar ? (
                    <img src={entry.user_avatar as string} alt={nome} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-semibold">
                      {getInitials(nome)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{nome}</span>
                    {' '}{actionText}
                    {details && <span className="text-gray-500"> {details}</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(entry.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
