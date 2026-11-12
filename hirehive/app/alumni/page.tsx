"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import EventCard from "@/components/EventCard";
import { getUser } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Account, Feedback, KEYS, Team } from "@/lib/data";
import { emptySession, InterviewSession, MOCK_KEYS, MockInterview } from "./mockInterview";
import BookInterview from "./_components/BookInterview";
import MyInterviews from "./_components/MyInterviews";
import OverallFeedback from "./_components/OverallFeedback";

export default function AlumniHome() {
  const [user, setUser] = useState<Account | null>(null);

  // All the saved lists this dashboard uses.
  const [teams] = useStore<Team[]>(KEYS.teams, []);
  const [session] = useStore<InterviewSession>(MOCK_KEYS.session, emptySession);
  const [interviews, setInterviews] = useStore<MockInterview[]>(MOCK_KEYS.interviews, []);
  const [feedback, setFeedback] = useStore<Feedback[]>(KEYS.feedback, []);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <RoleGuard role="alumni">
      <TopBar links={[{ label: "Home", href: "/alumni" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted">Alumni dashboard</p>
        </div>

        <EventCard />

        <Card title="Mock interview session">
          {session.slots.length === 0 ? (
            <p className="text-sm text-muted">The Admin has not created the mock interview session yet.</p>
          ) : (
            <div className="space-y-1 text-sm">
              <p><b>Date:</b> {session.date}</p>
              <p><b>Venue:</b> {session.venue}</p>
              <p><b>Slots:</b> {session.slotMinutes} minutes each, {session.slots[0]} to {session.slots[session.slots.length - 1]} ({session.slots.length} slots)</p>
            </div>
          )}
        </Card>

        {user && (
          <>
            <BookInterview user={user} teams={teams} session={session} interviews={interviews} setInterviews={setInterviews} />
            <MyInterviews user={user} teams={teams} session={session} interviews={interviews} setInterviews={setInterviews} />
            <OverallFeedback user={user} feedback={feedback} setFeedback={setFeedback} />
          </>
        )}
      </main>
    </RoleGuard>
  );
}
