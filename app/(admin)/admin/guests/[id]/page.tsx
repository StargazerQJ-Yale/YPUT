import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { GuestStatusBadge } from "@/components/admin/guest-status-badge";
import { GuestResearchPanel } from "@/components/admin/guest-research-panel";
import { DeleteGuestButton } from "@/components/admin/delete-guest-button";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const org = await getDefaultOrg();

  const [guest, lectureships, expenses] = await Promise.all([
    prisma.guest.findUnique({ where: { id } }),
    prisma.lectureshipFund.findMany({
      where: { orgId: org.id },
      orderBy: [{ isCommonlyUsed: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isCommonlyUsed: true },
    }),
    prisma.reimbursement.findMany({
      where: { guestId: id },
      orderBy: { purchaseDate: "asc" },
      include: { budgetArea: true, budgetItem: true },
    }),
  ]);

  if (!guest || guest.orgId !== org.id) notFound();

  const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/guests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Guests
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{guest.name}</h1>
            <GuestStatusBadge status={guest.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Debate on {formatDate(guest.debateDate)}
          </p>
        </div>
        <DeleteGuestButton guestId={guest.id} name={guest.name} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lectureship Match</CardTitle>
        </CardHeader>
        <CardContent>
          <GuestResearchPanel
            guestId={guest.id}
            status={guest.status}
            researchSummary={guest.researchSummary}
            matchReasoning={guest.matchReasoning}
            matchedLectureshipId={guest.matchedLectureshipId}
            lectureships={lectureships}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Expenses</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Reimbursements linked to this guest — attach them from the reimbursement&apos;s Edit dialog.
            </p>
          </div>
          {expenses.length > 0 && (
            <Button
              nativeButton={false}
              render={<a href={`/api/exports/guest/${guest.id}`} download />}
            >
              <Download className="size-4" />
              Download Expense Report (ZIP)
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
              <Receipt className="size-6 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                No reimbursements linked to this guest yet.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Budget Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(expense.purchaseDate)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {expense.eventName || expense.description}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {expense.budgetArea.name} / {expense.budgetItem.name}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={expense.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-right text-sm font-medium">
                Total: {formatCurrency(totalExpenses)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
