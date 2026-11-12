import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { appUrl, cleanEmail } from "@/lib/server/accounts";
import { sendEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

// Admin: POST /api/invites  { email, name?, role: "company", message?, attachmentName? }
// Token banta hai, invitation email outbox me jati hai, link wapas milta hai.
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Only Admin can invite." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const email = cleanEmail(b.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  const role = b.role === "company" ? "company" : null;
  if (!role) return NextResponse.json({ error: "Only company invitations are supported." }, { status: 400 });

  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { error } = await db().from("invites").insert({ token, email, role, name: b.name ?? null, expires_at: expires });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const link = `${appUrl(req)}/register/company?token=${token}`;
  await sendEmail(
    email,
    "Invitation: Riphah Open House",
    `Hello ${b.name ?? ""},\n\n${b.message ?? "You are invited to the Riphah Open House."}\n\nRegister your company here (valid 7 days):\n${link}`,
    { link, attachmentName: b.attachmentName }
  );
  return NextResponse.json({ link });
}

// Public: GET /api/invites?token=...  -> registration page form pehle se bharne ke liye
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const { data } = await db().from("invites").select("email,name,expires_at,used").eq("token", token).maybeSingle();
  if (!data || data.used || new Date(data.expires_at) < new Date()) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, email: data.email, name: data.name });
}
