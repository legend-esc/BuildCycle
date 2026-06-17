export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-buildcycle-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-buildcycle-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-buildcycle-gray-200 rounded w-3/4" />
        <div className="h-5 bg-buildcycle-gray-200 rounded w-1/2" />
        <div className="h-3 bg-buildcycle-gray-200 rounded w-full" />
        <div className="h-3 bg-buildcycle-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BatchDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-72 bg-buildcycle-gray-200 rounded-xl mb-6" />
      <div className="space-y-3">
        <div className="h-7 bg-buildcycle-gray-200 rounded w-2/3" />
        <div className="h-5 bg-buildcycle-gray-200 rounded w-1/4" />
        <div className="h-4 bg-buildcycle-gray-200 rounded w-full" />
        <div className="h-4 bg-buildcycle-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-buildcycle-gray-200 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 bg-buildcycle-gray-200 rounded w-48" />
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-buildcycle-gray-200 rounded-xl flex-1" />
        ))}
      </div>
      <div className="h-64 bg-buildcycle-gray-200 rounded-xl" />
    </div>
  );
}
