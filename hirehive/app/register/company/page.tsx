"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Field from "@/components/Field";
import Logo from "@/components/Logo";
import { refreshUser } from "@/lib/auth";

// Company ko email me invitation link milta hai: /register/company?token=...
function CompanyRegister() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"checking" | "ok" | "bad">("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [requirements, setRequirements] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/invites?token=" + encodeURIComponent(token))
      .then((r) => r.json())
      .then((j) => { if (j.valid) { setEmail(j.email); setName(j.name ?? ""); setState("ok"); } else setState("bad"); })
      .catch(() => setState("bad"));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your company name."); return; }
    if (password.length < 8) { setError("Password must have at least 8 characters."); return; }
    const res = await fetch("/api/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, accounts: [{ role: "company", email, name: name.trim(), password, technologies, requirements, companyStatus: "Registered" }] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.created?.length) { setError(json.error ?? "Could not register. This email may already have an account."); return; }
    await refreshUser();         // server ne cookie laga di, cache bhar lo
    router.push("/company");      // company khud login ho gayi
  }

  if (state === "checking") return null;
  if (state === "bad") return <div className="flex min-h-screen items-center justify-center p-6"><p className="text-center">This invitation link is invalid, expired or already used.<br />Please contact the Open House Admin.</p></div>;
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8">
        <Logo dark />
        <h1 className="text-2xl font-bold">Company registration</h1>
        <Field label="Company name" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={() => {}} hint="This is the email the invitation was sent to." />
        <Field label="Technologies you hire for" value={technologies} onChange={setTechnologies} placeholder="React, Node.js, Flutter" />
        <Field label="Requirements" value={requirements} onChange={setRequirements} multiline />
        <Field label="Choose a password" type="password" value={password} onChange={setPassword} hint="At least 8 characters." />
        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        <button className="w-full rounded-lg bg-brand py-3 font-semibold text-white">Register</button>
      </form>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><CompanyRegister /></Suspense>;
}
