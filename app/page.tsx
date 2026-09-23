"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";
import { countResults, passRate } from "@/lib/client-types";
import { formatDateTime } from "@/lib/format";
import { compareRuns } from "@/lib/regression";

export default function DashboardPage() {
  const { store, catalog } = useAppData();
  const latest = store.runs[0];
  const previous = store.runs[1];
  const latestCounts = latest ? countResults(store, latest.id) : null;
  const rate = latestCounts ? passRate(latestCounts) : null;
  const deltas = latest && previous ? compareRuns(store, previous.id, latest.id) : [];
  const regressions = deltas.filter((item) => item.kind === "regression");
  const improvements = deltas.filter((item) => item.kind === "improvement");

  return (
    <div>
      <PageHeader
        eyebrow="SIM environment"
        title="Flight testing lab"
        description="Run the drone transition catalog after every SkyCommand, SIM, or firmware update. Record results, keep version history, and spot regressions between test runs."
        actions={
          <Button render={<Link href="/runs/new" />}>
            <Plus />
            New test run
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Catalog</CardDescription>
            <CardTitle className="text-3xl">{catalog.tests.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Individual state → command tests, plus {catalog.missions.length} mission scenarios.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Test runs</CardDescription>
            <CardTitle className="text-3xl">{store.runs.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Each run snapshots SkyCommand, drone software, and last-successful .deb artifacts.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Latest pass rate</CardDescription>
            <CardTitle className="text-3xl">{rate === null ? "—" : `${rate}%`}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {latest
              ? `${latestCounts?.passed ?? 0} passed · ${latestCounts?.failed ?? 0} failed · ${latestCounts?.not_tested ?? 0} still open`
              : "Create a test run to start scoring results."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Regressions vs previous</CardDescription>
            <CardTitle className="text-3xl">{latest && previous ? regressions.length : "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {latest && previous
              ? `${improvements.length} improved since ${previous.name}.`
              : "Need two runs to compare releases."}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Latest test run</CardTitle>
              <CardDescription>
                {latest
                  ? `${latest.name} · ${formatDateTime(latest.startedAt)}`
                  : "No runs recorded yet"}
              </CardDescription>
            </div>
            {latest ? (
              <Button variant="outline" size="sm" render={<Link href={`/runs/${latest.id}`} />}>
                Continue
                <ArrowRight />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {latest && latestCounts ? (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">SkyCommand / SIM</div>
                    <div className="font-medium">{latest.skyCommandVersion || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Drone software</div>
                    <div className="font-medium">{latest.droneVersion || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tester</div>
                    <div className="font-medium">{latest.tester || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Progress</div>
                    <div className="font-medium">
                      {latestCounts.total - latestCounts.not_tested} / {latestCounts.total} recorded
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="passed" short />
                  <span className="text-sm text-muted-foreground">{latestCounts.passed}</span>
                  <StatusBadge status="failed" short />
                  <span className="text-sm text-muted-foreground">{latestCounts.failed}</span>
                  <StatusBadge status="blocked" short />
                  <span className="text-sm text-muted-foreground">{latestCounts.blocked}</span>
                  <StatusBadge status="not_tested" short />
                  <span className="text-sm text-muted-foreground">{latestCounts.not_tested}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  After a software update, start a new test run from the existing catalog instead of
                  recreating tests by hand.
                </p>
                <Button className="mt-4" render={<Link href="/runs/new" />}>
                  Create first test run
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last successful artifacts</CardTitle>
            <CardDescription>Editable .deb filenames used for the next test run snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {store.artifacts.map((artifact) => (
                <li key={artifact.id} className="min-w-0">
                  <div className="text-xs text-muted-foreground">{artifact.packageName}</div>
                  <div className="truncate font-mono text-xs sm:text-sm">{artifact.filename || "—"}</div>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/artifacts" />}>
              Edit artifacts
            </Button>
          </CardContent>
        </Card>
      </div>

      {latest && previous ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Release delta</CardTitle>
            <CardDescription>
              {previous.name} ({previous.skyCommandVersion || "no SIM version"} /{" "}
              {previous.droneVersion || "no drone version"}) → {latest.name} (
              {latest.skyCommandVersion || "no SIM version"} / {latest.droneVersion || "no drone version"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {regressions.length === 0 && improvements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No scored pass/fail changes between these two runs yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-300">
                    <AlertTriangle className="size-4" />
                    Regressions
                  </div>
                  <ul className="space-y-2 text-sm">
                    {regressions.length === 0 ? (
                      <li className="text-muted-foreground">None</li>
                    ) : (
                      regressions.map((item) => {
                        const test = catalog.tests.find((entry) => entry.id === item.testCaseId);
                        return <li key={item.testCaseId}>{test?.name || item.testCaseId}</li>;
                      })
                    )}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                    <CheckCircle2 className="size-4" />
                    Improvements
                  </div>
                  <ul className="space-y-2 text-sm">
                    {improvements.length === 0 ? (
                      <li className="text-muted-foreground">None</li>
                    ) : (
                      improvements.map((item) => {
                        const test = catalog.tests.find((entry) => entry.id === item.testCaseId);
                        return <li key={item.testCaseId}>{test?.name || item.testCaseId}</li>;
                      })
                    )}
                  </ul>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/compare" />}>
              Open full comparison
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
