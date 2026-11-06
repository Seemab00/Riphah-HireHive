"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Field from "@/components/Field";
import { createAlumniAccount } from "./createAlumni";

// While the Email outbox is not ready, the password is shown on the screen so you can test.
// When Simaab's outbox works, change this to false (the password then only goes by email).
const SHOW_PASSWORD_ON_SCREEN = true;

const selectStyle = "w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm";

export default function AlumniRegisterPage() {
  // Required
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [contact, setContact] = useState("");
  // Optional
  const [program, setProgram] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [attendedBefore, setAttendedBefore] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    // Required boxes
    if (!name.trim() || !email.trim() || !company.trim() || !designation.trim() || !contact.trim()) {
      setError("Please fill in name, email, current company, designation and contact.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const digits = contact.replace(/\D/g, "");
    if (!/^[\d\s+()-]+$/.test(contact.trim()) || digits.length < 10 || digits.length > 14) {
      setError("Please enter a valid contact number, for example 0300 1234567.");
      return;
    }
    // Optional boxes: only check them if filled
    if (graduationYear.trim()) {
      const year = Number(graduationYear);
      if (!/^\d{4}$/.test(graduationYear.trim()) || year < 2000 || year > new Date().getFullYear() + 1) {
        setError("Graduation year must be a 4 digit year, for example 2022.");
        return;
      }
    }

    setBusy(true);
    const result = await createAlumniAccount({
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      designation: designation.trim(),
      contact: contact.trim(),
      program: program ? (program as "BCA" | "SE" | "CS") : undefined,
      graduationYear: graduationYear.trim() || undefined,
      attendedBefore: attendedBefore ? (attendedBefore as "Yes" | "No") : undefined,
    });
    setBusy(false);

    if (result.error || !result.password) {
      setError(result.error ?? "Could not create the account.");
      return;
    }
    setDone({ email: email.trim().toLowerCase(), password: result.password });
  }

  // ---- Success screen ----
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8">
          <Logo dark />
          <h1 className="text-2xl font-bold">Welcome to HireHive!</h1>
          <p className="text-sm">
            Your alumni account is ready. A welcome email with your username, password and login link is being sent to <b>{done.email}</b>.
          </p>
          {SHOW_PASSWORD_ON_SCREEN && (
            <div className="rounded-lg bg-soft p-4 text-sm">
              <p><b>Username:</b> {done.email}</p>
              <p><b>Password:</b> {done.password}</p>
              <p className="mt-2 text-xs text-muted">Test mode: the password is shown here only until the email outbox is ready. You can change it later from My profile.</p>
            </div>
          )}
          <Link href="/login" className="block w-full rounded-lg bg-brand py-3 text-center font-semibold text-white">Go to login</Link>
        </div>
      </div>
    );
  }

  // ---- The form ----
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8">
        <Logo dark />
        <h1 className="text-2xl font-bold">Alumni registration</h1>
        <p className="text-sm text-muted">Join the Riphah HireHive open house as an alumni mentor. You will get your login by email.</p>

        <Field label="Full name *" value={name} onChange={setName} />
        <Field label="Email *" value={email} onChange={setEmail} placeholder="you@example.com" hint="This will be your username." />
        <Field label="Current company *" value={company} onChange={setCompany} />
        <Field label="Designation *" value={designation} onChange={setDesignation} placeholder="Software Engineer" />
        <Field label="Contact number *" value={contact} onChange={setContact} placeholder="0300 1234567" />

        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Optional</p>

        <div>
          <label htmlFor="program" className="mb-1 block text-sm font-semibold">Program</label>
          <select id="program" value={program} onChange={(e) => setProgram(e.target.value)} className={selectStyle}>
            <option value="">Prefer not to say</option>
            <option value="BCA">BCA</option>
            <option value="SE">SE</option>
            <option value="CS">CS</option>
          </select>
        </div>
        <Field label="Graduation year" value={graduationYear} onChange={setGraduationYear} placeholder="2022" />
        <div>
          <label htmlFor="attended" className="mb-1 block text-sm font-semibold">Did you attend a previous open house?</label>
          <select id="attended" value={attendedBefore} onChange={(e) => setAttendedBefore(e.target.value)} className={selectStyle}>
            <option value="">Prefer not to say</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-lg bg-brand py-3 font-semibold text-white disabled:opacity-60">
          {busy ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm text-muted">
          Already registered? <Link href="/login" className="text-brand underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
