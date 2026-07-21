import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShowNamesToggle } from "@/components/admin/show-names-toggle";
import { requireSuperAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";

export default async function SettingsPage() {
  await requireSuperAdmin();
  const org = await getDefaultOrg();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Organization-wide preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="show-names">Show member names publicly</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                When on, the public ledger at <code>/ledger</code> shows who submitted each
                transaction. When off (default), only the date, description, and amount are shown.
              </p>
            </div>
            <ShowNamesToggle initialValue={org.showMemberNamesOnPublicLedger} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
