import { useState } from "react";
import Link from "next/link";
import { MOCK_BATCHES } from "@/utils/mockData";

type Tab = "listings" | "purchases" | "escrows";

interface EscrowStatus {
  id: number;
  batchId: number;
  batchTitle: string;
  buyer: string;
  seller: string;
  amount: number;
  asset: string;
  status: "Created" | "Locked" | "Released" | "Disputed";
  createdAt: number;
}

const MOCK_ESCROWS: EscrowStatus[] = [
  { id: 101, batchId: 1, batchTitle: "Oak Hardwood Planks", buyer: "BuyerA", seller: "GCCON123", amount: 450, asset: "USDC", status: "Released", createdAt: Date.now() - 86400000 * 5 },
  { id: 102, batchId: 4, batchTitle: "PVC Schedule 40 Pipe", buyer: "BuyerB", seller: "BRKLYNDEV", amount: 320, asset: "EURC", status: "Locked", createdAt: Date.now() - 86400000 * 2 },
  { id: 103, batchId: 6, batchTitle: "Reclaimed Barn Wood", buyer: "BuyerC", seller: "GCCON123", amount: 900, asset: "USDC", status: "Disputed", createdAt: Date.now() - 86400000 * 1 },
  { id: 104, batchId: 11, batchTitle: "Commercial Sink", buyer: "BuyerD", seller: "BRKLYNDEV", amount: 550, asset: "USDC", status: "Created", createdAt: Date.now() - 3600000 },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "listings", label: "My Listings" },
  { key: "purchases", label: "My Purchases" },
  { key: "escrows", label: "Escrow Status" },
];

const statusColors: Record<string, string> = {
  Created: "bg-blue-100 text-blue-700",
  Locked: "bg-yellow-100 text-yellow-700",
  Released: "bg-green-100 text-green-700",
  Disputed: "bg-red-100 text-red-700",
  Resolved: "bg-gray-100 text-gray-700",
};

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("listings");

  const myListings = MOCK_BATCHES.filter((b) => b.seller === "GCCON123");
  const myPurchases = MOCK_BATCHES.slice(0, 4).map((b) => ({
    ...b,
    buyer: "You",
    purchaseStatus: b.conditionReports.length > 0 ? "Delivered" : "In Transit",
  }));

  function StatusBadge({ status }: { status: string }) {
    return (
      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  }

  function TabButton({ tabKey }: { tabKey: Tab }) {
    return (
      <button
        onClick={() => setTab(tabKey)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
          tab === tabKey
            ? "bg-buildcycle-orange-500 text-white"
            : "text-buildcycle-gray-600 hover:bg-buildcycle-gray-100"
        }`}
      >
        {TABS.find((t) => t.key === tabKey)!.label}
      </button>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-6">Dashboard</h1>

      <div className="flex gap-2 mb-6 p-1 bg-buildcycle-gray-50 rounded-xl w-fit">
        <TabButton tabKey="listings" />
        <TabButton tabKey="purchases" />
        <TabButton tabKey="escrows" />
      </div>

      {/* My Listings */}
      {tab === "listings" && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <p className="text-buildcycle-gray-400 text-sm py-8 text-center">No listings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-buildcycle-gray-500 text-xs uppercase tracking-wider border-b border-buildcycle-gray-200">
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Price</th>
                    <th className="pb-3 pr-4">Views</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myListings.map((batch) => (
                    <tr key={batch.id} className="border-b border-buildcycle-gray-100">
                      <td className="py-3 pr-4">
                        <Link href={`/batches/${batch.id}`} className="font-medium text-buildcycle-gray-800 hover:text-buildcycle-orange-600 transition">
                          {batch.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={batch.active ? "Active" : "Closed"} /></td>
                      <td className="py-3 pr-4 text-buildcycle-gray-700">${batch.price}</td>
                      <td className="py-3 pr-4 text-buildcycle-gray-500">{Math.floor(Math.random() * 50) + 10}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="text-xs px-2 py-1 border border-buildcycle-gray-300 rounded text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 transition">Edit</button>
                          <button className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            href="/sell"
            className="inline-block mt-4 px-4 py-2 bg-buildcycle-orange-500 text-white text-sm font-medium rounded-lg hover:bg-buildcycle-orange-600 transition"
          >
            + New Listing
          </Link>
        </div>
      )}

      {/* My Purchases */}
      {tab === "purchases" && (
        <div className="space-y-4">
          {myPurchases.length === 0 ? (
            <p className="text-buildcycle-gray-400 text-sm py-8 text-center">No purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-buildcycle-gray-500 text-xs uppercase tracking-wider border-b border-buildcycle-gray-200">
                    <th className="pb-3 pr-4">Batch</th>
                    <th className="pb-3 pr-4">Seller</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myPurchases.map((batch) => (
                    <tr key={batch.id} className="border-b border-buildcycle-gray-100">
                      <td className="py-3 pr-4">
                        <Link href={`/batches/${batch.id}`} className="font-medium text-buildcycle-gray-800 hover:text-buildcycle-orange-600 transition">
                          {batch.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-buildcycle-gray-600">{batch.seller}</td>
                      <td className="py-3 pr-4 text-buildcycle-gray-700">${batch.price} {batch.paymentAsset}</td>
                      <td className="py-3 pr-4"><StatusBadge status={batch.conditionReports.length > 0 ? "Delivered" : "In Transit"} /></td>
                      <td className="py-3">
                        <button className="text-xs px-2 py-1 border border-buildcycle-gray-300 rounded text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 transition">
                          Dispute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Escrow Status */}
      {tab === "escrows" && (
        <div className="space-y-4">
          {MOCK_ESCROWS.map((escrow) => (
            <div key={escrow.id} className="bg-white border border-buildcycle-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-buildcycle-gray-800 text-sm">{escrow.batchTitle}</h3>
                <StatusBadge status={escrow.status} />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-xs text-buildcycle-gray-500">
                  <span>#{escrow.id}</span>
                  <span>{escrow.buyer} → {escrow.seller}</span>
                  <span className="font-medium text-buildcycle-gray-700">${escrow.amount} {escrow.asset}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 pt-1">
                {["Created", "Locked", escrow.status === "Disputed" ? "Disputed" : "Released"].map((s, i, arr) => {
                  const idx = ["Created", "Locked", "Released"].indexOf(escrow.status === "Disputed" ? "Disputed" : escrow.status);
                  const active = i <= idx;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          active ? "bg-buildcycle-orange-500 text-white" : "bg-buildcycle-gray-100 text-buildcycle-gray-400"
                        }`}
                      >
                        {active ? "\u2713" : i + 1}
                      </div>
                      <span className={`text-[10px] ${active ? "text-buildcycle-gray-700 font-medium" : "text-buildcycle-gray-400"}`}>
                        {s}
                      </span>
                      {i < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${active ? "bg-buildcycle-orange-300" : "bg-buildcycle-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <button className="text-xs px-3 py-1.5 border border-buildcycle-gray-300 rounded-lg text-buildcycle-gray-600 hover:bg-buildcycle-gray-50 transition">
                  View Details
                </button>
                {escrow.status !== "Released" && escrow.status !== "Disputed" && (
                  <button className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                    Raise Dispute
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
