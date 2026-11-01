"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import EventCard from "@/components/EventCard";
import CvCard from "@/components/CvCard";
import { getUser } from "@/lib/auth";
import { Account } from "@/lib/data";

// The dashboard of a regular student (a student who is not doing an FYP).
export default function StudentHome() {
  const [user, setUser] = useState<Account | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <RoleGuard role="student">
      <TopBar links={[{ label: "Home", href: "/student" }]} />
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

        <CvCard />
      </main>
    </RoleGuard>
  );
}
