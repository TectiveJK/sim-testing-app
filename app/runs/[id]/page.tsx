"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Flag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NativeSelect } from "@/components/native-select";
import { ResultPanel } from "@/components/result-panel";
import { StatusBadge } from "@/components/status-badge";
import { TestMatrix } from "@/components/test-matrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/data-provider";
import { countResults, passRate } from "@/lib/client-types";
import { formatDateTime } from "@/lib/format";
import { TEST_STATUSES, type TestStatus } from "@/lib/types";

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { store, catalog, updateRun } = useAppData();
  const run = store.runs.find((item) => item.id === id);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("all");
  const [command, setCommand] = useState("all");
  const [status, setStatus] = useState<"all" | TestStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(
    () => store.results.filter((result) => result.testRunId === id),
    [store.results, id],
  );
  const byTestId = useMemo(
    () => new Map(results.map((result) => [result.testCaseId, result])),
    [results],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.tests.filter((test) => {
      const result = byTestId.get(test.id);
      if (state !== "all" && test.currentState !== state) return false;
      if (command !== "all" && test.command !== command) return false;
      if (status !== "all" && result?.status !== status) return false;
      if (!needle) return true;
      return (
        test.name.toLowerCase().includes(needle) ||
        test.id.toLowerCase().includes(needle) ||
        (result?.notes || "").toLowerCase().includes(needle)
      );
    });
  }, [catalog.tests, query, state, command, status, byTestId]);

  const selected = catalog.tests.find((test) => test.id === selectedId) ?? filtered[0];
  const selectedResult = selected ? byTestId.get(selected.id) : undefined;

  if (!run) {
    return (
      <div>
        <PageHeader title="Test run not found" />
        <Button variant="outline" render={<Link href="/runs" />}>
          Back to runs
        </Button>
      </div>
    );
  }

  const counts = countResults(store, run.id);
  const rate = passRate(counts);
  const recorded = counts.total - counts.not_tested;

  const exportJson = () => {
    const payload = {
      run,
      results: results.map((result) => ({
        ...result,
        test: catalog.tests.find((test) => test.id === result.testCaseId),
      })),
    };
    downloadFile(`${run.name.replace(/\s+/g, "-")}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCsv = () => {
    const header = [
      "test_id",
      "name",
      "state",
      "phase",
      "command",
      "status",
      "notes",
      "executed_at",
      "tester",
      "skycommand",
      "drone",
    ];
    const rows = catalog.tests.map((test) => {
      const result = byTestId.get(test.id);
      return [
        test.id,
        test.name,
        test.currentState,
        test.phase,
        test.command,
        result?.status ?? "",
        (result?.notes || "").replaceAll("\n", " "),
        result?.executedAt ?? "",
        result?.tester || run.tester,
        run.skyCommandVersion,
        run.droneVersion,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",");
    });
    downloadFile(`${run.name.replace(/\s+/g, "-")}.csv`, [header.join(","), ...rows].join("\n"), "text/csv");
  };

  return (
    <div>
      <PageHeader
        eyebrow={run.completedAt ? "Completed run" : "In progress"}
        title={run.name}
        description={`${formatDateTime(run.startedAt)} · SkyCommand ${run.skyCommandVersion || "—"} · Drone ${run.droneVersion || "—"} · ${run.tester || "No tester"}`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download />
              CSV
            </Button>
            <Button variant="outline" onClick={exportJson}>
              <Download />
              JSON
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await updateRun(run.id, {
                    completedAt: run.completedAt ? null : new Date().toISOString(),
                  });
                  toast.success(run.completedAt ? "Run reopened" : "Run marked complete");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not update run");
                }
              }}
            >
              <Flag />
              {run.completedAt ? "Reopen" : "Mark complete"}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Recorded" value={`${recorded} / ${counts.total}`} />
        <Summary label="Pass rate" value={rate === null ? "—" : `${rate}%`} />
        <Summary label="Passed" value={String(counts.passed)} />
        <Summary label="Failed" value={String(counts.failed)} />
        <Summary label="Blocked / N/A" value={`${counts.blocked} / ${counts.not_applicable}`} />
      </div>

      <Tabs defaultValue="execute">
        <TabsList>
          <TabsTrigger value="execute">Execute</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="execute" className="mt-4">
          <div className="mb-3 grid gap-2 md:grid-cols-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tests or notes"
            />
            <NativeSelect value={state} onChange={(event) => setState(event.target.value)}>
              <option value="all">All states</option>
              {catalog.states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect value={command} onChange={(event) => setCommand(event.target.value)}>
              <option value="all">All commands</option>
              {catalog.commands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | TestStatus)}
            >
              <option value="all">All results</option>
              {TEST_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tests ({filtered.length})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[72vh] space-y-1 overflow-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tests match these filters.</p>
                ) : (
                  filtered.map((test) => {
                    const result = byTestId.get(test.id);
                    return (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => setSelectedId(test.id)}
                        className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${
                          selected?.id === test.id ? "bg-muted" : ""
                        }`}
                      >
                        <span>
                          <span className="block font-medium">{test.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">{test.id}</span>
                        </span>
                        {result ? <StatusBadge status={result.status} short /> : null}
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {selected && selectedResult ? (
                  <ResultPanel
                    test={selected}
                    result={selectedResult}
                    runId={run.id}
                    tester={run.tester}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a test to record a result.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <TestMatrix
            tests={catalog.tests}
            commands={catalog.commands}
            states={catalog.states}
            phasesByState={catalog.phasesByState}
            resultsByTestId={byTestId}
            selectedId={selected?.id}
            onSelect={(test) => setSelectedId(test.id)}
          />
        </TabsContent>

        <TabsContent value="setup" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Run setup</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label="SkyCommand / SIM version"
                value={run.skyCommandVersion}
                onSave={(value) => updateRun(run.id, { skyCommandVersion: value })}
              />
              <Field
                label="Drone software / firmware"
                value={run.droneVersion}
                onSave={(value) => updateRun(run.id, { droneVersion: value })}
              />
              <Field
                label="Tester"
                value={run.tester}
                onSave={(value) => updateRun(run.id, { tester: value })}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  key={run.notes}
                  defaultValue={run.notes}
                  onBlur={(event) => {
                    if (event.target.value !== run.notes) {
                      void updateRun(run.id, { notes: event.target.value });
                    }
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-2 text-sm font-medium">Snapshotted artifacts</div>
                <ul className="space-y-1 font-mono text-xs">
                  {run.artifacts.map((artifact) => (
                    <li key={artifact.id}>
                      {artifact.packageName}: {artifact.filename || "—"}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        key={value}
        defaultValue={value}
        onBlur={(event) => {
          if (event.target.value !== value) {
            void onSave(event.target.value).catch((error) => {
              toast.error(error instanceof Error ? error.message : "Could not save");
            });
          }
        }}
      />
    </div>
  );
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
