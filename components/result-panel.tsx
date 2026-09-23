"use client";

import { Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/data-provider";
import { formatBytes, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import { TEST_STATUSES, type TestCase, type TestResult, type TestStatus } from "@/lib/types";

export function ResultPanel({
  test,
  result,
  runId,
  tester,
  compact = false,
}: {
  test: TestCase;
  result: TestResult;
  runId: string;
  tester?: string;
  compact?: boolean;
}) {
  const { saveResult, uploadAttachment, deleteAttachment } = useAppData();

  const setStatus = async (status: TestStatus) => {
    try {
      await saveResult({
        id: result.id,
        testRunId: runId,
        testCaseId: test.id,
        status,
        tester,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save status");
    }
  };

  const saveNotes = async (notes: string) => {
    try {
      await saveResult({
        id: result.id,
        testRunId: runId,
        testCaseId: test.id,
        notes,
        tester,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notes");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">{test.id}</p>
          <StatusBadge status={result.status} />
        </div>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{test.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{test.description}</p>
      </div>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expected
            </div>
            <p className="mt-1 text-sm">{test.expectedBehavior}</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Procedure
            </div>
            <p className="mt-1 text-sm">{test.procedure}</p>
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2 block">Result</Label>
        <div className="flex flex-wrap gap-2">
          {TEST_STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={result.status === status ? "default" : "outline"}
              onClick={() => setStatus(status)}
            >
              {STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
        {result.executedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last recorded {formatDateTime(result.executedAt)}
            {result.tester ? ` by ${result.tester}` : ""}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`notes-${result.id}`}>Notes and observations</Label>
        <Textarea
          id={`notes-${result.id}`}
          key={`${result.id}-${result.notes}`}
          defaultValue={result.notes}
          placeholder="What happened in the SIM? Unexpected modes, errors, telemetry, or recovery notes."
          className="min-h-28"
          onBlur={(event) => {
            if (event.target.value !== result.notes) {
              void saveNotes(event.target.value);
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <p className="text-xs text-muted-foreground">
          Screenshots, logs, error messages, or test reports from this execution.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" render={<label htmlFor={`file-${result.id}`} />}>
            <Paperclip />
            Attach file
          </Button>
          <input
            id={`file-${result.id}`}
            type="file"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                await uploadAttachment({
                  file,
                  resultId: result.id,
                  testRunId: runId,
                  testCaseId: test.id,
                });
                toast.success(`Attached ${file.name}`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Upload failed");
              }
            }}
          />
        </div>
        {result.attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files attached yet.</p>
        ) : (
          <ul className="space-y-2">
            {result.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <a
                  href={`/api/attachments?id=${attachment.id}`}
                  className="min-w-0 truncate text-sm hover:underline"
                >
                  {attachment.originalName}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatBytes(attachment.size)}
                  </span>
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={async () => {
                    try {
                      await deleteAttachment(attachment.id);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not delete");
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
