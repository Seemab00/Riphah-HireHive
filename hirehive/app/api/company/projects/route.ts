import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const STORAGE_KEY = "hirehive_sdp_uploads";
const FACULTIES = new Set(["SE", "CA", "CS"]);
const PHASES = new Set(["FYP1", "FYP2"]);

type JsonRecord = Record<string, unknown>;

type CompanyProject = {
  id: string;
  title: string;
  description: string;
  technologies: string;
  faculty: string;
  phase: string;
  groupName: string;
  supervisor: string;
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstValue(rows: JsonRecord[], field: string): string {
  for (const row of rows) {
    const value = text(row[field]);
    if (value) return value;
  }

  return "";
}

function approvedProjects(value: unknown): CompanyProject[] {
  if (!Array.isArray(value)) return [];

  const projects: CompanyProject[] = [];

  value.forEach((entry, uploadIndex) => {
    const upload = asRecord(entry);
    if (!upload || upload.status === "Superseded") return;

    const faculty = text(upload.department);
    const phase = text(upload.phase);
    if (!FACULTIES.has(faculty) || !PHASES.has(phase)) return;

    const rows = Array.isArray(upload.rows) ? upload.rows : [];
    const groups = new Map<string, JsonRecord[]>();

    for (const entryRow of rows) {
      const row = asRecord(entryRow);
      if (!row) continue;

      const groupName = text(row.groupName);
      if (!groupName || groupName.startsWith("Unassigned")) continue;

      const groupRows = groups.get(groupName) ?? [];
      groupRows.push(row);
      groups.set(groupName, groupRows);
    }

    const reviews = asRecord(upload.groupReviews);

    for (const [groupName, groupRows] of groups) {
      const review = reviews?.[groupName];
      const status = text(asRecord(review)?.status) || text(review);
      if (status !== "Approved") continue;

      projects.push({
        id: `${text(upload.id) || `upload-${uploadIndex}`}:${groupName}`,
        title: firstValue(groupRows, "projectTitle"),
        description: firstValue(groupRows, "projectDescription"),
        technologies: firstValue(groupRows, "technologies"),
        faculty,
        phase,
        groupName,
        supervisor: firstValue(groupRows, "supervisor"),
      });
    }
  });

  return projects;
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.role !== "company") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const database = db();
    const { data: account, error: accountError } = await database
      .from("accounts")
      .select("data")
      .eq("email", session.email)
      .eq("role", "company")
      .maybeSingle();

    if (accountError) {
      console.error(
        "Company project registration check failed:",
        accountError.message
      );
      return NextResponse.json(
        { error: "Could not verify company registration." },
        { status: 500 }
      );
    }

    if (asRecord(account?.data)?.companyStatus !== "Registered") {
      return NextResponse.json(
        { error: "Company registration is not valid." },
        { status: 403 }
      );
    }

    const { data: record, error: recordError } = await database
      .from("records")
      .select("value")
      .eq("key", STORAGE_KEY)
      .maybeSingle();

    if (recordError) {
      console.error(
        "Approved company projects query failed:",
        recordError.message
      );
      return NextResponse.json(
        { error: "Could not load approved projects." },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: approvedProjects(record?.value) });
  } catch (error) {
    console.error(
      "Approved company projects request failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Could not load approved projects." },
      { status: 500 }
    );
  }
}
