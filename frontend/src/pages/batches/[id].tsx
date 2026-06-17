import { useRouter } from "next/router";
import { getBatchById } from "@/utils/mockData";
import ConditionReportCard from "@/components/ConditionReportCard";
import { useState } from "react";
import { useCreateEscrow, useLockPayment, useEscrows } from "@/hooks/useEscrow";
import { useWalletStore } from "@/stores/useWalletStore";
import Link from "next/link";
import { BatchDetailSkeleton } from "@/components/LoadingSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";

const statusBadgeColors: Record<string, string> = {
  Created: "bg-blue-100 text-blue-700",
  Locked: "bg-yellow-100 text-yellow-700",
  Released: "bg-green-100 text-green-700",
  Disputed: "bg-red-100 text-red-700",
  Resolved: "bg-gray-100 text-gray-700",
};

export default function BatchDetail() {
  const router = useRouter();
  const { id } = router.query;
  const batch = getBatchById(Number(id));
  const [photoIndex, setPhotoIndex] = useState(0);
  const { isConnected } = useWalletStore();
  const createEscrow = useCreateEscrow();
  const lockPayment = useLockPayment();
  const { data: escrows } = useEscrows();
  const [purchaseState, setPurchaseState] = useState<"idle" | "creating" | "locking" | "done">("idle");

  const batchEscrow = escrows?.find((e) => e.batchId === Number(id));

  if (!router.isReady) return <BatchDetailSkeleton />;

  if (!batch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-buildcycle-gray-400">
        Batch not found.
      </div>
    );
  }

  async function handlePurchase() {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!batch) return;
    setPurchaseState("creating");
    try {
      const { escrowId } = await createEscrow.mutateAsync({
        batchId: batch.id,
        batchTitle: batch.title,
        seller: batch.seller,
        amount: batch.price,
        asset: batch.paymentAsset,
      });
      setPurchaseState("locking");
      await lockPayment.mutateAsync({ escrowId });
      setPurchaseState("done");
    } catch {
      setPurchaseState("idle");
    }
  }

  return (
    <ErrorBoundary>
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

          {batchEscrow && (
            <div className="bg-white border border-buildcycle-gray-200 rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-buildcycle-gray-800">Escrow Status</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadgeColors[batchEscrow.status] || "bg-gray-100 text-gray-700"}`}>
                  {batchEscrow.status}
                </span>
                <span className="text-xs text-buildcycle-gray-400">#{batchEscrow.id}</span>
              </div>
              {batchEscrow.status === "Locked" && (
                <Link
                  href="/scan"
                  className="inline-block text-xs px-3 py-1.5 bg-buildcycle-orange-500 text-white rounded-lg hover:bg-buildcycle-orange-600 transition"
                >
                  Scan QR to Confirm Pickup
                </Link>
              )}
              {batchEscrow.status === "Disputed" && (
                <Link
                  href="/disputes"
                  className="inline-block text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  View Dispute
                </Link>
              )}
            </div>
          )}

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

            {purchaseState === "done" ? (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
                  Purchase initiated! Escrow created.
                </div>
                <Link
                  href="/dashboard"
                  className="block text-center w-full py-2.5 bg-buildcycle-orange-500 text-white font-medium rounded-lg hover:bg-buildcycle-orange-600 transition"
                >
                  View in Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchaseState !== "idle" || !!batchEscrow}
                className="w-full py-2.5 bg-buildcycle-orange-500 text-white font-medium rounded-lg hover:bg-buildcycle-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchaseState === "creating"
                  ? "Creating escrow..."
                  : purchaseState === "locking"
                  ? "Locking payment..."
                  : batchEscrow
                  ? "Already in escrow"
                  : "Purchase"}
              </button>
            )}

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
    </ErrorBoundary>
  );
}
