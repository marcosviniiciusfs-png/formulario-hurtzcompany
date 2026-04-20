interface MetricCardProps {
  titulo: string
  valor: string | number
  descricao?: string
  icon: React.ReactNode
}

export function MetricCard({ titulo, valor, descricao, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
          {descricao && <p className="text-xs text-gray-400 mt-1">{descricao}</p>}
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}
