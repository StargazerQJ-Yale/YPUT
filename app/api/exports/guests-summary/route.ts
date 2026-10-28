import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { buildWorkbook } from "@/lib/exports/excel";
import { buildGuestSummaryRow, GUEST_SUMMARY_HEADERS } from "@/lib/exports/guest-summary";

// One row per guest across the whole org — the master handoff sheet a
// treasurer keeps alongside the per-guest ZIP exports.
export async function GET() {
  await requireAdmin();
  const org = await getDefaultOrg();

  const guests = await prisma.guest.findMany({
    where: { orgId: org.id },
    orderBy: { debateDate: "asc" },
    include: {
      reimbursements: {
        select: { description: true, eventName: true, amount: true, status: true },
      },
    },
  });

  const rows = await Promise.all(
    guests.map((guest) =>
      buildGuestSummaryRow({
        name: guest.name,
        debateDate: guest.debateDate,
        resolution: guest.resolution,
        reimbursements: guest.reimbursements.map((r) => ({
          description: r.description,
          eventName: r.eventName,
          amount: Number(r.amount),
          status: r.status,
        })),
      }),
    ),
  );

  const workbookBuffer = await buildWorkbook([
    { name: "Guests", headers: GUEST_SUMMARY_HEADERS, rows, wrapColumns: [2] },
  ]);

  return new Response(new Uint8Array(workbookBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Guest Expense Summary.xlsx"`,
    },
  });
}
