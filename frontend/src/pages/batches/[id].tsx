import { useRouter } from "next/router";
import { getBatchById } from "@/utils/mockData";
import ConditionReportCard from "@/components/ConditionReportCard";
import { useState } from "react";

export default function BatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const batch = getBatchById(Number(id));
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!batch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-buildcycle-gray-400">
        Batch not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Photo carousel */}
      <div className="relative aspect-[16/9] bg-buildcycle-gray-100 rounded-xl overflow-hidden mb-6">
        {batch.photos.length > 0 && (
          <img
            src={batch.photos[photoIndex]}
            alt={batch.title}
            className="w-full h-full object-cover"
          />
        )}
        {batch.photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIndex((i) => (i - 1 + batch.photos.length) % batch.photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-white transition"
            >
              &lsaquo;
            </button>
            <button
              onClick={() => setPhotoIndex((i) => (i + 1) % batch.photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-white transition"
            >
              &rsaquo;
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {batch.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${i === photoIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-buildcycle-gray-800">{batch.title}</h1>
            <p className="text-sm text-buildcycle-gray-500 mt-1">Listed by {batch.seller}</p>
          </div>

          <p className="text-buildcycle-gray-600 leading-relaxed">{batch.description}</p>

          {/* Condition reports */}
          <div>
            <h2 className="text-lg font-semibold text-buildcycle-gray-800 mb-3">Condition Reports</h2>
            {batch.conditionReports.length > 0 ? (
              <div className="space-y-3">
                {batch.conditionReports.map((report) => (
                  <ConditionReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-buildcycle-gray-400">No condition reports yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-buildcycle-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-3xl font-bold text-buildcycle-orange-600">
                ${batch.price}{" "}
                <span className="text-base font-normal text-buildcycle-gray-400">{batch.paymentAsset}</span>
              </p>
              <p className="text-xs text-buildcycle-gray-400 mt-0.5">Fixed price</p>
            </div>

            <button className="w-full py-2.5 bg-buildcycle-orange-500 text-white font-medium rounded-lg hover:bg-buildcycle-orange-600 transition">
              Purchase
            </button>

            <div className="border-t border-buildcycle-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Quantity</span>
                <span className="font-medium">{batch.quantity} {batch.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Condition</span>
                <span className="font-medium">{batch.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Dimensions</span>
                <span className="font-medium">{batch.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Category</span>
                <span className="font-medium capitalize">{batch.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Location</span>
                <span className="font-medium">{batch.gps.lat.toFixed(4)}, {batch.gps.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
