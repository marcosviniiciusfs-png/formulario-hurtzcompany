export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-50">
            <div className="h-4 w-56 bg-gray-100 rounded" />
            <div className="h-3 w-36 bg-gray-50 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
