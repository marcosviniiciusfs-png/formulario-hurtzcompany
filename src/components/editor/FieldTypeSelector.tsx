'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FieldType } from '@/types'
import {
  Type, Mail, Phone, List, CheckSquare, Circle, Calendar,
  Upload, AlignLeft, Hash, Plus, X
} from 'lucide-react'

const fieldTypes: { tipo: FieldType; label: string; icon: React.ReactNode }[] = [
  { tipo: 'text', label: 'Texto curto', icon: <Type size={18} /> },
  { tipo: 'textarea', label: 'Texto longo', icon: <AlignLeft size={18} /> },
  { tipo: 'email', label: 'Email', icon: <Mail size={18} /> },
  { tipo: 'phone', label: 'Telefone', icon: <Phone size={18} /> },
  { tipo: 'number', label: 'Número', icon: <Hash size={18} /> },
  { tipo: 'date', label: 'Data', icon: <Calendar size={18} /> },
  { tipo: 'select', label: 'Seleção', icon: <List size={18} /> },
  { tipo: 'radio', label: 'Escolha única', icon: <Circle size={18} /> },
  { tipo: 'checkbox', label: 'Múltipla escolha', icon: <CheckSquare size={18} /> },
  { tipo: 'file', label: 'Upload', icon: <Upload size={18} /> },
]

interface FieldTypeSelectorProps {
  onSelect: (tipo: FieldType) => void
}

export function FieldTypeSelector({ onSelect }: FieldTypeSelectorProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={18} />
        Adicionar campo
      </button>
      {open && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Escolha o tipo de campo</h3>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto">
              {fieldTypes.map(({ tipo, label, icon }) => (
                <button
                  key={tipo}
                  onClick={() => { onSelect(tipo); setOpen(false) }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left"
                >
                  <span className="text-gray-400 shrink-0">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
