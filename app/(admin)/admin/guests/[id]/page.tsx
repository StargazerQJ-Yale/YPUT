import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestStatusBadge } from "@/components/admin/guest-status-badge";
import { GuestResearchPanel } from "@/components/admin/guest-research-panel";
import { DeleteGuestButton } from "@/components/admin/delete-guest-button";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getDefaultOrg();

  const [guest, lectureships] = await Promise.all([
    prisma.guest.findUnique({ where: { id } }),
    prisma.lectureshipFund.findMany({
      where: { orgId: org.id },
      orderBy: [{ isCommonlyUsed: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isCommonlyUsed: true },
    }),
  ]);

  if (!guest || guest.orgId !== org.id) notFound();

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
    </div>
  );
}
