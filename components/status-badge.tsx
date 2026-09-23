import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_SHORT, statusClass } from "@/lib/status";
import type { TestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  short = false,
  className,
}: {
  status: TestStatus;
  short?: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusClass(status), className)}
    >
      {short ? STATUS_SHORT[status] : STATUS_LABELS[status]}
    </Badge>
  );
}
