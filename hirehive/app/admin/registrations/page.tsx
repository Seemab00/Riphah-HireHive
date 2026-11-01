"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import TeamForm from "@/components/TeamForm";
import { useTeams } from "@/lib/useTeams";
import { Status } from "@/lib/data";

// The filter buttons at the top. "All" shows every team.
type Filter = "All" | Status;
const filters: Filter[] = ["All", "Pending", "Approved", "Rejected"];

export default function RegistrationsPage() {
  const { teams, addTeam, setStatus, updateTeam, removeTeam } = useTeams();
  const [filter, setFilter] = useState<Filter>("All"); // the filter that is selected now
  const [showForm, setShowForm] = useState(false);     // is the "Add team" form open?

  // Keep only the teams that match the selected filter.
  const shown = filter === "All" ? teams : teams.filter((t) => t.status === filter);

  // All SAP IDs that are already used, so the form can refuse duplicates.
  const usedSapIds = teams.flatMap((t) => t.sapIds);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Team registrations</h1>
          <p className="text-sm text-muted">Review each team, or add a team yourself.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-ink">
          {showForm ? "Close form" : "Add team"}
        </button>
      </div>

      {/* The form to enter a team. Teams you add are approved right away. */}
      {showForm && (
        <Card title="Add a team">
          <TeamForm
            buttonLabel="Save team"
            existingSapIds={usedSapIds}
            onSubmit={(data) => addTeam({ ...data, ownerEmail: "admin" }, "Approved")}
          />
        </Card>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full px-4 py-2 text-sm font-semibold " +
              (filter === f ? "bg-brand text-white" : "bg-soft text-brand")
            }
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2">Project</th>
                <th>Program</th>
                <th>Members</th>
                <th>Supervisor</th>
                <th>Status</th>
                <th>Template submissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* One table row for every team in "shown". */}
              {shown.map((team) => (
                <tr key={team.id} className="border-t border-line">
                  <td className="py-3 font-semibold">{team.title}</td>
                  <td>{team.program}</td>
                  <td>{team.members.length}</td>
                  <td>{team.supervisor}</td>
                  <td>
                    <Chip color={statusColor(team.status)}>{team.status}</Chip>
                  </td>
                  <td className="min-w-56">
                    <div className="space-y-2 py-2">
                      {["Proposal", "Quarterly report", "Final report", "Poster"].map((template) => (
                        <label key={template} className="flex items-center justify-between gap-2 text-xs">
                          <span>{template}</span>
                          <select value={team.templateStatuses?.[template] || "Not submitted"} onChange={(e) => updateTeam(team.id, { templateStatuses: { ...(team.templateStatuses || {}), [template]: e.target.value as "Not submitted" | "Submitted" | "Reviewed" } })} className="rounded border border-gray-300 bg-white p-1">
                            <option>Not submitted</option><option>Submitted</option><option>Reviewed</option>
                          </select>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {/* Disabled when the team already has that status. */}
                      <button
                        onClick={() => setStatus(team.id, "Approved")}
                        disabled={team.status === "Approved"}
                        className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setStatus(team.id, "Rejected")}
                        disabled={team.status === "Rejected"}
                        className="rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand disabled:opacity-40"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          // confirm() asks "OK or Cancel" before deleting
                          if (window.confirm("Delete this team?")) removeTeam(team.id);
                        }}
                        className="rounded-lg border border-red-700 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Message when there are no teams to show. */}
        {shown.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">
            {teams.length === 0 ? "No team has registered yet. Press Add team to enter one." : "No teams in this list."}
          </p>
        )}
      </Card>
    </div>
  );
}
