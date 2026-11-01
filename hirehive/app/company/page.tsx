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
import { Account, Interest, KEYS } from "@/lib/data";

export default function CompanyHome() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const { teams } = useTeams();
  const [interests, setInterests] = useStore<Interest[]>(KEYS.interests, []);
  const [accounts] = useStore<Account[]>(KEYS.accounts, []);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setEmail(user.email);
      setName(user.name);
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
  function isInterested(teamId: number): boolean {
    return interests.some((i) => i.company === email && i.teamId === teamId);
  }

  // Add the project to my list, or remove it when it is already there.
  function toggle(teamId: number) {
    if (isInterested(teamId)) {
      setInterests(interests.filter((i) => !(i.company === email && i.teamId === teamId)));
    } else {
      setInterests([...interests, { company: email, teamId: teamId }]);
    }
  }

  const myCount = interests.filter((i) => i.company === email).length;

  return (
    <RoleGuard role="company">
      <TopBar links={[{ label: "Projects", href: "/company" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">FYP projects</h1>
          <p className="text-sm text-muted">Welcome, {name}. You are interested in {myCount} project(s).</p>
        </div>

        <EventCard />

        <Card title="Student CVs shared with companies">
          <p className="mb-3 text-sm text-muted">Only CVs whose owner has enabled company visibility appear here. This prototype stores CV files in the browser.</p>
          <div className="space-y-2">{accounts.filter(a => (a.role === "fyp" || a.role === "student") && a.cvVisible && a.cvName).map(a => <div key={a.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm"><div><p className="font-semibold">{a.name}</p><p className="text-xs text-muted">{a.program || "Program not supplied"} · {a.cvName}</p></div>{a.cvDataUrl ? <a className="text-brand underline" href={a.cvDataUrl} download={a.cvName}>Open CV</a> : <span className="text-xs text-muted">Filename only; re-upload via profile to store file</span>}</div>)}{accounts.filter(a => (a.role === "fyp" || a.role === "student") && a.cvVisible && a.cvName).length === 0 && <p className="text-sm text-muted">No students have shared a CV yet.</p>}</div>
        </Card>

        <Card>
          <Field label="Search projects" value={search} onChange={setSearch} placeholder="Technology, skill or program" />
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((team) => (
            <Card key={team.id}>
              <div className="flex items-center justify-between">
                <Chip color="teal">Table {String(tableNumbers[team.id] ?? "-").padStart(2, "0")}</Chip>
                <span className="text-sm text-muted">{team.program}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold">{team.title}</h3>
              <p className="mt-1 text-sm text-muted">{team.technology}</p>
              <p className="mt-1 text-sm">Supervisor: {team.supervisor}</p>
              <button
                onClick={() => toggle(team.id)}
                className={
                  "mt-3 rounded-lg px-4 py-2 text-sm font-semibold " +
                  (isInterested(team.id) ? "bg-accent text-ink" : "bg-brand text-white")
                }
              >
                {isInterested(team.id) ? "Interested (tap to remove)" : "Interested"}
              </button>
            </Card>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="text-center text-sm text-muted">
            {projects.length === 0 ? "No approved project yet." : "No project matches your search."}
          </p>
        )}
      </main>
    </RoleGuard>
  );
}
