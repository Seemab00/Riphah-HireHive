"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshUser, homeFor, logout } from "@/lib/auth";
import { Account, Role, ROLE_LABELS } from "@/lib/data";

// Wrap a page with this to protect it.
// Example: <RoleGuard role="admin">...admin page...</RoleGuard>
//   Not logged in      -> we send the person to the login page.
//   Logged in, same role -> we show the page.
//   Logged in, other role -> we show an "Access denied" message (a student can never open the admin pages).
export default function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");
  const [user, setUser] = useState<Account | null>(null);

  useEffect(() => {
    // Server se poochho: cookie abhi bhi valid hai? (sirf browser ke cache par bharosa nahi)
    refreshUser().then((current) => {
      if (!current) {
        router.replace("/login");
      } else if (current.role === role) {
        setState("allowed");
      } else {
        setUser(current);
        setState("denied");
      }
    });
  }, [role, router]);

  // While we check, show nothing (this avoids a flash of the protected page).
  if (state === "checking") return null;

  if (state === "denied" && user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-line bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="text-sm text-muted">
            You are signed in as <b>{ROLE_LABELS[user.role]}</b>. This page is only for{" "}
            <b>{ROLE_LABELS[role]}</b>.
          </p>
          <button
            onClick={() => router.push(homeFor(user.role))}
            className="w-full rounded-lg bg-brand py-3 font-semibold text-white"
          >
            Go to my dashboard
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full rounded-lg border border-brand py-3 font-semibold text-brand"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
