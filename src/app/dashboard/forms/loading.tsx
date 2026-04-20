export default function FormsLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-44 bg-gray-200 rounded" />
          <div className="h-4 w-28 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
            <div className="flex gap-4 mt-3">
              <div className="h-3 w-20 bg-gray-50 rounded" />
              <div className="h-3 w-24 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
