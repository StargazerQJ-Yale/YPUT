import Link from "next/link";
import { ReceiptText, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();

  const reimbursements = await prisma.reimbursement.findMany({
    where: { submitterUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { budgetArea: true, budgetItem: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Submissions</h1>
          <p className="text-sm text-muted-foreground">
            Track the status of every reimbursement you&apos;ve submitted.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/submit" />}>
          <Plus className="size-4" />
          New Reimbursement
        </Button>
      </div>

      {reimbursements.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No submissions yet"
          description="Once you submit a reimbursement request, it will show up here with its live status."
          action={
            <Button nativeButton={false} render={<Link href="/submit" />}>Submit your first reimbursement</Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {reimbursements.map((r) => (
            <Link key={r.id} href={`/reimbursements/${r.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.eventName || r.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.budgetArea.name} &middot; {r.budgetItem.name} &middot; {formatDate(r.purchaseDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
