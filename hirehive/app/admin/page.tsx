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

  // Count the numbers shown on the cards.
  const approved = teams.filter((t) => t.status === "Approved").length;
  const pendingTeams = teams.filter((t) => t.status === "Pending").length;
  const tableNumbers = assignTables(teams);
  const tablesAssigned = Object.keys(tableNumbers).length;
  const companies = accounts.filter((a) => a.role === "company").length;
  const volunteers = accounts.filter((a) => a.role === "volunteer");
  const volunteersApproved = volunteers.filter((v) => v.volunteerStatus === "Approved").length;
  const pendingVolunteers = volunteers.filter((v) => v.volunteerStatus === "Pending").length;
  const lcdsNotReturned = lcds.filter((l) => l.issued && !l.returned).length;

  // One row of the "Needs attention" box. It is shown only when "count" is more than zero.
  function attention(text: string, count: number, color: string, href: string) {
    if (count === 0) return null;
    return (
      <div className={"flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold " + color}>
        <span>{text} ({count})</span>
        <Link href={href} className="underline">Review</Link>
      </div>
    );
  }

  const nothingToReview = pendingTeams === 0 && pendingVolunteers === 0 && lcdsNotReturned === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Open house dashboard</h1>
        <p className="text-sm text-muted">
          {event.name
            ? event.name + " · " + event.date + " · " + event.venue
            : "No event yet. Add the details in Event setup."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/staff" className="rounded-xl border border-line bg-white p-4 hover:border-brand"><p className="font-semibold">Staff and coordinators</p><p className="mt-1 text-sm text-muted">Create role-scoped accounts</p></Link>
        <Link href="/admin/volunteer-selection" className="rounded-xl border border-line bg-white p-4 hover:border-brand"><p className="font-semibold">Volunteer selection</p><p className="mt-1 text-sm text-muted">Track all three selection stages</p></Link>
        <Link href="/admin/ai-recommendations" className="rounded-xl border border-line bg-white p-4 hover:border-brand"><p className="font-semibold">AI team suggestions</p><p className="mt-1 text-sm text-muted">Review transparent prototype scores</p></Link>
        <Link href="/admin/checkin" className="rounded-xl border border-line bg-white p-4 hover:border-brand"><p className="font-semibold">QR check-in design</p><p className="mt-1 text-sm text-muted">View check-in workflow prototype</p></Link>
      </div>

      {/* Five number cards in a row (they stack on small screens). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="FYP teams registered" value={teams.length} />
        <StatCard label="FYP teams approved" value={approved} />
        <StatCard label="Tables assigned" value={tablesAssigned} />
        <StatCard label="Companies registered" value={companies} />
        <StatCard label="Volunteers approved" value={volunteersApproved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Needs attention">
          <div className="space-y-3">
            {attention("Teams waiting for approval", pendingTeams, "bg-amber-100 text-amber-900", "/admin/registrations")}
            {attention("Volunteers waiting for approval", pendingVolunteers, "bg-amber-100 text-amber-900", "/admin/volunteers")}
            {attention("LCDs not returned", lcdsNotReturned, "bg-red-100 text-red-800", "/admin/lcd")}
            {nothingToReview && <p className="text-sm text-muted">Nothing needs your attention right now.</p>}
          </div>
        </Card>

        <Card title="Table numbers">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2">Program</th>
                <th>Tables</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {PROGRAMS.map((program) => {
                // How many approved teams of this program have a table number?
                const count = teams.filter(
                  (t) => t.program === program && tableNumbers[t.id] !== undefined
                ).length;
                return (
                  <tr key={program} className="border-t border-line">
                    <td className="py-3">{program}</td>
                    <td>{RANGES[program].label}</td>
                    <td>
                      {count > 0 ? <Chip color="green">Ready to print</Chip> : <Chip color="blue">Not generated</Chip>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Link href="/admin/tables" className="mt-4 inline-block rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white">
            Open tables and tags
          </Link>
        </Card>
      </div>
    </div>
  );
}
