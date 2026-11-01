"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/Field";
import Logo from "@/components/Logo";
import { getAccounts, register } from "@/lib/auth";
import { Account, KEYS } from "@/lib/data";

/** First-run local demo setup only. This is NOT secure production provisioning. */
export default function SetupAdminPage() {
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [name, setName] = useState("Tazzaina Malik");
  const [email, setEmail] = useState("tazzaina.malik@riphah.edu.pk");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setAvailable(!getAccounts().some((a) => a.role === "admin")); }, []);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!available) { setError("An Admin account already exists in this browser."); return; }
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    const problem = register({ name: name.trim(), email: email.trim(), password, role: "admin" } as Account);
    if (problem) { setError(problem); return; }
    // register logs in the account; clear setup availability and go to dashboard.
    setAvailable(false);
    router.push("/admin");
  }
  return <div className="flex min-h-screen items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-xl border border-line bg-white p-8">
    <Logo dark /><h1 className="text-2xl font-bold">First-run Admin setup</h1>
    <p className="text-sm text-muted">Create the initial Admin account for this browser demo. Use the temporary password supplied by your project supervisor, then change it before any real deployment.</p>
    {!available ? <p className="rounded-lg bg-soft p-3 text-sm">Admin setup is disabled because an Admin account already exists in this browser. Sign in instead.</p> : <>
      <Field label="Admin name" value={name} onChange={setName} />
      <Field label="Riphah email" value={email} onChange={setEmail} />
      <Field label="Initial password" type="password" value={password} onChange={setPassword} hint="At least 8 characters. This demo stores it in localStorage and is not production-secure." />
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <button className="w-full rounded-lg bg-brand py-3 font-semibold text-white">Create Admin account</button>
    </>}
    <button type="button" onClick={() => router.push("/login")} className="w-full rounded-lg border border-brand py-3 font-semibold text-brand">Back to login</button>
  </form></div>;
}
