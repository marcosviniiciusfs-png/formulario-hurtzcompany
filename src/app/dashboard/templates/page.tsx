'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, Fragment } from 'react'
import { FileText, Building2, MessageSquare, Star, Users, ShoppingCart, Loader2 } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Building2,
  Star,
  MessageSquare,
  Users,
  ShoppingCart,
}

const templates = [
  {
    titulo: 'Captura de Leads Imobiliários',
    descricao: 'Formulário para captar leads do setor imobiliário',
    icon: 'Building2',
    fields: [
      { tipo: 'text', label: 'Nome completo', obrigatorio: true },
      { tipo: 'email', label: 'Email', obrigatorio: true },
      { tipo: 'phone', label: 'Telefone', obrigatorio: true },
      { tipo: 'select', label: 'Tipo de imóvel', opcoes: ['Apartamento', 'Casa', 'Terreno', 'Comercial'] },
      { tipo: 'text', label: 'Cidade de interesse' },
      { tipo: 'select', label: 'Faixa de valor', opcoes: ['Até R$200mil', 'R$200mil - R$500mil', 'R$500mil - R$1mi', 'Acima de R$1mi'] },
    ],
  },
  {
    titulo: 'Pesquisa de Satisfação',
    descricao: 'Avalie a satisfação dos seus clientes',
    icon: 'Star',
    fields: [
      { tipo: 'text', label: 'Nome', obrigatorio: true },
      { tipo: 'email', label: 'Email', obrigatorio: true },
      { tipo: 'radio', label: 'Como avalia nosso serviço?', opcoes: ['Excelente', 'Bom', 'Regular', 'Ruim'] },
      { tipo: 'textarea', label: 'O que podemos melhorar?' },
      { tipo: 'radio', label: 'Recomendaria para alguém?', opcoes: ['Sim', 'Talvez', 'Não'] },
    ],
  },
  {
    titulo: 'Formulário de Contato',
    descricao: 'Formulário de contato simples e eficaz',
    icon: 'MessageSquare',
    fields: [
      { tipo: 'text', label: 'Nome', obrigatorio: true },
      { tipo: 'email', label: 'Email', obrigatorio: true },
      { tipo: 'phone', label: 'Telefone' },
      { tipo: 'select', label: 'Assunto', opcoes: ['Dúvida', 'Orçamento', 'Suporte', 'Parceria', 'Outro'] },
      { tipo: 'textarea', label: 'Mensagem', obrigatorio: true },
    ],
  },
  {
    titulo: 'Inscrição para Evento',
    descricao: 'Capture inscrições para eventos e workshops',
    icon: 'Users',
    fields: [
      { tipo: 'text', label: 'Nome completo', obrigatorio: true },
      { tipo: 'email', label: 'Email', obrigatorio: true },
      { tipo: 'phone', label: 'Telefone', obrigatorio: true },
      { tipo: 'text', label: 'Empresa' },
      { tipo: 'text', label: 'Cargo' },
      { tipo: 'select', label: 'Como conheceu o evento?', opcoes: ['Instagram', 'LinkedIn', 'Indicação', 'Google', 'Outro'] },
    ],
  },
  {
    titulo: 'Pedido de Orçamento',
    descricao: 'Receba pedidos de orçamento de clientes',
    icon: 'ShoppingCart',
    fields: [
      { tipo: 'text', label: 'Nome / Empresa', obrigatorio: true },
      { tipo: 'email', label: 'Email', obrigatorio: true },
      { tipo: 'phone', label: 'Telefone', obrigatorio: true },
      { tipo: 'select', label: 'Tipo de serviço', opcoes: ['Consultoria', 'Desenvolvimento', 'Design', 'Marketing', 'Outro'] },
      { tipo: 'textarea', label: 'Descreva o que precisa', obrigatorio: true },
      { tipo: 'select', label: 'Prazo estimado', opcoes: ['Urgente', '1-2 semanas', '1 mês', 'Flexível'] },
    ],
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)

  const handleCreate = async (template: typeof templates[0], index: number) => {
    setLoadingIndex(index)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: template.titulo,
          descricao: template.descricao,
          fields: template.fields.map((f, i) => ({
            tipo: f.tipo,
            label: f.label,
            obrigatorio: f.obrigatorio || false,
            opcoes: f.opcoes || null,
            ordem: i + 1,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const data = await res.json()
      router.push(`/dashboard/forms/${data.id}`)
    } catch (error) {
      console.error(error)
      setLoadingIndex(null)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-gray-500 mt-1">Comece com um template pronto e personalize como quiser</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => {
          const Icon = iconMap[template.icon] || FileText
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.titulo}</h3>
                    <p className="text-sm text-gray-500">{template.fields.length} campos</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{template.descricao}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.fields.slice(0, 4).map((f, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{f.label}</span>
                  ))}
                  {template.fields.length > 4 && (
                    <span className="text-xs text-gray-400">+{template.fields.length - 4} mais</span>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 border-t border-gray-100">
                <button
                  onClick={() => handleCreate(template, index)}
                  disabled={loadingIndex === index}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingIndex === index && <Loader2 size={14} className="animate-spin" />}
                  Usar template
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
