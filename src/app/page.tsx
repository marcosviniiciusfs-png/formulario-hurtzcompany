import Link from 'next/link'
import { FileText, Sparkles, Zap, BarChart3, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Hurtz Forms</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Entrar</Link>
            <Link href="/auth/register" className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Criar conta</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Sparkles size={14} />
            Powered by AI
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Crie formulários incríveis<br />
            <span className="text-blue-600">em segundos</span>
          </h1>
          <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
            Descreva o que precisa e a IA gera o formulário completo. Editor visual com 3 modos de edição, dashboard analytics e link público.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-lg"
            >
              Começar grátis
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Tudo que você precisa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Geração com IA</h3>
              <p className="text-gray-500">Descreva o formulário que precisa e a IA gera automaticamente com campos relevantes e labels profissionais.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3 Modos de Edição</h3>
              <p className="text-gray-500">Edite no modo Lista, Inline estilo Notion ou Canvas livre. Troque entre modos instantaneamente.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Analytics</h3>
              <p className="text-gray-500">Visualize respostas, acompanhe taxa de conversão e exporte dados em CSV. Tudo em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pronto para começar?</h2>
          <p className="text-gray-500 text-lg mb-8">Crie seu primeiro formulário em menos de 1 minuto. Gratuito.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-lg"
          >
            Criar conta grátis
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-400">Hurtz Forms</span>
          <span className="text-sm text-gray-400">Feito para criar formulários incríveis</span>
        </div>
      </footer>
    </div>
  )
}
