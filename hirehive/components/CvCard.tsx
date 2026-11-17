
"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import Chip from "./Chip";
import { Account } from "@/lib/data";
import { getUser, updateAccount } from "@/lib/auth";

export default function CvCard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAccount(getUser());
  }, []);

  if (!account) return null;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !account || saving) return;

    event.target.value = "";

    if (file.size > 2 * 1024 * 1024) {
      window.alert("Choose a CV smaller than 2 MB.");
      return;
    }

    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      window.alert("Upload a PDF, DOC, or DOCX file.");
      return;
    }

    setSaving(true);
    setError("");

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const saveError = await updateAccount(account.email, {
          cvName: file.name,
          cvDataUrl: String(reader.result),
        });

        if (saveError) {
          setError(saveError);
          return;
        }

        setAccount(getUser());
      } catch {
        setError("Could not save CV. Please try again.");
      } finally {
        setSaving(false);
      }
    };

    reader.onerror = () => {
      setError("Could not read the CV file. Please try again.");
      setSaving(false);
    };

    reader.readAsDataURL(file);
  }

  return (
    <Card title="My CV">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saving && <p className="text-sm text-muted">Saving...</p>}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {account.cvName ? (
          <Chip color="green">Uploaded</Chip>
        ) : (
          <Chip color="yellow">No CV yet</Chip>
        )}

        {account.cvName && (
          <span className="font-semibold">{account.cvName}</span>
        )}

        {account.cvDataUrl && (
          <a
            className="text-brand underline"
            href={account.cvDataUrl}
            download={account.cvName || "CV"}
          >
            Download saved CV
          </a>
        )}
      </div>

      <label
        className="mt-4 block text-sm font-semibold"
        htmlFor="cv-file"
      >
        {account.cvName ? "Replace CV" : "Upload CV"} (PDF or Word)
      </label>

      <input
        id="cv-file"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFile}
        disabled={saving}
        className="mt-1 text-sm"
      />

      <p className="mt-2 text-xs text-muted">
        Uploaded CVs are automatically available to approved companies.
        Prototype limit: maximum 2 MB.
      </p>
    </Card>
  );
}
