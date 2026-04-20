'use client'

import { Field } from '@/types'

interface FormFieldProps {
  field: Field
  value: string | string[] | undefined
  error: string | undefined
  onChange: (value: string | string[]) => void
}

export function FormField({ field, value, error, onChange }: FormFieldProps) {
  const inputClass = `w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
  }`

  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1.5">
        {field.label}
        {field.obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {field.tipo === 'textarea' && (
        <textarea
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      )}

      {field.tipo === 'select' && (
        <select
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{field.placeholder || 'Selecione...'}</option>
          {(field.opcoes || []).map((op, i) => (
            <option key={i} value={op}>{op}</option>
          ))}
        </select>
      )}

      {field.tipo === 'radio' && (
        <div className="space-y-2">
          {(field.opcoes || []).map((op, i) => (
            <label key={i} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="radio"
                name={field.id}
                value={op}
                checked={(value as string) === op}
                onChange={e => onChange(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{op}</span>
            </label>
          ))}
        </div>
      )}

      {field.tipo === 'checkbox' && (
        <div className="space-y-2">
          {(field.opcoes || []).map((op, i) => {
            const checked = Array.isArray(value) && value.includes(op)
            return (
              <label key={i} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  value={op}
                  checked={checked}
                  onChange={e => {
                    const current = Array.isArray(value) ? [...value] : []
                    if (e.target.checked) {
                      onChange([...current, op])
                    } else {
                      onChange(current.filter(v => v !== op))
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{op}</span>
              </label>
            )
          })}
        </div>
      )}

      {field.tipo === 'date' && (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {field.tipo === 'file' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            onChange={e => {
              const file = e.target.files?.[0]
              onChange(file ? file.name : '')
            }}
            className="hidden"
            id={`file-${field.id}`}
          />
          <label htmlFor={`file-${field.id}`} className="cursor-pointer">
            <p className="text-sm text-gray-500">
              {(value as string) || 'Clique para selecionar um arquivo'}
            </p>
          </label>
        </div>
      )}

      {!['textarea', 'select', 'radio', 'checkbox', 'date', 'file'].includes(field.tipo) && (
        <input
          type={field.tipo === 'email' ? 'email' : field.tipo === 'phone' ? 'tel' : field.tipo === 'number' ? 'number' : 'text'}
          value={(value as string) || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className={inputClass}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
