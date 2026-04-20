'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FieldTypeSelector } from './FieldTypeSelector'
import { FieldCard } from './FieldCard'

interface ListModeProps {
  readOnly?: boolean
}

export function ListMode({ readOnly }: ListModeProps) {
  const { fields, addField, selectedFieldId } = useFormEditorStore()

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable field list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-3">
          {fields.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">Nenhum campo adicionado</p>
              <p className="text-sm mt-1">Adicione campos usando o botão abaixo ou use a IA para gerar</p>
            </div>
          )}
          {fields.map((field, index) => (
            <FieldCard key={field.id} field={field} index={index} />
          ))}
          {/* Extra padding at bottom so last field is not hidden behind sticky button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Sticky add button at bottom */}
      {!readOnly && (
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <FieldTypeSelector onSelect={addField} />
        </div>
      </div>
      )}
    </div>
  )
}
