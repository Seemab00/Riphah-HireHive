
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

  if (session.role !== "fyp") {
    return NextResponse.json(
      { error: "Not allowed." },
      { status: 403 }
    );
  }

  const { data, error } = await db()
    .from("fyp_group_notifications")
    .select("*")
    .eq("recipient_email", session.email)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("FYP notifications fetch error:", error);

    return NextResponse.json(
      { error: "Could not load notifications." },
      { status: 500 }
    );
  }

  const notifications = data ?? [];
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return NextResponse.json({
    notifications,
    unreadCount,
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

  if (session.role !== "fyp") {
    return NextResponse.json(
      { error: "Not allowed." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";

  if (!id) {
    return NextResponse.json(
      { error: "Notification ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await db()
    .from("fyp_group_notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_email", session.email)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("FYP notification update error:", error);

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
