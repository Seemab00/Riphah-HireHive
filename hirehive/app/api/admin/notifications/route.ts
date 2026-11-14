
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not signed in." },
      { status: 401 }
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Not allowed." },
      { status: 403 }
    );
  }

  const { data, error } = await db()
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load notifications." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    notifications: data ?? [],
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not signed in." },
      { status: 401 }
    );
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Not allowed." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);

  if (typeof body?.id !== "string" || !body.id.trim()) {
    return NextResponse.json(
      { error: "Invalid notification ID." },
      { status: 400 }
    );
  }

  const { data, error } = await db()
    .from("admin_notifications")
    .update({ read: true })
    .eq("id", body.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not update notification." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Notification not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
