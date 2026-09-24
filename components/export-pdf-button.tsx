"use client";

import { FileDown } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { toast } from "sonner";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useAppData } from "@/components/data-provider";
import { cn } from "@/lib/utils";

export function ExportPdfButton({
  runId,
  size,
  testId,
  className,
}: {
  runId: string;
  testId?: string;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, "size">) {
  const { exportPdf } = useAppData();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={busy}
      className={cn(buttonVariants({ variant: "outline", size }), className)}
      onClick={async () => {
        setBusy(true);
        try {
          await exportPdf(runId);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not export PDF");
        } finally {
          setBusy(false);
        }
      }}
    >
      <FileDown />
      {busy ? "Exporting…" : "Export PDF"}
    </button>
  );
}
