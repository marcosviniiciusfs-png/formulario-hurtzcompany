'use client'

import { Field } from '@/types'
import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { Trash2, Copy } from 'lucide-react'
import { parseOpcoes } from '@/lib/utils'

interface FieldPropertiesProps {
  field: Field
}

export function FieldProperties({ field }: FieldPropertiesProps) {
  const { updateField, removeField, duplicateField } = useFormEditorStore()

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Propriedades</h3>
        <div className="flex gap-1">
          <button
            onClick={() => duplicateField(field.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Duplicar"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => removeField(field.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Remover"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rótulo</label>
          <input
            type="text"
            value={field.label}
            onChange={e => updateField(field.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={e => updateField(field.id, { placeholder: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${field.id}`}
            checked={field.obrigatorio}
            onChange={e => updateField(field.id, { obrigatorio: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700">
            Campo obrigatório
          </label>
        </div>

        {needsOptions(field.tipo) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opções</label>
            <div className="space-y-2">
              {(parseOpcoes(field.opcoes) || []).map((opcao, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={opcao}
                    onChange={e => {
                      const current = parseOpcoes(field.opcoes) || []
                      const newOpcoes = [...current]
                      newOpcoes[index] = e.target.value
                      updateField(field.id, { opcoes: newOpcoes })
                    }}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const current = parseOpcoes(field.opcoes) || []
                      const newOpcoes = current.filter((_, i) => i !== index)
                      updateField(field.id, { opcoes: newOpcoes })
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const current = parseOpcoes(field.opcoes) || []
                  updateField(field.id, { opcoes: [...current, `Opção ${current.length + 1}`] })
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Adicionar opção
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function needsOptions(tipo: string): boolean {
  return tipo === 'select' || tipo === 'checkbox' || tipo === 'radio'
}
