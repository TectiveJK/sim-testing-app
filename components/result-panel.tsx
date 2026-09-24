"use client";

import { ArrowRight, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppData } from "@/components/data-provider";
import { formatBytes, formatDateTime } from "@/lib/format";
import { appPath, attachmentHref, runHref } from "@/lib/routes";
import { QUICK_STATUSES, STATUS_LABELS, scoreButtonClass } from "@/lib/status";
import type { TestCase, TestResult } from "@/lib/types";

export function ResultPanel({
  test,
  result,
  runId,
  tester,
  compact = false,
  nextHref,
}: {
  test: TestCase;
  result: TestResult;
  runId: string;
  tester?: string;
  compact?: boolean;
  nextHref?: string;
}) {
  const { saveResult, uploadAttachment, deleteAttachment } = useAppData();
  const stayHref = runHref(runId, { view: "execute", test: test.id });
  const afterScoreHref = nextHref || stayHref;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-sm text-sky-100">
        This app does not control SkyCommand. Read the procedure here, do the actions in SkyCommand
        on your other monitor, then come back and record the result.
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">{test.id}</p>
          <StatusBadge status={result.status} />
        </div>
        <h2 data-testid="result-title" className="mt-1 text-xl font-semibold tracking-tight">
          {test.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{test.description}</p>
      </div>

      {!compact && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Procedure — do this in SkyCommand
            </div>
            <p className="mt-2 text-sm leading-relaxed">{test.procedure}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expected result
            </div>
            <p className="mt-2 text-sm leading-relaxed">{test.expectedBehavior}</p>
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2 block">Record result</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_STATUSES.map((status) => (
            <form
              key={status}
              className="min-w-0 flex-1"
              onSubmit={async (event) => {
                event.preventDefault();
                try {
                  await saveResult({
                    testRunId: runId,
                    testCaseId: test.id,
                    status,
                    tester,
                  });
                  window.location.assign(appPath(status === "not_tested" ? stayHref : afterScoreHref));
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not save result");
                }
              }}
            >
              <button type="submit" className={cn("w-full", scoreButtonClass(status, result.status === status))}>
                {STATUS_LABELS[status]}
              </button>
            </form>
          ))}
        </div>
        {result.executedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last recorded {formatDateTime(result.executedAt)}
            {result.tester ? ` by ${result.tester}` : ""}
          </p>
        ) : null}
      </div>

      <form
        className="space-y-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          try {
            await saveResult({
              testRunId: runId,
              testCaseId: test.id,
              notes: String(form.get("notes") || ""),
              tester,
            });
            toast.success("Notes saved");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save notes");
          }
        }}
      >
        <Label htmlFor={`notes-${result.id}`}>Notes / Observations</Label>
        <Textarea
          id={`notes-${result.id}`}
          name="notes"
          defaultValue={result.notes}
          placeholder="What you saw in SkyCommand. Unexpected behaviour, errors, or anything worth keeping."
          className="min-h-24"
        />
        <button type="submit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Save notes
        </button>
      </form>

      {nextHref ? (
        <a href={nextHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
          Next test
          <ArrowRight />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">This is the last test in the current list.</p>
      )}

      <details className="rounded-xl border px-3 py-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">Optional attachment</summary>
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Optional screenshot or log from the SkyCommand session. Not required to record a result.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`file-${result.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}
            >
              <Paperclip />
              Attach file
            </label>
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
            <p className="text-sm text-muted-foreground">No file attached.</p>
          ) : (
            <ul className="space-y-2">
              {result.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <a
                    href={attachmentHref(attachment.id, attachment.dataUrl)}
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
      </details>
    </div>
  );
}
