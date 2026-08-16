import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClickableTableRow } from "@/components/shared/clickable-table-row";
import { ExportMenu } from "@/components/admin/export-menu";
import { ManualLedgerEntryForm } from "@/components/admin/manual-ledger-entry-form";
import { DeleteLedgerEntryButton } from "@/components/admin/delete-ledger-entry-button";
import { requireAdminAreaAccess } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getLedgerTransactions, groupTransactionsByWeek } from "@/lib/ledger";
import { getPublicIdentity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function LedgerPage() {
  const viewer = await requireAdminAreaAccess();
  const canEdit = viewer.role !== "EBOARD";
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const [transactions, budgetAreasList] = await Promise.all([
    getLedgerTransactions(org.id, fiscalYear.id),
    prisma.budgetArea.findMany({
      where: { orgId: org.id, fiscalYearId: fiscalYear.id },
      orderBy: { name: "asc" },
      include: { budgetItems: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
    }),
  ]);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const weeklyGroups = groupTransactionsByWeek(transactions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Recorded when a reimbursement is marked paid, or added manually. Grouped by the
            Tuesday-to-Tuesday week the money was spent. Fiscal year {fiscalYear.label}.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Recorded</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(total)}</p>
          </div>
          <ExportMenu href="/api/exports/ledger" />
        </div>
      </div>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Manual Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualLedgerEntryForm budgetAreas={budgetAreasList} />
          </CardContent>
        </Card>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No ledger entries yet"
          description="Entries appear automatically once a reimbursement is marked paid, or add one manually above."
        />
      ) : (
        <div className="space-y-6">
          {weeklyGroups.map((group) => (
            <Card key={group.weekStart.toISOString()} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
                <p className="text-sm font-medium">
                  Week of {formatDate(group.weekStart)} – {formatDate(group.weekEnd)}
                </p>
                <Badge variant="secondary" className="tabular-nums">
                  {formatCurrency(group.total)}
                </Badge>
              </div>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.transactions.map((t) => {
                      if (t.reimbursement && t.reimbursementId) {
                        const href = `/admin/reimbursements/${t.reimbursementId}`;
                        return (
                          <ClickableTableRow key={t.id} href={href}>
                            <TableCell className="whitespace-nowrap text-sm">
                              <Link href={href} className="block">
                                {formatDate(t.reimbursement.purchaseDate)}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <p>{t.budgetItem.budgetArea.name}</p>
                              <p className="text-xs text-muted-foreground">{t.budgetItem.name}</p>
                            </TableCell>
                            <TableCell className="whitespace-normal">
                              <p className="font-medium">{t.reimbursement.fullName}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {t.reimbursement.eventName || t.reimbursement.description}
                              </p>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(t.amount)}
                            </TableCell>
                            <TableCell />
                          </ClickableTableRow>
                        );
                      }

                      const identity = t.recordedBy ? getPublicIdentity(t.recordedBy, viewer) : null;
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(t.occurredAt)}
                          </TableCell>
                          <TableCell>
                            <p>{t.budgetItem.budgetArea.name}</p>
                            <p className="text-xs text-muted-foreground">{t.budgetItem.name}</p>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <p className="font-medium">{t.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Manual entry{identity ? ` · added by ${identity.fullName}` : ""}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <DeleteLedgerEntryButton entryId={t.id} description={t.description ?? "entry"} />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
