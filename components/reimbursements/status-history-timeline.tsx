import { Paperclip } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/format";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

type HistoryEntry = {
  id: string;
  fromStatus: ReimbursementStatus | null;
  toStatus: ReimbursementStatus;
  note: string | null;
  createdAt: Date;
  changedBy: { fullName: string | null; email: string };
  attachmentName?: string | null;
  attachmentUrl?: string | null;
};

export function StatusHistoryTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <ol className="space-y-4">
      {history.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={entry.toStatus} />
              <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {entry.changedBy.fullName ?? entry.changedBy.email}
              {entry.note ? ` — ${entry.note}` : ""}
            </p>
            {entry.attachmentUrl && (
              <a
                href={entry.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Paperclip className="size-3" />
                {entry.attachmentName ?? "View attachment"}
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
