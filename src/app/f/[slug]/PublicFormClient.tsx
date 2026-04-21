'use client'

import { FormWithFields } from '@/types'
import { useState, useEffect } from 'react'
import { FormField } from '@/components/form/FormField'
import { ThankYou } from '@/components/form/ThankYou'
import { Loader2, Send } from 'lucide-react'

interface PublicFormClientProps {
  form: FormWithFields
}

export function PublicFormClient({ form }: PublicFormClientProps) {
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fields = (form.fields || []).sort((a, b) => a.ordem - b.ordem)

  const handleChange = (fieldId: string, value: string | string[]) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      if (field.obrigatorio) {
        const val = responses[field.id]
        if (!val || (typeof val === 'string' && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = 'Este campo é obrigatório'
        }
      }
      if (field.tipo === 'email' && responses[field.id] && typeof responses[field.id] === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(responses[field.id] as string)) {
          newErrors[field.id] = 'Email inválido'
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_id: form.id, respostas: responses }),
      })
      if (!res.ok) throw new Error('Submit failed')
      setSubmitted(true)
    } catch {
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return <ThankYou titulo={form.titulo} />
  }

  const config = (form.configuracoes || {}) as Record<string, string>

  useEffect(() => {
    if (config.font_family && config.font_family !== 'Inter') {
      const existing = document.querySelector(`link[data-hurtz-font="${config.font_family}"]`)
      if (existing) return
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${config.font_family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`
      link.rel = 'stylesheet'
      link.setAttribute('data-hurtz-font', config.font_family)
      document.head.appendChild(link)
    }
  }, [config.font_family])

  return (
    <div className="min-h-screen bg-gray-50" style={{
      backgroundColor: config.bgColor || undefined,
      fontFamily: config.font_family && config.font_family !== 'Inter' ? `'${config.font_family}', sans-serif` : undefined,
    }}>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header: banner image OR color */}
          {config.banner_url ? (
            <div className="relative">
              <img src={config.banner_url} alt="Banner" className="w-full h-52 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-2xl font-bold text-white drop-shadow-md">{form.titulo}</h1>
                {form.descricao && <p className="text-white/80 mt-2 drop-shadow-sm">{form.descricao}</p>}
              </div>
            </div>
          ) : (
            <div className="p-8 border-b border-gray-100" style={{ backgroundColor: config.headerColor || undefined }}>
              <h1 className="text-2xl font-bold text-gray-900">{form.titulo}</h1>
              {form.descricao && <p className="text-gray-500 mt-2">{form.descricao}</p>}
            </div>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {fields.map(field => (
              <FormField
                key={field.id}
                field={field}
                value={responses[field.id]}
                error={errors[field.id]}
                onChange={(value) => handleChange(field.id, value)}
              />
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Enviar
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Criado com Hurtz Forms
        </p>
      </div>
    </div>
  )
}
