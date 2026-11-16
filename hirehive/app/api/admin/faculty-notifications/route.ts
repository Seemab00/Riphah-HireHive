
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await db()
      .from("faculty_upload_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error("Faculty notifications GET error:", error);
    return NextResponse.json(
      { error: "Could not load faculty notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    const { error } = await db()
      .from("faculty_upload_notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Faculty notifications PATCH error:", error);
    return NextResponse.json(
      { error: "Could not update notification." },
      { status: 500 }
    );
  }
}
