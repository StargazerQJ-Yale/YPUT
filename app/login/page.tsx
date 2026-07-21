import { redirect } from "next/navigation";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next || "/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Landmark className="size-6" />
          </div>
          <CardTitle className="text-xl">Treasury Portal</CardTitle>
          <CardDescription>Sign in to submit or review reimbursements.</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton next={next} />
        </CardContent>
      </Card>
      <Link
        href="/ledger"
        className="mt-4 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        View the public finance ledger →
      </Link>
    </main>
  );
}
