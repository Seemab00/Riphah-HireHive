"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import { Account, SAP_DOMAIN, Team } from "@/lib/data";
import { getAccounts } from "@/lib/auth";
import { InterviewSession, MockInterview, openCv } from "../mockInterview";
import FeedbackForm from "./FeedbackForm";

// "My interviews": every booking of this alumnus, the student's CV, and the feedback form.
export default function MyInterviews({
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openId, setOpenId] = useState<number | null>(null); // booking whose feedback form is open

  // Load the accounts, to find the students' CVs.
  useEffect(() => {
    setAccounts(getAccounts());
  }, [interviews]);

  // Only MY bookings, earliest slot first.
  const mine = interviews.filter((i) => i.alumniEmail === user.email).sort((a, b) => a.slot.localeCompare(b.slot));

  // Find the student's account by SAP ID.
  function studentAccount(sap: string): Account | undefined {
    return accounts.find((a) => a.sapId === sap || a.email === sap + SAP_DOMAIN);
  }

  function cancelBooking(id: number) {
    if (!window.confirm("Cancel this booking? The slot becomes free again.")) return;
    setInterviews(interviews.filter((i) => i.id !== id));
  }

  function submitFeedback(id: number, result: Partial<MockInterview>) {
    setInterviews(interviews.map((i) => (i.id === id ? { ...i, ...result, status: "Done" } : i)));
    setOpenId(null);
  }

  return (
    <Card title="My interviews">
      {mine.length === 0 && <p className="py-6 text-center text-sm text-muted">You have not booked any interview yet.</p>}

      <div className="space-y-4">
        {mine.map((b) => {
          const team = teams.find((t) => t.id === b.teamId);
          const account = studentAccount(b.studentSap);
          const done = b.status === "Done";

          return (
            <div key={b.id} className="rounded-lg bg-surface p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-bold">{b.slot} · {b.studentName} <span className="font-normal text-muted">({b.studentSap})</span></p>
                <Chip color={done ? "green" : "blue"}>{b.status}</Chip>
              </div>
              <p className="mt-1 text-muted">
                {team ? team.title : "Team"} {session.venue && "· " + session.venue} {session.date && "· " + session.date}
              </p>

              {/* The CV of the booked student only */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {account?.cvDataUrl && account.cvVisible ? (
                  <button onClick={() => openCv(account.cvDataUrl as string, account.cvName ?? "CV")} className="rounded-lg border border-brand px-4 py-2 text-xs font-semibold text-brand">
                    View CV ({account.cvName})
                  </button>
                ) : (
                  <span className="text-xs text-muted">
                    {!account ? "CV not available: the student has no account yet." : !account.cvName || !account.cvDataUrl ? "CV not available: the student has not uploaded a CV." : "CV not available: the student has not allowed viewing."}
                  </span>
                )}
                {!done && (
                  <>
                    <button onClick={() => setOpenId(openId === b.id ? null : b.id)} className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white">
                      {openId === b.id ? "Hide feedback form" : "Give feedback"}
                    </button>
                    <button onClick={() => cancelBooking(b.id)} className="rounded-lg px-4 py-2 text-xs font-semibold text-red-700 underline">
                      Cancel booking
                    </button>
                  </>
                )}
              </div>

              {!done && openId === b.id && <FeedbackForm studentName={b.studentName} onSubmit={(r) => submitFeedback(b.id, r)} onClose={() => setOpenId(null)} />}

              {/* My submitted feedback */}
              {done && (
                <div className="mt-3 rounded-lg bg-white p-3">
                  <p className="font-semibold text-brand">
                    Technical {b.technical}/5 · Communication {b.communication}/5 · Project explanation {b.projectExplanation}/5
                  </p>
                  <p className="mt-1"><b>Recommendation:</b> {b.recommendation}</p>
                  <p className="mt-1">{b.comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
