import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getDefaultOrg } from "@/lib/org";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { user: authUser } = data;
  const org = await getDefaultOrg();
  const bootstrapAdminEmail = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.toLowerCase();
  const email = authUser.email!.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });

  await prisma.user.upsert({
    where: { id: authUser.id },
    // fullName/email are only set on first login (create) — once set, they're
    // "sticky" so a Super Admin's edit via /admin/users isn't silently
    // overwritten by Google's values the next time this person signs in.
    update: {
      avatarUrl: authUser.user_metadata.avatar_url ?? null,
    },
    create: {
      id: authUser.id,
      orgId: org.id,
      email,
      fullName: authUser.user_metadata.full_name ?? authUser.user_metadata.name ?? null,
      avatarUrl: authUser.user_metadata.avatar_url ?? null,
      role: !existing && bootstrapAdminEmail && email === bootstrapAdminEmail ? "SUPER_ADMIN" : "MEMBER",
    },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
