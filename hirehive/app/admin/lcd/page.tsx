"use client";

import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import StatCard from "@/components/StatCard";
import { useStore } from "@/lib/useStore";
import { KEYS, LcdRequest } from "@/lib/data";

// The admin only LOOKS at the LCD report. The lab staff approve and record the LCDs.
export default function LcdReportPage() {
  const [lcds] = useStore<LcdRequest[]>(KEYS.lcd, []);

  const issued = lcds.filter((l) => l.issued).length;
  const returned = lcds.filter((l) => l.returned).length;
  const notReturned = lcds.filter((l) => l.issued && !l.returned).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">LCD report</h1>
        <p className="text-sm text-muted">Made automatically from the lab staff records.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="LCDs issued" value={issued} />
        <StatCard label="Returned" value={returned} />
        <StatCard label="Not returned" value={notReturned} />
      </div>

      <Card title="All LCD requests">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-2">Team</th>
              <th>Reason</th>
              <th>Request</th>
              <th>LCD</th>
            </tr>
          </thead>
          <tbody>
            {lcds.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="py-3 font-semibold">{l.teamTitle}</td>
                <td>{l.reason}</td>
                <td><Chip color={statusColor(l.status)}>{l.status}</Chip></td>
                <td>
                  {l.status !== "Approved" && <span className="text-muted">-</span>}
                  {l.status === "Approved" && !l.issued && <Chip color="blue">Not issued yet</Chip>}
                  {l.status === "Approved" && l.issued && !l.returned && <Chip color="red">Not returned</Chip>}
                  {l.returned && <Chip color="green">Returned</Chip>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lcds.length === 0 && <p className="py-6 text-center text-sm text-muted">No LCD request yet.</p>}
      </Card>
    </div>
  );
}
