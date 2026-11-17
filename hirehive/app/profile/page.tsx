
"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/Field";
import Card from "@/components/Card";
import { getUser, homeFor, updateAccount } from "@/lib/auth";
import { Account, ROLE_LABELS, SAP_DOMAIN, needsSapEmail } from "@/lib/data";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const current = getUser();

    if (!current) {
      router.replace("/login");
    } else {
      setUser(current);
      setName(current.name);
      setEmail(current.email);
      setCompanyDescription(current.companyDescription || "");
      setCompanyWebsite(current.companyWebsite || "");
      setCompanyIndustry(current.companyIndustry || "");
      setCompanyContact(current.companyContact || "");
    }
  }, [router]);

  if (!user) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }

    if (!user) return;

    if (
      needsSapEmail(user.role) &&
      email.trim().toLowerCase() !== `${user.sapId}${SAP_DOMAIN}`
    ) {
      setMessage(`This role must use its SAP email: ${user.sapId}${SAP_DOMAIN}`);
      return;
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setMessage("Enter your current password.");
        return;
      }
      if (newPassword.length < 8) {
        setMessage("New password must have at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("New password and confirmation do not match.");
        return;
      }
    }

    const changes: Partial<Account> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };

    if (user.role === "company") {
      changes.companyDescription = companyDescription.trim();
      changes.companyWebsite = companyWebsite.trim();
      changes.companyIndustry = companyIndustry.trim();
      changes.companyContact = companyContact.trim();
    }

    if (newPassword) changes.password = newPassword;

    const err = await updateAccount(user.email, {
      ...changes,
      currentPassword,
    });

    if (err) {
      setMessage(err);
      return;
    }

    setUser({ ...user, ...changes });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(
      newPassword
        ? "Profile and password updated successfully."
        : "Profile updated successfully."
    );
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Please choose a CV smaller than 2 MB for this demo.");
      return;
    }

    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setMessage("Upload a PDF, DOC, or DOCX file.");
      return;
    }

    if (!user) return;

    const currentUser = user;
    const reader = new FileReader();

    reader.onload = async () => {
      const cvDataUrl = String(reader.result);

      const err = await updateAccount(currentUser.email, {
        cvName: file.name,
        cvDataUrl,
      });

      if (err) {
        setMessage(err);
        return;
      }

      setUser({
        ...currentUser,
        cvName: file.name,
        cvDataUrl,
      });

      setMessage("CV saved successfully. It is available to approved companies.");
    };

    reader.onerror = () => {
      setMessage("Could not read the CV file. Please try again.");
    };

    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My profile</h1>
          <p className="text-sm text-muted">{ROLE_LABELS[user.role]}</p>
        </div>
        <button
          onClick={() => router.push(homeFor(user.role))}
          className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand"
        >
          Back to dashboard
        </button>
      </div>

      <Card title="Personal details">
        <form onSubmit={save} className="max-w-xl space-y-4">
          <Field label="Full name / company name" value={name} onChange={setName} />
          <Field label="Email" value={email} onChange={setEmail} />

          {user.role === "company" && (
            <>
              <Field
                label="Industry"
                value={companyIndustry}
                onChange={setCompanyIndustry}
                placeholder="e.g. Software Development"
              />
              <Field
                label="Company Website"
                value={companyWebsite}
                onChange={setCompanyWebsite}
                placeholder="https://example.com"
              />
              <Field
                label="Contact Information"
                value={companyContact}
                onChange={setCompanyContact}
                placeholder="Official contact number or email"
              />
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Company Description
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Tell students about your company..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                />
              </div>
              <div className="rounded-lg bg-soft p-3 text-sm">
                <span className="font-semibold">Assigned Booth:</span>{" "}
                {user.boothNumber || "Not assigned yet"}
              </div>
            </>
          )}

          <div className="rounded-lg bg-soft p-3 text-xs text-muted">
            Role: {ROLE_LABELS[user.role]}
            {user.department ? ` · Department: ${user.department}` : ""}
            {user.phase ? ` · ${user.phase}` : ""}
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="mb-3 font-semibold">Change password</h3>
            <div className="space-y-3">
              <Field
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <Field
                label="New password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                hint="At least 8 characters."
              />
              <Field
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            Save profile and password
          </button>
        </form>
      </Card>

      {(user.role === "fyp" || user.role === "student") && (
        <Card title="CV upload">
          <p className="mb-3 text-sm text-muted">
            Upload a PDF, DOC, or DOCX file (maximum 2 MB in this prototype).
            Your uploaded CV is available to approved companies automatically.
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={upload}
            className="block w-full text-sm"
          />
          {user.cvName && (
            <p className="mt-3 text-sm">
              Current CV: <b>{user.cvName}</b> · Available to approved companies
            </p>
          )}
          {!user.cvName && (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              No CV uploaded yet.
            </p>
          )}
        </Card>
      )}

      {message && (
        <p role="status" className="rounded-lg bg-soft p-3 text-sm">
          {message}
        </p>
      )}

      <p className="text-xs text-muted">
        Prototype limitation: profiles, CV data, and sessions are stored in
        browser localStorage. Do not upload real sensitive CVs or use this
        authentication for production.
      </p>
    </main>
  );
}
