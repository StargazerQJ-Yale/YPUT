import Link from "next/link";
import { Mic2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { GuestForm } from "@/components/admin/guest-form";
import { GuestStatusBadge } from "@/components/admin/guest-status-badge";
import { DeleteGuestButton } from "@/components/admin/delete-guest-button";
import { getDefaultOrg } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function GuestsPage() {
  const org = await getDefaultOrg();

  const [guests, lectureships] = await Promise.all([
    prisma.guest.findMany({
      where: { orgId: org.id },
      orderBy: { debateDate: "desc" },
      include: { matchedLectureship: { select: { name: true } } },
    }),
    prisma.lectureshipFund.findMany({
      where: { orgId: org.id },
      orderBy: [{ isCommonlyUsed: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
        <p className="text-sm text-muted-foreground">
          Track Tuesday debate speakers and let AI research which Yale lectureship fund fits
          each one.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Guest</CardTitle>
        </CardHeader>
        <CardContent>
          <GuestForm />
        </CardContent>
      </Card>

      {guests.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No guests yet"
          description="Add a guest above, then research them with AI on their detail page."
        />
      ) : (
        <div className="space-y-2">
          {guests.map((guest) => (
            <Card key={guest.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-1">
                <Link href={`/admin/guests/${guest.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(guest.debateDate)}
                    {guest.matchedLectureship && ` · ${guest.matchedLectureship.name}`}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <GuestStatusBadge status={guest.status} />
                  <DeleteGuestButton guestId={guest.id} name={guest.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yale Lectureship Funds</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {lectureships.map((fund) => (
            <div key={fund.id} className="flex items-start gap-2 py-2">
              {fund.isCommonlyUsed && (
                <Star className="mt-0.5 size-3.5 shrink-0 fill-amber-400 text-amber-400" />
              )}
              <div>
                <p className="text-sm font-medium">{fund.name}</p>
                <p className="text-xs text-muted-foreground">{fund.purpose}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
