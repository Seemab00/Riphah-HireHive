
"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";

type DocumentItem = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string | null;
};

export default function FypDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/fyp-documents", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load documents.");
      }

      setDocuments(result.documents || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/fyp-documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setMessage("Document uploaded successfully.");
      await loadDocuments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function formatSize(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  return (
    <Card title="Group Documents">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted">
            Upload project documents for all members of your approved group.
            Group members can view and download shared files.
          </p>

          <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {uploading ? "Uploading..." : "Upload Document"}

            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>

          <p className="mt-2 text-xs text-muted">
            PDF, Word, PowerPoint, Excel and images. Maximum size: 10 MB.
          </p>
        </div>

        {message && (
          <p className="text-sm text-green-600">{message}</p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Shared Documents & Upload History</h3>

            <button
              type="button"
              onClick={loadDocuments}
              className="text-sm font-medium text-blue-600"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted">
              No documents uploaded by your group yet.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-semibold">
                        {document.fileName}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Uploaded by: {document.uploadedBy}
                      </p>

                      <p className="text-xs text-muted">
                        {formatDate(document.uploadedAt)}
                      </p>

                      <p className="text-xs text-muted">
                        {formatSize(document.fileSize)}
                      </p>
                    </div>

                    {document.downloadUrl ? (
                      <a
                        href={document.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-red-600">
                        Download unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
