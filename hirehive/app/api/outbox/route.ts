import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Admin ka "Email outbox" page: GET /api/outbox
export async function GET() {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ error: "Only Admin." }, { status: 403 });
  const { data } = await db().from("email_outbox").select("*").order("id", { ascending: false }).limit(100);
  return NextResponse.json({ emails: data ?? [] });
}
