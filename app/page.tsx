import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  // E-Board can't see the Overview page (/admin) itself — Treasurer/Admin/
  // Super Admin only — so send it straight to the one page it can see.
  if (user.role === "EBOARD") redirect("/admin/ledger");
  if (["TREASURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  redirect("/dashboard");
}
