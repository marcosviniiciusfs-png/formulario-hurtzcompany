interface MetricCardProps {
  titulo: string
  valor: string | number
  descricao?: string
  tooltip?: string
  icon: React.ReactNode
}

export function MetricCard({ titulo, valor, descricao, tooltip, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            {titulo}
            {tooltip && (
              <span className="relative group cursor-help">
                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] text-gray-400 border border-gray-300 rounded-full">?</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {tooltip}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
              </span>
            )}
          </p>
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
