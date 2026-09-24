"use client";

import { Trash2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { useAppData } from "@/components/data-provider";
import { appPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function DeleteRunButton({
  runId,
  runName,
  size = "sm",
  testId,
  redirectTo = "/runs",
}: {
  runId: string;
  runName: string;
  testId?: string;
  redirectTo?: string;
} & Pick<VariantProps<typeof buttonVariants>, "size">) {
  const { deleteRun } = useAppData();

  return (
    <button
      type="button"
      data-testid={testId}
      className={cn(buttonVariants({ variant: "destructive", size }))}
      onClick={async () => {
        if (!window.confirm(`Delete ${runName}? This removes the run and its results.`)) {
          return;
        }
        try {
          await deleteRun(runId);
          window.location.assign(appPath(redirectTo));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not delete run");
        }
      }}
    >
      <Trash2 />
      Delete
    </button>
  );
}
