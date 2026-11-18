
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { notifyFypGroupMembers } from "@/lib/server/fyp-notifications";

export const dynamic = "force-dynamic";

async function getStudent(sessionEmail: string) {
  const { data, error } = await db()
    .from("accounts")
    .select("email, name, role, data")
    .eq("email", sessionEmail)
    .eq("role", "fyp")
    .maybeSingle();

  if (error || !data) return null;

  const details = (data.data ?? {}) as Record<string, unknown>;
  const department = String(details.department ?? "").trim();
  const phase = String(details.phase ?? "").trim();
  const groupName = String(details.groupName ?? "").trim();

  if (!department || !phase || !groupName) return null;

  return {
    email: data.email,
    name: data.name,
    department,
    phase,
    groupName,
  };
}

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

  const student = await getStudent(session.email);

  if (!student) {
    return NextResponse.json(
      { error: "Student group details are incomplete." },
      { status: 400 }
    );
  }

  const { data, error } = await db()
    .from("fyp_progress_updates")
    .select("*")
    .eq("department", student.department)
    .eq("phase", student.phase)
    .eq("group_name", student.groupName)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load progress updates." },
      { status: 500 }
    );
  }

  return NextResponse.json({ updates: data ?? [] });
}

export async function POST(req: Request) {
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

  const student = await getStudent(session.email);

  if (!student) {
    return NextResponse.json(
      { error: "Student group details are incomplete." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const title =
    typeof body?.title === "string" ? body.title.trim() : "";
  const content =
    typeof body?.content === "string" ? body.content.trim() : "";
  const technologies =
    typeof body?.technologies === "string"
      ? body.technologies.trim()
      : "";

  if (!title || title.length > 120) {
    return NextResponse.json(
      { error: "Title is required and must be 120 characters or less." },
      { status: 400 }
    );
  }

  if (!content || content.length > 5000) {
    return NextResponse.json(
      { error: "Update is required and must be 5000 characters or less." },
      { status: 400 }
    );
  }

  const { data, error } = await db()
    .from("fyp_progress_updates")
    .insert({
      department: student.department,
      phase: student.phase,
      group_name: student.groupName,
      posted_by_email: student.email,
      posted_by_name: student.name,
      title,
      content,
      technologies,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save progress update." },
      { status: 500 }
    );
  }

  // Notify other members of the same FYP group.
  // Notification failure should not fail the progress update.
  try {
    await notifyFypGroupMembers({
      actorEmail: student.email,
      department: student.department,
      phase: student.phase,
      groupName: student.groupName,
      title: "New group progress update",
      message: `${student.name} posted a progress update: "${title}".`,
      relatedType: "progress",
      relatedId: data.id,
    });
  } catch (notificationError) {
    console.error(
      "FYP progress notification error:",
      notificationError
    );
  }

  return NextResponse.json({ ok: true, update: data });
}
