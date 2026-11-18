import { createClient } from "@supabase/supabase-js";

// Server-only database client for API routes. The service-role key is never sent to the browser.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing from .env.local."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
