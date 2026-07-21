import { AppShell, type NavItem } from "@/components/shared/app-shell";
import { requireUser } from "@/lib/auth";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "My Submissions", icon: "dashboard" },
  { href: "/submit", label: "Submit Reimbursement", icon: "submit" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell navItems={NAV_ITEMS} user={user} brandLabel="Treasury Portal">
      {children}
    </AppShell>
  );
}
