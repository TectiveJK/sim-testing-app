"use client";

import Link from "next/link";
import { FileDown, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DeleteRunButton } from "@/components/delete-run-button";
import { DownloadLink } from "@/components/download-link";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";
import { countResults, passRate } from "@/lib/client-types";
import { formatDateTime } from "@/lib/format";

export default function RunsPage() {
  const { store } = useAppData();

  return (
    <div>
      <PageHeader
        eyebrow="Regression testing"
        title="Test runs"
        description="A test run is a checklist session. Open a test, do the actions in SkyCommand, then record the result here. The catalog is attached automatically."
        actions={
          <LinkButton href="/runs/new">
            <Plus />
            New test run
          </LinkButton>
        }
      />

      {store.runs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No test runs yet. Start one to begin scoring the 100 transition tests against a software
              version.
            </p>
            <LinkButton href="/runs/new" className="mt-4">
              Create test run
            </LinkButton>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {store.runs.map((run) => {
            const counts = countResults(store, run.id);
            const rate = passRate(counts);
            const recorded = counts.total - counts.not_tested;
            return (
              <div
                key={run.id}
                className="rounded-xl border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <Link href={`/runs/${run.id}`} className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{run.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      SkyCommand {run.skyCommandVersion || "—"} · Drone {run.droneVersion || "—"} ·{" "}
                      {formatDateTime(run.startedAt)}
                      {run.tester ? ` · ${run.tester}` : ""}
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {rate === null ? "No scored tests" : `${rate}% pass`}
                    </span>
                    <StatusBadge status="passed" short />
                    <span>{counts.passed}</span>
                    <StatusBadge status="failed" short />
                    <span>{counts.failed}</span>
                    <StatusBadge status="not_tested" short />
                    <span>{counts.not_tested}</span>
                    {recorded > 0 ? (
                      <DownloadLink
                        href={`/api/runs/${run.id}/pdf`}
                        size="sm"
                        testId={`export-pdf-${run.id}`}
                      >
                        <FileDown />
                        Export PDF
                      </DownloadLink>
                    ) : null}
                    <DeleteRunButton
                      runId={run.id}
                      runName={run.name}
                      testId={`delete-run-${run.id}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
