import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Load notifications belonging only to the signed-in company.
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.role !== "company") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const { data, error } = await db()
      .from("company_notifications")
      .select("id, title, message, created_at, read")
      .eq("company_email", session.email)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Could not load notifications." },
      { status: 500 }
    );
  }
}

// Mark one of the signed-in company's notifications as read.
export async function PATCH(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.role !== "company") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body || typeof body.id !== "string" || !body.id.trim()) {
    return NextResponse.json({ error: "A notification ID is required." }, { status: 400 });
  }

  try {
    const { data, error } = await db()
      .from("company_notifications")
      .update({ read: true })
      .eq("id", body.id)
      .eq("company_email", session.email)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not update notification." },
      { status: 500 }
    );
  }
}
