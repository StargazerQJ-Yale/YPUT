import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CycleForm } from "@/components/admin/cycle-form";
import { DeleteCycleButton } from "@/components/admin/delete-cycle-button";
import { EditCycleDialog } from "@/components/admin/edit-cycle-dialog";
import { requireSuperAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function CyclesPage() {
  await requireSuperAdmin();
  const org = await getDefaultOrg();

  const [cycles, treasurers] = await Promise.all([
    prisma.reimbursementCycle.findMany({
      where: { orgId: org.id },
      orderBy: { startDate: "desc" },
      include: { treasurer: true, _count: { select: { reimbursements: true } } },
    }),
    prisma.user.findMany({
      where: { orgId: org.id, role: { in: ["TREASURER", "SUPER_ADMIN"] } },
      orderBy: { email: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reimbursement Cycles</h1>
        <p className="text-sm text-muted-foreground">
          Submissions are automatically routed to whichever cycle is active on the day they&apos;re
          submitted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          {treasurers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No treasurers yet. Promote a user to Treasurer or Super Admin on the Users page first.
            </p>
          ) : (
            <CycleForm treasurers={treasurers} />
          )}
        </CardContent>
      </Card>

      {cycles.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No cycles yet" description="Create one above to get started." />
      ) : (
        <div className="grid gap-3">
          {cycles.map((cycle) => (
            <Card key={cycle.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-1">
                <div>
                  <p className="font-medium">{cycle.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)} ·{" "}
                    {cycle.treasurer.fullName ?? cycle.treasurer.email} · {cycle._count.reimbursements}{" "}
                    submissions
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <EditCycleDialog
                    cycleId={cycle.id}
                    currentLabel={cycle.label}
                    currentStartDate={cycle.startDate.toISOString().slice(0, 10)}
                    currentEndDate={cycle.endDate.toISOString().slice(0, 10)}
                    currentTreasurerUserId={cycle.treasurerUserId}
                    treasurers={treasurers}
                  />
                  <DeleteCycleButton cycleId={cycle.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
