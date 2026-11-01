"use client";

import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import StatCard from "@/components/StatCard";
import { useStore } from "@/lib/useStore";
import { KEYS, LcdRequest, Status } from "@/lib/data";

// The lab staff approve or reject LCD requests, then record when the LCD is given and taken back.
export default function LabHome() {
  const [lcds, setLcds] = useStore<LcdRequest[]>(KEYS.lcd, []);

  // Change some fields of ONE request (for example { status: "Approved" }) and save.
  function change(id: number, changes: Partial<LcdRequest>) {
    setLcds(lcds.map((l) => (l.id === id ? { ...l, ...changes } : l)));
  }

  const pending = lcds.filter((l) => l.status === "Pending");
  const approved = lcds.filter((l) => l.status === "Approved");

  return (
    <RoleGuard role="lab">
      <TopBar links={[{ label: "LCD requests", href: "/lab" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">LCD requests</h1>
          <p className="text-sm text-muted">Approve or reject each request. The report updates by itself.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="LCDs issued" value={lcds.filter((l) => l.issued).length} />
          <StatCard label="Returned" value={lcds.filter((l) => l.returned).length} />
          <StatCard label="Not returned" value={lcds.filter((l) => l.issued && !l.returned).length} />
        </div>

        <Card title="New requests">
          <div className="space-y-3">
            {pending.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm">
                <span><b>{l.teamTitle}</b> · {l.reason}</span>
                <div className="flex gap-2">
                  <button onClick={() => change(l.id, { status: "Approved" as Status })} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">
                    Approve
                  </button>
                  <button onClick={() => change(l.id, { status: "Rejected" as Status })} className="rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pending.length === 0 && <p className="text-sm text-muted">No new request.</p>}
        </Card>

        <Card title="Approved: issued and returned">
          <div className="space-y-3">
            {approved.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm">
                <span><b>{l.teamTitle}</b></span>
                <div className="flex items-center gap-2">
                  {!l.issued && (
                    <button onClick={() => change(l.id, { issued: true })} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">
                      Mark issued
                    </button>
                  )}
                  {l.issued && !l.returned && (
                    <>
                      <Chip color="blue">Issued</Chip>
                      <button onClick={() => change(l.id, { returned: true })} className="rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand">
                        Mark returned
                      </button>
                    </>
                  )}
                  {l.returned && <Chip color="green">Returned</Chip>}
                </div>
              </div>
            ))}
          </div>
          {approved.length === 0 && <p className="text-sm text-muted">No approved request yet.</p>}
        </Card>
      </main>
    </RoleGuard>
  );
}
