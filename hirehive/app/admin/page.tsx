"use client";

import Link from "next/link";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import StatCard from "@/components/StatCard";
import { useStore } from "@/lib/useStore";
import { useEffect, useState } from "react";
import { Account, emptyEvent, EventInfo, KEYS, LcdRequest } from "@/lib/data";

export default function AdminDashboard() {
  type AdminNotification = {
    id: string;
    company_name: string;
    company_email: string;
    team_id: number;
    team_title: string;
    created_at: string;
    read: boolean;
  };

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

type FacultyNotification = {
  id: string;
  title: string;
  message: string;
  upload_id: string;
  created_at: string;
  read: boolean;
};

const [facultyNotifications, setFacultyNotifications] =
  useState<FacultyNotification[]>([]);

  useEffect(() => {
    fetch("/api/admin/notifications", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load notifications.");
        return res.json();
      })
      .then((data) => setNotifications(data.notifications ?? []))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
  fetch("/api/admin/faculty-notifications", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("Could not load faculty notifications.");
      return res.json();
    })
    .then((data) => setFacultyNotifications(data.notifications ?? []))
    .catch((error) => console.error(error));
}, []);  

  async function markNotificationRead(id: string) {
    const res = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) return;

    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

async function markFacultyNotificationRead(id: string) {
  const res = await fetch("/api/admin/faculty-notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) return;

  setFacultyNotifications((current) =>
    current.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    ),
  );
}

  const [accounts] = useStore<Account[]>(KEYS.accounts, []);
  const [lcds] = useStore<LcdRequest[]>(KEYS.lcd, []);
  const [event] = useStore<EventInfo>(KEYS.event, emptyEvent);

  const companies = accounts.filter((a) => a.role === "company");
  const volunteers = accounts.filter((a) => a.role === "volunteer");

  const approvedVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Approved",
  ).length;

  const pendingVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Pending",
  ).length;

  const rejectedVolunteers = volunteers.filter(
    (v) => v.volunteerStatus === "Rejected",
  ).length;

  const lcdsNotReturned = lcds.filter((l) => l.issued && !l.returned).length;

  function attention(
    label: string,
    count: number,
    color: string,
    href: string,
  ) {
    if (count === 0) return null;

    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${color}`}
      >
        <span>
          {label} ({count})
        </span>
        <Link href={href} className="shrink-0 underline">
          Review
        </Link>
      </div>
    );
  }

  const nothingToReview =
  pendingVolunteers === 0 && lcdsNotReturned === 0;

  const quickActions = [
    {
      title: "FYP Team Registrations",
      description: "Review and approve registered FYP teams.",
      href: "/admin/registrations",
    },
    {
      title: "SDP Group Review",
      description: "Review faculty Excel uploads and approve or reject complete student groups.",
      href: "/admin/sdp-review",
    },
    {
      title: "Volunteer Selection",
      description: "Review volunteer selection stages.",
      href: "/admin/volunteer-selection",
    },
    {
      title: "Company Management",
      description: "View registered company accounts.",
      href: "/admin/companies",
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
          <p className="text-sm font-semibold text-brand">Riphah HireHive</p>

          <h1 className="mt-1 text-3xl font-bold">Admin Dashboard</h1>

          <p className="mt-2 text-sm text-muted">
            {event.name
              ? `${event.name}, ${event.date}, ${event.venue}`
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
        <h2 className="mb-3 text-lg font-bold">System Overview</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Companies Registered" value={companies.length} />

          <StatCard label="Volunteers Pending" value={pendingVolunteers} />

          <StatCard label="Volunteers Approved" value={approvedVolunteers} />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Quick Actions</h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-line bg-white p-5 transition hover:border-brand hover:shadow-md"
            >
              <h3 className="font-bold">{action.title}</h3>

              <p className="mt-2 text-sm text-muted">{action.description}</p>

              <p className="mt-4 text-sm font-semibold text-brand">
                Open section
              </p>
            </Link>
          ))}
        </div>
      </section>
      {/* Company Interest Notifications */}
      <Card title="Company Interest Notifications">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted">
              No company interest notifications yet.
            </p>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markNotificationRead(item.id)}
                className={`w-full rounded-lg border border-line p-4 text-left transition hover:border-brand ${
                  item.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {item.company_name} showed interest
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Project: {item.team_title} (#{item.team_id})
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <Chip color={item.read ? "green" : "blue"}>
                    {item.read ? "Read" : "Unread"}
                  </Chip>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
            {/* Faculty SDP Upload Notifications */}
      <Card title="Faculty SDP Upload Notifications">
        <div className="space-y-3">
          {facultyNotifications.length === 0 ? (
            <p className="text-sm text-muted">
              No faculty upload notifications yet.
            </p>
          ) : (
            facultyNotifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markFacultyNotificationRead(item.id)}
                className={`w-full rounded-lg border border-line p-4 text-left transition hover:border-brand ${
                  item.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    <Link
                      href="/admin/sdp-review"
                      className="mt-2 inline-block text-sm font-semibold text-brand underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Review SDP Groups
                    </Link>
                  </div>

                  <Chip color={item.read ? "green" : "blue"}>
                    {item.read ? "Read" : "Unread"}
                  </Chip>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
      {/* Attention and table summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Needs Attention">
          <div className="space-y-3">
            {attention(
              "Volunteers waiting for approval",
              pendingVolunteers,
              "bg-amber-100 text-amber-900",
              "/admin/volunteers",
            )}

            {attention(
              "Volunteers rejected",
              rejectedVolunteers,
              "bg-red-100 text-red-800",
              "/admin/volunteers",
            )}

            {attention(
              "LCDs not returned",
              lcdsNotReturned,
              "bg-red-100 text-red-800",
              "/admin/lcd",
            )}

            {nothingToReview && (
              <p className="text-sm text-muted">
                Nothing needs your attention right now.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

