
"use client";

import Link from "next/link";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import StatCard from "@/components/StatCard";
import { useTeams } from "@/lib/useTeams";
import { useStore } from "@/lib/useStore";
import { assignTables, PROGRAMS, RANGES } from "@/lib/tables";
import { Account, emptyEvent, EventInfo, KEYS, LcdRequest } from "@/lib/data";

export default function AdminDashboard() {
  const { teams } = useTeams();
  const [accounts] = useStore<Account[]>(KEYS.accounts, []);
  const [lcds] = useStore<LcdRequest[]>(KEYS.lcd, []);
  const [event] = useStore<EventInfo>(KEYS.event, emptyEvent);

  const approvedTeams = teams.filter((t) => t.status === "Approved").length;
  const pendingTeams = teams.filter((t) => t.status === "Pending").length;
  const rejectedTeams = teams.filter((t) => t.status === "Rejected").length;

  const tableNumbers = assignTables(teams);
  const tablesAssigned = Object.keys(tableNumbers).length;

  const companies = accounts.filter((a) => a.role === "company");
  const volunteers = accounts.filter((a) => a.role === "volunteer");

  const approvedVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Approved"
  ).length;

  const pendingVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Pending"
  ).length;

  const rejectedVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Rejected"
  ).length;

  const lcdsNotReturned = lcds.filter(
    (l) => l.issued && !l.returned
  ).length;

  function attention(
    label: string,
    count: number,
    color: string,
    href: string
  ) {
    if (count === 0) return null;

    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${color}`}
      >
        <span>{label} ({count})</span>
        <Link href={href} className="shrink-0 underline">
          Review
        </Link>
      </div>
    );
  }

  const nothingToReview =
    pendingTeams === 0 &&
    pendingVolunteers === 0 &&
    lcdsNotReturned === 0;

  const quickActions = [
    {
      title: "FYP Team Registrations",
      description: "Review and approve registered FYP teams.",
      href: "/admin/registrations",
    },
    {
      title: "Volunteer Selection",
      description: "Review volunteer selection stages.",
      href: "/admin/volunteer-selection",
    },
    {
      title: "Company Management",
      description: "View registered company accounts.",
      href: "/admin/staff",
    },
    {
      title: "AI Team Suggestions",
      description: "Review AI recommendation results.",
      href: "/admin/ai-recommendations",
    },
    {
      title: "Tables and Tags",
      description: "Manage program-wise table allocation.",
      href: "/admin/tables",
    },
    {
      title: "Event Setup",
      description: "Manage Open House event details.",
      href: "/admin/event",
    },
  ];

  return (
    <div className="space-y-7">

      {/* Dashboard heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">
            Riphah HireHive
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted">
            {event.name
              ? `${event.name} • ${event.date} • ${event.venue}`
              : "Welcome! Set up your Open House event to get started."}
          </p>
        </div>

        <Link
          href="/admin/event"
          className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Manage Event
        </Link>
      </div>

      {/* Statistics */}
      <section>
        <h2 className="mb-3 text-lg font-bold">
          System Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="FYP Teams Registered"
            value={teams.length}
          />

          <StatCard
            label="Teams Pending"
            value={pendingTeams}
          />

          <StatCard
            label="Teams Approved"
            value={approvedTeams}
          />

          <StatCard
            label="Teams Rejected"
            value={rejectedTeams}
          />

          <StatCard
            label="Tables Assigned"
            value={tablesAssigned}
          />

          <StatCard
            label="Companies Registered"
            value={companies.length}
          />

          <StatCard
            label="Volunteers Pending"
            value={pendingVolunteers}
          />

          <StatCard
            label="Volunteers Approved"
            value={approvedVolunteers}
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-line bg-white p-5 transition hover:border-brand hover:shadow-md"
            >
              <h3 className="font-bold">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-muted">
                {action.description}
              </p>

              <p className="mt-4 text-sm font-semibold text-brand">
                Open section →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Attention and table summary */}
      <div className="grid gap-6 lg:grid-cols-2">

        <Card title="Needs Attention">
          <div className="space-y-3">

            {attention(
              "Teams waiting for approval",
              pendingTeams,
              "bg-amber-100 text-amber-900",
              "/admin/registrations"
            )}

            {attention(
              "Volunteers waiting for approval",
              pendingVolunteers,
              "bg-amber-100 text-amber-900",
              "/admin/volunteers"
            )}

            {attention(
              "Volunteers rejected",
              rejectedVolunteers,
              "bg-red-100 text-red-800",
              "/admin/volunteers"
            )}

            {attention(
              "LCDs not returned",
              lcdsNotReturned,
              "bg-red-100 text-red-800",
              "/admin/lcd"
            )}

            {nothingToReview && (
              <p className="text-sm text-muted">
                Nothing needs your attention right now.
              </p>
            )}
          </div>
        </Card>

        <Card title="Table Allocation Overview">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2">Program</th>
                  <th>Table Range</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {PROGRAMS.map((program) => {
                  const count = teams.filter(
                    (t) =>
                      t.program === program &&
                      tableNumbers[t.id] !== undefined
                  ).length;

                  return (
                    <tr key={program} className="border-t border-line">
                      <td className="py-3 font-semibold">
                        {program}
                      </td>

                      <td>{RANGES[program].label}</td>

                      <td>
                        {count > 0 ? (
                          <Chip color="green">
                            Ready to print
                          </Chip>
                        ) : (
                          <Chip color="blue">
                            Not generated
                          </Chip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Link
            href="/admin/tables"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white"
          >
            Manage Tables and Tags
          </Link>
        </Card>
      </div>

    </div>
  );
}
