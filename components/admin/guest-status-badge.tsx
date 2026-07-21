import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GuestStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<GuestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400 border-transparent",
  RESEARCHED: "bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-400 border-transparent",
  CONFIRMED:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400 border-transparent",
};

const STATUS_LABELS: Record<GuestStatus, string> = {
  PENDING: "Not Researched",
  RESEARCHED: "Researched",
  CONFIRMED: "Confirmed",
};

export function GuestStatusBadge({ status, className }: { status: GuestStatus; className?: string }) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)} variant="outline">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
