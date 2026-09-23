"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { NativeSelect } from "@/components/native-select";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";
import { compareRuns, type DeltaKind } from "@/lib/regression";

const KIND_LABEL: Record<DeltaKind, string> = {
  regression: "Regression",
  improvement: "Improvement",
  unchanged: "Unchanged",
  new: "New",
  cleared: "Cleared",
};

export default function ComparePage() {
  const { store, catalog } = useAppData();
  const [fromId, setFromId] = useState(store.runs[1]?.id ?? store.runs[0]?.id ?? "");
  const [toId, setToId] = useState(store.runs[0]?.id ?? "");
  const [kind, setKind] = useState<"all" | DeltaKind>("all");

  const deltas = useMemo(
    () => (fromId && toId ? compareRuns(store, fromId, toId) : []),
    [store, fromId, toId],
  );
  const visible = kind === "all" ? deltas : deltas.filter((item) => item.kind === kind);
  const fromRun = store.runs.find((run) => run.id === fromId);
  const toRun = store.runs.find((run) => run.id === toId);

  return (
    <div>
      <PageHeader
        eyebrow="Regression"
        title="Compare test runs"
        description="See whether a function that previously passed still passes after a new SkyCommand or drone software release."
      />

      {store.runs.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Create at least two test runs to compare releases.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <NativeSelect value={fromId} onChange={(event) => setFromId(event.target.value)}>
              {store.runs.map((run) => (
                <option key={run.id} value={run.id}>
                  Baseline: {run.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={toId} onChange={(event) => setToId(event.target.value)}>
              {store.runs.map((run) => (
                <option key={run.id} value={run.id}>
                  Current: {run.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={kind}
              onChange={(event) => setKind(event.target.value as "all" | DeltaKind)}
            >
              <option value="all">All changes</option>
              <option value="regression">Regressions only</option>
              <option value="improvement">Improvements only</option>
              <option value="unchanged">Unchanged</option>
              <option value="cleared">Cleared / reopened</option>
            </NativeSelect>
          </div>

          <p className="mb-3 text-sm text-muted-foreground">
            {fromRun?.name} ({fromRun?.skyCommandVersion || "—"} / {fromRun?.droneVersion || "—"}) →{" "}
            {toRun?.name} ({toRun?.skyCommandVersion || "—"} / {toRun?.droneVersion || "—"})
          </p>

          <div className="overflow-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-card text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Test</th>
                  <th className="px-3 py-2 font-medium">Baseline</th>
                  <th className="px-3 py-2 font-medium">Current</th>
                  <th className="px-3 py-2 font-medium">Delta</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const test = catalog.tests.find((entry) => entry.id === item.testCaseId);
                  return (
                    <tr key={item.testCaseId} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{test?.name || item.testCaseId}</div>
                        <div className="font-mono text-xs text-muted-foreground">{item.testCaseId}</div>
                      </td>
                      <td className="px-3 py-2">
                        {item.previous ? <StatusBadge status={item.previous.status} short /> : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {item.current ? <StatusBadge status={item.current.status} short /> : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            item.kind === "regression"
                              ? "text-red-300"
                              : item.kind === "improvement"
                                ? "text-emerald-300"
                                : "text-muted-foreground"
                          }
                        >
                          {KIND_LABEL[item.kind]}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                        {item.current?.notes || item.previous?.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
