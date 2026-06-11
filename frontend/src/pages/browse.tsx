import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { MOCK_BATCHES, CATEGORIES, CONDITION_OPTIONS, type BatchCondition } from "@/utils/mockData";

export default function ListingGrid() {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState<BatchCondition | "all">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    return MOCK_BATCHES.filter((b) => {
      if (!b.active) return false;
      if (category !== "all" && b.category !== category) return false;
      if (condition !== "all" && b.condition !== condition) return false;
      if (minPrice && b.price < Number(minPrice)) return false;
      if (maxPrice && b.price > Number(maxPrice)) return false;
      return true;
    });
  }, [category, condition, minPrice, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-6">Browse Listings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-xl border border-buildcycle-gray-200">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-buildcycle-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-buildcycle-gray-800"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as BatchCondition | "all")}
            className="border border-buildcycle-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-buildcycle-gray-800"
          >
            <option value="all">All Conditions</option>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Min Price</label>
          <input
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="border border-buildcycle-gray-300 rounded-lg px-3 py-2 text-sm w-24 text-buildcycle-gray-800"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Max Price</label>
          <input
            type="number"
            placeholder="$9999"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border border-buildcycle-gray-300 rounded-lg px-3 py-2 text-sm w-24 text-buildcycle-gray-800"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((batch) => (
          <button
            key={batch.id}
            onClick={() => router.push(`/batches/${batch.id}`)}
            className="text-left bg-white rounded-xl border border-buildcycle-gray-200 overflow-hidden hover:shadow-md hover:border-buildcycle-orange-300 transition group"
          >
            <div className="aspect-[4/3] bg-buildcycle-gray-100 overflow-hidden">
              {batch.photos[0] && (
                <img
                  src={batch.photos[0]}
                  alt={batch.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm text-buildcycle-gray-800 truncate">{batch.title}</h3>
              <p className="text-lg font-bold text-buildcycle-orange-600">
                ${batch.price}{" "}
                <span className="text-xs font-normal text-buildcycle-gray-400">{batch.paymentAsset}</span>
              </p>
              <div className="flex items-center justify-between text-xs text-buildcycle-gray-500">
                <span>{batch.quantity} {batch.unit}</span>
                <span>{batch.condition}</span>
              </div>
              <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-buildcycle-orange-600 bg-buildcycle-orange-50 px-2 py-0.5 rounded">
                {batch.category}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-buildcycle-gray-400 py-16">No listings match your filters.</p>
      )}
    </div>
  );
}
