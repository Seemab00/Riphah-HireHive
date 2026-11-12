
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession, Session } from "@/lib/server/session";
import { AccountRow, splitAccount, toAccount } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

const KEY_RE = /^hirehive_[a-z_]+$/;
const ACCOUNTS = "hirehive_accounts";

const RPC_KEYS = new Set([
  "hirehive_teams",
  "hirehive_lcd",
  "hirehive_feedback",
  "hirehive_interests",
  "hirehive_checkins",
  "hirehive_mock_interviews",
]);

const ADMIN_OBJECT_KEYS = new Set([
  "hirehive_event",
  "hirehive_interview_session",
  "hirehive_clearance",
]);

function validKey(key: string) {
  return KEY_RE.test(key) && key !== "hirehive_session";
}

function canWriteKey(role: string, key: string) {
  const permissions: Record<string, string[]> = {
    hirehive_teams: ["admin", "fyp"],
    hirehive_event: ["admin"],
    hirehive_lcd: ["admin", "fyp", "lab"],
    hirehive_feedback: ["admin", "alumni"],
    hirehive_interests: ["company"],
    hirehive_checkins: ["admin"],
    hirehive_mock_interviews: ["admin", "alumni"],
    hirehive_interview_session: ["admin"],
    hirehive_clearance: ["admin"],
  };

  return permissions[key]?.includes(role) ?? false;
}

function canReadKey(role: string, key: string) {
  const permissions: Record<string, string[]> = {
    hirehive_teams: ["admin", "fyp", "company", "alumni"],
    hirehive_event: [
      "admin", "fyp", "student", "volunteer",
      "lab", "company", "alumni", "coordinator",
    ],
    hirehive_lcd: ["admin", "fyp", "lab"],
    hirehive_feedback: ["admin", "alumni"],
    hirehive_interests: ["admin", "company"],
    hirehive_checkins: ["admin"],
    hirehive_mock_interviews: ["admin", "alumni", "fyp"],
    hirehive_interview_session: ["admin", "alumni"],
    hirehive_clearance: ["admin", "fyp"],
  };

  return permissions[key]?.includes(role) ?? false;
}

function visibleAccounts(s: Session, all: ReturnType<typeof toAccount>[]) {
  if (s.role === "admin" || s.role === "coordinator") return all;

  return all
    .filter((a) => {
      if (a.email === s.email) return true;

      if (s.role === "company") {
        return (
          (a.role === "fyp" || a.role === "student") &&
          a.cvVisible === true
        );
      }

      if (s.role === "alumni") return a.role === "fyp";

      return false;
    })
    .map((a) => {
      const canSeeCv =
        a.email === s.email ||
        (s.role === "company" &&
          (a.role === "fyp" || a.role === "student") &&
          a.cvVisible === true);

      if (canSeeCv) return a;

      const { cvDataUrl, ...safeAccount } = a;
      return safeAccount;
    });
}

async function getOwnTeams(email: string) {
  const { data, error } = await db()
    .from("records")
    .select("value")
    .eq("key", "hirehive_teams")
    .maybeSingle();

  if (error) throw new Error(error.message);

  const teams = Array.isArray(data?.value) ? data.value : [];

  return teams.filter(
    (team: any) =>
      String(team.ownerEmail ?? "").trim().toLowerCase() === email
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { key: string } }
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!validKey(params.key)) {
    return NextResponse.json({ error: "Bad key." }, { status: 400 });
  }

  if (params.key === ACCOUNTS) {
    const { data, error } = await db().from("accounts").select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const all = ((data ?? []) as AccountRow[]).map(toAccount);

    return NextResponse.json({ value: visibleAccounts(s, all) });
  }

  if (!canReadKey(s.role, params.key)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { data, error } = await db()
    .from("records")
    .select("value")
    .eq("key", params.key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let value = data?.value ?? null;

  if (value === null) {
    return NextResponse.json({ value: null });
  }

  try {
    if (s.role === "fyp") {
      const ownTeams = await getOwnTeams(s.email);
      const teamIds = new Set(ownTeams.map((t: any) => String(t.id)));
      const sapIds = new Set(
        ownTeams.flatMap((t: any) =>
          Array.isArray(t.sapIds) ? t.sapIds.map(String) : []
        )
      );

      if (params.key === "hirehive_teams") {
        value = Array.isArray(value)
          ? value.filter(
              (t: any) =>
                String(t.ownerEmail ?? "").trim().toLowerCase() === s.email
            )
          : [];
      }

      if (
        params.key === "hirehive_lcd" ||
        params.key === "hirehive_mock_interviews"
      ) {
        value = Array.isArray(value)
          ? value.filter((item: any) => teamIds.has(String(item.teamId)))
          : [];
      }

      if (params.key === "hirehive_clearance") {
        if (typeof value === "object" && !Array.isArray(value)) {
          value = Object.fromEntries(
            Object.entries(value).filter(([sap]) => sapIds.has(sap))
          );
        } else {
          value = {};
        }
      }
    }

    if (s.role === "alumni" && params.key === "hirehive_feedback") {
  value = Array.isArray(value)
    ? value.filter(
        (item: any) =>
          String(item.alumniEmail ?? "").trim().toLowerCase() === s.email
      )
    : [];
}

if (s.role === "alumni" && params.key === "hirehive_mock_interviews") {
  value = Array.isArray(value)
    ? value.map((item: any) => {
        const isOwn =
          String(item.alumniEmail ?? "").trim().toLowerCase() === s.email;

        if (isOwn) return item;

        return {
          id: item.id,
          teamId: item.teamId,
          alumniEmail: item.alumniEmail,
          slot: item.slot,
          status: item.status,
        };
      })
    : [];
}

    if (s.role === "company" && params.key === "hirehive_interests") {
      value = Array.isArray(value)
        ? value.filter(
            (item: any) =>
              String(item.company ?? "").trim().toLowerCase() === s.email
          )
        : [];
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not filter data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ value });
}

export async function PUT(
  req: Request,
  { params }: { params: { key: string } }
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!validKey(params.key)) {
    return NextResponse.json({ error: "Bad key." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);

  if (!body || !("value" in body)) {
    return NextResponse.json({ error: "Missing value." }, { status: 400 });
  }

  if (params.key === ACCOUNTS) {
    if (s.role !== "admin" && s.role !== "coordinator") {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    if (
      !Array.isArray(body.value) ||
      body.value.some((a: any) => !a || typeof a !== "object" || Array.isArray(a))
    ) {
      return NextResponse.json({ error: "Expected a list of accounts." }, { status: 400 });
    }

    const { data: existing, error: readError } = await db()
      .from("accounts")
      .select("email, role, password_hash, must_change_password");

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    const byEmail = new Map((existing ?? []).map((r: any) => [r.email, r]));
    const rows: Record<string, unknown>[] = [];

    for (const a of body.value as Record<string, any>[]) {
      const { email, role, name, data } = splitAccount(a);

      if (!email) continue;

      const old: any = byEmail.get(email);

      if (!old && role === "admin") continue;
      if (old?.role === "admin" && s.role !== "admin") continue;

      const hash = a.password
        ? await bcrypt.hash(String(a.password), 10)
        : old?.password_hash;

      if (!hash) continue;

      rows.push({
        email,
        name,
        data,
        role: old ? old.role : role,
        password_hash: hash,
        must_change_password: a.password
          ? true
          : old?.must_change_password ?? false,
      });
    }

    if (rows.length) {
      const { error } = await db()
        .from("accounts")
        .upsert(rows, { onConflict: "email" });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (!canWriteKey(s.role, params.key)) {
    return NextResponse.json(
      { error: "You do not have permission to update this data." },
      { status: 403 }
    );
  }

  // Admin-only object records are saved directly.
  if (ADMIN_OBJECT_KEYS.has(params.key)) {
    if (
      s.role !== "admin" ||
      !body.value ||
      typeof body.value !== "object" ||
      Array.isArray(body.value)
    ) {
      return NextResponse.json(
        { error: "Expected an admin object record." },
        { status: 400 }
      );
    }

    const { error } = await db()
      .from("records")
      .upsert({
        key: params.key,
        value: body.value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (!RPC_KEYS.has(params.key) || !Array.isArray(body.value)) {
    return NextResponse.json(
      { error: "Unsupported record or expected an array." },
      { status: 400 }
    );
  }

  const { error } = await db().rpc("hh_save_record", {
    p_key: params.key,
    p_value: body.value,
    p_email: s.email,
    p_role: s.role,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
