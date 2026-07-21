import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "positive" | "negative";
}) {
  const toneStyles: Record<string, string> = {
    default: "bg-muted text-foreground",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400",
    positive: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400",
    negative: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-400",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-1">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneStyles[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
