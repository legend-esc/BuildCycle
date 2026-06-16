import { useState } from "react";
import QRScanner from "@/components/QRScanner";
import { useConfirmPickup } from "@/hooks/useEscrow";
import Link from "next/link";

export default function ScanPage() {
  const [step, setStep] = useState<"scan" | "confirming" | "success" | "error">("scan");
  const [errorMsg, setErrorMsg] = useState("");
  const confirmPickup = useConfirmPickup();

  async function handleScan(data: { batchId: number; secret: string }) {
    setStep("confirming");
    try {
      await confirmPickup.mutateAsync({ escrowId: data.batchId, qrSecret: data.secret });
      setStep("success");
    } catch {
      setErrorMsg("Failed to confirm pickup. Please try again.");
      setStep("error");
    }
  }

  function handleError(msg: string) {
    setErrorMsg(msg);
    setStep("error");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-buildcycle-gray-800 mb-6">Scan QR Code</h1>

      {step === "scan" && (
        <div className="space-y-4">
          <p className="text-sm text-buildcycle-gray-500">
            Scan the seller&apos;s QR code to confirm pickup and release funds from escrow.
          </p>
          <QRScanner onScan={handleScan} onError={handleError} />
        </div>
      )}

      {step === "confirming" && (
        <div className="text-center py-16 space-y-4">
          <div className="w-12 h-12 border-4 border-buildcycle-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-buildcycle-gray-600">Confirming pickup...</p>
        </div>
      )}

      {step === "success" && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl text-green-600">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-buildcycle-gray-800">Pickup Confirmed!</h2>
          <p className="text-sm text-buildcycle-gray-500">
            Funds have been released to the seller. The batch is now yours.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-buildcycle-orange-500 text-white text-sm font-medium rounded-lg hover:bg-buildcycle-orange-600 transition"
            >
              View Dashboard
            </Link>
            <Link
              href="/browse"
              className="px-4 py-2 border border-buildcycle-gray-300 text-buildcycle-gray-600 text-sm font-medium rounded-lg hover:bg-buildcycle-gray-50 transition"
            >
              Browse More
            </Link>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl text-red-600">&#10007;</span>
          </div>
          <p className="text-sm text-red-600">{errorMsg}</p>
          <button
            onClick={() => { setStep("scan"); setErrorMsg(""); }}
            className="px-4 py-2 bg-buildcycle-orange-500 text-white text-sm font-medium rounded-lg hover:bg-buildcycle-orange-600 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
