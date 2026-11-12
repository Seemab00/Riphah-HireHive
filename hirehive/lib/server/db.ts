import { createClient } from "@supabase/supabase-js";

// Sirf server par chalta hai (API routes). Service-role key browser ko kabhi nahi jati.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL ya SUPABASE_SERVICE_ROLE_KEY .env.local me nahi hai");
  return createClient(url, key, { auth: { persistSession: false } });
}
