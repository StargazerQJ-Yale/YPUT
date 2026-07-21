import { cookies } from "next/headers";
import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { AdminPinGate } from "@/components/admin/admin-pin-gate";
import { requireAdmin } from "@/lib/auth";
import { PIN_COOKIE_NAME, verifyPinToken } from "@/lib/pin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  const cookieStore = await cookies();
  const pinVerified = verifyPinToken(user.id, cookieStore.get(PIN_COOKIE_NAME)?.value);
  if (!pinVerified) {
    return <AdminPinGate />;
  }

  const navItems: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "dashboard" },
    { href: "/admin/reimbursements", label: "Reimbursements", icon: "reimbursements" },
    { href: "/admin/budgets", label: "Budgets", icon: "budgets" },
    { href: "/admin/ledger", label: "Ledger", icon: "ledger" },
    { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
    { href: "/admin/guests", label: "Guests", icon: "guests" },
    ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN"
      ? ([{ href: "/admin/users", label: "Users", icon: "users" }] as NavItem[])
      : []),
    ...(user.role === "SUPER_ADMIN"
      ? ([
          { href: "/admin/cycles", label: "Cycles", icon: "cycles" },
          { href: "/admin/settings", label: "Settings", icon: "settings" },
        ] as NavItem[])
      : []),
  ];

  return (
    <AppShell navItems={navItems} user={user} brandLabel="Treasury Admin">
      {children}
    </AppShell>
  );
}
