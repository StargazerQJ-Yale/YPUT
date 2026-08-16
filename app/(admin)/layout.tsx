import { cookies } from "next/headers";
import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { AdminPinGate } from "@/components/admin/admin-pin-gate";
import { requireAdminAreaAccess } from "@/lib/auth";
import { PIN_COOKIE_NAME, verifyPinToken } from "@/lib/pin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminAreaAccess();

  const cookieStore = await cookies();
  const pinVerified = verifyPinToken(user.id, cookieStore.get(PIN_COOKIE_NAME)?.value);
  if (!pinVerified) {
    return <AdminPinGate />;
  }

  // E-Board is read-only and scoped to Ledger/Budgets — every other admin
  // page still requires requireAdmin() itself, so hiding nav items here is a
  // UX nicety, not the only thing standing between E-Board and those pages.
  const navItems: NavItem[] =
    user.role === "EBOARD"
      ? [
          { href: "/admin/budgets", label: "Budgets", icon: "budgets" },
          { href: "/admin/ledger", label: "Ledger", icon: "ledger" },
        ]
      : [
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
