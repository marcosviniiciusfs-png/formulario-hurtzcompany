interface ThankYouProps {
  titulo: string
}

export function ThankYou({ titulo }: ThankYouProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h1>
        <p className="text-gray-500">Sua resposta para &ldquo;{titulo}&rdquo; foi enviada com sucesso.</p>
      </div>
    </div>
  )
}
