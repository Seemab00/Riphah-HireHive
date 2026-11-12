"use client";

import { useEffect, useMemo, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import EventCard from "@/components/EventCard";
import CvCard from "@/components/CvCard";
import { getUser } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Account, emptyEvent, EventInfo, KEYS, LcdRequest, MockInterview, Team } from "@/lib/data";
import { assignTables } from "@/lib/tables";

export default function FypStudentDashboard() {
  const [user, setUser] = useState<Account | null>(null);
  const [teams] = useStore<Team[]>(KEYS.teams, []);
  const [event] = useStore<EventInfo>(KEYS.event, emptyEvent);
  const [lcds, setLcds] = useStore<LcdRequest[]>(KEYS.lcd, []);
  const [interviews] = useStore<MockInterview[]>(KEYS.mockInterviews, []);
  const [reason, setReason] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [lcdError, setLcdError] = useState("");

  useEffect(() => { setUser(getUser()); }, []);

  const myTeam = useMemo(() => teams.find((team) => team.ownerEmail.toLowerCase() === (user?.email || "").toLowerCase()), [teams, user]);
  const tableNumbers = useMemo(() => assignTables(teams), [teams]);
  const myTable = myTeam ? tableNumbers[myTeam.id] : undefined;
  const myLcds = myTeam ? lcds.filter((item) => item.teamId === myTeam.id) : [];
  const activeLcd = myLcds.find((item) => item.status !== "Rejected");
  const myInterviews = myTeam ? interviews.filter((item) => item.teamId === myTeam.id) : [];

  const notifications = useMemo(() => {
    if (!myTeam) return ["Your FYP team record will appear here after Admin makes it available."];
    const items: string[] = [];
    items.push(`Your team review status is ${myTeam.status}.`);
    if (myTeam.status === "Approved") items.push(myTable !== undefined ? `Admin allocation is available: table ${myTable}.` : "Your team is approved. Table allocation is pending.");
    if (myTeam.status === "Rejected") items.push("Please contact your FYP coordinator for further guidance.");
    if (myTeam.templateStatuses) Object.entries(myTeam.templateStatuses).forEach(([name, status]) => items.push(`${name}: ${status}.`));
    myLcds.forEach((item) => items.push(`LCD request: ${item.status}.`));
    myInterviews.forEach((item) => items.push(`Mock interview: ${item.status}, ${item.slot}.`));
    return items;
  }, [myTeam, myTable, myLcds, myInterviews]);

  function requestLcd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myTeam || myTeam.status !== "Approved") return;
    if (!reason.trim()) { setLcdError("Please enter the reason for requesting an LCD."); return; }
    if (!agreed) { setLcdError("Please confirm responsibility for the LCD and its accessories."); return; }
    setLcds([...lcds, { id: Date.now(), teamId: myTeam.id, teamTitle: myTeam.title, reason: reason.trim(), status: "Pending", issued: false, returned: false }]);
    setReason(""); setAgreed(false); setLcdError("");
  }

  return <RoleGuard role="fyp">
    <TopBar links={[{ label: "Dashboard", href: "/fyp" }]} />
    <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Riphah HireHive</p>
        <h1 className="mt-1 text-3xl font-bold">Welcome, {user?.name || "FYP Student"}</h1>
        <p className="mt-1 text-sm text-muted">Your FYP team, project and Open House information.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Team status">{myTeam ? <Chip color={statusColor(myTeam.status)}>{myTeam.status}</Chip> : <Chip color="yellow">Not available</Chip>}<p className="mt-2 text-xs text-muted">Status is managed by Admin.</p></Card>
        <Card title="Assigned table"><p className="text-2xl font-bold">{myTable !== undefined ? `Table ${String(myTable).padStart(2, "0")}` : "Not assigned"}</p><p className="text-xs text-muted">Only Admin assigns event tables.</p></Card>
        <Card title="Program"><p className="text-2xl font-bold">{myTeam?.program || user?.program || "—"}</p><p className="text-xs text-muted">FYP student information</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="My team">
          {myTeam ? <div className="space-y-3 text-sm">
            <div><p className="text-lg font-bold">{myTeam.title}</p><p className="text-muted">{myTeam.program} · {myTeam.technology}</p></div>
            <p><b>Supervisor:</b> {myTeam.supervisor || "Not assigned"}</p>
            <div><b>Team members</b><ul className="mt-2 list-disc space-y-1 pl-5">{myTeam.members.map((member, index) => <li key={`${member}-${index}`}>{member} <span className="text-muted">({myTeam.sapIds[index] || "SAP ID not available"})</span></li>)}</ul></div>
          </div> : <p className="text-sm text-muted">Your team record has not been linked to your account yet. Admin will make your selected team record available here. Contact your FYP coordinator if you believe this is incorrect.</p>}
        </Card>
        <Card title="Project details">
          {myTeam ? <div className="space-y-2 text-sm"><p><b>Project title:</b> {myTeam.title}</p><p><b>Technology:</b> {myTeam.technology || "Not provided"}</p><p><b>Supervisor:</b> {myTeam.supervisor || "Not assigned"}</p><p><b>Department:</b> {myTeam.program}</p><div className="border-t border-line pt-3"><b>Template tracking</b>{["Proposal", "Quarterly report", "Final report", "Poster"].map((template) => <div key={template} className="mt-2 flex items-center justify-between gap-2"><span>{template}</span><span className="font-semibold">{myTeam.templateStatuses?.[template] || "Not submitted"}</span></div>)}</div></div> : <p className="text-sm text-muted">Project information will be displayed after your team record is available.</p>}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EventCard />
        <Card title="Assigned event information">
          {myTeam?.status === "Approved" ? <div className="space-y-2 text-sm"><p><b>Event:</b> {event.name || "Awaiting event announcement"}</p><p><b>Date:</b> {event.date || "To be announced"}</p><p><b>Venue:</b> {event.venue || "To be announced"}</p><p><b>Table:</b> {myTable !== undefined ? myTable : "Pending Admin allocation"}</p><p className="text-xs text-muted">Your team cannot book or change its own slot or table.</p></div> : <p className="text-sm text-muted">Event allocation details will appear here after Admin approves your team and assigns its table.</p>}
        </Card>
      </div>

      <Card title="Notifications and updates"><ul className="space-y-2 text-sm">{notifications.map((item, index) => <li key={`${index}-${item}`} className="rounded-lg bg-soft px-4 py-3">{item}</li>)}</ul></Card>

      {myInterviews.length > 0 && <Card title="Mock interview"><div className="space-y-3">{myInterviews.map((interview) => <div key={interview.id} className="rounded-lg border border-line p-4 text-sm"><div className="flex flex-wrap items-center gap-3"><span><b>Alumnus:</b> {interview.alumniEmail}</span><span><b>Slot:</b> {interview.slot}</span><Chip color={interview.status === "Done" ? "green" : "blue"}>{interview.status}</Chip>{interview.meetingLink && <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="font-semibold text-brand underline">Join meeting</a>}</div>{interview.status === "Done" && <div className="mt-3 border-t border-line pt-3"><p><b>Score:</b> {interview.score ?? "—"} / 5</p>{interview.recommendation && <p><b>Recommendation:</b> {interview.recommendation}</p>}{interview.comment && <p><b>Feedback:</b> {interview.comment}</p>}</div>}</div>)}</div></Card>}

      {myTeam?.status === "Approved" && <Card title="LCD request"><div className="space-y-2">{myLcds.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-soft p-3 text-sm"><span>{item.reason}</span><Chip color={statusColor(item.status)}>{item.status}</Chip>{item.issued && !item.returned && <Chip color="blue">Issued</Chip>}{item.returned && <Chip color="green">Returned</Chip>}</div>)}</div>{!activeLcd && <form onSubmit={requestLcd} className="mt-4 max-w-xl space-y-3"><label className="block text-sm font-semibold" htmlFor="lcd-reason">Why does your team need an LCD?</label><textarea id="lcd-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-lg border border-line px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />Our team accepts responsibility for the LCD and accessories.</label>{lcdError && <p role="alert" className="text-sm text-red-700">{lcdError}</p>}<button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Submit LCD request</button></form>}</Card>}

      <CvCard />
    </main>
  </RoleGuard>;
}
