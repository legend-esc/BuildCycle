const ASSETS = [
  { code: "USDC", issuer: "GB...7832", label: "USD Coin", rate: 1 },
  { code: "EURC", issuer: "GB...41af", label: "Euro Coin", rate: 0.92 },
  { code: "XLM", issuer: "native", label: "Stellar Lumens", rate: 0.093 },
  { code: "BRL", issuer: "GB...f1a7", label: "Brazilian Real", rate: 5.04 },
] as const;

interface PathPaySelectorProps {
  value: string;
  onChange: (assetCode: string) => void;
  amount?: number;
}

export default function PathPaySelector({ value, onChange, amount = 0 }: PathPaySelectorProps) {
  const selected = ASSETS.find((a) => a.code === value) || ASSETS[0];

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">
        Payout Asset
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-buildcycle-gray-800 appearance-none cursor-pointer"
        >
          {ASSETS.map((asset) => (
            <option key={asset.code} value={asset.code}>
              {asset.code} — {asset.label}
            </option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-buildcycle-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {amount > 0 && (
        <div className="bg-buildcycle-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between text-buildcycle-gray-600">
            <span>Listed price</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-buildcycle-gray-600">
            <span>You receive</span>
            <span className="font-semibold text-buildcycle-gray-800">
              {(amount * selected.rate).toFixed(2)} {selected.code}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-buildcycle-gray-400">
            <span>Rate</span>
            <span>1 USD = {selected.rate} {selected.code}</span>
          </div>
        </div>
      )}
    </div>
  );
}
