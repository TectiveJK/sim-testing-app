"use client";

import { use, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/link-button";
import { ResultPanel } from "@/components/result-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/native-select";
import { useAppData } from "@/components/data-provider";

export default function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { catalog, store } = useAppData();
  const mission = catalog.missions.find((item) => item.id === id);
  const [runId, setRunId] = useState(store.runs[0]?.id ?? "");
  const [stepIndex, setStepIndex] = useState(0);

  if (!mission) {
    return (
      <div>
        <PageHeader title="Mission not found" />
        <LinkButton href="/missions" variant="outline">
          Back to missions
        </LinkButton>
      </div>
    );
  }

  const run = store.runs.find((item) => item.id === runId);
  const step = mission.steps[stepIndex];
  const test = catalog.tests.find((item) => item.id === step?.testCaseId);
  const result = run
    ? store.results.find((item) => item.testRunId === run.id && item.testCaseId === step?.testCaseId)
    : undefined;

  return (
    <div>
      <PageHeader
        eyebrow={mission.category}
        title={mission.name}
        description={mission.description}
        actions={
          <LinkButton href="/missions" variant="outline">
            All missions
          </LinkButton>
        }
      />

      {store.runs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Create a test run first so mission steps can be scored against a software version.
            </p>
            <LinkButton href="/runs/new" className="mt-4">
              New test run
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Score against</div>
                <NativeSelect value={runId} onChange={(event) => setRunId(event.target.value)}>
                  {store.runs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <ol className="space-y-2">
                {mission.steps.map((item, index) => {
                  const stepTest = catalog.tests.find((entry) => entry.id === item.testCaseId);
                  const stepResult = run
                    ? store.results.find(
                        (entry) => entry.testRunId === run.id && entry.testCaseId === item.testCaseId,
                      )
                    : undefined;
                  return (
                    <li key={item.testCaseId}>
                      <button
                        type="button"
                        onClick={() => setStepIndex(index)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                          index === stepIndex ? "border-primary bg-muted/70" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {index + 1}. {stepTest?.name}
                          </span>
                          {stepResult ? <StatusBadge status={stepResult.status} short /> : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.instruction}</p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {test && result && run ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">{step.instruction}</p>
                  <ResultPanel
                    key={test.id}
                    test={test}
                    result={result}
                    runId={run.id}
                    tester={run.tester}
                  />
                  <div className="mt-6 flex justify-between">
                    <Button
                      variant="outline"
                      disabled={stepIndex === 0}
                      onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                    >
                      Previous step
                    </Button>
                    <Button
                      disabled={stepIndex === mission.steps.length - 1}
                      onClick={() => setStepIndex((value) => Math.min(mission.steps.length - 1, value + 1))}
                    >
                      Next step
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a run to score this mission.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
