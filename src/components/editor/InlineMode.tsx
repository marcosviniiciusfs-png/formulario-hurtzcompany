'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FieldType, Field } from '@/types'
import { parseOpcoes } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'

const fieldTypes: { tipo: FieldType; label: string }[] = [
  { tipo: 'text', label: 'Texto curto' },
  { tipo: 'textarea', label: 'Texto longo' },
  { tipo: 'email', label: 'Email' },
  { tipo: 'phone', label: 'Telefone' },
  { tipo: 'number', label: 'Número' },
  { tipo: 'date', label: 'Data' },
  { tipo: 'select', label: 'Seleção' },
  { tipo: 'radio', label: 'Escolha única' },
  { tipo: 'checkbox', label: 'Múltipla escolha' },
  { tipo: 'file', label: 'Upload' },
]

export function InlineMode({ readOnly }: { readOnly?: boolean }) {
  const { form, fields, addField, updateField, removeField, updateForm } = useFormEditorStore()
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!showAddModal) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowAddModal(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showAddModal])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-xl mx-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <input
                type="text"
                value={form.titulo}
                onChange={e => updateForm({ titulo: e.target.value })}
                placeholder="Título do formulário"
                className="w-full text-2xl font-bold text-gray-900 outline-none placeholder:text-gray-300 bg-transparent"
              />
              <input
                type="text"
                value={form.descricao}
                onChange={e => updateForm({ descricao: e.target.value })}
                placeholder="Descrição (opcional)"
                className="w-full mt-2 text-sm text-gray-500 outline-none placeholder:text-gray-300 bg-transparent"
              />
            </div>

            <div>
              {fields.map((field) => (
                <InlineFieldRow key={field.id} field={field} removeField={removeField} updateField={updateField} readOnly={readOnly} />
              ))}
            </div>

            {/* Add field button */}
            {!readOnly && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Plus size={16} />
                Adicionar campo
              </button>
            </div>
            )}
          </div>
          <div className="h-8" />
        </div>
      </div>

      {/* Modal rendered via portal */}
      {showAddModal && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
          onClick={() => setShowAddModal(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Escolha o tipo de campo</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto">
              {fieldTypes.map(({ tipo, label }) => (
                <button
                  key={tipo}
                  onClick={() => { addField(tipo as FieldType); setShowAddModal(false) }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function InlineFieldRow({ field, removeField, updateField, readOnly }: { field: Field; removeField: (id: string) => void; updateField: (id: string, data: Partial<Field>) => void; readOnly?: boolean }) {
  return (
    <div className="group border-b border-gray-100 last:border-b-0">
      <div className="flex items-start p-4 hover:bg-blue-50/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={field.label}
              onChange={e => updateField(field.id, { label: e.target.value })}
              disabled={readOnly}
              className="text-sm font-medium text-gray-800 outline-none hover:bg-gray-100 focus:bg-gray-100 rounded px-1 -ml-1 flex-1 bg-transparent"
            />
            {field.obrigatorio && <span className="text-red-500 text-sm">*</span>}
          </div>
          <InlineFieldPreview field={field} updateField={updateField} readOnly={readOnly} />
        </div>
        {!readOnly && (
        <button
          onClick={() => removeField(field.id)}
          className="ml-2 p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
        >
          <Trash2 size={14} />
        </button>
        )}
      </div>
    </div>
  )
}

function InlineFieldPreview({ field, updateField, readOnly }: { field: Field; updateField: (id: string, data: Partial<Field>) => void; readOnly?: boolean }) {
  const baseClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50"
  const opcoes = parseOpcoes(field.opcoes) || []

  switch (field.tipo) {
    case 'textarea':
      return <textarea className={`${baseClass} h-20 resize-none`} placeholder={field.placeholder || 'Texto longo...'} disabled />
    case 'select':
      return (
        <select className={baseClass} disabled>
          <option>{field.placeholder || 'Selecione...'}</option>
          {opcoes.map((op, i) => <option key={i}>{op}</option>)}
        </select>
      )
    case 'radio':
    case 'checkbox':
      return (
        <div className="space-y-1.5">
          {opcoes.map((op, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <input type={field.tipo === 'radio' ? 'radio' : 'checkbox'} disabled name={`preview-${field.id}`} />
              <input
                type="text"
                value={op}
                onChange={e => {
                  const newOpcoes = [...opcoes]
                  newOpcoes[i] = e.target.value
                  updateField(field.id, { opcoes: newOpcoes })
                }}
                disabled={readOnly}
                className="outline-none hover:bg-gray-100 focus:bg-gray-100 rounded px-1 bg-transparent text-sm text-gray-600 flex-1"
              />
              {!readOnly && (
              <button
                onClick={() => {
                  const newOpcoes = opcoes.filter((_, idx) => idx !== i)
                  updateField(field.id, { opcoes: newOpcoes.length > 0 ? newOpcoes : null })
                }}
                className="p-0.5 text-gray-300 hover:text-red-400 shrink-0"
              >
                <Trash2 size={11} />
              </button>
              )}
            </label>
          ))}
          {!readOnly && (
          <button
            type="button"
            onClick={() => updateField(field.id, { opcoes: [...opcoes, `Opção ${opcoes.length + 1}`] })}
            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
          >
            <Plus size={12} /> Adicionar
          </button>
          )}
        </div>
      )
    case 'date':
      return <input type="date" className={baseClass} disabled />
    case 'file':
      return <div className={`${baseClass} text-center py-6 border-dashed`}>Upload de arquivo</div>
    default:
      return <input type={field.tipo === 'email' ? 'email' : field.tipo === 'phone' ? 'tel' : field.tipo === 'number' ? 'number' : 'text'} className={baseClass} placeholder={field.placeholder || ''} disabled />
  }
}
