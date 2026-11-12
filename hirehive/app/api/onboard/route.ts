import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession, createSession } from "@/lib/server/session";
import { appUrl, cleanEmail, generatePassword, splitAccount } from "@/lib/server/accounts";
import { sendEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

// Ek jagah se account banta hai (Nimra ka "Select", Wafa ka alumni form, company registration).
//
// POST /api/onboard
//   { accounts: [{ email, name, role, ...baqi fields }], token? }
//   Admin session: kisi bhi role (admin ke ilawa) ke accounts, password generate + email outbox me.
//   Bina login, role "alumni": public alumni form.
//   Bina login, role "company" + invite token: company apna password khud set karti hai.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const items: Record<string, any>[] = Array.isArray(body.accounts) ? body.accounts : [];
  if (!items.length || items.length > 200) return NextResponse.json({ error: "Send 1 to 200 accounts." }, { status: 400 });

  const s = await getSession();
  const isAdmin = s?.role === "admin";
  let invite: any = null;

  if (!isAdmin) {
    const allAlumni = items.every((i) => i.role === "alumni");
    if (allAlumni) {
      // public alumni form: theek hai
    } else if (body.token && items.length === 1 && items[0].role === "company") {
      const { data } = await db().from("invites").select("*").eq("token", String(body.token)).maybeSingle();
      invite = data;
      if (!invite || invite.used || new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "This invitation link is invalid or expired." }, { status: 400 });
      if (cleanEmail(items[0].email) !== invite.email) return NextResponse.json({ error: "Use the email the invitation was sent to." }, { status: 400 });
      if (!items[0].password || String(items[0].password).length < 8) return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
  }

  const login = appUrl(req) + "/login";
  const created: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    const { email, role, name, data } = splitAccount(item);
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !role || role === "admin") { skipped.push(email || "(no email)"); continue; }
    const { data: exists } = await db().from("accounts").select("email").eq("email", email).maybeSingle();
    if (exists) { skipped.push(email); continue; }

    const chosen = invite && item.password ? String(item.password) : null;
    const plain = chosen ?? generatePassword();
    const extra = role === "volunteer" ? { volunteerStatus: "Approved" } : {};
    const { error } = await db().from("accounts").insert({
      email, role, name,
      password_hash: await bcrypt.hash(plain, 10),
      must_change_password: !chosen,   // generated password: pehli login par badalna zaroori
      data: { ...data, ...extra },
    });
    if (error) { skipped.push(email); continue; }
    created.push(email);

    if (chosen) {
      await sendEmail(email, "Welcome to Riphah HireHive", `Hello ${name},\n\nYour company account is ready. Sign in with this email and the password you chose.\n\n${login}`, { link: login });
    } else {
      await sendEmail(
        email,
        "Your Riphah HireHive account",
        `Hello ${name},\n\nYour HireHive account has been created.\n\nUsername: ${email}\nPassword: ${plain}\n\nPlease sign in and change your password: ${login}`,
        { link: login }
      );
    }
  }

  if (invite && created.length) {
    await db().from("invites").update({ used: true }).eq("token", invite.token);
    await createSession(created[0], "company"); // company khud login ho jati hai
  }
  return NextResponse.json({ created, skipped });
}
