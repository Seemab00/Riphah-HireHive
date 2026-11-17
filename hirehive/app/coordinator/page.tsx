
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { getUser, logout } from "@/lib/auth";
import { Account, KEYS } from "@/lib/data";
import { useStore } from "@/lib/useStore";

interface FacultyUploadRow {
  name: string;
  email: string;
  sapId: string;
  valid: boolean;
  issues: string[];
  excelRow: number;
  contactNo: string;
  groupName: string;
  supervisor: string;
  projectTitle: string;
}

interface FacultyUpload {
  id: string;
  rows: FacultyUploadRow[];
  phase: "FYP1" | "FYP2";
  status: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  flaggedRows: number;
  department: string;
  uploadedAt: string;
}

export default function CoordinatorDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useStore<Account[]>(KEYS.accounts, []);
  const [message, setMessage] = useState("");

  const [uploadPhase, setUploadPhase] = useState<"FYP1" | "FYP2">("FYP1");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState("");
  const [facultyUploads, setFacultyUploads] = useState<FacultyUpload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [uploadListError, setUploadListError] = useState("");
  const [editingStudent, setEditingStudent] = useState<{
    uploadId: string;
    row: FacultyUploadRow;
  } | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);

  useEffect(() => {
    const u = getUser();

    if (!u) router.replace("/login");
    else if (u.role !== "coordinator") router.replace("/" + u.role);
    else setUser(u);
  }, [router]);

  useEffect(() => {
  if (!user || user.coordinatorLevel !== "faculty") return;

  async function loadFacultyUploads() {
    setLoadingUploads(true);
    setUploadListError("");

    try {
      const response = await fetch("/api/faculty-upload");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load student records.");
      }

      setFacultyUploads(result.uploads || []);
    } catch (error) {
      setUploadListError(
        error instanceof Error
          ? error.message
          : "Unable to load student records."
      );
    } finally {
      setLoadingUploads(false);
    }
  }

  loadFacultyUploads();
}, [user]);

  if (!user) return null;

  const stage =
    user.coordinatorLevel === "student"
      ? 1
      : user.coordinatorLevel === "faculty"
      ? 2
      : 3;

  const pending = accounts.filter(
    (a) => a.role === "volunteer" && (a.volunteerStage ?? 1) === stage
  );

  const label =
    stage === 1
      ? "FYP Student Coordinator"
      : stage === 2
      ? "Faculty Coordinator"
      : "Primary FYP Incharge";

  function decide(vol: Account, approve: boolean) {
    const next = approve ? stage + 1 : -1;

    const decisions = [
      ...(vol.volunteerStageDecisions ?? ["Pending", "Pending", "Pending"]),
    ];

    decisions[stage - 1] =
      approve
        ? stage === 3
          ? "Selected"
          : "Recommended"
        : "Rejected";

    setAccounts(
      accounts.map((a) =>
        a.email === vol.email
          ? {
              ...a,
              volunteerStage: next,
              volunteerStageDecisions: decisions,
              volunteerStatus:
                next === 4 ? "Approved" : next === -1 ? "Rejected" : "Pending",
            }
          : a
      )
    );

    setMessage(
      `${vol.name}: ${
        approve
          ? stage === 3
            ? "selected"
            : "moved to the next stage"
          : "rejected"
      }.`
    );
  }

  async function handleFacultyUpload(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;

    if (!uploadFile) {
      setUploadResult("Please select an Excel file.");
      return;
    }

    setUploading(true);
    setUploadResult("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("phase", uploadPhase);

      const response = await fetch("/api/faculty-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setUploadResult(
        `Upload successful! Total: ${result.totalRows}, Valid: ${result.validRows}, Flagged: ${result.flaggedRows}.`
      );

      setUploadFile(null);
      form.reset();
    } catch (error) {
      setUploadResult(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveStudent(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!editingStudent) return;

  setSavingStudent(true);
  setUploadListError("");

  try {
    const response = await fetch("/api/faculty-upload", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadId: editingStudent.uploadId,
        excelRow: editingStudent.row.excelRow,
        contactNo: editingStudent.row.contactNo,
        groupName: editingStudent.row.groupName,
        supervisor: editingStudent.row.supervisor,
        projectTitle: editingStudent.row.projectTitle,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to update student.");
    }

    setFacultyUploads((previous) =>
      previous.map((upload) =>
        upload.id === editingStudent.uploadId
          ? {
              ...upload,
              rows: upload.rows.map((row) =>
                row.excelRow === editingStudent.row.excelRow
                  ? { ...row, ...editingStudent.row }
                  : row
              ),
            }
          : upload
      )
    );

    setEditingStudent(null);
    setUploadResult("Student details updated successfully.");
  } catch (error) {
    setUploadListError(
      error instanceof Error ? error.message : "Unable to update student."
    );
  } finally {
    setSavingStudent(false);
  }
}

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Coordinator dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {user.name} · {label} · {user.department} · {user.phase}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/profile")}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand"
          >
            My profile
          </button>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Stage">
          <p className="text-2xl font-bold">{stage} of 3</p>
          <p className="text-sm text-muted">{label}</p>
        </Card>

        <Card title="Awaiting review">
          <p className="text-2xl font-bold">{pending.length}</p>
          <p className="text-sm text-muted">
            Volunteer applications at your stage
          </p>
        </Card>

        <Card title="Scope">
          <p className="text-lg font-bold">
            {user.department || "All departments"}
          </p>
          <p className="text-sm text-muted">
            {user.phase || "All phases"}
          </p>
        </Card>
      </div>

      {user.coordinatorLevel === "faculty" && (
        <Card title="SDP-I / SDP-II Excel Upload">

          <p className="mb-4 text-sm text-muted">
            Upload your faculty's student Excel file for Admin review.
            Assigned faculty: <strong>{user.department}</strong>
          </p>

          <form onSubmit={handleFacultyUpload} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Select project phase
              </label>

              <select
                value={uploadPhase}
                onChange={(e) =>
                  setUploadPhase(e.target.value as "FYP1" | "FYP2")
                }
                className="w-full rounded-lg border border-line bg-white p-3 text-sm"
              >
                <option value="FYP1">SDP-I (FYP-1)</option>
                <option value="FYP2">SDP-II (FYP-2)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Select Excel file
              </label>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) =>
                  setUploadFile(e.target.files?.[0] ?? null)
                }
                className="w-full rounded-lg border border-line p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload for Admin Review"}
            </button>

            {uploadResult && (
              <p role="status" className="rounded-lg bg-soft p-3 text-sm">
                {uploadResult}
              </p>
            )}
          </form>
        </Card>
      )}

            {user.coordinatorLevel === "faculty" && editingStudent && (
        <Card title="Edit Student Details">
          <form onSubmit={handleSaveStudent} className="space-y-4">
            <div className="rounded-lg bg-soft p-3">
              <p className="font-semibold">{editingStudent.row.name}</p>
              <p className="text-sm text-muted">
                SAP ID: {editingStudent.row.sapId} · {editingStudent.row.email}
              </p>
              <p className="text-xs text-muted">
                Student Name, SAP ID and Email cannot be changed.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Contact Number
              </label>
              <input
                type="text"
                value={editingStudent.row.contactNo || ""}
                onChange={(e) =>
                  setEditingStudent((current) =>
                    current
                      ? {
                          ...current,
                          row: { ...current.row, contactNo: e.target.value },
                        }
                      : current
                  )
                }
                className="w-full rounded-lg border border-line p-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Group Name
              </label>
              <input
                type="text"
                value={editingStudent.row.groupName || ""}
                onChange={(e) =>
                  setEditingStudent((current) =>
                    current
                      ? {
                          ...current,
                          row: { ...current.row, groupName: e.target.value },
                        }
                      : current
                  )
                }
                className="w-full rounded-lg border border-line p-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Supervisor Name
              </label>
              <input
                type="text"
                value={editingStudent.row.supervisor || ""}
                onChange={(e) =>
                  setEditingStudent((current) =>
                    current
                      ? {
                          ...current,
                          row: { ...current.row, supervisor: e.target.value },
                        }
                      : current
                  )
                }
                className="w-full rounded-lg border border-line p-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Title
              </label>
              <input
                type="text"
                value={editingStudent.row.projectTitle || ""}
                onChange={(e) =>
                  setEditingStudent((current) =>
                    current
                      ? {
                          ...current,
                          row: { ...current.row, projectTitle: e.target.value },
                        }
                      : current
                  )
                }
                className="w-full rounded-lg border border-line p-3 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-lg border border-line px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingStudent}
                className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingStudent ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {user.coordinatorLevel === "faculty" && (
  <Card title="Uploaded Student Records">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Students uploaded for {user.department}
      </p>

      <button
        onClick={() => window.location.reload()}
        className="rounded-lg border border-line px-3 py-2 text-sm"
      >
        Refresh records
      </button>
    </div>

    {loadingUploads && (
      <p className="py-4 text-sm text-muted">
        Loading student records...
      </p>
    )}

    {uploadListError && (
      <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {uploadListError}
      </p>
    )}

    {!loadingUploads &&
      !uploadListError &&
      (["FYP1", "FYP2"] as const).map((phase) => {
        const uploads = facultyUploads.filter(
          (upload) => upload.phase === phase
        );

        return (
          <div key={phase} className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">
              {phase === "FYP1" ? "SDP-I (FYP-1)" : "SDP-II (FYP-2)"}
            </h3>

            {uploads.length === 0 ? (
              <p className="text-sm text-muted">
                No upload available for this phase.
              </p>
            ) : (
              uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="mb-4 rounded-lg border border-line p-4"
                >
                  <div className="mb-3">
                    <p className="font-semibold">{upload.fileName}</p>
                    <p className="text-xs text-muted">
                      {upload.totalRows} students · {upload.status}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {upload.rows.map((student) => (
                      <div
                        key={`${upload.id}-${student.excelRow}`}
                        className="rounded-lg bg-soft p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted">
                              SAP ID: {student.sapId} · {student.email}
                            </p>
                            <p className="mt-1 text-sm">
                              Group: {student.groupName || "Not assigned"}
                            </p>
                            <p className="text-sm">
                              Supervisor: {student.supervisor || "Not assigned"}
                            </p>
                            <p className="text-sm">
                              Project: {student.projectTitle || "Not assigned"}
                            </p>
                            <p className="text-sm">
                              Contact: {student.contactNo || "Not supplied"}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              setEditingStudent({
                                uploadId: upload.id,
                                row: { ...student },
                              })
                            }
                            className="rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand"
                          >
                            Edit details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
  </Card>
)}

      <Card title="Volunteer applications awaiting your decision">
        <p className="mb-4 text-sm text-muted">
          Workflow: Student Coordinator → Faculty Coordinator → Primary FYP
          Incharge final decision. Recommendations move applications forward;
          the last stage selects volunteers.
        </p>

        <div className="space-y-3">
          {pending.map((v) => (
            <div
              key={v.email}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4"
            >
              <div>
                <p className="font-semibold">{v.name}</p>

                <p className="text-sm text-muted">
                  {v.email} · SAP {v.sapId || "not supplied"} ·{" "}
                  {v.program || "program not supplied"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Experience:{" "}
                  {v.volunteerExperience || "No experience details supplied"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Prior stages:{" "}
                  {(v.volunteerStageDecisions || [
                    "Pending",
                    "Pending",
                    "Pending",
                  ])
                    .slice(0, stage - 1)
                    .join(" → ") || "Not reviewed"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => decide(v, true)}
                  className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
                >
                  {stage === 3
                    ? "Select volunteer"
                    : "Recommend / approve stage"}
                </button>

                <button
                  onClick={() => decide(v, false)}
                  className="rounded-lg border border-red-600 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {pending.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              No applications are currently waiting at your stage.
            </p>
          )}
        </div>

        {message && (
          <p role="status" className="mt-3 rounded-lg bg-soft p-3 text-sm">
            {message}
          </p>
        )}
      </Card>

      <p className="text-xs text-muted">
        Prototype limitation: role and department checks happen in the
        browser. Production access control must be enforced by a server.
      </p>
    </main>
  );
}
