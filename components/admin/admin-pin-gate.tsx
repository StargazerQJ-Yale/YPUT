"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyAdminPin, type ActionResult } from "@/lib/actions/admin-pin";

const initialState: ActionResult | null = null;

export function AdminPinGate() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(verifyAdminPin, initialState);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-xl">Admin PIN Required</CardTitle>
          <CardDescription>Enter your PIN to continue to the treasury admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="pin" className="sr-only">
                PIN
              </Label>
              <Input id="pin" name="pin" type="password" autoFocus required className="text-center" />
              {state && !state.success && (
                <p className="mt-1.5 text-sm text-destructive">{state.error}</p>
              )}
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
