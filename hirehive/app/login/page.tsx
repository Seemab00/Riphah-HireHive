"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Field from "@/components/Field";
import { login, homeFor } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // What the person types.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // the red message under the form

  // This runs when the person presses "Sign in".
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page

    if (email.trim() === "" || password === "") {
      setError("Please enter your email and password.");
      return;
    }

    // Check the email and password against the saved accounts.
    const result = login(email, password);
    if (result.error || !result.account) {
      setError(result.error ?? "Could not sign in.");
      return;
    }

    // The role comes from the ACCOUNT, so each person lands on their own dashboard.
    router.push(homeFor(result.account.role));
  }

  return (
    <div className="flex min-h-screen">
      {/* Left teal panel. "hidden md:flex" hides it on small phone screens. */}
      <div className="hidden flex-1 flex-col justify-between bg-brand p-14 text-white md:flex">
        <Logo />
        <div>
          <h1 className="text-5xl font-bold leading-tight">Open house, organised in one place.</h1>
          <p className="mt-4 text-lg opacity-90">
            Registration, tables, volunteers, seminar and check-in, all in one system for Riphah
            International University.
          </p>
        </div>
        <p>Gulberg Green Campus</p>
      </div>

      {/* Right side with the login form. */}
      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="text-sm text-muted">Use the email you signed up with.</p>

          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" />

          {/* Show the error only when there is one. */}
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

          <button type="submit" className="w-full rounded-lg bg-brand py-3 font-semibold text-white">
            Sign in
          </button>

          <p className="text-center text-sm text-muted">First time setting up this demo? <Link href="/setup-admin" className="text-brand underline">Create initial Admin</Link></p>
          <p className="text-center text-sm text-muted">
            New here? <Link href="/signup" className="text-brand underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
