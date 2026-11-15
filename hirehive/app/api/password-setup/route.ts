import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "A valid setup link and password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date().toISOString();

  const { data: setup, error: lookupError } = await db()
    .from("password_setup_tokens")
    .select("id, email")
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .gt("expires_at", now)
    .maybeSingle();

  if (lookupError || !setup) {
    return NextResponse.json(
      { error: "This password setup link is invalid, expired, or already used." },
      { status: 400 }
    );
  }

  const { data: account } = await db()
    .from("accounts")
    .select("email")
    .eq("email", setup.email)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const { data: claimed, error: claimError } = await db()
    .from("password_setup_tokens")
    .update({ used: true })
    .eq("id", setup.id)
    .eq("used", false)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    return NextResponse.json(
      { error: "This setup link has already been used or expired." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error: updateError } = await db()
    .from("accounts")
    .update({
      password_hash: passwordHash,
      must_change_password: false,
    })
    .eq("email", setup.email);

  if (updateError) {
    return NextResponse.json(
      { error: "Could not save the new password. Please request a new setup link." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
