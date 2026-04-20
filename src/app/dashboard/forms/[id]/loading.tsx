export default function FormEditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-gray-100 animate-pulse">
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-7 w-24 bg-gray-100 rounded-lg" />
            <div className="h-7 w-20 bg-gray-100 rounded-lg" />
            <div className="h-7 w-24 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-lg border border-gray-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
