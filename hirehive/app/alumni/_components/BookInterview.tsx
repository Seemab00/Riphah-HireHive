"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import { Account, Team } from "@/lib/data";
import { InterviewSession, MockInterview, isSelectedTeam, slotTaken } from "../mockInterview";

// Shows the SELECTED FYP teams. The alumnus picks one student and then books a free slot.
export default function BookInterview({
  user,
  teams,
  session,
  interviews,
  setInterviews,
}: {
  user: Account;
  teams: Team[];
  session: InterviewSession;
  interviews: MockInterview[];
  setInterviews: (next: MockInterview[]) => void;
}) {
  // Which student is chosen right now: team id + position of the student in team.members
  const [pick, setPick] = useState<{ teamId: number; index: number } | null>(null);
  const [message, setMessage] = useState("");

  const selectedTeams = teams.filter(isSelectedTeam);
  const pickedTeam = pick ? selectedTeams.find((t) => t.id === pick.teamId) : undefined;
  const pickedSap = pickedTeam && pick ? pickedTeam.sapIds[pick.index] ?? "" : "";
  const pickedName = pickedTeam && pick ? pickedTeam.members[pick.index] ?? "" : "";

  function book(slot: string) {
    if (!pickedTeam) return;

    // RULE 7: the same slot cannot be booked twice.
    if (slotTaken(interviews, slot)) {
      setMessage("Sorry, " + slot + " was just taken. Please choose another slot.");
      return;
    }
    // The same alumnus should not book the same student twice.
    if (interviews.some((i) => i.alumniEmail === user.email && i.studentSap === pickedSap)) {
      setMessage("You have already booked " + pickedName + ".");
      return;
    }

    setInterviews([
      ...interviews,
      {
        id: Date.now(),
        teamId: pickedTeam.id,
        studentSap: pickedSap,
        studentName: pickedName,
        alumniEmail: user.email,
        alumniName: user.name,
        slot: slot,
        status: "Booked",
      },
    ]);
    setMessage("Booked " + pickedName + " at " + slot + ". See it under \"My interviews\".");
    setPick(null);
  }

  return (
    <Card title="Selected FYP teams">
      <p className="mb-4 text-sm text-muted">
        Choose a student from a team, then book one free slot. A slot can be booked only once.
      </p>

      {message && <p className="mb-4 rounded-lg bg-soft p-3 text-sm font-semibold text-brand">{message}</p>}

      {selectedTeams.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">No FYP team has been selected by the Admin yet.</p>
      )}

      <div className="space-y-4">
        {selectedTeams.map((team) => (
          <div key={team.id} className="rounded-lg bg-surface p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-bold">{team.title}</p>
              <Chip color="teal">{team.program}</Chip>
            </div>
            <p className="mt-1 text-muted">Technology: {team.technology} · Supervisor: {team.supervisor}</p>

            <div className="mt-3 space-y-2">
              {team.members.map((member, index) => {
                const sap = team.sapIds[index] ?? "";
                const count = interviews.filter((i) => i.studentSap === sap).length;
                const chosen = pick?.teamId === team.id && pick.index === index;
                return (
                  <div key={sap + index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                    <span>
                      <b>{member}</b> <span className="text-muted">({sap})</span>
                      {count > 0 && <span className="ml-2 text-xs text-muted">{count} interview{count > 1 ? "s" : ""} booked</span>}
                    </span>
                    <button
                      onClick={() => { setPick(chosen ? null : { teamId: team.id, index }); setMessage(""); }}
                      className={"rounded-lg px-4 py-2 text-xs font-semibold " + (chosen ? "bg-accent text-ink" : "bg-brand text-white")}
                    >
                      {chosen ? "Chosen" : "Choose student"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Slot picker: appears after a student is chosen */}
      {pickedTeam && (
        <div className="mt-5 rounded-lg border border-brand p-4">
          <p className="text-sm font-bold">Book a slot for {pickedName}</p>
          {session.slots.length === 0 ? (
            <p className="mt-2 text-sm text-muted">The Admin has not created the interview slots yet.</p>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted">
                {session.date} · {session.venue} · {session.slotMinutes} minutes each
              </p>
              <div className="flex flex-wrap gap-2">
                {session.slots.map((slot) => {
                  const taken = slotTaken(interviews, slot);
                  return (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => book(slot)}
                      className={
                        "rounded-lg border px-4 py-2 text-sm font-semibold " +
                        (taken ? "cursor-not-allowed border-line bg-gray-100 text-gray-400 line-through" : "border-brand text-brand hover:bg-soft")
                      }
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
