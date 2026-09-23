import type { AppStore, TestResult, TestStatus } from "@/lib/types";

export type DeltaKind = "regression" | "improvement" | "unchanged" | "new" | "cleared";

export interface ResultDelta {
  testCaseId: string;
  previous?: TestResult;
  current?: TestResult;
  kind: DeltaKind;
}

function scored(status?: TestStatus) {
  return status === "passed" || status === "failed";
}

export function classifyDelta(previous?: TestResult, current?: TestResult): DeltaKind {
  const prev = previous?.status;
  const curr = current?.status;
  if (!previous && current) return "new";
  if (prev === "passed" && curr === "failed") return "regression";
  if (prev === "failed" && curr === "passed") return "improvement";
  if (scored(prev) && (curr === "not_tested" || !curr)) return "cleared";
  return "unchanged";
}

export function compareRuns(store: AppStore, fromId: string, toId: string): ResultDelta[] {
  const previous = store.results.filter((result) => result.testRunId === fromId);
  const current = store.results.filter((result) => result.testRunId === toId);
  const ids = new Set([...previous, ...current].map((result) => result.testCaseId));
  return [...ids].map((testCaseId) => {
    const prev = previous.find((result) => result.testCaseId === testCaseId);
    const curr = current.find((result) => result.testCaseId === testCaseId);
    return {
      testCaseId,
      previous: prev,
      current: curr,
      kind: classifyDelta(prev, curr),
    };
  });
}

export function historyForTest(store: AppStore, testCaseId: string) {
  const byRun = new Map(store.runs.map((run) => [run.id, run]));
  return store.results
    .filter((result) => result.testCaseId === testCaseId)
    .map((result) => ({
      result,
      run: byRun.get(result.testRunId),
    }))
    .filter((item) => item.run)
    .sort((a, b) => (b.run!.startedAt || "").localeCompare(a.run!.startedAt || ""));
}
