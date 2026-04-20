'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FieldType } from '@/types'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Trash2, Copy, ZoomIn, ZoomOut, X } from 'lucide-react'
import { parseCanvasMeta } from '@/lib/utils'
import { createPortal } from 'react-dom'

const GRID_SIZE = 20
const DEFAULT_FIELD_SIZE = { w: 300, h: 80 }
const FIELD_TYPES: { tipo: FieldType; label: string }[] = [
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

export function CanvasMode({ readOnly }: { readOnly?: boolean }) {
  const { fields, addField, updateField, removeField, duplicateField, selectedFieldId, selectField } = useFormEditorStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Use refs for drag state to avoid re-renders during drag
  const dragState = useRef<{
    fieldId: string | null
    type: 'move' | 'resize'
    startX: number
    startY: number
    startMeta: { x: number; y: number; w: number; h: number }
  }>({ fieldId: null, type: 'move', startX: 0, startY: 0, startMeta: { x: 0, y: 0, w: 300, h: 80 } })

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

  const getFieldMeta = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    const idx = fields.findIndex(f => f.id === fieldId)
    return parseCanvasMeta(field?.canvas_meta) || {
      x: 40 + (idx * 40) % 600,
      y: 40 + (idx * 120) % 800,
      ...DEFAULT_FIELD_SIZE,
    }
  }, [fields])

  const handleMouseDown = useCallback((e: React.MouseEvent, fieldId: string, type: 'move' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    selectField(fieldId)
    const meta = getFieldMeta(fieldId)
    dragState.current = {
      fieldId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      startMeta: { ...meta },
    }
  }, [getFieldMeta, selectField])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { fieldId, type, startX, startY, startMeta } = dragState.current
    if (!fieldId) return

    const dx = (e.clientX - startX) / zoom
    const dy = (e.clientY - startY) / zoom

    if (type === 'move') {
      updateField(fieldId, {
        canvas_meta: {
          ...startMeta,
          x: snapToGrid(Math.max(0, startMeta.x + dx)),
          y: snapToGrid(Math.max(0, startMeta.y + dy)),
        }
      })
    } else {
      updateField(fieldId, {
        canvas_meta: {
          ...startMeta,
          w: snapToGrid(Math.max(120, startMeta.w + dx)),
          h: snapToGrid(Math.max(60, startMeta.h + dy)),
        }
      })
    }
  }, [updateField, zoom])

  const handleMouseUp = useCallback(() => {
    dragState.current.fieldId = null
  }, [])

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 p-1">
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-auto cursor-crosshair"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === canvasRef.current) selectField(null)
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', minWidth: '2000px', minHeight: '1500px', position: 'relative' }}>
          {fields.map((field) => {
            const meta = getFieldMeta(field.id)
            const isSelected = selectedFieldId === field.id

            return (
              <div
                key={field.id}
                className={`absolute bg-white border-2 rounded-lg shadow-sm cursor-move select-none ${
                  isSelected ? 'border-blue-500 shadow-blue-100 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ left: meta.x, top: meta.y, width: meta.w, height: meta.h }}
                onMouseDown={readOnly ? undefined : (e) => handleMouseDown(e, field.id, 'move')}
              >
                <div className="p-3 h-full flex flex-col justify-between overflow-hidden pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{field.label}</span>
                    <span className="text-[10px] text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded">{field.tipo}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {field.obrigatorio ? 'Obrigatório' : 'Opcional'}
                  </div>
                </div>

                {/* Resize handle */}
                {!readOnly && (
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                  onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                >
                  <svg className="absolute bottom-1 right-1 text-gray-300" width="8" height="8" viewBox="0 0 8 8">
                    <line x1="6" y1="2" x2="2" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="6" y1="5" x2="5" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                )}

                {/* Actions */}
                {isSelected && !readOnly && (
                  <div className="absolute -top-9 right-0 flex gap-1 bg-white border border-gray-200 rounded shadow-md p-0.5 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateField(field.id) }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Minimap */}
      <div className="absolute bottom-4 right-4 w-40 h-28 bg-white border border-gray-200 rounded-lg shadow-md p-2">
        <div className="relative w-full h-full bg-gray-50 rounded overflow-hidden">
          {fields.map(field => {
            const meta = parseCanvasMeta(field.canvas_meta)
            if (!meta) return null
            return (
              <div
                key={field.id}
                className="absolute bg-blue-200 rounded-sm"
                style={{
                  left: `${(meta.x / 2000) * 100}%`,
                  top: `${(meta.y / 1500) * 100}%`,
                  width: `${Math.max(1, (meta.w / 2000) * 100)}%`,
                  height: `${Math.max(1, (meta.h / 1500) * 100)}%`,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Add button */}
      {!readOnly && (
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={() => setShowAddMenu(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 text-sm"
        >
          + Campo
        </button>
      </div>
      )}

      {/* Modal via portal */}
      {showAddMenu && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
          onClick={() => setShowAddMenu(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Escolha o tipo de campo</h3>
              <button onClick={() => setShowAddMenu(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto">
              {FIELD_TYPES.map(({ tipo, label }) => (
                <button
                  key={tipo}
                  onClick={() => { addField(tipo); setShowAddMenu(false) }}
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
