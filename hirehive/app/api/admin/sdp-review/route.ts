import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { appUrl } from "@/lib/server/accounts";
import { sendEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const STORAGE_KEY = "hirehive_sdp_uploads";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const { data, error } = await db()
      .from("records")
      .select("value")
      .eq("key", STORAGE_KEY)
      .maybeSingle();

    if (error) throw error;

    const uploads = Array.isArray(data?.value) ? data.value : [];

    const result = uploads
      .filter((upload: any) => upload.status !== "Superseded")
      .map((upload: any) => {
        const grouped = new Map<string, any[]>();

        for (const row of Array.isArray(upload.rows) ? upload.rows : []) {
          const name = String(row.groupName ?? "").trim();
          const groupKey = name || `Unassigned — Excel row ${row.excelRow}`;

          if (!grouped.has(groupKey)) grouped.set(groupKey, []);
          grouped.get(groupKey)!.push(row);
        }

        const groups = Array.from(grouped.entries()).map(
          ([groupName, rows]) => {
            const review = upload.groupReviews?.[groupName];

            return {
              groupName,
              rows,
              studentCount: rows.length,
              status: review?.status ?? "Pending",
              reviewedAt: review?.reviewedAt ?? null,
              issues: rows.flatMap((row: any) =>
                Array.isArray(row.issues) ? row.issues : []
              ),
              canApprove:
                !groupName.startsWith("Unassigned") &&
                rows.length > 0 &&
                rows.every((row: any) => row.valid === true),
            };
          }
        );

        return {
          id: upload.id,
          department: upload.department,
          phase: upload.phase,
          fileName: upload.fileName,
          uploadedBy: upload.uploadedBy,
          uploadedAt: upload.uploadedAt,
          status: upload.status,
          totalRows: upload.totalRows,
          validRows: upload.validRows,
          flaggedRows: upload.flaggedRows,
          groups,
        };
      });

    return NextResponse.json({ uploads: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load faculty uploads.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const uploadId = String(body.uploadId ?? "");
  const groupName = String(body.groupName ?? "").trim();
  const decision = body.decision;

  if (
    !uploadId ||
    !groupName ||
    !["Approved", "Rejected"].includes(decision)
  ) {
    return NextResponse.json(
      { error: "Upload, group and valid decision are required." },
      { status: 400 }
    );
  }

  const database = db();
  let createdEmails: string[] = [];
  let createdTokens = false;

  try {
    const { data: record, error: readError } = await database
      .from("records")
      .select("value")
      .eq("key", STORAGE_KEY)
      .maybeSingle();

    if (readError) throw readError;

    const uploads = Array.isArray(record?.value) ? record.value : [];
    const upload = uploads.find((item: any) => item.id === uploadId);

    if (!upload || upload.status === "Superseded") {
      return NextResponse.json(
        { error: "Upload not found or no longer active." },
        { status: 404 }
      );
    }

    const rows = (upload.rows || []).filter(
      (row: any) => String(row.groupName ?? "").trim() === groupName
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 404 }
      );
    }

    if (upload.groupReviews?.[groupName]?.status) {
      return NextResponse.json(
        { error: "This group has already been reviewed." },
        { status: 409 }
      );
    }

    let setupEntries: {
      email: string;
      name: string;
      token: string;
      tokenHash: string;
    }[] = [];

    if (decision === "Approved") {
      const invalidRows = rows.filter(
        (row: any) =>
          row.valid !== true ||
          !/^\d+$/.test(String(row.sapId ?? "").trim()) ||
          !String(row.name ?? "").trim()
      );

      if (invalidRows.length) {
        return NextResponse.json(
          {
            error:
              "Approval blocked. Correct all invalid SAP IDs and missing student names, then upload the corrected Excel file.",
          },
          { status: 400 }
        );
      }

      const sapIds = rows.map((row: any) => String(row.sapId).trim());

      if (new Set(sapIds).size !== sapIds.length) {
        return NextResponse.json(
          { error: "Duplicate SAP IDs exist inside this group." },
          { status: 400 }
        );
      }

      const studentEmails = sapIds.map(
        (sapId: string) =>
          `${sapId}@students.riphah.edu.pk`.toLowerCase()
      );

      const { data: existing, error: existingError } = await database
        .from("accounts")
        .select("email")
        .in("email", studentEmails);

      if (existingError) throw existingError;

      if (existing?.length) {
        return NextResponse.json(
          {
            error:
              "Some student accounts already exist. No accounts were created.",
            existingEmails: existing.map((account: any) => account.email),
          },
          { status: 409 }
        );
      }

      setupEntries = rows.map((row: any, index: number) => {
        const token = randomBytes(32).toString("hex");

        return {
          email: studentEmails[index],
          name: String(row.name).trim(),
          token,
          tokenHash: createHash("sha256").update(token).digest("hex"),
        };
      });

      const accountRows = await Promise.all(
        rows.map(async (row: any, index: number) => ({
          email: setupEntries[index].email,
          role: "fyp",
          name: String(row.name).trim(),
          password_hash: await bcrypt.hash(
            randomBytes(32).toString("hex"),
            10
          ),
          must_change_password: true,
          data: {
  sapId: sapIds[index],
  department: upload.department,
  faculty: upload.department,
  program: upload.department,
  phase: upload.phase,
  groupName,
  supervisor: row.supervisor || "",
  projectTitle: row.projectTitle || "",
  technologies: row.technologies || "",
  projectDescription: row.projectDescription || "",
  contactNo: row.contactNo || "",
},
        }))
      );

      const { error: accountError } = await database
        .from("accounts")
        .insert(accountRows);

      if (accountError) {
        throw new Error(`Account creation failed: ${accountError.message}`);
      }

      createdEmails = studentEmails;

      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      const { error: tokenError } = await database
        .from("password_setup_tokens")
        .insert(
          setupEntries.map((entry) => ({
            email: entry.email,
            token_hash: entry.tokenHash,
            expires_at: expiresAt,
            used: false,
          }))
        );

      if (tokenError) {
        throw new Error(
          `Password setup tokens could not be saved: ${tokenError.message}`
        );
      }

      createdTokens = true;

      rows.forEach((row: any, index: number) => {
        row.email = studentEmails[index];
      });
    }

    upload.groupReviews = {
      ...upload.groupReviews,
      [groupName]: {
        status: decision,
        reviewedAt: new Date().toISOString(),
        reviewedBy: session.email,
        ...(decision === "Approved"
          ? { studentEmails: createdEmails }
          : {}),
      },
    };

    const updatedUploads = uploads.map((item: any) =>
      item.id === uploadId ? upload : item
    );

    const { error: saveError } = await database
      .from("records")
      .upsert({
        key: STORAGE_KEY,
        value: updatedUploads,
        updated_at: new Date().toISOString(),
      });

    if (saveError) throw saveError;

    // Send setup emails only after accounts, tokens and approval are saved.
    const emailFailures: string[] = [];

    if (decision === "Approved") {
      const baseUrl = appUrl(req);

      for (const entry of setupEntries) {
        const link = `${baseUrl}/setup-password?token=${entry.token}`;

        try {
          await sendEmail(
            entry.email,
            "HireHive Student Account - Set Your Password",
            `Dear ${entry.name},

Your student account for HireHive has been created.

Please use the following one-time link to set your password:
${link}

This link expires in 24 hours and can only be used once.

Regards,
HireHive Team`,
            { link }
          );
        } catch (emailError) {
          emailFailures.push(entry.email);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        decision === "Approved"
          ? "Group approved and student accounts created."
          : "Group rejected. Records have been retained.",
      accountsCreated: decision === "Approved" ? createdEmails.length : 0,
      emailsSent:
        decision === "Approved"
          ? setupEntries.length - emailFailures.length
          : 0,
      emailFailures,
    });
  } catch (error) {
    // Roll back newly created accounts/tokens if saving approval failed.
    if (createdEmails.length) {
      if (createdTokens) {
        await database
          .from("password_setup_tokens")
          .delete()
          .in("email", createdEmails);
      }

      await database.from("accounts").delete().in("email", createdEmails);
    }

    const message =
      error instanceof Error ? error.message : "Group review failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}