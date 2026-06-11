import dynamic from "next/dynamic";
import { MOCK_BATCHES } from "@/utils/mockData";
import { useRouter } from "next/router";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function MapView() {
  const router = useRouter();
  const active = MOCK_BATCHES.filter((b) => b.active);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      <div className="lg:w-80 xl:w-96 p-4 overflow-y-auto border-r border-buildcycle-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-buildcycle-gray-800 mb-3">Active Batches</h2>
        <div className="space-y-3">
          {active.map((batch) => (
            <button
              key={batch.id}
              onClick={() => router.push(`/batches/${batch.id}`)}
              className="w-full text-left p-3 rounded-lg border border-buildcycle-gray-200 hover:border-buildcycle-orange-300 hover:shadow-sm transition bg-white"
            >
              <h3 className="font-medium text-sm text-buildcycle-gray-800 truncate">{batch.title}</h3>
              <p className="text-xs text-buildcycle-gray-500 mt-1">
                ${batch.price} {batch.paymentAsset} &middot; {batch.condition}
              </p>
              <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold text-buildcycle-orange-600 bg-buildcycle-orange-50 px-2 py-0.5 rounded">
                {batch.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <MapPicker className="h-full w-full" />
      </div>
    </div>
  );
}
