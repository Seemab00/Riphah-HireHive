"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import { getUser, logout, refreshUser } from "@/lib/auth";
import { Account, KEYS } from "@/lib/data";
import { useStore } from "@/lib/useStore";

type Tab = "pending" | "recommended" | "rejected" | "history";

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [accounts, setAccounts] = useStore<Account[]>(KEYS.accounts, []);
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    refreshUser().then((current) => {
      if (!active) return;
      if (!current) router.replace("/login");
      else if (current.role !== "coordinator" || current.coordinatorLevel !== "student") router.replace("/" + current.role);
      else setUser(current);
    });
    return () => { active = false; };
  }, [router]);

  const volunteers = useMemo(() => accounts.filter((a) => a.role === "volunteer"), [accounts]);
  const pending = volunteers.filter((a) => (a.volunteerStage ?? 1) === 1);
  const recommended = volunteers.filter((a) => (a.volunteerStage ?? 1) > 1 && (a.volunteerStageDecisions?.[0] === "Recommended"));
  const rejected = volunteers.filter((a) => (a.volunteerStage ?? 1) === -1 && a.volunteerStageDecisions?.[0] === "Rejected");
  const visible = tab === "pending" ? pending : tab === "recommended" ? recommended : tab === "rejected" ? rejected : volunteers.filter((a) => (a.volunteerStage ?? 1) !== 1);

  async function decide(volunteer: Account, recommend: boolean) {
    if (!user || saving) return;
    setSaving(true);
    const decisions = [...(volunteer.volunteerStageDecisions ?? ["Pending", "Pending", "Pending"])];
    decisions[0] = recommend ? "Recommended" : "Rejected";
    const updated = accounts.map((a) => a.email.toLowerCase() === volunteer.email.toLowerCase()
      ? { ...a, volunteerStage: recommend ? 2 : -1, volunteerStageDecisions: decisions, volunteerStatus: (recommend ? "Pending" : "Rejected") as const }
      : a);
    setAccounts(updated);
    setMessage(recommend
      ? `${volunteer.name} has been recommended and forwarded to the next review stage.`
      : `${volunteer.name}'s application has been rejected at the Student Coordinator stage.`);
    setSelectedEmail(null);
    setTab(recommend ? "recommended" : "rejected");
    setSaving(false);
  }

  if (!user) return <main className="p-8 text-sm text-muted">Checking coordinator access…</main>;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "recommended", label: "Recommended", count: recommended.length },
    { id: "rejected", label: "Rejected", count: rejected.length },
    { id: "history", label: "Review history", count: recommended.length + rejected.length },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Riphah HireHive</p>
          <h1 className="mt-1 text-3xl font-bold">FYP Student Coordinator</h1>
          <p className="mt-1 text-sm text-muted">Welcome, {user.name}. Review volunteer applications and forward suitable candidates to Admin.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/profile")} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">My profile</button>
          <button onClick={() => { logout(); router.push("/login"); }} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Log out</button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card title="Pending applications"><p className="text-3xl font-bold">{pending.length}</p><p className="text-xs text-muted">Waiting for your review</p></Card>
        <Card title="Recommended"><p className="text-3xl font-bold">{recommended.length}</p><p className="text-xs text-muted">Forwarded to next stage</p></Card>
        <Card title="Rejected"><p className="text-3xl font-bold">{rejected.length}</p><p className="text-xs text-muted">Closed at your stage</p></Card>
      </section>

      <Card title="Volunteer application review">
        <p className="mb-4 text-sm text-muted">Your responsibility is the first review only. Recommend suitable applicants for the next review stage or reject an application. Admin retains the final approval decision.</p>
        <div className="mb-4 flex flex-wrap gap-2 border-b border-line pb-3">
          {tabs.map((item) => <button key={item.id} onClick={() => { setTab(item.id); setSelectedEmail(null); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.id ? "bg-brand text-white" : "bg-soft text-ink"}`}>{item.label} ({item.count})</button>)}
        </div>

        {visible.length === 0 ? <p className="py-8 text-center text-sm text-muted">No applications in this section yet.</p> : (
          <div className="space-y-3">
            {visible.map((volunteer) => {
              const isPending = (volunteer.volunteerStage ?? 1) === 1;
              const firstDecision = volunteer.volunteerStageDecisions?.[0] ?? "Pending";
              return <article key={volunteer.email} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold">{volunteer.name}</h3>
                    <p className="break-all text-sm text-muted">{volunteer.email}</p>
                    <p className="mt-1 text-xs text-muted">SAP ID: {volunteer.sapId || "Not provided"} · Program: {volunteer.program || "Not provided"}</p>
                    <div className="mt-2"><Chip color={firstDecision === "Recommended" ? "green" : firstDecision === "Rejected" ? "red" : "yellow"}>{firstDecision}</Chip></div>
                  </div>
                  <button onClick={() => setSelectedEmail(selectedEmail === volunteer.email ? null : volunteer.email)} className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand">{selectedEmail === volunteer.email ? "Hide details" : "View details"}</button>
                </div>
                {selectedEmail === volunteer.email && <div className="mt-4 grid gap-3 rounded-lg bg-soft p-4 text-sm sm:grid-cols-2">
                  <p><b>Volunteer experience:</b><br />{volunteer.volunteerExperience || "Not provided"}</p>
                  <p><b>Department / Program:</b><br />{volunteer.program || "Not provided"}</p>
                  <p><b>Application status:</b><br />{volunteer.volunteerStatus || "Pending"}</p>
                  <p><b>Review stage:</b><br />{isPending ? "Student Coordinator review" : firstDecision}</p>
                </div>}
                {isPending && <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={saving} onClick={() => decide(volunteer, true)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Recommend to next stage</button>
                  <button disabled={saving} onClick={() => decide(volunteer, false)} className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject application</button>
                </div>}
              </article>;
            })}
          </div>
        )}
        {message && <p role="status" className="mt-4 rounded-lg bg-soft p-3 text-sm font-semibold">{message}</p>}
      </Card>

      <p className="text-xs text-muted">Workflow boundary: the Student Coordinator cannot approve a volunteer finally, create volunteer credentials, or access Admin management pages. Backend permissions must also be enforced for production deployment.</p>
    </main>
  );
}
