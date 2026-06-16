import { useState } from "react";
import { useEscrows, useDispute, useResolveDispute } from "@/hooks/useEscrow";
import { useWalletStore } from "@/stores/useWalletStore";
import Link from "next/link";

const statusColors: Record<string, string> = {
  Created: "bg-blue-100 text-blue-700",
  Locked: "bg-yellow-100 text-yellow-700",
  Released: "bg-green-100 text-green-700",
  Disputed: "bg-red-100 text-red-700",
  Resolved: "bg-gray-100 text-gray-700",
};

export default function DisputesPage() {
  const { data: escrows, isLoading } = useEscrows();
  const dispute = useDispute();
  const resolveDispute = useResolveDispute();
  const { publicKey } = useWalletStore();
  const [disputeModal, setDisputeModal] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [resolveModal, setResolveModal] = useState<number | null>(null);

  const isAdmin = publicKey === "admin";

  async function handleRaiseDispute(escrowId: number) {
    if (!disputeReason.trim()) return;
    await dispute.mutateAsync({ escrowId, reason: disputeReason });
    setDisputeModal(null);
    setDisputeReason("");
  }

  async function handleResolve(escrowId: number, resolution: "full_refund" | "partial_release" | "full_release") {
    await resolveDispute.mutateAsync({ escrowId, resolution });
    setResolveModal(null);
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-buildcycle-gray-400">
        Loading disputes...
      </div>
    );
  }

  const disputedEscrows = escrows?.filter((e) => e.status === "Disputed" || e.status === "Resolved") || [];
  void disputedEscrows;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-2">Dispute Center</h1>
      <p className="text-sm text-buildcycle-gray-500 mb-6">
        Manage disputes and resolve escrow conflicts.
      </p>

      {escrows && escrows.length === 0 ? (
        <p className="text-buildcycle-gray-400 text-sm py-8 text-center">No escrows found.</p>
      ) : (
        <div className="space-y-4">
          {escrows?.map((escrow) => (
            <div
              key={escrow.id}
              className="bg-white border border-buildcycle-gray-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/batches/${escrow.batchId}`}
                    className="font-semibold text-buildcycle-gray-800 text-sm hover:text-buildcycle-orange-600 transition"
                  >
                    {escrow.batchTitle}
                  </Link>
                  <p className="text-xs text-buildcycle-gray-400 mt-0.5">
                    #{escrow.id} &middot; {escrow.buyer} &rarr; {escrow.seller} &middot; ${escrow.amount} {escrow.asset}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[escrow.status] || "bg-gray-100 text-gray-700"}`}>
                  {escrow.status}
                </span>
              </div>

              {escrow.disputeReason && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Reason: </span>
                  {escrow.disputeReason}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/batches/${escrow.batchId}`}
                  className="text-xs px-3 py-1.5 border border-buildcycle-gray-300 rounded-lg text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 transition"
                >
                  View Batch
                </Link>
                {(escrow.status === "Created" || escrow.status === "Locked") && (
                  <button
                    onClick={() => setDisputeModal(escrow.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Raise Dispute
                  </button>
                )}
                {escrow.status === "Disputed" && isAdmin && (
                  <button
                    onClick={() => setResolveModal(escrow.id)}
                    className="text-xs px-3 py-1.5 border border-buildcycle-orange-300 text-buildcycle-orange-600 rounded-lg hover:bg-buildcycle-orange-50 transition"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise Dispute Modal */}
      {disputeModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-buildcycle-gray-800">Raise Dispute</h2>
            <p className="text-sm text-buildcycle-gray-500">
              Describe why you are disputing this escrow.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain the issue..."
              rows={4}
              className="w-full border border-buildcycle-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-buildcycle-orange-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDisputeModal(null); setDisputeReason(""); }}
                className="px-4 py-2 text-sm text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRaiseDispute(disputeModal)}
                disabled={!disputeReason.trim() || dispute.isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                {dispute.isPending ? "Submitting..." : "Raise Dispute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {resolveModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-buildcycle-gray-800">Resolve Dispute</h2>
            <p className="text-sm text-buildcycle-gray-500">
              Choose a resolution for escrow #{resolveModal}.
            </p>
            <div className="space-y-2">
              {([
                { label: "Full Refund", value: "full_refund" as const, desc: "Return full amount to buyer" },
                { label: "Partial Release", value: "partial_release" as const, desc: "Split between buyer and seller" },
                { label: "Full Release", value: "full_release" as const, desc: "Release full amount to seller" },
              ]).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResolve(resolveModal, option.value)}
                  disabled={resolveDispute.isPending}
                  className="w-full text-left p-3 border border-buildcycle-gray-200 rounded-lg hover:bg-buildcycle-gray-50 transition disabled:opacity-50"
                >
                  <span className="font-medium text-sm text-buildcycle-gray-800">{option.label}</span>
                  <p className="text-xs text-buildcycle-gray-400 mt-0.5">{option.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setResolveModal(null)}
              className="w-full px-4 py-2 text-sm text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
