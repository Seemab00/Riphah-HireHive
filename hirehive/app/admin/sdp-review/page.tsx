
"use client";

import { useCallback, useEffect, useState } from "react";

type StudentRow = {
  sapId?: string;
  name?: string;
  email?: string;
  contactNo?: string;
  groupName?: string;
  supervisor?: string;
  projectTitle?: string;
  technologies?: string;
  projectDescription?: string;
  issues?: string[];
  excelRow?: number;
  lastEditedAt?: string;
  lastEditedBy?: string;
  editedFields?: string[];
};

type Group = {
  groupName: string;
  rows: StudentRow[];
  studentCount: number;
  status: string;
  reviewedAt?: string | null;
  issues: string[];
  canApprove: boolean;
};

type Upload = {
  id: string;
  department: string;
  phase: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  totalRows: number;
  validRows: number;
  flaggedRows: number;
  groups: Group[];
};

export default function SDPReviewPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadUploads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/sdp-review", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load uploads.");
      }

      setUploads(data.uploads || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  async function reviewGroup(
    uploadId: string,
    groupName: string,
    decision: "Approved" | "Rejected"
  ) {
    const action = decision === "Approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} the entire group "${groupName}"?`
      )
    ) {
      return;
    }

    const actionKey = `${uploadId}-${groupName}`;
    setBusy(actionKey);

    try {
      const response = await fetch("/api/admin/sdp-review", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          groupName,
          decision,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Review action failed.");
      }

      window.alert(
        data.message ||
          (decision === "Approved"
            ? "Group approved successfully."
            : "Group rejected successfully.")
      );

      await loadUploads();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusy("");
    }
  }

  async function syncGroup(uploadId: string, groupName: string) {
    if (
      !window.confirm(
        `Sync the five approved project/group fields for existing student accounts in "${groupName}"? Accounts are matched by SAP ID; no accounts will be created.`
      )
    ) {
      return;
    }

    const actionKey = `sync-${uploadId}-${groupName}`;
    setBusy(actionKey);

    try {
      const response = await fetch("/api/admin/sdp-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadId, groupName }),
      });
      const data = await response.json();
      const summary = [
        `Accounts updated: ${data.updatedAccountCount ?? 0}`,
        `Already up to date: ${data.unchangedAccountCount ?? 0}`,
        `Unmatched students: ${data.unmatchedStudents?.length ?? 0}`,
      ];

      if (
        Array.isArray(data.unmatchedStudents) &&
        data.unmatchedStudents.length
      ) {
        summary.push(
          `Unmatched: ${data.unmatchedStudents
            .map(
              (student: { name?: string; sapId?: string; reason?: string }) =>
                `${student.name || "Unknown"} (SAP ${student.sapId || "—"}): ${
                  student.reason || "Not synchronized"
                }`
            )
            .join("; ")}`
        );
      }

      if (Array.isArray(data.invalidStudents) && data.invalidStudents.length) {
        summary.push(
          `Invalid SAP IDs: ${data.invalidStudents
            .map(
              (student: { name?: string; sapId?: string }) =>
                `${student.name || "Unknown"} (SAP ${student.sapId || "—"})`
            )
            .join("; ")}`
        );
      }

      if (
        Array.isArray(data.duplicateSapIds) &&
        data.duplicateSapIds.length
      ) {
        summary.push(`Duplicate SAP IDs: ${data.duplicateSapIds.join(", ")}`);
      }

      if (Array.isArray(data.failedStudents) && data.failedStudents.length) {
        summary.push(
          `Failed: ${data.failedStudents
            .map(
              (student: { name?: string; sapId?: string; reason?: string }) =>
                `${student.name || "Unknown"} (SAP ${student.sapId || "—"}): ${
                  student.reason || "Update failed"
                }`
            )
            .join("; ")}`
        );
      }

      if (data.error) summary.unshift(data.error);
      window.alert(summary.join("\n"));

      if (response.ok || data.updatedAccountCount) {
        await loadUploads();
      }
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Could not synchronize this group."
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SDP Group Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review faculty Excel uploads and complete student groups.
          </p>
        </div>

        <button
          onClick={loadUploads}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading uploads...</p>
      ) : uploads.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-gray-500">
          No faculty uploads are available yet.
        </div>
      ) : (
        <div className="space-y-6">
          {uploads.map((upload) => (
            <section
              key={upload.id}
              className="rounded-xl border bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Department: {upload.department}, Phase: {upload.phase}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {upload.fileName}, uploaded by {upload.uploadedBy}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {upload.uploadedAt
                      ? new Date(upload.uploadedAt).toLocaleString()
                      : ""}
                  </p>
                </div>

                <div className="text-sm">
                  <p>Total students: {upload.totalRows}</p>
                  <p>Valid rows: {upload.validRows}</p>
                  <p>Flagged rows: {upload.flaggedRows}</p>
                </div>
              </div>

              <div className="space-y-4">
                {upload.groups.map((group) => {
                  const actionKey = `${upload.id}-${group.groupName}`;

                  const reviewed = ["Approved", "Rejected"].includes(
                    group.status
                  );

                  return (
                    <div
                      key={group.groupName}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            Group: {group.groupName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {group.studentCount} students
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            group.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : group.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {group.status}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="py-2 pr-3">SAP ID</th>
                              <th className="py-2 pr-3">Student Name</th>
                              <th className="py-2 pr-3">Email</th>
                              <th className="py-2 pr-3">Contact No</th>
                              <th className="py-2 pr-3">Group</th>
                              <th className="py-2 pr-3">Supervisor</th>
                              <th className="py-2 pr-3">Project Title</th>
                              <th className="py-2 pr-3">Technologies / Tools</th>
<th className="py-2 pr-3">Project Description</th>
                              <th className="py-2 pr-3">Edit History</th>
                            </tr>
                          </thead>

                          <tbody>
                            {group.rows.map((student, index) => (
                              <tr
                                key={`${student.sapId || "missing"}-${index}`}
                                className="border-b last:border-0"
                              >
                                <td className="py-2 pr-3">
                                  {student.sapId || "Missing"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.name || "Missing"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.email || "—"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.contactNo || "—"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.groupName || "—"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.supervisor || "—"}
                                </td>

                                <td className="py-2 pr-3">
                                  {student.projectTitle || "—"}
                                </td>

                                <td className="py-2 pr-3">
  {student.technologies || "—"}
</td>

<td className="py-2 pr-3 min-w-64 whitespace-normal">
  {student.projectDescription || "—"}
</td>

                                <td className="py-2 pr-3">
                                  {student.lastEditedAt ? (
                                    <div className="min-w-40">
                                      <span className="font-medium text-blue-700">
                                        Updated by Faculty
                                      </span>

                                      <p className="text-xs text-gray-500">
                                        {student.lastEditedBy ||
                                          "Faculty Coordinator"}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          student.lastEditedAt
                                        ).toLocaleString()}
                                      </p>

                                      <p className="text-xs text-gray-600">
                                        Fields:{" "}
                                        {student.editedFields?.join(", ") ||
                                          "Updated"}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      No edits
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {group.issues.length > 0 && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                          <p className="font-semibold mb-1">
                            Issues: approval blocked
                          </p>

                          <ul className="list-disc pl-5">
                            {group.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!reviewed && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            disabled={!group.canApprove || !!busy}
                            onClick={() =>
                              reviewGroup(
                                upload.id,
                                group.groupName,
                                "Approved"
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                          >
                            {busy === actionKey
                              ? "Processing..."
                              : "Approve Group"}
                          </button>

                          <button
                            disabled={!!busy}
                            onClick={() =>
                              reviewGroup(
                                upload.id,
                                group.groupName,
                                "Rejected"
                              )
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                          >
                            {busy === actionKey
                              ? "Processing..."
                              : "Reject Group"}
                          </button>
                        </div>
                      )}

                      {group.status === "Approved" && (
                        <div className="pt-2">
                          <button
                            disabled={!!busy}
                            onClick={() =>
                              syncGroup(upload.id, group.groupName)
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                          >
                            {busy === `sync-${actionKey}`
                              ? "Syncing..."
                              : "Sync Existing Student Accounts"}
                          </button>
                        </div>
                      )}

                      {reviewed && group.reviewedAt && (
                        <p className="text-xs text-gray-500">
                          Reviewed:{" "}
                          {new Date(group.reviewedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
