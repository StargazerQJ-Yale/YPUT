import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReimbursementForm } from "@/components/reimbursements/reimbursement-form";
import { requireUser } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function SubmitPage() {
  const user = await requireUser();
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const budgetAreas = await prisma.budgetArea.findMany({
    where: { orgId: org.id, fiscalYearId: fiscalYear.id },
    orderBy: { name: "asc" },
    include: { budgetItems: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Submit a Reimbursement</CardTitle>
          <CardDescription>
            Fill out the details below and attach your receipt. Your request will be routed to the
            treasurer currently on cycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReimbursementForm
            budgetAreas={budgetAreas}
            defaultFullName={user.fullName ?? ""}
            defaultEmail={user.email}
          />
        </CardContent>
      </Card>
    </div>
  );
}
