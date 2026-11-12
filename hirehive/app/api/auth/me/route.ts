import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { AccountRow, splitAccount, toAccount } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

async function load(email: string) {
  const { data } = await db().from("accounts").select("*").eq("email", email).maybeSingle();
  return data as AccountRow | null;
}

// Kaun logged in hai?
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ account: null });
  const row = await load(s.email);
  return NextResponse.json({ account: row ? toAccount(row) : null });
}

// Apna profile badalna (naam, CV, password). Email aur role yahan se nahi badalte.
export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const row = await load(s.email);
  if (!row) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { name, data: rest } = splitAccount({ ...body, email: row.email, role: row.role });
  const update: Record<string, unknown> = { data: { ...row.data, ...rest } };
  if (typeof body.name === "string" && body.name.trim()) update.name = name;

  if (body.password) {
    if (String(body.password).length < 8) return NextResponse.json({ error: "New password must have at least 8 characters." }, { status: 400 });
    // Pehli login par (mustChangePassword) purana password dobara poochna zaroori nahi.
    if (!row.must_change_password && !(await bcrypt.compare(String(body.currentPassword ?? ""), row.password_hash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    update.password_hash = await bcrypt.hash(String(body.password), 10);
    update.must_change_password = false;
  }

  const { data, error } = await db().from("accounts").update(update).eq("email", row.email).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: toAccount(data as AccountRow) });
}
