import Link from "next/link";
import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClickableTableRow } from "@/components/shared/clickable-table-row";
import { ReimbursementsFilterBar } from "@/components/admin/reimbursements-filter-bar";
import { prisma } from "@/lib/prisma";
import { getDefaultOrg } from "@/lib/org";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Prisma, ReimbursementStatus } from "@/lib/generated/prisma/client";

export default async function AdminReimbursementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const org = await getDefaultOrg();

  const budgetAreas = await prisma.budgetArea.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const where: Prisma.ReimbursementWhereInput = { orgId: org.id };

  if (params.q) {
    where.OR = [
      { fullName: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.status) where.status = params.status as ReimbursementStatus;
  if (params.budgetAreaId) where.budgetAreaId = params.budgetAreaId;
  if (params.dateFrom || params.dateTo) {
    where.purchaseDate = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
    };
  }
  if (params.amountMin || params.amountMax) {
    where.amount = {
      ...(params.amountMin ? { gte: Number(params.amountMin) } : {}),
      ...(params.amountMax ? { lte: Number(params.amountMax) } : {}),
    };
  }

  const reimbursements = await prisma.reimbursement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { budgetArea: true, budgetItem: true, guest: { select: { name: true } } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reimbursements</h1>
        <p className="text-sm text-muted-foreground">
          Search and filter every submission across the organization.
        </p>
      </div>

      <ReimbursementsFilterBar budgetAreas={budgetAreas} />

      {reimbursements.length === 0 ? (
        <EmptyState icon={Inbox} title="No matching reimbursements" description="Try adjusting your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reimbursements.map((r) => (
                <ClickableTableRow key={r.id} href={`/admin/reimbursements/${r.id}`}>
                  <TableCell className="whitespace-normal">
                    <Link href={`/admin/reimbursements/${r.id}`} className="block">
                      <p className="font-medium">{r.fullName}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p>{r.budgetArea.name}</p>
                    <p className="text-xs text-muted-foreground">{r.budgetItem.name}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.guest?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(r.purchaseDate)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(r.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </ClickableTableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
