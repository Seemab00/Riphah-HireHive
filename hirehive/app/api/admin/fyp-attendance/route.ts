
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getEventKey(event: Record<string, unknown>) {
  const name = clean(event.name);
  const date = clean(event.date);
  const time = clean(event.time);
  const venue = clean(event.venue);

  if (!name || !date || !venue) return null;

  return createHash("sha256")
    .update(JSON.stringify([name, date, time, venue]))
    .digest("hex");
}

async function getCurrentEvent(database: ReturnType<typeof db>) {
  const { data, error } = await database
    .from("records")
    .select("value")
    .eq("key", "hirehive_event")
    .maybeSingle();

  if (error) throw error;

  const event = (data?.value || {}) as Record<string, unknown>;
  const eventKey = getEventKey(event);

  if (!eventKey) return null;

  return { event, eventKey };
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const database = db();
    const current = await getCurrentEvent(database);

    if (!current) {
      return NextResponse.json({
        event: null,
        attendance: [],
        total: 0,
      });
    }

    const { data, error } = await database
      .from("fyp_event_attendance")
      .select("*")
      .eq("event_key", current.eventKey)
      .order("checked_in_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      event: current.event,
      attendance: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("FYP attendance GET error:", error);
    return NextResponse.json(
      { error: "Unable to load FYP attendance." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const token = clean(body.token);
    const sapId = clean(body.sapId);
    const method = token ? "qr" : sapId ? "manual" : "";

    if (!method) {
      return NextResponse.json(
        { error: "Provide a QR token or SAP ID." },
        { status: 400 }
      );
    }

    const database = db();
    const current = await getCurrentEvent(database);

    if (!current) {
      return NextResponse.json(
        { error: "The Admin has not announced an Open House event yet." },
        { status: 400 }
      );
    }

    let student: {
      email: string;
      name: string;
      role: string;
      data: Record<string, unknown> | null;
    } | null = null;

    if (method === "qr") {
      const { data: qrRecord, error: qrError } = await database
        .from("fyp_event_qr_tokens")
        .select("id, student_email, event_key, expires_at")
        .eq("token_hash", hashToken(token))
        .eq("event_key", current.eventKey)
        .is("revoked_at", null)
        .maybeSingle();

      if (qrError) throw qrError;

      if (
        !qrRecord ||
        new Date(qrRecord.expires_at).getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { error: "Invalid, expired, or revoked QR code." },
          { status: 400 }
        );
      }

      const { data: account, error: accountError } = await database
        .from("accounts")
        .select("email,name,role,data")
        .eq("email", qrRecord.student_email)
        .maybeSingle();

      if (accountError) throw accountError;

      if (!account || account.role !== "fyp") {
        return NextResponse.json(
          { error: "Student account not found." },
          { status: 404 }
        );
      }

      student = account;
    } else {
      const { data: accounts, error: accountsError } = await database
        .from("accounts")
        .select("email,name,role,data")
        .eq("role", "fyp");

      if (accountsError) throw accountsError;

      const matches = (accounts || []).filter((account) => {
        const data = (account.data || {}) as Record<string, unknown>;
        return clean(data.sapId) === sapId;
      });

      if (matches.length === 0) {
        return NextResponse.json(
          { error: "No FYP student was found with this SAP ID." },
          { status: 404 }
        );
      }

      if (matches.length > 1) {
        return NextResponse.json(
          { error: "Multiple accounts use this SAP ID. Ask an Admin to verify it." },
          { status: 409 }
        );
      }

      student = matches[0];
    }

    const studentData = (student.data || {}) as Record<string, unknown>;
    const department = clean(studentData.department);
    const phase = clean(studentData.phase);
    const groupName = clean(studentData.groupName);
    const studentSapId = clean(studentData.sapId);

    if (!department || !phase || !groupName || !studentSapId) {
      return NextResponse.json(
        { error: "The student's academic details are incomplete." },
        { status: 400 }
      );
    }

    const { data: attendance, error: insertError } = await database
      .from("fyp_event_attendance")
      .insert({
        event_key: current.eventKey,
        student_email: student.email,
        student_name: student.name,
        sap_id: studentSapId,
        department,
        phase,
        group_name: groupName,
        attendance_method: method,
        checked_in_by: session.email,
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This student has already been checked in." },
          { status: 409 }
        );
      }

      throw insertError;
    }

    return NextResponse.json({
      message: "Student attendance successfully marked.",
      attendance,
    });
  } catch (error) {
    console.error("FYP attendance POST error:", error);
    return NextResponse.json(
      { error: "Unable to mark student attendance." },
      { status: 500 }
    );
  }
}
