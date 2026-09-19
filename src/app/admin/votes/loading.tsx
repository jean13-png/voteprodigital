export default function AdminVotesLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full max-w-md" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
