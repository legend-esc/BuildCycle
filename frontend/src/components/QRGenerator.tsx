import { QRCodeCanvas } from "qrcode.react";

interface QRGeneratorProps {
  batchId: number;
  secret: string;
  size?: number;
}

export default function QRGenerator({ batchId, secret, size = 200 }: QRGeneratorProps) {
  const data = JSON.stringify({ batchId, secret });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl border border-buildcycle-gray-200 shadow-sm">
        <QRCodeCanvas value={data} size={size} level="M" />
      </div>
      <p className="text-xs text-buildcycle-gray-400 text-center">
        Scan to confirm pickup for batch #{batchId}
      </p>
    </div>
  );
}
