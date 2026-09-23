"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { NativeSelect } from "@/components/native-select";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/components/data-provider";
import { formatDateTime } from "@/lib/format";
import { historyForTest } from "@/lib/regression";

export default function HistoryPage() {
  const { store, catalog } = useAppData();
  const [query, setQuery] = useState("");
  const [testId, setTestId] = useState(catalog.tests[0]?.id ?? "");

  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.tests.filter((test) => {
      if (!needle) return true;
      return test.name.toLowerCase().includes(needle) || test.id.toLowerCase().includes(needle);
    });
  }, [catalog.tests, query]);

  const selected = catalog.tests.find((test) => test.id === testId) ?? options[0];
  const history = selected ? historyForTest(store, selected.id) : [];

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Previous executions"
        description="Look up one checklist item and see the results you recorded on earlier runs."
      />

      <div className="mb-4 grid gap-2 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter catalog"
        />
        <NativeSelect
          value={selected?.id ?? ""}
          onChange={(event) => setTestId(event.target.value)}
        >
          {options.map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {selected ? (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="font-mono text-xs text-muted-foreground">{selected.id}</div>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No executions recorded for this test yet.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-card text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Version</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Result</th>
                <th className="px-3 py-2 font-medium">Tester</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map(({ result, run }) => (
                <tr key={result.id} className="border-t align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium">{run?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      SkyCommand {run?.skyCommandVersion || "—"} / Drone {run?.droneVersion || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{formatDateTime(result.executedAt || run?.startedAt)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={result.status} />
                  </td>
                  <td className="px-3 py-2">{result.tester || run?.tester || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{result.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
