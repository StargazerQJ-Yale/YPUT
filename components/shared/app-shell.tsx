"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  KeyRound,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Mic2,
  Receipt,
  ReceiptText,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ChangePinDialog } from "@/components/admin/change-pin-dialog";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/role-permissions";

// Icons are resolved by name (not passed as component references) because
// component/function values can't cross the Server -> Client prop boundary.
const ICONS = {
  dashboard: LayoutDashboard,
  submit: ReceiptText,
  reimbursements: ListChecks,
  budgets: Wallet,
  ledger: Receipt,
  analytics: BarChart3,
  guests: Mic2,
  cycles: CalendarRange,
  users: Users,
  settings: Settings,
} as const;

export type IconKey = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
};

type AppShellUser = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
};

function NavLinks({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu({ user }: { user: AppShellUser }) {
  const [pinDialogOpen, setPinDialogOpen] = React.useState(false);
  const isAdmin =
    user.role === "TREASURER" ||
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "EBOARD";

  const initials = (user.fullName || user.email)
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-muted" />
          }
        >
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{user.fullName ?? user.email}</p>
            <p className="truncate text-xs text-muted-foreground leading-tight">{user.email}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between font-normal">
              <span className="text-xs text-muted-foreground">Signed in as</span>
              <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuItem onClick={() => setPinDialogOpen(true)}>
              <KeyRound className="size-4" />
              Change Admin PIN
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" render={<form action={signOut} className="w-full" />}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && <ChangePinDialog open={pinDialogOpen} onOpenChange={setPinDialogOpen} />}
    </>
  );
}

export function AppShell({
  navItems,
  user,
  brandLabel,
  children,
}: {
  navItems: NavItem[];
  user: AppShellUser;
  brandLabel: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-4" />
          </div>
          <span className="font-semibold">{brandLabel}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks navItems={navItems} />
        </div>
        <div className="border-t p-3">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-16 items-center gap-2 border-b px-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Landmark className="size-4" />
              </div>
              <span className="font-semibold">{brandLabel}</span>
            </div>
            <div className="p-3">
              <NavLinks navItems={navItems} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="absolute bottom-0 w-64 border-t p-3">
              <UserMenu user={user} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-semibold">{brandLabel}</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop theme toggle, floated top-right of content */}
      <div className="fixed right-4 top-4 z-30 hidden lg:block">
        <ThemeToggle />
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
