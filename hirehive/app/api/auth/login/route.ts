import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";
import { AccountRow, cleanEmail, toAccount } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const { data } = await db().from("accounts").select("*").eq("email", cleanEmail(email)).maybeSingle();
  const row = data as AccountRow | null;
  // Dono galtiyon par ek hi message (kisi ko ye na pata chale ke email maujood hai).
  if (!row || !password || !(await bcrypt.compare(String(password), row.password_hash))) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }
  await createSession(row.email, row.role);
  return NextResponse.json({ account: toAccount(row) });
}
