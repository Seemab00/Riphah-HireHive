"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import EventCard from "@/components/EventCard";
import { getUser } from "@/lib/auth";
import { Account } from "@/lib/data";

export default function VolunteerHome() {
  const [user, setUser] = useState<Account | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const status = user?.volunteerStatus ?? "Pending";

  // The three review steps, in order. Each step has one decision saved in the account.
  const steps = ["Student Coordinator", "Faculty Coordinator", "FYP Incharge"];
  const decisions = user?.volunteerStageDecisions ?? ["Pending", "Pending", "Pending"];

  // Chip color for one decision: Pending yellow, Recommended blue, Selected green, Rejected red.
  function decisionColor(value: string): "green" | "yellow" | "red" | "blue" {
    if (value === "Selected") return "green";
    if (value === "Recommended") return "blue";
    if (value === "Rejected") return "red";
    return "yellow";
  }

  return (
    <RoleGuard role="volunteer">
      <TopBar links={[{ label: "My duties", href: "/volunteer" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">My duties</h1>
          <p className="text-sm text-muted">Hello, {user?.name}</p>
        </div>

        <Card title="Application status">
          <Chip color={statusColor(status)}>{status}</Chip>
          {status === "Pending" && (
            <p className="mt-3 text-sm text-muted">The admin is reviewing your application. Please check again later.</p>
          )}
          {status === "Rejected" && (
            <p className="mt-3 text-sm text-muted">Your application was not selected this time.</p>
          )}
        </Card>

        <Card title="Selection progress">
          <p className="mb-3 text-sm text-muted">Your application is reviewed in three steps.</p>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
                <span><b>Step {index + 1}:</b> {step}</span>
                <Chip color={decisionColor(decisions[index] ?? "Pending")}>{decisions[index] ?? "Pending"}</Chip>
              </div>
            ))}
          </div>
        </Card>

        {/* Duties are shown only after the admin approves the volunteer. */}
        {status === "Approved" && (
          <Card title="Your placement">
            {user?.placement ? (
              <div className="space-y-1 text-sm">
                <p className="text-lg font-bold">{user.placement}</p>
                <p><b>Shift:</b> {user.shift || "Not set yet"}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">The admin has not given you a placement yet.</p>
            )}
          </Card>
        )}

        <EventCard />
      </main>
    </RoleGuard>
  );
}
