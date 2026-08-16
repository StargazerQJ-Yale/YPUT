import { Badge } from "@/components/ui/badge";
import type { FundDepositStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<FundDepositStatus, string> = {
  PROMISED: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400 border-transparent",
  RECEIVED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400 border-transparent",
};

const STATUS_LABELS: Record<FundDepositStatus, string> = {
  PROMISED: "Promised",
  RECEIVED: "Received",
};

export function FundDepositStatusBadge({ status }: { status: FundDepositStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]} variant="outline">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
