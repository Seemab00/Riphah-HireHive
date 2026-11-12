"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import EventCard from "@/components/EventCard";
import CvCard from "@/components/CvCard";
import TeamForm from "@/components/TeamForm";
import { getUser } from "@/lib/auth";
import { useTeams } from "@/lib/useTeams";
import { useStore } from "@/lib/useStore";
import { assignTables } from "@/lib/tables";
import { KEYS, LcdRequest, MockInterview } from "@/lib/data";

export default function FypHome() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { teams, addTeam, removeTeam } = useTeams();
  const [lcds, setLcds] = useStore<LcdRequest[]>(KEYS.lcd, []);
  const [interviews] = useStore<MockInterview[]>(KEYS.mockInterviews, []); // mock interviews assigned by the admin

  // LCD form boxes.
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [lcdError, setLcdError] = useState("");

  // Read who is logged in when the page opens.
  useEffect(() => {
    const user = getUser();
    if (user) {
      setEmail(user.email);
      setName(user.name);
    }
  }, []);

  // My team = the team that I registered. It is undefined when I have not registered yet.
  const myTeam = teams.find((t) => t.ownerEmail === email);
  const tableNumbers = assignTables(teams);
  const myTable = myTeam ? tableNumbers[myTeam.id] : undefined;

  // Mock interviews of MY team only.
  const myInterviews = myTeam ? interviews.filter((i) => i.teamId === myTeam.id) : [];

  // Chip color for the alumnus recommendation.
  function recommendationColor(value?: string): "green" | "yellow" | "red" | "blue" {
    if (value === "Ready") return "green";
    if (value === "Needs improvement") return "yellow";
    if (value === "Not ready") return "red";
    return "blue";
  }

  // My LCD requests. A new request is possible only when none is waiting or approved.
  const myLcds = myTeam ? lcds.filter((l) => l.teamId === myTeam.id) : [];
  const activeLcd = myLcds.find((l) => l.status !== "Rejected");

  function requestLcd(event: React.FormEvent) {
    event.preventDefault();
    if (!myTeam) return;
    if (!reason.trim()) {
      setLcdError("Please write why you need an LCD.");
      return;
    }
    if (!agreed) {
      setLcdError("Please accept the responsibility for damage.");
      return;
    }
    setLcds([
      ...lcds,
      { id: Date.now(), teamId: myTeam.id, teamTitle: myTeam.title, reason: reason.trim(), status: "Pending", issued: false, returned: false },
    ]);
    setReason("");
    setAgreed(false);
    setLcdError("");
  }

  return (
    <RoleGuard role="fyp">
      <TopBar links={[{ label: "My project", href: "/fyp" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {name}</h1>
          <p className="text-sm text-muted">FYP student dashboard</p>
        </div>

        <EventCard />

        {/* Step 1: register the team. Step 2: see the status and table. */}
        {!myTeam ? (
          <Card title="Register your FYP team">
            <TeamForm
              buttonLabel="Submit registration"
              existingSapIds={teams.flatMap((t) => t.sapIds)}
              onSubmit={(data) => addTeam({ ...data, ownerEmail: email })}
            />
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="My team">
              <div className="space-y-1 text-sm">
                <p className="text-lg font-bold">{myTeam.title}</p>
                <p>{myTeam.program} · {myTeam.technology}</p>
                <p><b>Supervisor:</b> {myTeam.supervisor}</p>
                <p><b>Members:</b> {myTeam.members.map((m, i) => m + " (" + myTeam.sapIds[i] + ")").join(", ")}</p>
                <div className="pt-2"><Chip color={statusColor(myTeam.status)}>{myTeam.status}</Chip></div>
                <div className="mt-4 border-t border-line pt-3"><p className="mb-2 font-semibold">Template submission tracking</p><div className="space-y-1">{["Proposal", "Quarterly report", "Final report", "Poster"].map((template) => <div key={template} className="flex items-center justify-between gap-3 text-xs"><span>{template}</span><span className="font-semibold">{myTeam.templateStatuses?.[template] || "Not submitted"}</span></div>)}</div><p className="mt-2 text-xs text-muted">Template status is updated by the Admin during review.</p></div>
              </div>
              {/* A pending or rejected team can be withdrawn and entered again. */}
              {myTeam.status !== "Approved" && (
                <button
                  onClick={() => removeTeam(myTeam.id)}
                  className="mt-4 rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  Withdraw registration
                </button>
              )}
            </Card>

            <Card title="Table">
              {myTable !== undefined ? (
                <div className="rounded-lg bg-soft p-4">
                  <span className="text-5xl font-bold text-brand">{String(myTable).padStart(2, "0")}</span>{" "}
                  <b>Your table number</b>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  You get a table number after the admin approves your team.
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Mock interview: shown after the team is registered. Before the interview we show the slot and link; after it, the feedback. */}
        {myTeam && (
          <Card title="Mock interview">
            {myInterviews.length === 0 && (
              <p className="text-sm text-muted">No mock interview has been assigned yet.</p>
            )}
            <div className="space-y-4">
              {myInterviews.map((i) => (
                <div key={i.id} className="rounded-lg bg-surface p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span><b>Alumnus:</b> {i.alumniEmail}</span>
                    <span><b>Slot:</b> {i.slot}</span>
                    <Chip color={i.status === "Done" ? "green" : "blue"}>{i.status}</Chip>
                    {i.meetingLink && (
                      <a href={i.meetingLink} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">
                        Join
                      </a>
                    )}
                  </div>

                  {/* The feedback appears only after the alumnus marks the interview as Done. */}
                  {i.status === "Done" && (
                    <div className="mt-3 space-y-2 border-t border-line pt-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span><b>Score:</b> {i.score ?? "-"} / 5</span>
                        {i.recommendation && <Chip color={recommendationColor(i.recommendation)}>{i.recommendation}</Chip>}
                      </div>
                      {i.comment && <p><b>Comment:</b> {i.comment}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* LCD request: possible only for an approved team. */}
        {myTeam && myTeam.status === "Approved" && (
          <Card title="LCD request">
            {myLcds.map((l) => (
              <div key={l.id} className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <span>{l.reason}</span>
                <Chip color={statusColor(l.status)}>{l.status}</Chip>
                {l.issued && !l.returned && <Chip color="blue">LCD with you</Chip>}
                {l.returned && <Chip color="green">Returned</Chip>}
              </div>
            ))}

            {!activeLcd && (
              <form onSubmit={requestLcd} className="max-w-xl space-y-3">
                <label htmlFor="lcd-reason" className="block text-sm font-semibold">Why do you need an LCD?</label>
                <textarea
                  id="lcd-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-400 px-3 py-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  My group is responsible for any damage to the LCD or cables
                </label>
                {lcdError && <p className="text-sm font-semibold text-red-700">{lcdError}</p>}
                <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">
                  Send request
                </button>
              </form>
            )}
          </Card>
        )}

        <CvCard />
      </main>
    </RoleGuard>
  );
}
