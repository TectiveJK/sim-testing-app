import type { AppStore, CatalogPayload } from "@/lib/types";

export interface AppData {
  store: AppStore;
  catalog: CatalogPayload;
}

export type RunCounts = {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  not_tested: number;
  not_applicable: number;
};

export function countResults(store: AppStore, runId: string): RunCounts {
  const results = store.results.filter((result) => result.testRunId === runId);
  const counts: RunCounts = {
    total: results.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    not_tested: 0,
    not_applicable: 0,
  };
  for (const result of results) {
    counts[result.status] += 1;
  }
  return counts;
}

export function passRate(counts: RunCounts) {
  const scored = counts.passed + counts.failed;
  if (scored === 0) return null;
  return Math.round((counts.passed / scored) * 100);
}
