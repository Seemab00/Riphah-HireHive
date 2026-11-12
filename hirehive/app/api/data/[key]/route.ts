import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession, Session } from "@/lib/server/session";
import { AccountRow, splitAccount, toAccount } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

const KEY_RE = /^hirehive_[a-z_]+$/;
const ACCOUNTS = "hirehive_accounts";
// In keys ko sirf Admin likh sakti hai.
const ADMIN_ONLY_WRITE = new Set(["hirehive_event", "hirehive_clearance", "hirehive_interview_session"]);

function validKey(key: string) {
  return KEY_RE.test(key) && key !== "hirehive_session";
}

// Accounts ki list: har role ko sirf wo dikhao jo us ke kaam ka hai.
function visibleAccounts(s: Session, all: ReturnType<typeof toAccount>[]) {
  if (s.role === "admin" || s.role === "coordinator") return all;
  const strip = (a: any) => { const { cvDataUrl, ...rest } = a; return rest; };
  return all
    .filter((a: any) => {
      if (a.email === s.email || a.role === "company") return true;
      if (s.role === "company") return (a.role === "fyp" || a.role === "student") && a.cvVisible;
      if (s.role === "alumni") return a.role === "fyp"; // booked student ki CV (booking check agle phase me)
      return false;
    })
    .map((a: any) => (a.email === s.email || (s.role === "alumni" && a.role === "fyp") || (s.role === "company" && a.cvVisible) ? a : strip(a)));
}

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!validKey(params.key)) return NextResponse.json({ error: "Bad key." }, { status: 400 });

  if (params.key === ACCOUNTS) {
    const { data } = await db().from("accounts").select("*");
    const all = ((data ?? []) as AccountRow[]).map(toAccount);
    return NextResponse.json({ value: visibleAccounts(s, all) });
  }
  const { data } = await db().from("records").select("value").eq("key", params.key).maybeSingle();
  return NextResponse.json({ value: data ? data.value : null });
}

export async function PUT(req: Request, { params }: { params: { key: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!validKey(params.key)) return NextResponse.json({ error: "Bad key." }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || !("value" in body)) return NextResponse.json({ error: "Missing value." }, { status: 400 });

  if (params.key === ACCOUNTS) {
    if (s.role !== "admin" && s.role !== "coordinator") return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    if (!Array.isArray(body.value)) return NextResponse.json({ error: "Expected a list." }, { status: 400 });

    const { data: existing } = await db().from("accounts").select("email, role, password_hash, must_change_password");
    const byEmail = new Map((existing ?? []).map((r: any) => [r.email, r]));
    const rows: Record<string, unknown>[] = [];

    for (const a of body.value as Record<string, any>[]) {
      const { email, role, name, data } = splitAccount(a);
      if (!email) continue;
      const old: any = byEmail.get(email);
      if (!old && role === "admin") continue;                       // API se naya admin nahi ban sakta
      if (old?.role === "admin" && s.role !== "admin") continue;    // coordinator admin ko nahi chhoo sakta
      // Page ne naya plain password diya (jaise Staff page) to hash karo, warna purana hash rakho.
      const hash = a.password ? await bcrypt.hash(String(a.password), 10) : old?.password_hash;
      if (!hash) continue;
      rows.push({
        email, name, data,
        role: old ? old.role : role,                                  // role badla nahi ja sakta
        password_hash: hash,
        must_change_password: a.password ? true : old?.must_change_password ?? false,
      });
    }
    if (rows.length) {
      const { error } = await db().from("accounts").upsert(rows, { onConflict: "email" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (ADMIN_ONLY_WRITE.has(params.key) && s.role !== "admin") return NextResponse.json({ error: "Only Admin can change this." }, { status: 403 });
  const { error } = await db().from("records").upsert({ key: params.key, value: body.value, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
