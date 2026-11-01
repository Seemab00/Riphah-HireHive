"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import { useStore } from "@/lib/useStore";
import { Account, KEYS } from "@/lib/data";

// One row of the volunteer table. It has its own boxes for placement and shift.
function VolunteerRow({
  volunteer,
  onChange,
}: {
  volunteer: Account;
  onChange: (changes: Partial<Account>) => void; // saves changes to this volunteer
}) {
  const [placement, setPlacement] = useState(volunteer.placement ?? "");
  const [shift, setShift] = useState(volunteer.shift ?? "");
  const status = volunteer.volunteerStatus ?? "Pending";

  return (
    <tr className="border-t border-line">
      <td className="py-3 font-semibold">{volunteer.name}</td>
      <td>{volunteer.sapId} · {volunteer.program}</td>
      <td><Chip color={statusColor(status)}>{status}</Chip></td>
      <td>
        <div className="space-y-1 text-xs">
          <p className="font-semibold">{volunteer.volunteerStage === 4 ? "Selected" : volunteer.volunteerStage === -1 ? "Rejected" : `Stage ${volunteer.volunteerStage ?? 1} of 3`}</p>
          <a href="/admin/volunteer-selection" className="text-brand underline">Review workflow</a>
        </div>
      </td>
      <td>
        {/* Placement and shift can be entered only for approved volunteers. */}
        {status === "Approved" ? (
          <div className="flex flex-wrap gap-2 py-2">
            <input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Placement"
              className="w-32 rounded-lg border border-gray-400 px-2 py-2 text-xs" aria-label="Placement" />
            <input value={shift} onChange={(e) => setShift(e.target.value)} placeholder="Shift"
              className="w-28 rounded-lg border border-gray-400 px-2 py-2 text-xs" aria-label="Shift" />
            <button onClick={() => onChange({ placement: placement, shift: shift })}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-ink">
              Save
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">Approve first</span>
        )}
      </td>
    </tr>
  );
}

export default function VolunteersPage() {
  const [accounts, setAccounts] = useStore<Account[]>(KEYS.accounts, []);
  const volunteers = accounts.filter((a) => a.role === "volunteer");

  // Change some fields of one volunteer and save all accounts.
  function change(email: string, changes: Partial<Account>) {
    setAccounts(accounts.map((a) => (a.email === email ? { ...a, ...changes } : a)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteers</h1>
        <p className="text-sm text-muted">Track the three-stage selection workflow, then enter placement and shift for selected volunteers.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2">Name</th>
                <th>SAP ID · Program</th>
                <th>Status</th>
                <th>Action</th>
                <th>Placement and shift</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <VolunteerRow key={v.email} volunteer={v} onChange={(changes) => change(v.email, changes)} />
              ))}
            </tbody>
          </table>
        </div>
        {volunteers.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No volunteer has signed up yet.</p>
        )}
      </Card>
    </div>
  );
}
