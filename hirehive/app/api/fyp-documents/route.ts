
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { notifyFypGroupMembers } from "@/lib/server/fyp-notifications";

export const dynamic = "force-dynamic";

const BUCKET = "fyp-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

async function getStudentGroup(email: string) {
  const database = db();

  const { data, error } = await database
    .from("accounts")
    .select("email, name, role, data")
    .eq("email", email)
    .maybeSingle();

  if (error || !data || data.role !== "fyp") {
    return null;
  }

  const account = data.data || {};

  const department = clean(account.department);
  const phase = clean(account.phase);
  const groupName = clean(account.groupName);

  if (!department || !phase || !groupName) {
    return null;
  }

  return {
    email: data.email,
    name: data.name || "",
    department,
    phase,
    groupName,
  };
}

// GET: Documents for the student's group and temporary download links.
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "fyp") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const group = await getStudentGroup(session.email);

    if (!group) {
      return NextResponse.json(
        { error: "Approved group details not found." },
        { status: 403 }
      );
    }

    const database = db();

    const { data, error } = await database
      .from("fyp_documents")
      .select("*")
      .eq("department", group.department)
      .eq("phase", group.phase)
      .eq("group_name", group.groupName)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const documents = await Promise.all(
      (data || []).map(async (document) => {
        const { data: signed, error: signedError } =
          await database.storage
            .from(BUCKET)
            .createSignedUrl(document.storage_path, 60);

        return {
          id: document.id,
          fileName: document.file_name,
          mimeType: document.mime_type,
          fileSize: document.file_size,
          uploadedBy: document.uploaded_by_name,
          uploadedAt: document.created_at,
          downloadUrl: signedError ? null : signed?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("FYP documents GET error:", error);

    return NextResponse.json(
      { error: "Unable to load group documents." },
      { status: 500 }
    );
  }
}

// POST: Group member document upload.
export async function POST(req: Request) {
  let uploadedPath = "";

  try {
    const session = await getSession();

    if (!session || session.role !== "fyp") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const group = await getStudentGroup(session.email);

    if (!group) {
      return NextResponse.json(
        { error: "Approved group details not found." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 10 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "This file type is not allowed." },
        { status: 400 }
      );
    }

    const originalName = file.name.replace(/[/\\]/g, "_").trim();

    if (!originalName) {
      return NextResponse.json(
        { error: "Invalid file name." },
        { status: 400 }
      );
    }

    const extension = originalName.includes(".")
      ? originalName.split(".").pop()?.toLowerCase() || ""
      : "";

    const allowedExtensions = new Set([
      "pdf", "doc", "docx", "ppt", "pptx",
      "xls", "xlsx", "png", "jpg", "jpeg",
    ]);

    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file extension." },
        { status: 400 }
      );
    }

    const database = db();

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${randomUUID()}-${safeName}`;

    const { error: uploadError } = await database.storage
      .from(BUCKET)
      .upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    uploadedPath = storagePath;

    const { data: document, error: insertError } = await database
      .from("fyp_documents")
      .insert({
        department: group.department,
        phase: group.phase,
        group_name: group.groupName,
        uploaded_by_email: group.email,
        uploaded_by_name: group.name,
        file_name: originalName,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
      })
      .select("id")
      .single();

if (insertError) throw insertError;

// Notify other members of the same FYP group.
try {
  await notifyFypGroupMembers({
    actorEmail: group.email,
    department: group.department,
    phase: group.phase,
    groupName: group.groupName,
    title: "New group document uploaded",
    message: `${group.name} uploaded a new document: ${originalName}`,
    relatedType: "document",
    relatedId: document.id,
  });
} catch (notificationError) {
  console.error("FYP document notification error:", notificationError);
}

    return NextResponse.json(
      {
        message: "Document uploaded successfully.",
        id: document.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FYP documents POST error:", error);

    // Metadata save fail ho to uploaded file bhi remove kar do.
    if (uploadedPath) {
      await db()
        .storage
        .from(BUCKET)
        .remove([uploadedPath])
        .catch(() => undefined);
    }

    return NextResponse.json(
      { error: "Unable to upload document." },
      { status: 500 }
    );
  }
}
