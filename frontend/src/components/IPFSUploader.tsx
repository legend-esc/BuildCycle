import { useState, useRef } from "react";

interface IPFSUploaderProps {
  onUpload: (cid: string, file: File) => void;
  maxFiles?: number;
}

export default function IPFSUploader({ onUpload, maxFiles = 5 }: IPFSUploaderProps) {
  const [files, setFiles] = useState<{ file: File; preview: string; cid?: string; uploading: boolean }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles).slice(0, maxFiles - files.length);
    const entries = arr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }

  async function uploadFile(index: number) {
    const entry = files[index];
    if (!entry || entry.uploading || entry.cid) return;

    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploading: true };
      return next;
    });

    await new Promise((r) => setTimeout(r, 1200));

    const mockCid = "bafy" + Math.random().toString(36).substring(2, 14);

    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploading: false, cid: mockCid };
      return next;
    });

    onUpload(mockCid, entry.file);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver
            ? "border-buildcycle-orange-400 bg-buildcycle-orange-50"
            : "border-buildcycle-gray-300 bg-white hover:border-buildcycle-orange-300"
        }`}
      >
        <svg className="w-10 h-10 mx-auto text-buildcycle-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-buildcycle-gray-600 font-medium">
          Drag & drop photos or click to browse
        </p>
        <p className="text-xs text-buildcycle-gray-400 mt-1">
          Up to {maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {files.map((entry, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-buildcycle-gray-200 bg-buildcycle-gray-100">
              <img src={entry.preview} alt="" className="w-full h-full object-cover" />
              {entry.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {entry.cid && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Uploaded
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                &times;
              </button>
              {!entry.cid && !entry.uploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); uploadFile(i); }}
                  className="absolute inset-x-2 bottom-2 py-1 bg-buildcycle-orange-500 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition"
                >
                  Upload
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
