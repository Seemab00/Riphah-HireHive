"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import EventCard from "@/components/EventCard";
import Field from "@/components/Field";
import { getUser } from "@/lib/auth";
import { useTeams } from "@/lib/useTeams";
import { useStore } from "@/lib/useStore";
import { assignTables } from "@/lib/tables";
import {
  Account,
  Interest,
  CompanyNotification,
  KEYS,
} from "@/lib/data";

export default function CompanyHome() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const { teams } = useTeams();
  const [interests, setInterests, interestsLoaded] = useStore<Interest[]>(KEYS.interests, []);
  const [accounts] = useStore<Account[]>(KEYS.accounts, []);
const [notifications, setNotifications] = useStore<CompanyNotification[]>(
  KEYS.companyNotifications,
  []
);

const normalizedEmail = email.trim().toLowerCase();

const myNotifications = notifications.filter(
  (n) => n.company.trim().toLowerCase() === normalizedEmail
);

function markAsRead(id: string) {
  setNotifications(
    notifications.map((n) =>
      n.id === id &&
      n.company.trim().toLowerCase() === normalizedEmail
        ? { ...n, read: true }
        : n
    )
  );
}

const unreadCount = myNotifications.filter((n) => !n.read).length;
  useEffect(() => {
  const user = getUser();

  if (user) {
    setEmail(user.email);
    setName(user.name);
    setCompany(user);
  }
}, []);

  // Companies see only approved projects, because only those have a table.
  const tableNumbers = assignTables(teams);
  const projects = teams.filter((t) => t.status === "Approved");

  // Keep the projects that contain the search text in the title, technology or program.
  const text = search.trim().toLowerCase();
  const shown = projects.filter(
    (t) =>
      t.title.toLowerCase().includes(text) ||
      t.technology.toLowerCase().includes(text) ||
      t.program.toLowerCase().includes(text)
  );

  // Is this project in my "Interested" list?
   // Normalize email so uppercase/lowercase differences do not affect matching.

  // Check whether this company is interested in a project.
  function isInterested(teamId: number): boolean {
    return interests.some(
      (i) =>
        i.company.trim().toLowerCase() === normalizedEmail &&
        i.teamId === teamId
    );
  }

  // Add or remove a project from this company's interest list.
  function toggle(teamId: number) {
    if (isInterested(teamId)) {
      setInterests(
        interests.filter(
          (i) =>
            !(
              i.company.trim().toLowerCase() === normalizedEmail &&
              i.teamId === teamId
            )
        )
      );
    } else {
      setInterests([
        ...interests,
        { company: normalizedEmail, teamId: teamId },
      ]);
    }
  }

  const myCount = interests.filter(
    (i) => i.company.trim().toLowerCase() === normalizedEmail
  ).length;

  return (
    <RoleGuard role="company">
      <TopBar links={[{ label: "Projects", href: "/company" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">FYP projects</h1>
          <p className="text-sm text-muted">Welcome, {name}. You are interested in {myCount} project(s).</p>
        </div>

        <EventCard />
        <Card title={`Notifications (${unreadCount} unread)`}>
  {myNotifications.length === 0 ? (
    <p className="text-sm text-muted">
      No notifications yet. Updates from HireHive will appear here.
    </p>
  ) : (
    <div className="space-y-3">
      {myNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border border-line p-3 ${
            notification.read ? "" : "bg-soft"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{notification.title}</p>
              <p className="mt-1 text-sm text-muted">
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-muted">
                {notification.date}
              </p>
            </div>

            {!notification.read && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="shrink-0 text-xs font-semibold text-brand"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</Card>
        {company && (
  <Card title="Company Overview">
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs text-muted">Company Name</p>
        <p className="font-semibold">{company.name}</p>
      </div>

      <div>
        <p className="text-xs text-muted">Industry</p>
        <p className="font-semibold">
          {company.companyIndustry || "Not provided"}
        </p>
      </div>

      <div>
        <p className="text-xs text-muted">Website</p>
        <p className="font-semibold">
          {company.companyWebsite || "Not provided"}
        </p>
      </div>

      <div>
  <p className="text-xs text-muted">Website</p>
  {company.companyWebsite?.trim() ? (
    <a
      href={
        /^https?:\/\//i.test(company.companyWebsite.trim())
          ? company.companyWebsite.trim()
          : `https://${company.companyWebsite.trim()}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-brand underline break-all"
    >
      {company.companyWebsite}
    </a>
  ) : (
    <p className="font-semibold">Not provided</p>
  )}
</div>

      <div>
        <p className="text-xs text-muted">Assigned Booth</p>
        <Chip color="teal">
          {company.boothNumber || "Not assigned"}
        </Chip>
      </div>
    </div>

    <div className="mt-4 border-t border-line pt-4">
      <p className="mb-1 text-xs text-muted">About Company</p>
      <p className="text-sm">
        {company.companyDescription || "No company description added yet."}
      </p>
    </div>

    <button
      onClick={() => (window.location.href = "/profile")}
      className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
    >
      Edit Company Profile
    </button>
  </Card>
)}
        <Card title="Student CVs shared with companies">
          <p className="mb-3 text-sm text-muted">Only CVs whose owner has enabled company visibility appear here. This prototype stores CV files in the browser.</p>
          <div className="space-y-2">{accounts.filter(a => (a.role === "fyp" || a.role === "student") && a.cvVisible && a.cvName).map(a => <div key={a.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm"><div><p className="font-semibold">{a.name}</p><p className="text-xs text-muted">{a.program || "Program not supplied"} · {a.cvName}</p></div>{a.cvDataUrl ? <a className="text-brand underline" href={a.cvDataUrl} download={a.cvName}>Open CV</a> : <span className="text-xs text-muted">Filename only; re-upload via profile to store file</span>}</div>)}{accounts.filter(a => (a.role === "fyp" || a.role === "student") && a.cvVisible && a.cvName).length === 0 && <p className="text-sm text-muted">No students have shared a CV yet.</p>}</div>
        </Card>

        <Card>
          <Field label="Search projects" value={search} onChange={setSearch} placeholder="Technology, skill or program" />
        </Card>

                {!interestsLoaded ? (
          <p className="text-sm text-muted">Loading project interests...</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {shown.map((team) => (
                <Card key={team.id}>
                  <div className="flex items-center justify-between">
                    <Chip color="teal">
                      Table {String(tableNumbers[team.id] ?? "-").padStart(2, "0")}
                    </Chip>
                    <span className="text-sm text-muted">{team.program}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold">{team.title}</h3>
                  <p className="mt-1 text-sm text-muted">{team.technology}</p>
                  <p className="mt-1 text-sm">Supervisor: {team.supervisor}</p>

                  <button
                    onClick={() => toggle(team.id)}
                    className={
                      "mt-3 rounded-lg px-4 py-2 text-sm font-semibold " +
                      (isInterested(team.id)
                        ? "bg-accent text-ink"
                        : "bg-brand text-white")
                    }
                  >
                    {isInterested(team.id)
                      ? "Interested (tap to remove)"
                      : "Interested"}
                  </button>
                </Card>
              ))}
            </div>

            {shown.length === 0 && (
              <p className="text-center text-sm text-muted">
                {projects.length === 0
                  ? "No approved project yet."
                  : "No project matches your search."}
              </p>
            )}
          </>
        )}
      </main>
    </RoleGuard>
  );
}
