
import { NextResponse } from "next/server";
import { createHash, createHmac, randomUUID } from "crypto";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function makeToken(
  id: string,
  eventKey: string,
  email: string,
  expiresAt: string,
  secret: string
) {
  return createHmac("sha256", secret)
    .update(`${id}:${eventKey}:${email}:${expiresAt}`)
    .digest("hex");
}

export async function POST() {
  try {
    const session = await getSession();

    if (!session || session.role !== "fyp") {
      return NextResponse.json(
        { error: "Only FYP students can generate attendance QR." },
        { status: 401 }
      );
    }

    const secret = process.env.FYP_QR_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("FYP_QR_SECRET is missing or invalid.");
    }

    const database = db();

    // Verify the student account in the database.
    const { data: account, error: accountError } = await database
      .from("accounts")
      .select("email, name, role, data")
      .eq("email", session.email)
      .maybeSingle();

    if (accountError) throw accountError;

    if (!account || account.role !== "fyp") {
      return NextResponse.json(
        { error: "FYP student account not found." },
        { status: 403 }
      );
    }

    const studentData = account.data || {};
    const department = clean(studentData.department);
    const phase = clean(studentData.phase);
    const groupName = clean(studentData.groupName);
    const sapId = clean(studentData.sapId);

    if (!department || !phase || !groupName || !sapId) {
      return NextResponse.json(
        { error: "Approved student group details are incomplete." },
        { status: 403 }
      );
    }

    // Read the current Open House event from the database.
    const { data: eventRecord, error: eventError } = await database
      .from("records")
      .select("value")
      .eq("key", "hirehive_event")
      .maybeSingle();

    if (eventError) throw eventError;

    const event = eventRecord?.value || {};
    const eventName = clean(event.name);
    const eventDate = clean(event.date);
    const eventTime = clean(event.time);
    const eventVenue = clean(event.venue);

    if (!eventName || !eventDate || !eventVenue) {
      return NextResponse.json(
        { error: "Admin has not announced a complete Open House event." },
        { status: 400 }
      );
    }

    // Event ki identity: date/time/venue/name change ho to naya QR event.
    const eventKey = createHash("sha256")
      .update(JSON.stringify([
        eventName,
        eventDate,
        eventTime,
        eventVenue,
      ]))
      .digest("hex");

    // Retrieve the existing active QR code.
    const { data: existing, error: existingError } = await database
      .from("fyp_event_qr_tokens")
      .select("id, token_hash, expires_at")
      .eq("student_email", account.email)
      .eq("event_key", eventKey)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (
      existing &&
      new Date(existing.expires_at).getTime() > Date.now()
    ) {
      const token = makeToken(
        existing.id,
        eventKey,
        account.email,
        existing.expires_at,
        secret
      );

      if (hashToken(token) === existing.token_hash) {
        return NextResponse.json({
          token,
          expiresAt: existing.expires_at,
          event: {
            name: eventName,
            date: eventDate,
            time: eventTime,
            venue: eventVenue,
          },
        });
      }

      // Revoke the old QR code if the secret changes.
      await database
        .from("fyp_event_qr_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    // QR event ke Pakistan local date ke end tak valid rahega.
    const expiry = new Date(`${eventDate}T23:59:59.999+05:00`);

    if (
      Number.isNaN(expiry.getTime()) ||
      expiry.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "This Open House event date has passed or is invalid." },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const expiresAt = expiry.toISOString();

    const token = makeToken(
      id,
      eventKey,
      account.email,
      expiresAt,
      secret
    );

    const { error: insertError } = await database
      .from("fyp_event_qr_tokens")
      .insert({
        id,
        token_hash: hashToken(token),
        event_key: eventKey,
        student_email: account.email,
        expires_at: expiresAt,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      token,
      expiresAt,
      event: {
        name: eventName,
        date: eventDate,
        time: eventTime,
        venue: eventVenue,
      },
    });
  } catch (error) {
    console.error("FYP QR generation error:", error);

    return NextResponse.json(
      { error: "Unable to generate student attendance QR." },
      { status: 500 }
    );
  }
}
