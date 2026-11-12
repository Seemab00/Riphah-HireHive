"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Field from "@/components/Field";
import { register, homeFor } from "@/lib/auth";
import { needsSapEmail, Program, Role, ROLE_LABELS, ROLE_ORDER, SAP_DOMAIN } from "@/lib/data";

export default function SignUpPage() {
  const router = useRouter();

  // One value for every box in the form.
  const [role, setRole] = useState<Role>("fyp");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sapId, setSapId] = useState("");
  const [program, setProgram] = useState<Program>("SE");
  const [password, setPassword] = useState("");
  const [volunteerExperience, setVolunteerExperience] = useState("");
  const [error, setError] = useState("");

  // Students and volunteers must use their SAP email. Other roles can use any email.
  const sapRole = needsSapEmail(role);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Check 1: no empty boxes.
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in every box.");
      return;
    }

    // Check 2: the password needs at least 6 characters.
    if (password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

    if (sapRole) {
      // Check 3 (students and volunteers only): SAP ID is numbers.
      if (!/^\d+$/.test(sapId)) {
        setError("SAP ID must contain only numbers.");
        return;
      }
      // Check 4 (students and volunteers only): email is SAP ID + @students.riphah.edu.pk
      if (email.trim().toLowerCase() !== sapId + SAP_DOMAIN) {
        setError("Email must be your SAP ID followed by " + SAP_DOMAIN);
        return;
      }
    } else {
      // Other roles: any email is fine, as long as it looks like an email.
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    // Try to create the account. It fails if the email is already used.
    const problem = await register({
      name: name.trim(),
      email: email,
      password: password,
      role: role,
      sapId: sapRole ? sapId : undefined,
      program: sapRole ? program : undefined,
      volunteerExperience: role === "volunteer" ? volunteerExperience.trim() : undefined,
    });
    if (problem) {
      setError(problem);
      return;
    }

    router.push(homeFor(role)); // open the dashboard of the chosen role
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8">
        <Logo dark />
        <h1 className="text-2xl font-bold">Create an account</h1>

        {/* Who are you? The role decides the dashboard. */}
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-semibold">I am a</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <Field label={role === "company" ? "Company name" : "Full name"} value={name} onChange={setName} />

        {/* These two boxes appear only for students and volunteers. */}
        {sapRole && (
          <>
            <Field label="SAP ID" value={sapId} onChange={setSapId} placeholder="54910" />
            <div>
              <label htmlFor="program" className="mb-1 block text-sm font-semibold">Program</label>
              <select
                id="program"
                value={program}
                onChange={(e) => setProgram(e.target.value as Program)}
                className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"
              >
                <option value="BCA">BCA</option>
                <option value="SE">SE</option>
                <option value="CS">CS</option>
              </select>
            </div>
          </>
        )}

        <Field
          label={sapRole ? "Riphah email" : "Email"}
          value={email}
          onChange={setEmail}
          placeholder={sapRole ? "54910" + SAP_DOMAIN : "you@example.com"}
          hint={sapRole ? "Format: SAP ID followed by " + SAP_DOMAIN : "Any email address works for this role."}
        />
        {role === "volunteer" && <Field label="Previous volunteer experience (optional)" value={volunteerExperience} onChange={setVolunteerExperience} placeholder="Events, roles, responsibilities" />}
        <Field label="Password" type="password" value={password} onChange={setPassword} hint="At least 6 characters." />

        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" className="w-full rounded-lg bg-brand py-3 font-semibold text-white">
          Create account
        </button>

        <p className="text-xs text-muted">Staff accounts are created by the Admin. This demo stores data in this browser only and is not production authentication.</p>

        <p className="text-sm text-muted">
          Already have an account? <Link href="/login" className="text-brand underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
