import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Status color is never the only signal — the percentage/label text next to
// the bar always carries the same meaning, per the reserved status palette
// (good/warning/critical) used elsewhere in this app (StatCard, StatusBadge).
function toneFor(percentUsed: number): "good" | "warning" | "critical" {
  if (percentUsed >= 100) return "critical";
  if (percentUsed >= 75) return "warning";
  return "good";
}

const INDICATOR_TONE_CLASSES = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const TEXT_TONE_CLASSES = {
  good: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-700 dark:text-amber-400",
  critical: "text-red-700 dark:text-red-400",
};

export function BudgetMeter({ percentUsed }: { percentUsed: number }) {
  const tone = toneFor(percentUsed);
  const clamped = Math.min(Math.max(percentUsed, 0), 100);

  return (
    <div className="flex items-center gap-2">
      <ProgressPrimitive.Root value={clamped} className="w-full">
        <ProgressTrack>
          <ProgressIndicator className={INDICATOR_TONE_CLASSES[tone]} />
        </ProgressTrack>
      </ProgressPrimitive.Root>
      <span className={cn("w-16 shrink-0 text-right text-xs font-medium tabular-nums", TEXT_TONE_CLASSES[tone])}>
        {percentUsed.toFixed(0)}%
      </span>
    </div>
  );
}
