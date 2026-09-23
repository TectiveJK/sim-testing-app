import type { TestStatus } from "@/lib/types";

export const QUICK_STATUSES = ["passed", "failed", "blocked", "not_tested"] as const;

export const STATUS_LABELS: Record<TestStatus, string> = {
  passed: "PASS",
  failed: "FAIL",
  blocked: "BLOCKED",
  not_tested: "NOT TESTED",
  not_applicable: "N/A",
};

export const STATUS_SHORT: Record<TestStatus, string> = {
  passed: "PASS",
  failed: "FAIL",
  blocked: "BLOCKED",
  not_tested: "NOT TESTED",
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

export function scoreButtonClass(status: TestStatus, selected: boolean) {
  const base =
    "flex h-12 min-w-[7.5rem] flex-1 items-center justify-center rounded-lg border text-sm font-semibold";
  switch (status) {
    case "passed":
      return `${base} ${selected ? "border-emerald-400 bg-emerald-500 text-emerald-50" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"}`;
    case "failed":
      return `${base} ${selected ? "border-red-400 bg-red-500 text-red-50" : "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"}`;
    case "blocked":
      return `${base} ${selected ? "border-amber-400 bg-amber-500 text-amber-50" : "border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"}`;
    case "not_tested":
      return `${base} ${selected ? "border-sky-300 bg-sky-500 text-sky-50" : "border-border bg-background text-muted-foreground hover:bg-muted"}`;
    default:
      return `${base} ${selected ? "bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`;
  }
}
