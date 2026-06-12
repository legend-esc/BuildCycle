import { useState } from "react";
import dynamic from "next/dynamic";
import IPFSUploader from "@/components/IPFSUploader";
import PathPaySelector from "@/components/PathPaySelector";
import QRGenerator from "@/components/QRGenerator";
import { CATEGORIES, CONDITION_OPTIONS, type BatchCondition } from "@/utils/mockData";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

interface FormData {
  photos: { cid: string; file: File }[];
  title: string;
  category: string;
  quantity: number;
  unit: string;
  condition: BatchCondition;
  dimensions: string;
  description: string;
  price: number;
  paymentAsset: string;
  gps: { lat: number; lng: number } | null;
}

const STEPS = ["Photos", "Details", "Location", "Payment", "Review"];

export default function SellForm() {
  const [step, setStep] = useState(0);
  const [qrSecret] = useState(() => "sec-" + Math.random().toString(36).substring(2, 14));
  const [batchId] = useState(() => Math.floor(Math.random() * 90000) + 10000);

  const [form, setForm] = useState<FormData>({
    photos: [],
    title: "",
    category: "lumber",
    quantity: 1,
    unit: "pieces",
    condition: "New",
    dimensions: "",
    description: "",
    price: 0,
    paymentAsset: "USDC",
    gps: null,
  });

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return form.photos.length > 0;
      case 1: return form.title.trim().length > 0 && form.quantity > 0 && form.dimensions.trim().length > 0;
      case 2: return form.gps !== null;
      case 3: return form.price > 0;
      default: return true;
    }
  }

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                i === step
                  ? "bg-buildcycle-orange-500 text-white"
                  : i < step
                  ? "bg-green-500 text-white"
                  : "bg-buildcycle-gray-100 text-buildcycle-gray-400"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i === step ? "text-buildcycle-gray-800 font-medium" : "text-buildcycle-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-buildcycle-gray-200" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-6">List New Material</h1>
      <StepIndicator />

      <div className="bg-white border border-buildcycle-gray-200 rounded-xl p-6 space-y-6">
        {/* Step 1: Photos */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Upload Photos</h2>
            <p className="text-sm text-buildcycle-gray-500">Show the condition of your materials clearly.</p>
            <IPFSUploader
              onUpload={(cid, file) => {
                update("photos", [...form.photos, { cid, file }]);
              }}
            />
          </div>
        )}

        {/* Step 2: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Material Details</h2>
            <div>
              <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Title</label>
              <input
                type="text"
                placeholder="e.g. Oak Hardwood Planks – 200 sqft"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm text-buildcycle-gray-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-buildcycle-gray-800"
                >
                  {CATEGORIES.filter((c) => c !== "all").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => update("condition", e.target.value as BatchCondition)}
                  className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-buildcycle-gray-800"
                >
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => update("quantity", Number(e.target.value))}
                  className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm text-buildcycle-gray-800"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Unit</label>
                <input
                  type="text"
                  placeholder="sqft, boxes, pieces..."
                  value={form.unit}
                  onChange={(e) => update("unit", e.target.value)}
                  className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm text-buildcycle-gray-800"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Dimensions</label>
              <input
                type="text"
                placeholder="e.g. 3/4x3x96"
                value={form.dimensions}
                onChange={(e) => update("dimensions", e.target.value)}
                className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm text-buildcycle-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Description</label>
              <textarea
                rows={3}
                placeholder="Describe the material, its history, and condition details..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="mt-1 w-full border border-buildcycle-gray-300 rounded-lg px-3 py-2.5 text-sm text-buildcycle-gray-800 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Pickup Location</h2>
            <p className="text-sm text-buildcycle-gray-500">Click on the map to set the material location.</p>
            <div className="h-72 rounded-xl overflow-hidden border border-buildcycle-gray-200">
              <MapPicker
                interactive
                onLocationSelect={(lat, lng) => update("gps", { lat, lng })}
                selectedLocation={form.gps}
              />
            </div>
            {form.gps && (
              <p className="text-sm text-buildcycle-gray-600">
                Selected: {form.gps.lat.toFixed(4)}, {form.gps.lng.toFixed(4)}
              </p>
            )}
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Price & QR Code</h2>
            <div>
              <label className="text-xs font-medium text-buildcycle-gray-500 uppercase tracking-wider">Price</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-buildcycle-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  value={form.price || ""}
                  onChange={(e) => update("price", Number(e.target.value))}
                  className="w-full border border-buildcycle-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm text-buildcycle-gray-800"
                />
              </div>
            </div>
            <PathPaySelector
              value={form.paymentAsset}
              onChange={(asset) => update("paymentAsset", asset)}
              amount={form.price}
            />
            <div className="border-t border-buildcycle-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-buildcycle-gray-700 mb-3">Pickup QR Code</h3>
              <p className="text-xs text-buildcycle-gray-500 mb-4">
                This QR code will be used to verify pickup. Print it or save it to your phone.
              </p>
              <div className="flex justify-center">
                <QRGenerator batchId={batchId} secret={qrSecret} size={180} />
              </div>
              <div className="mt-3 bg-buildcycle-gray-50 rounded-lg p-3 text-xs text-buildcycle-gray-500">
                <strong>Secret:</strong> {qrSecret}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-buildcycle-gray-800">Review & Submit</h2>
            <div className="bg-buildcycle-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Title</span>
                <span className="font-medium text-buildcycle-gray-800">{form.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Category</span>
                <span className="font-medium capitalize">{form.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Quantity</span>
                <span className="font-medium">{form.quantity} {form.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Condition</span>
                <span className="font-medium">{form.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Dimensions</span>
                <span className="font-medium">{form.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Price</span>
                <span className="font-bold text-buildcycle-orange-600">${form.price} {form.paymentAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Location</span>
                <span className="font-medium">
                  {form.gps ? `${form.gps.lat.toFixed(4)}, ${form.gps.lng.toFixed(4)}` : "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-buildcycle-gray-500">Photos</span>
                <span className="font-medium">{form.photos.length} uploaded</span>
              </div>
            </div>

            <button
              onClick={() => alert("Listing submitted! (mock)")}
              className="w-full py-3 bg-buildcycle-orange-500 text-white font-medium rounded-lg hover:bg-buildcycle-orange-600 transition text-sm"
            >
              Sign & Submit Listing
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-2 border border-buildcycle-gray-300 rounded-lg text-sm text-buildcycle-gray-700 hover:bg-buildcycle-gray-50 transition disabled:opacity-30"
        >
          Back
        </button>
        <span className="text-xs text-buildcycle-gray-400">
          Step {step + 1} of {STEPS.length}
        </span>
        <button
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={!canProceed() || step === STEPS.length - 1}
          className="px-5 py-2 bg-buildcycle-orange-500 text-white font-medium rounded-lg text-sm hover:bg-buildcycle-orange-600 transition disabled:opacity-30"
        >
          {step === STEPS.length - 1 ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
