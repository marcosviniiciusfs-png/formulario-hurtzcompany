'use client'

import { Field } from '@/types'
import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { GripVertical, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { cn, parseOpcoes } from '@/lib/utils'

interface FieldCardProps {
  field: Field
  index: number
}

export function FieldCard({ field, index }: FieldCardProps) {
  const { selectedFieldId, selectField, removeField, duplicateField, reorderFields } = useFormEditorStore()
  const isSelected = selectedFieldId === field.id

  return (
    <div
      className={cn(
        'group border rounded-lg bg-white transition-colors',
        isSelected ? 'border-blue-500 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* Header row - clickable to toggle selection */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => selectField(isSelected ? null : field.id)}
      >
        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', index.toString())
            e.currentTarget.classList.add('opacity-50')
          }}
          onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
          draggable
        >
          <GripVertical size={18} />
        </div>

        <span className="text-xs font-medium text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded shrink-0">
          {field.tipo}
        </span>

        <span className="flex-1 text-sm text-gray-800 font-medium truncate">
          {field.label}
          {field.obrigatorio && <span className="text-red-500 ml-1">*</span>}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); duplicateField(field.id) }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {isSelected ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
      </div>

      {/* Expanded editor — stops click propagation so inputs work */}
      {isSelected && (
        <div
          className="px-4 pb-4 border-t border-gray-100"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="pt-3 space-y-3">
            <FieldEditorInline field={field} />
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        className="h-1"
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.style.backgroundColor = '#eff6ff'
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.backgroundColor = ''
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.style.backgroundColor = ''
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
          if (!isNaN(fromIndex)) {
            reorderFields(fromIndex, index)
          }
        }}
      />
    </div>
  )
}

function FieldEditorInline({ field }: { field: Field }) {
  const { updateField } = useFormEditorStore()
  const opcoes = parseOpcoes(field.opcoes) || []

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rótulo</label>
          <input
            type="text"
            value={field.label}
            onChange={e => updateField(field.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={e => updateField(field.id, { placeholder: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`req-${field.id}`}
          checked={field.obrigatorio}
          onChange={e => updateField(field.id, { obrigatorio: e.target.checked })}
          className="rounded border-gray-300 text-blue-600"
        />
        <label htmlFor={`req-${field.id}`} className="text-xs text-gray-600 cursor-pointer">Obrigatório</label>
      </div>

      {needsOptions(field.tipo) && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">Opções</label>
          <div className="space-y-1.5">
            {opcoes.map((opcao, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs text-gray-300 w-4 text-center">{idx + 1}</span>
                <input
                  type="text"
                  value={opcao}
                  onChange={e => {
                    const newOpcoes = [...opcoes]
                    newOpcoes[idx] = e.target.value
                    updateField(field.id, { opcoes: newOpcoes })
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <button
                  onClick={() => {
                    const newOpcoes = opcoes.filter((_, i) => i !== idx)
                    updateField(field.id, { opcoes: newOpcoes.length > 0 ? newOpcoes : null })
                  }}
                  className="p-1 text-gray-300 hover:text-red-500 rounded shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              updateField(field.id, { opcoes: [...opcoes, `Opção ${opcoes.length + 1}`] })
            }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Adicionar opção
          </button>
        </div>
      )}
    </>
  )
}

function needsOptions(tipo: string): boolean {
  return tipo === 'select' || tipo === 'checkbox' || tipo === 'radio'
}
