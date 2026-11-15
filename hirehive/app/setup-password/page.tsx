"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetupPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Setup link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/password-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "Could not set password.");
      } else {
        setMessage("Password set successfully. You can now log in.");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-8 shadow space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Set Your HireHive Password</h1>
        <p className="text-sm text-gray-600">Create a secure password for your company account. It must be at least 8 characters.</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set Password"}
        </button>
        {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
      </form>
    </main>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading...</main>}>
      <SetupPasswordForm />
    </Suspense>
  );
}
