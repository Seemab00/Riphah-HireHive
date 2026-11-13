
"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import Chip, { statusColor } from "@/components/Chip";
import EventCard from "@/components/EventCard";
import { getUser, updateAccount } from "@/lib/auth";
import { Account, VolunteerNotification, KEYS } from "@/lib/data";

const volunteerTasks = [
  "Report to the assigned booth on time",
  "Help with company booth arrangements",
  "Guide students and visitors",
  "Assist companies during the event",
  "Maintain discipline in the assigned area",
  "Coordinate with the event management team",
];

export default function VolunteerHome() {
  const [user, setUser] = useState<Account | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [notifications, setNotifications] = useState<VolunteerNotification[]>([]);
const [notificationsLoaded, setNotificationsLoaded] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem(KEYS.volunteerNotifications);
  setNotifications(saved ? JSON.parse(saved) : []);
  setNotificationsLoaded(true);
}, []);

const myNotifications = notifications.filter(
  (n) => n.volunteer.toLowerCase() === (user?.email || "").toLowerCase()
);

function markAsRead(id: string) {
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );

  setNotifications(updated);
  localStorage.setItem(KEYS.volunteerNotifications, JSON.stringify(updated));
}

const unreadCount = myNotifications.filter((n) => !n.read).length;

  useEffect(() => {
  setUser(getUser());
  setUserLoaded(true);
}, []);

  const status = user?.volunteerStatus ?? "Pending";
  const steps = ["Student Coordinator", "Faculty Coordinator", "FYP Incharge"];
  const decisions = user?.volunteerStageDecisions ?? [
    "Pending",
    "Pending",
    "Pending",
  ];

  const completedTasks = user?.taskChecklist ?? [];

  const progress = Math.round(
    (completedTasks.length / volunteerTasks.length) * 100
  );

  function toggleTask(task: string) {
    if (!user) return;

    const updatedTasks = completedTasks.includes(task)
      ? completedTasks.filter((item) => item !== task)
      : [...completedTasks, task];

    updateAccount(user.email, { taskChecklist: updatedTasks });

    setUser({
      ...user,
      taskChecklist: updatedTasks,
    });
  }

  function decisionColor(
    value: string
  ): "green" | "yellow" | "red" | "blue" {
    if (value === "Selected") return "green";
    if (value === "Recommended") return "blue";
    if (value === "Rejected") return "red";
    return "yellow";
  }

  return (
    <RoleGuard role="volunteer">
      <TopBar links={[{ label: "My duties", href: "/volunteer" }]} />

      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">My duties</h1>
          <p className="text-sm text-muted">Hello, {user?.name}</p>
        </div>
        {!userLoaded ? (
  <Card title="Application status">
    <p className="text-sm text-muted">Loading application details...</p>
  </Card>
) : (
  <>

        <Card title="Application status">
          <Chip color={statusColor(status)}>{status}</Chip>

          {status === "Pending" && (
            <p className="mt-3 text-sm text-muted">
              The admin is reviewing your application. Please check again later.
            </p>
          )}

          {status === "Rejected" && (
            <p className="mt-3 text-sm text-muted">
              Your application was not selected this time.
            </p>
          )}
        </Card>

        <Card title="Selection progress">
          <p className="mb-3 text-sm text-muted">
            Your application is reviewed in three steps.
          </p>

          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm"
              >
                <span>
                  <b>Step {index + 1}:</b> {step}
                </span>

                <Chip color={decisionColor(decisions[index] ?? "Pending")}>
                  {decisions[index] ?? "Pending"}
                </Chip>
              </div>
            ))}
          </div>
        </Card>
          </>
)}

        {status === "Approved" && (
          <>
            <Card title="Your placement">
              {user?.placement ? (
                <div className="space-y-1 text-sm">
                  <p className="text-lg font-bold">{user.placement}</p>
                  <p>
                    <b>Shift:</b> {user.shift || "Not set yet"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  The admin has not given you a placement yet.
                </p>
              )}
            </Card>

            <Card title="My Duties Checklist">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted">
                  Completed: {completedTasks.length}/{volunteerTasks.length}
                </p>
                <Chip color={progress === 100 ? "green" : "blue"}>
                  {progress}%
                </Chip>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-soft">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-3">
                {volunteerTasks.map((task) => (
                  <label
                    key={task}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={completedTasks.includes(task)}
                      onChange={() => toggleTask(task)}
                      className="mt-1 h-4 w-4 accent-current"
                    />
                    <span
                      className={
                        completedTasks.includes(task)
                          ? "text-muted line-through"
                          : ""
                      }
                    >
                      {task}
                    </span>
                  </label>
                ))}
              </div>

              {progress === 100 && (
                <p className="mt-4 text-sm font-semibold text-green-700">
                  All duties completed!
                </p>
              )}
            </Card>
          </>
        )}
<Card title={`Notifications (${unreadCount} unread)`}>
  {!notificationsLoaded ? (
    <p className="text-sm text-muted">
      Loading notifications...
    </p>
  ) : myNotifications.length === 0 ? (
    <p className="text-sm text-muted">
      No notifications yet. Updates about your application and duties will appear here.
    </p>
  ) : (
    <div className="space-y-3">
      {myNotifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-lg border border-line p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{notification.title}</p>
              <p className="mt-1 text-sm text-muted">
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-muted">
                {notification.date}
              </p>
            </div>

            {!notification.read && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="shrink-0 text-xs font-semibold text-brand"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</Card>
        <EventCard />
      </main>
    </RoleGuard>
  );
}
