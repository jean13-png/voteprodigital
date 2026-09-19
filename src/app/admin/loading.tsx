export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-28" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 h-64" />
    </div>
  );
}
