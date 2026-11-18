// Seeds the Admin account with a hashed password.
// Run with: node --env-file=.env.local scripts/seed-admin.mjs
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD in .env.local."
  );
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { error } = await db.from("accounts").upsert({
  email: ADMIN_EMAIL.trim().toLowerCase(),
  role: "admin",
  name: ADMIN_NAME || "Admin",
  password_hash: await bcrypt.hash(ADMIN_PASSWORD, 10),
  must_change_password: false,
  data: {},
}, { onConflict: "email" });
if (error) { console.error(error.message); process.exit(1); }
console.log("Admin ready:", ADMIN_EMAIL);
