"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { associateExpenseToGuest } from "@/lib/actions/guests";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

export type LinkableExpense = {
  id: string;
  fullName: string;
  description: string;
  eventName: string | null;
  amount: number;
  purchaseDate: string; // ISO date
  status: ReimbursementStatus;
  guestName: string | null;
};

export function GuestExpenseLinker({
  guestId,
  candidates,
}: {
  guestId: string;
  candidates: LinkableExpense[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, 20);
    return candidates
      .filter((c) =>
        [c.fullName, c.description, c.eventName ?? ""].some((field) =>
          field.toLowerCase().includes(q),
        ),
      )
      .slice(0, 20);
  }, [candidates, query]);

  function handleLink(expenseId: string) {
    setPendingId(expenseId);
    startTransition(async () => {
      const result = await associateExpenseToGuest(guestId, expenseId);
      setPendingId(null);
      if (result.success) {
        toast.success("Expense linked");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Link an Existing Expense</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Finds any reimbursement already in the system — no restriction on its purchase date
          relative to this guest&apos;s visit. Linking moves it off any other guest it&apos;s currently
          attached to.
        </p>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, description, or event..."
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No matching expenses.</p>
      ) : (
        <div className="max-h-72 divide-y overflow-y-auto rounded-lg border">
          {filtered.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between gap-3 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {expense.eventName || expense.description}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {expense.fullName} · {formatDate(expense.purchaseDate)}
                  {expense.guestName ? ` · currently: ${expense.guestName}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={expense.status} />
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending && pendingId === expense.id}
                  onClick={() => handleLink(expense.id)}
                >
                  {pending && pendingId === expense.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Link2 className="size-4" />
                  )}
                  Link
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
