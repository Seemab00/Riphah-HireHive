import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";
import { cleanEmail, splitAccount, toAccount, AccountRow } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

// Purani open signup, sirf in roles ke liye (jab tak Ma'am Regular Student / Lab ka onboarding confirm na karein).
// Admin, coordinator, company, alumni, fyp yahan se nahi ban sakte: unka raasta invitation / /api/onboard hai.
const OPEN_ROLES = new Set(["student", "lab", "volunteer"]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, role, name, data } = splitAccount(body);
  if (!OPEN_ROLES.has(role)) return NextResponse.json({ error: "This role cannot sign up directly. Please use your invitation link." }, { status: 403 });
  if (!email || !body.password || String(body.password).length < 8) return NextResponse.json({ error: "Email and a password of at least 8 characters are required." }, { status: 400 });

  const { data: existing } = await db().from("accounts").select("role").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "This email is already registered as " + existing.role + ". Please sign in." }, { status: 409 });

  const extra = role === "volunteer"
    ? { volunteerStatus: "Pending", volunteerStage: 1, volunteerStageDecisions: ["Pending", "Pending", "Pending"] }
    : {};
  const { data: row, error } = await db().from("accounts").insert({
    email, role, name,
    password_hash: await bcrypt.hash(String(body.password), 10),
    data: { ...data, ...extra },
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await createSession(cleanEmail(email), role);
  return NextResponse.json({ account: toAccount(row as AccountRow) });
}
