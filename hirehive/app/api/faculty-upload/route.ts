
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import * as XLSX from "xlsx";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_KEY = "hirehive_sdp_uploads";

type UploadRow = {
  sapId: string;
  name: string;
  email: string;
  contactNo: string;
  groupName: string;
  supervisor: string;
  projectTitle: string;
  excelRow: number;
  issues: string[];
  valid: boolean;
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value).replace(/\.0$/, "");
  return String(value).trim();
}

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header));
}

function parseWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) throw new Error("Excel file mein koi worksheet nahi mili.");

  const sheet = workbook.Sheets[firstSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const headerIndex = matrix.findIndex((row) => {
    const headers = row.map(normalize);
    return (
      findColumn(headers, ["sapid", "sapno", "sapnumber"]) >= 0 &&
      findColumn(headers, ["name", "studentname", "fullname"]) >= 0
    );
  });

  if (headerIndex < 0) {
    throw new Error("SAP ID aur Student Name columns wali header row nahi mili.");
  }

  const headers = matrix[headerIndex].map(normalize);

  const columns = {
    sap: findColumn(headers, ["sapid", "sapno", "sapnumber"]),
    name: findColumn(headers, ["name", "studentname", "fullname"]),
    email: findColumn(headers, ["email", "studentemail"]),
    contact: findColumn(headers, ["contactno", "contactnumber", "phone", "mobile"]),
    group: findColumn(headers, ["groupname", "group"]),
    supervisor: findColumn(headers, ["supervisorname", "supervisor"]),
    title: findColumn(headers, ["projecttitle", "title"]),
  };

  let previousGroup = "";
  let previousSupervisor = "";
  let previousTitle = "";

  const rows: UploadRow[] = [];

  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];

    const sapId = cellText(row[columns.sap]);
    const name = cellText(row[columns.name]);
    const groupCell = columns.group >= 0 ? cellText(row[columns.group]) : "";
    const supervisorCell = columns.supervisor >= 0
      ? cellText(row[columns.supervisor])
      : "";
    const titleCell = columns.title >= 0 ? cellText(row[columns.title]) : "";

    if (groupCell) previousGroup = groupCell;
    if (supervisorCell) previousSupervisor = supervisorCell;
    if (titleCell) previousTitle = titleCell;

    if (!sapId && !name && !groupCell && !supervisorCell && !titleCell) {
      continue;
    }

    const issues: string[] = [];

    if (!sapId) {
      issues.push("Missing SAP ID");
    } else if (!/^\d+$/.test(sapId)) {
      issues.push("Invalid SAP ID format");
    }

    if (!name) issues.push("Missing student name");

    rows.push({
      sapId,
      name,
      email: columns.email >= 0 ? cellText(row[columns.email]) : "",
      contactNo: columns.contact >= 0 ? cellText(row[columns.contact]) : "",
      groupName: previousGroup,
      supervisor: previousSupervisor,
      projectTitle: previousTitle,
      excelRow: i + 1,
      issues,
      valid: issues.length === 0,
    });
  }

  if (!rows.length) throw new Error("Excel file mein student records nahi mile.");

  return rows;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "coordinator") {
      return NextResponse.json(
        { error: "Only coordinators can upload faculty files." },
        { status: 403 }
      );
    }

    const { data: account, error: accountError } = await db()
      .from("accounts")
      .select("data")
      .eq("email", session.email)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Coordinator account could not be verified." },
        { status: 403 }
      );
    }

    const profile = account.data ?? {};

    if (profile.coordinatorLevel !== "faculty") {
      return NextResponse.json(
        { error: "Only Faculty Coordinators can upload these files." },
        { status: 403 }
      );
    }

    const department = String(profile.department ?? "");
    const allowedDepartments = ["SE", "CA", "CS"];

    if (!allowedDepartments.includes(department)) {
      return NextResponse.json(
        { error: "Your account does not have a valid faculty assignment." },
        { status: 403 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    const phase = String(form.get("phase") ?? "");

    if (phase !== "FYP1" && phase !== "FYP2") {
      return NextResponse.json(
        { error: "Select SDP-I or SDP-II." },
        { status: 400 }
      );
    }

    const accountPhase = String(profile.phase ?? "All");

    if (accountPhase !== "All" && accountPhase !== phase) {
      return NextResponse.json(
        { error: "You are not allowed to upload this FYP phase." },
        { status: 403 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an Excel file." },
        { status: 400 }
      );
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Only .xlsx and .xls files are supported." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be 10 MB or less." },
        { status: 400 }
      );
    }

    const rows = parseWorkbook(await file.arrayBuffer());

    const { data: existingRecord, error: readError } = await db()
      .from("records")
      .select("value")
      .eq("key", STORAGE_KEY)
      .maybeSingle();

    if (readError) throw new Error(readError.message);

    const uploads: any[] = Array.isArray(existingRecord?.value)
      ? existingRecord.value
      : [];

    // A new upload supersedes the previous active file for this faculty and phase.
    const activeUploads = uploads.map((upload) => {
      if (
        upload.department === department &&
        upload.phase === phase &&
        upload.status !== "Superseded"
      ) {
        return { ...upload, status: "Superseded" };
      }
      return upload;
    });

    // Detect duplicate SAP IDs within this file.
    const counts = new Map<string, number>();

    for (const row of rows) {
      if (row.sapId && /^\d+$/.test(row.sapId)) {
        counts.set(row.sapId, (counts.get(row.sapId) ?? 0) + 1);
      }
    }

    // Detect SAP IDs already present in other active faculty uploads of this phase.
    const existingSapIds = new Set<string>();

    for (const upload of activeUploads) {
      if (upload.phase !== phase || upload.status === "Superseded") continue;

      for (const oldRow of upload.rows ?? []) {
        if (oldRow.sapId) existingSapIds.add(String(oldRow.sapId));
      }
    }

    for (const row of rows) {
      if (!row.sapId) continue;

      if ((counts.get(row.sapId) ?? 0) > 1) {
        row.issues.push("Duplicate SAP ID in this file");
      }

      if (existingSapIds.has(row.sapId)) {
        row.issues.push("SAP ID already exists in another active faculty upload");
      }

      row.valid = row.issues.length === 0;
    }

    const upload = {
      id: randomUUID(),
      uploadedBy: session.email,
      department,
      phase,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      status: "Pending Review",
      totalRows: rows.length,
      validRows: rows.filter((row) => row.valid).length,
      flaggedRows: rows.filter((row) => !row.valid).length,
      rows,
    };

    const updatedUploads = [...activeUploads, upload];

    const { error: saveError } = await db()
      .from("records")
      .upsert({
        key: STORAGE_KEY,
        value: updatedUploads,
        updated_at: new Date().toISOString(),
      });

    if (saveError) throw new Error(saveError.message);

    return NextResponse.json({
      ok: true,
      uploadId: upload.id,
      totalRows: upload.totalRows,
      validRows: upload.validRows,
      flaggedRows: upload.flaggedRows,
      message: "File uploaded for Admin review.",
    });
  } catch (error) {
    console.error("Faculty upload failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Could not process the Excel file.",
      },
      { status: 500 }
    );
  }
}
