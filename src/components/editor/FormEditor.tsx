'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { ListMode } from './ListMode'
import { InlineMode } from './InlineMode'
import { CanvasMode } from './CanvasMode'
import { FieldProperties } from './FieldProperties'
import { EditorResponses } from './EditorResponses'
import { EditorSharing } from './EditorSharing'
import { FieldType, CollabRole } from '@/types'
import { List, FileText, LayoutGrid, Save, Eye, Rocket, Sparkles, Loader2, MessageSquare, Copy, Check, Share2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

interface FormEditorProps {
  formId: string
  collabRole?: CollabRole | null
}

export function FormEditor({ formId, collabRole }: FormEditorProps) {
  const { form, fields, editMode, setEditMode, selectedFieldId, updateForm } = useFormEditorStore()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'responses' | 'sharing'>('editor')
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const router = useRouter()

  const selectedField = fields.find(f => f.id === selectedFieldId)

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const isOwner = !collabRole
  const canEdit = isOwner || collabRole === 'editor'
  const canViewResponses = isOwner || collabRole === 'editor' || collabRole === 'viewer'

  const handleSave = async () => {
    if (!form.titulo.trim()) return showToast('O formulário precisa de um título', 'err')
    setSaving(true)
    try {
      const isNew = !formId || formId === 'new'
      const url = isNew ? '/api/forms' : `/api/forms/${formId}`
      const slug = form.slug || generateSlug(form.titulo)

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao || null,
          slug,
          publicado: form.publicado,
          configuracoes: form.configuracoes,
          fields: fields.map(f => ({
            tipo: f.tipo, label: f.label, placeholder: f.placeholder,
            obrigatorio: f.obrigatorio, opcoes: f.opcoes, ordem: f.ordem, canvas_meta: f.canvas_meta,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      if (isNew && data.id) router.replace(`/dashboard/forms/${data.id}`)
      if (data.fields) useFormEditorStore.getState().loadForm(data, data.fields)
      showToast('Salvo com sucesso!')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao salvar', 'err')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const slug = form.slug || generateSlug(form.titulo)
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo, descricao: form.descricao, slug,
          publicado: !form.publicado, configuracoes: form.configuracoes,
          fields: fields.map(f => ({
            tipo: f.tipo, label: f.label, placeholder: f.placeholder,
            obrigatorio: f.obrigatorio, opcoes: f.opcoes, ordem: f.ordem, canvas_meta: f.canvas_meta,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      if (data.fields) useFormEditorStore.getState().loadForm(data, data.fields)
      showToast(form.publicado ? 'Formulário despublicado' : 'Publicado com sucesso!')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao publicar', 'err')
    } finally {
      setPublishing(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro IA') }
      const data = await res.json()
      const newFields = (data.fields || []).map((f: Record<string, unknown>, i: number) => ({
        id: Math.random().toString(36).substring(2, 10),
        form_id: formId !== 'new' ? formId : '',
        tipo: f.tipo as FieldType, label: (f.label as string) || 'Campo',
        placeholder: (f.placeholder as string) || null,
        obrigatorio: (f.obrigatorio as boolean) || false,
        opcoes: Array.isArray(f.opcoes) ? f.opcoes as string[] : null,
        ordem: i + 1, logica: null, canvas_meta: null,
        created_at: new Date().toISOString(),
      }))
      useFormEditorStore.getState().loadForm({
        id: formId !== 'new' ? formId : '', titulo: data.titulo || form.titulo,
        descricao: data.descricao || '', slug: form.slug || '', user_id: '',
        publicado: false, configuracoes: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, newFields)
      setAiPrompt(''); setShowAiPanel(false)
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro com IA', 'err')
    } finally {
      setAiLoading(false)
    }
  }

  const copyLink = () => {
    const slug = form.slug || generateSlug(form.titulo)
    const url = `${window.location.origin}/f/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modeButtons = [
    { mode: 'list' as const, icon: <List size={14} />, label: 'Lista' },
    { mode: 'inline' as const, icon: <FileText size={14} />, label: 'Inline' },
    { mode: 'canvas' as const, icon: <LayoutGrid size={14} />, label: 'Canvas' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="px-4 py-2 flex items-center justify-between">
          <input
            type="text"
            value={form.titulo}
            onChange={e => updateForm({ titulo: e.target.value })}
            placeholder="Título do formulário"
            className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none flex-1 max-w-md"
          />
          <div className="flex items-center gap-2">
            {canEdit && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {modeButtons.map(({ mode, icon, label }) => (
                <button key={mode} onClick={() => setEditMode(mode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${editMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {icon} <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            )}
            {isOwner && (
            <button onClick={() => setShowAiPanel(!showAiPanel)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <Sparkles size={14} /> <span className="hidden sm:inline">IA</span>
            </button>
            )}
            {canEdit && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
            </button>
            )}
            {isOwner && formId !== 'new' && (
              <button onClick={handlePublish} disabled={publishing}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${form.publicado ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {publishing ? <Loader2 size={14} className="animate-spin" /> : form.publicado ? <Eye size={14} /> : <Rocket size={14} />}
                {form.publicado ? 'Publicado' : 'Publicar'}
              </button>
            )}
            {isOwner && form.publicado && (
              <button onClick={copyLink}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-1">
          <button onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${activeTab === 'editor' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Editor
          </button>
          {canViewResponses && (
          <button onClick={() => setActiveTab('responses')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1 ${activeTab === 'responses' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <MessageSquare size={12} /> Respostas
          </button>
          )}
          {isOwner && (
          <button onClick={() => setActiveTab('sharing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1 ${activeTab === 'sharing' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Share2 size={12} /> Compartilhar
          </button>
          )}
        </div>
      </div>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="shrink-0 bg-purple-50 border-b border-purple-100 px-4 py-2">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              placeholder="Descreva o formulário... (ex: Formulário para captar leads imobiliários)"
              className="flex-1 px-3 py-1.5 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
            <button onClick={handleAiGenerate} disabled={aiLoading}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1">
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gerar
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`shrink-0 px-4 py-2 text-xs text-center ${toast.type === 'err' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {activeTab === 'editor' ? (
          <>
            <div className="flex-1 min-h-0 flex flex-col">
              {editMode === 'list' && <ListMode readOnly={!canEdit} />}
              {editMode === 'inline' && <InlineMode readOnly={!canEdit} />}
              {editMode === 'canvas' && <CanvasMode readOnly={!canEdit} />}
            </div>
            {selectedField && editMode === 'list' && <FieldProperties field={selectedField} />}
          </>
        ) : activeTab === 'responses' ? (
          <EditorResponses formId={formId} />
        ) : (
          <EditorSharing formId={formId} slug={form.slug || generateSlug(form.titulo)} />
        )}
      </div>
    </div>
  )
}
