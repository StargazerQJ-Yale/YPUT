import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<ReimbursementStatus, string> = {
  PENDING:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400 border-transparent",
  APPROVED:
    "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-400 border-transparent",
  NEEDS_INFO:
    "bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-400 border-transparent",
  PAID: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-400 border-transparent",
  WITHDRAWN:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400 border-transparent",
};

const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  NEEDS_INFO: "Needs Info",
  PAID: "Paid",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function StatusBadge({ status, className }: { status: ReimbursementStatus; className?: string }) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)} variant="outline">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
