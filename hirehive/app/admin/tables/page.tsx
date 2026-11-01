"use client";

import { useState } from "react";
import Card from "@/components/Card";
import TagCard from "@/components/TagCard";
import { useTeams } from "@/lib/useTeams";
import { assignTables, PROGRAMS, RANGES } from "@/lib/tables";

export default function TablesPage() {
  const { teams } = useTeams();
  const [selectedId, setSelectedId] = useState<number | null>(null); // the team whose tag we preview

  // Table numbers for approved teams, e.g. { 4: 1, 1: 9 }.
  const tableNumbers = assignTables(teams);

  // Only teams that have a table number, sorted from the smallest number to the biggest.
  const withTables = teams
    .filter((t) => tableNumbers[t.id] !== undefined)
    .sort((a, b) => tableNumbers[a.id] - tableNumbers[b.id]);

  // The team shown in the preview: the clicked one, or the first team if none is clicked.
  const selected = withTables.find((t) => t.id === selectedId) ?? withTables[0];

  return (
    <div>
      {/* Everything inside this div is hidden when printing ("print:hidden"). */}
      <div className="space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Tables and tags</h1>
            <p className="text-sm text-muted">Numbers continue by program with no repeats.</p>
          </div>
          {/* window.print() opens the browser's print window */}
          <button
            onClick={() => window.print()}
            disabled={withTables.length === 0}
            className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-ink disabled:opacity-40"
          >
            Print all tags
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card title="Allocation">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-2">Program</th>
                    <th>Tables</th>
                    <th>Teams with a table</th>
                  </tr>
                </thead>
                <tbody>
                  {PROGRAMS.map((program) => (
                    <tr key={program} className="border-t border-line">
                      <td className="py-3">{program}</td>
                      <td>{RANGES[program].label}</td>
                      <td>{teams.filter((t) => t.program === program && tableNumbers[t.id] !== undefined).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Teams with a table">
              {withTables.length === 0 && (
                <p className="text-sm text-muted">Approve a team in Registrations to give it a table number.</p>
              )}
              <div className="space-y-2">
                {withTables.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedId(team.id)}
                    className={
                      "flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold " +
                      (selected && selected.id === team.id ? "bg-accent text-ink" : "bg-surface")
                    }
                  >
                    <span>Table {tableNumbers[team.id]} · {team.title}</span>
                    <span className="text-xs">{team.program}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Tag preview">
            {selected ? (
              <TagCard team={selected} tableNumber={tableNumbers[selected.id]} />
            ) : (
              <p className="text-sm text-muted">No tag to show yet.</p>
            )}
          </Card>
        </div>
      </div>

      {/* This area is hidden on screen and shown only when printing: one tag for every team. */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-4">
        {withTables.map((team) => (
          <TagCard key={team.id} team={team} tableNumber={tableNumbers[team.id]} />
        ))}
      </div>
    </div>
  );
}
