import { Trash2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteRunButton({
  runId,
  runName,
  size = "sm",
  testId,
}: {
  runId: string;
  runName: string;
  testId?: string;
} & Pick<VariantProps<typeof buttonVariants>, "size">) {
  return (
    <form
      action={`/api/runs/${runId}/delete`}
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${runName}? This removes the run and its results.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="next" value="/runs" />
      <button
        type="submit"
        data-testid={testId}
        className={cn(buttonVariants({ variant: "destructive", size }))}
      >
        <Trash2 />
        Delete
      </button>
    </form>
  );
}
