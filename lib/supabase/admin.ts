import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged, server-only operations (e.g. issuing
// signed upload URLs for the private receipts bucket). Never import this
// from a Client Component or expose SUPABASE_SECRET_KEY to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
