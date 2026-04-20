'use client'

import { useState, useEffect, useCallback } from 'react'
import { CollabRole, Collaborator } from '@/types'
import { Plus, Trash2, Copy, Check, Users, Loader2, Clock } from 'lucide-react'

interface EditorSharingProps {
  formId: string
  slug: string
}

const ROLE_LABELS: Record<CollabRole, { label: string; color: string }> = {
  editor: { label: 'Editor', color: 'bg-blue-50 text-blue-700' },
  viewer: { label: 'Ver respostas', color: 'bg-green-50 text-green-700' },
  readonly: { label: 'Somente leitura', color: 'bg-gray-100 text-gray-600' },
}

export function EditorSharing({ formId, slug }: EditorSharingProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'viewer' as CollabRole, expires_at: '' })

  const fetchCollaborators = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`)
      if (res.ok) {
        const data = await res.json()
        setCollaborators(data)
      }
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (formId !== 'new') fetchCollaborators()
  }, [formId, fetchCollaborators])

  const handleAdd = async () => {
    if (!form.email || !form.senha || !form.nome) return
    setAdding(true)
    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          role: form.role,
          expires_at: form.expires_at || null,
        }),
      })
      if (res.ok) {
        setForm({ nome: '', email: '', senha: '', role: 'viewer', expires_at: '' })
        fetchCollaborators()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao adicionar')
      }
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (cid: string) => {
    if (!confirm('Remover acesso desta pessoa?')) return
    await fetch(`/api/forms/${formId}/collaborators/${cid}`, { method: 'DELETE' })
    fetchCollaborators()
  }

  const copyLink = () => {
    const url = `${window.location.origin}/f/${slug}/collab`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (formId === 'new') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Salve o formulário para compartilhar
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* Share link */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} /> Link de compartilhamento
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${slug}/collab`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50"
            />
            <button onClick={copyLink}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shrink-0">
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Envie este link para a pessoa que deve acessar o formulário.</p>
        </div>

        {/* Add collaborator */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Plus size={16} /> Adicionar pessoa
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Senha de acesso"
              value={form.senha}
              onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as CollabRole }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="editor">Edição completa</option>
              <option value="viewer">Ver respostas</option>
              <option value="readonly">Somente leitura</option>
            </select>
            <input
              type="datetime-local"
              placeholder="Expira em (opcional)"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-2"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !form.email || !form.senha || !form.nome}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar
          </button>
        </div>

        {/* Collaborator list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pessoas com acesso ({collaborators.length})</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Nenhuma pessoa com acesso ainda
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {collaborators.map(collab => (
                <div key={collab.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {collab.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{collab.nome}</p>
                      <p className="text-xs text-gray-400 truncate">{collab.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_LABELS[collab.role].color}`}>
                      {ROLE_LABELS[collab.role].label}
                    </span>
                    {collab.expires_at && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5" title={`Expira em ${new Date(collab.expires_at).toLocaleString('pt-BR')}`}>
                        <Clock size={10} />
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(collab.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}