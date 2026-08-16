import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (["EBOARD", "TREASURER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/admin");
  redirect("/dashboard");
}
