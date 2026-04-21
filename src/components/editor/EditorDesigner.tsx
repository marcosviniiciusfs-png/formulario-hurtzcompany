'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { useEffect, useState, useRef } from 'react'
import { Palette, RotateCcw, Type, Image, Droplets, Upload, Loader2, X } from 'lucide-react'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Padrão)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
]

const PRESET_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#475569', '#1e293b',
  '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#1e1e1e',
]

interface EditorDesignerProps {
  formId: string
}

export function EditorDesigner({ formId: _formId }: EditorDesignerProps) {
  const { form, fields, updateForm } = useFormEditorStore()
  const config = (form.configuracoes || {}) as Record<string, string>
  const [expandedColor, setExpandedColor] = useState<'bg' | 'header' | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateConfig = (key: string, value: string) => {
    updateForm({ configuracoes: { ...form.configuracoes, [key]: value } })
  }

  const resetDesign = () => {
    updateForm({ configuracoes: {} })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Apenas imagens são permitidas')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Máximo 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-banner', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateConfig('banner_url', data.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeBanner = () => {
    updateConfig('banner_url', '')
  }

  const bgColor = config.bgColor || '#f9fafb'
  const headerColor = config.headerColor || '#ffffff'
  const bannerUrl = config.banner_url || ''
  const fontFamily = config.font_family || 'Inter'
  const previewFields = fields.slice(0, 4)

  return (
    <div className="flex-1 flex min-h-0">
      {/* Controls */}
      <div className="w-80 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Palette size={16} /> Designer
            </h3>
            <button onClick={resetDesign}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RotateCcw size={12} /> Resetar
            </button>
          </div>
        </div>

        {/* Background Color */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Droplets size={13} /> Cor de fundo
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={e => updateConfig('bgColor', e.target.value)}
              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={config.bgColor || ''}
              onChange={e => updateConfig('bgColor', e.target.value)}
              placeholder="#f9fafb"
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg font-mono"
            />
            <button onClick={() => setExpandedColor(expandedColor === 'bg' ? null : 'bg')}
              className="p-1 rounded hover:bg-gray-100">
              <div className="w-5 h-5 rounded border border-gray-200" style={{ background: `conic-gradient(${PRESET_COLORS.join(', ')})` }} />
            </button>
          </div>
          {expandedColor === 'bg' && (
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => updateConfig('bgColor', c)}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${bgColor === c ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
        </div>

        {/* Banner / Header Image */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Image size={13} /> Imagem do cabeçalho
          </label>

          {bannerUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
              <img src={bannerUrl} alt="Banner" className="w-full h-28 object-cover" />
              <button onClick={removeBanner}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} />
              </button>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              <span className="text-xs">{uploading ? 'Enviando...' : 'Clique para enviar uma imagem'}</span>
              <span className="text-[10px] text-gray-300">PNG, JPG, WEBP (máx. 5MB)</span>
            </button>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

          {bannerUrl && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full text-xs text-gray-500 hover:text-gray-700 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              {uploading ? 'Enviando...' : 'Trocar imagem'}
            </button>
          )}

          {!bannerUrl && (
            <p className="text-[10px] text-gray-400">A imagem substitui a cor do cabeçalho quando definida.</p>
          )}
        </div>

        {/* Header Color (only shown when no banner) */}
        {!bannerUrl && (
          <div className="p-4 border-b border-gray-100 space-y-3">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Droplets size={13} /> Cor do cabeçalho
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={headerColor}
                onChange={e => updateConfig('headerColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.headerColor || ''}
                onChange={e => updateConfig('headerColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg font-mono"
              />
              <button onClick={() => setExpandedColor(expandedColor === 'header' ? null : 'header')}
                className="p-1 rounded hover:bg-gray-100">
                <div className="w-5 h-5 rounded border border-gray-200" style={{ background: `conic-gradient(${PRESET_COLORS.join(', ')})` }} />
              </button>
            </div>
            {expandedColor === 'header' && (
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => updateConfig('headerColor', c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${headerColor === c ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Font Family */}
        <div className="p-4 space-y-3">
          <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Type size={13} /> Fonte
          </label>
          <select
            value={fontFamily}
            onChange={e => updateConfig('font_family', e.target.value)}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 bg-gray-200 p-6 overflow-auto">
        <div className="mx-auto" style={{ maxWidth: 420 }}>
          <div
            className="rounded-xl shadow-lg overflow-hidden"
            style={{
              backgroundColor: bgColor,
              fontFamily: fontFamily !== 'Inter' ? `'${fontFamily}', sans-serif` : undefined,
            }}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header: banner image OR color */}
              {bannerUrl ? (
                <div className="relative">
                  <img src={bannerUrl} alt="Banner" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-base font-bold text-white drop-shadow-md truncate">
                      {form.titulo || 'Título do formulário'}
                    </h3>
                    {form.descricao && (
                      <p className="text-white/80 text-xs mt-1 line-clamp-2 drop-shadow-sm">{form.descricao}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 border-b border-gray-100" style={{ backgroundColor: headerColor || undefined }}>
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {form.titulo || 'Título do formulário'}
                  </h3>
                  {form.descricao && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">{form.descricao}</p>
                  )}
                </div>
              )}
              {/* Fields Preview */}
              <div className="p-5 space-y-3">
                {previewFields.length > 0 ? previewFields.map(f => (
                  <div key={f.id}>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      {f.label}
                      {f.obrigatorio && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <div className="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg px-2.5 flex items-center">
                      <span className="text-[11px] text-gray-300">{f.placeholder || f.label}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-300 text-xs">
                    Adicione campos no Editor para visualizar
                  </div>
                )}
                <div className="pt-2">
                  <div className="w-full h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Enviar</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3 pb-2">
              Criado com Hurtz Forms
            </p>
          </div>
        </div>
      </div>

      <FontLoader fontFamily={fontFamily} />
    </div>
  )
}

function FontLoader({ fontFamily }: { fontFamily: string }) {
  useEffect(() => {
    if (fontFamily && fontFamily !== 'Inter') {
      const existing = document.querySelector(`link[data-hurtz-font="${fontFamily}"]`)
      if (existing) return
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
      link.rel = 'stylesheet'
      link.setAttribute('data-hurtz-font', fontFamily)
      document.head.appendChild(link)
    }
  }, [fontFamily])

  return null
}
