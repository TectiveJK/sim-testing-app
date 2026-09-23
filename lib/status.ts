import type { TestStatus } from "@/lib/types";

export const STATUS_LABELS: Record<TestStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked / Cannot Test",
  not_tested: "Not Tested",
  not_applicable: "Not Applicable",
};

export const STATUS_SHORT: Record<TestStatus, string> = {
  passed: "Pass",
  failed: "Fail",
  blocked: "Blocked",
  not_tested: "Untested",
  not_applicable: "N/A",
};

export function statusClass(status: TestStatus | undefined) {
  switch (status) {
    case "passed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "failed":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "blocked":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "not_applicable":
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    default:
      return "bg-sky-500/10 text-sky-200 border-sky-500/20";
  }
}

export function statusDot(status: TestStatus | undefined) {
  switch (status) {
    case "passed":
      return "bg-emerald-400";
    case "failed":
      return "bg-red-400";
    case "blocked":
      return "bg-amber-400";
    case "not_applicable":
      return "bg-slate-400";
    default:
      return "bg-sky-400/70";
  }
}

export function statusCell(status: TestStatus | undefined, exists: boolean) {
  if (!exists) return "bg-transparent text-muted-foreground/30";
  switch (status) {
    case "passed":
      return "bg-emerald-500/80 text-emerald-50";
    case "failed":
      return "bg-red-500/80 text-red-50";
    case "blocked":
      return "bg-amber-500/80 text-amber-50";
    case "not_applicable":
      return "bg-slate-500/60 text-slate-100";
    default:
      return "bg-sky-900/70 text-sky-100 border border-sky-500/30";
  }
}
