
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getAccounts, homeFor } from "@/lib/auth";
import { Account, CompanyInvitation, KEYS } from "@/lib/data";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const [invitation, setInvitation] = useState<CompanyInvitation | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
useEffect(() => {
  if (!token) return;

  try {
    const invitations = JSON.parse(
      localStorage.getItem(KEYS.companyInvitations) ?? "[]"
    ) as CompanyInvitation[];

    const foundInvitation = invitations.find(
      (item) =>
        item.invitationToken === token &&
        item.status === "Invitation Sent"
    );

    setInvitation(foundInvitation ?? null);
  } catch {
    setInvitation(null);
  }
}, [token]);
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (success) return;
    if (!token) {
      setError("Invitation link is missing its token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const invitations = JSON.parse(
        localStorage.getItem(KEYS.companyInvitations) ?? "[]"
      ) as CompanyInvitation[];

      const invitation = invitations.find(
        (item) => item.invitationToken === token
      );

      if (!invitation) {
        setError("This invitation is invalid or does not exist.");
        return;
      }

      if (invitation.status !== "Invitation Sent") {
        setError("This invitation is no longer available.");
        return;
      }

      const accounts = getAccounts();

      if (accounts.some((account) => account.email.toLowerCase() === invitation.email.toLowerCase())) {
        setError("An account already exists with this email. Please sign in.");
        return;
      }
setIsSubmitting(true);
      const newAccount: Account = {
        name: invitation.companyName,
        email: invitation.email.trim().toLowerCase(),
        password,
        role: "company",
        boothNumber: invitation.boothNumber,
      };

      localStorage.setItem(
        KEYS.accounts,
        JSON.stringify([...accounts, newAccount])
      );

      localStorage.setItem(KEYS.session, newAccount.email);

      const updatedInvitations = invitations.map((item) =>
        item.id === invitation.id
          ? {
              ...item,
              status: "Registered" as const,
              acceptedAt: new Date().toISOString(),
            }
          : item
      );

      localStorage.setItem(
        KEYS.companyInvitations,
        JSON.stringify(updatedInvitations)
      );
      setPassword("");
      setShowPassword(false);
setConfirmPassword("");
setShowPassword(false);

      setSuccess(true);

      setTimeout(() => {
        router.push(homeFor("company"));
      }, 2500);
        } catch {
      setIsSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-brand p-14 text-white md:flex">
        <Logo />

        <div>
          <h1 className="text-5xl font-bold leading-tight">
            Welcome to HireHive.
          </h1>
          <p className="mt-4 text-lg opacity-90">
            Your invitation to participate in the Riphah Open House starts here.
          </p>
        </div>

        <p>Gulberg Green Campus</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-xl border border-line bg-white p-8"
        >
          <h2 className="text-2xl font-bold">Accept Company Invitation</h2>

          <p className="text-sm text-muted">
            Set a password to activate your company account.
          </p>
          {invitation && (
  <div className="space-y-2 rounded-lg border border-line bg-gray-50 p-4">
    <h3 className="font-semibold text-gray-800">
      Invitation Details
    </h3>

    <div className="text-sm text-gray-600">
      <p>
        <span className="font-medium">Company:</span>{" "}
        {invitation.companyName}
      </p>

      <p>
        <span className="font-medium">Email:</span>{" "}
        {invitation.email}
      </p>

      <p>
        <span className="font-medium">Booth:</span>{" "}
        {invitation.boothNumber || "Not assigned yet"}
      </p>
    </div>
  </div>
)}

          {!token && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              No invitation token was provided. Please open the link from your invitation email.
            </p>
          )}
          {token && !invitation && (
  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
    This invitation is invalid, expired, or has already been used.
    Please contact the HireHive administration team.
  </p>
)}

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              disabled={!invitation || success || isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-line p-3 outline-none focus:border-brand"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-muted">
  Password must contain at least 8 characters.
</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              disabled={!invitation || success || isSubmitting}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-lg border border-line p-3 outline-none focus:border-brand"
              required
              minLength={8}
            />
          </div>
          <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  disabled={!invitation || success || isSubmitting}
  className="text-sm font-medium text-brand hover:underline"
>
  {showPassword ? "Hide Passwords" : "Show Passwords"}
</button>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p
  role="status"
  aria-live="polite"
  className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700"
>
              Account activated! Redirecting to your dashboard...
            </p>
          )}

          <button
            type="submit"
            disabled={!token || !invitation || success || isSubmitting}
            className="w-full rounded-lg bg-brand py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {success
  ? "Account Activated"
  : isSubmitting
    ? "Activating..."
    : "Activate Company Account"}
          </button>

          <p className="text-center text-sm text-muted">
            Already registered?{" "}
            <Link href="/login" className="text-brand underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
