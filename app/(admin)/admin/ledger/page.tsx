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
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportMenu } from "@/components/admin/export-menu";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getLedgerTransactions } from "@/lib/ledger";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function LedgerPage() {
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const transactions = await getLedgerTransactions(org.id, fiscalYear.id);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Automatically recorded when a reimbursement is marked paid. Fiscal year {fiscalYear.label}.
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

      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No ledger entries yet"
          description="Entries appear automatically once a reimbursement is marked paid."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell className="whitespace-nowrap text-sm">
                      <Link href={`/admin/reimbursements/${t.reimbursementId}`} className="block">
                        {formatDate(t.occurredAt)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p>{t.budgetItem.budgetArea.name}</p>
                      <p className="text-xs text-muted-foreground">{t.budgetItem.name}</p>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <p className="font-medium">{t.reimbursement.fullName}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {t.reimbursement.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
