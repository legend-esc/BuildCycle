import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (data: { batchId: number; secret: string }) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setScanning(true);
        }
      } catch {
        const msg = "Camera access denied or unavailable.";
        setError(msg);
        onError?.(msg);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onError]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        if (parsed.batchId && parsed.secret) {
          onScan({ batchId: Number(parsed.batchId), secret: parsed.secret });
        } else {
          const msg = "Invalid QR code data.";
          setError(msg);
          onError?.(msg);
        }
      } catch {
        setError("Could not parse QR code.");
        onError?.("Could not parse QR code.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${scanning ? "" : "hidden"}`}
        />
        {!scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            Requesting camera...
          </div>
        )}
        <div className="absolute inset-0 border-[3px] border-buildcycle-orange-400/60 rounded-xl pointer-events-none" />
      </div>

      <div className="text-center">
        <p className="text-sm text-buildcycle-gray-500 mb-2">Or upload a QR code image:</p>
        <label className="inline-block px-4 py-2 bg-buildcycle-orange-50 text-buildcycle-orange-600 border border-buildcycle-orange-200 rounded-lg text-sm font-medium cursor-pointer hover:bg-buildcycle-orange-100 transition">
          Upload QR Image
          <input type="file" accept=".json,.txt" onChange={handleFileInput} className="hidden" />
        </label>
      </div>
    </div>
  );
}
