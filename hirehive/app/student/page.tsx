"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import EventCard from "@/components/EventCard";
import { getUser } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Account, KEYS } from "@/lib/data";

// The dashboard of a regular student (a student who is not doing an FYP).
export default function StudentHome() {
  const [user, setUser] = useState<Account | null>(null);
  const [accounts] = useStore<Account[]>(KEYS.accounts, []);

  useEffect(() => {
    setUser(getUser());
  }, []);

  // The companies that are coming to the open house = every account with the role "company".
  const companies = accounts.filter((a) => a.role === "company");

  return (
    <RoleGuard role="student">
      <TopBar links={[{ label: "Home", href: "/student" }, { label: "Profile", href: "/profile" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted">Student dashboard</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="My profile">
            <div className="space-y-1 text-sm">
              <p><b>SAP ID:</b> {user?.sapId}</p>
              <p><b>Program:</b> {user?.program}</p>
              <p><b>Email:</b> {user?.email}</p>
            </div>
          </Card>
          <EventCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* CV status. The upload itself happens on the profile page. */}
          <Card title="My CV">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {user?.cvName ? <Chip color="green">Uploaded</Chip> : <Chip color="yellow">No CV yet</Chip>}
              {user?.cvName && <span className="font-semibold">{user.cvName}</span>}
            </div>
            <p className="mt-3 text-sm text-muted">
              {user?.cvVisible ? "Companies can view your CV." : "Companies cannot view your CV yet."}
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-block rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white"
            >
              {user?.cvName ? "Replace CV" : "Upload CV"}
            </Link>
          </Card>

          {/* Which companies are coming? Students often do not know this. */}
          <Card title="Participating companies">
            {companies.length === 0 ? (
              <p className="text-sm text-muted">No company has joined the open house yet.</p>
            ) : (
              <div className="space-y-2">
                {companies.map((company) => (
                  <div key={company.email} className="rounded-lg bg-surface px-4 py-3 text-sm font-semibold">
                    {company.name}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </RoleGuard>
  );
}
