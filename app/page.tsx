import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "TREASURER" || user.role === "SUPER_ADMIN") redirect("/admin");
  redirect("/dashboard");
}
