import type { ConditionReport } from "@/utils/mockData";

function StarRating({ grade }: { grade: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= grade ? "text-yellow-400" : "text-buildcycle-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function GradeBadge({ grade }: { grade: number }) {
  const colors: Record<number, string> = {
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-yellow-100 text-yellow-700",
    4: "bg-lime-100 text-lime-700",
    5: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[grade] || "bg-gray-100 text-gray-700"}`}>
      {grade}/5
    </span>
  );
}

export default function ConditionReportCard({ report }: { report: ConditionReport }) {
  return (
    <div className="border border-buildcycle-gray-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-buildcycle-gray-800">{report.reporter}</span>
        <GradeBadge grade={report.grade} />
      </div>
      <StarRating grade={report.grade} />
      <p className="text-sm text-buildcycle-gray-600">{report.notes}</p>
      <span className="text-xs text-buildcycle-gray-400">
        {new Date(report.timestamp).toLocaleDateString()}
      </span>
    </div>
  );
}
