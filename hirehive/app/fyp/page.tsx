
"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import EventCard from "@/components/EventCard";
import CvCard from "@/components/CvCard";
import FypDocuments from "@/components/FypDocuments";
import FypProgress from "@/components/FypProgress";
import FypStudentQr from "@/components/FypStudentQr";
import FypNotifications from "@/components/FypNotifications";
import { refreshUser } from "@/lib/auth";
import { Account } from "@/lib/data";

export default function FypHome() {
  const [student, setStudent] = useState<Account | null>(null);

  useEffect(() => {
  let active = true;

  refreshUser().then((user) => {
    if (active && user) {
      setStudent(user);
    }
  });

  return () => {
    active = false;
  };
}, []);

  return (
    <RoleGuard role="fyp">
      <TopBar links={[{ label: "My project", href: "/fyp" }]} />

      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, {student?.name || "Student"}
          </h1>
          <p className="text-sm text-muted">
            FYP student dashboard
          </p>
        </div>

        <EventCard />
<FypStudentQr />
<FypNotifications />

        <Card title="My Academic Details">
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted">SAP ID</p>
              <p className="font-semibold">{student?.sapId || "-"}</p>
            </div>
            <div>
              <p className="text-muted">Department</p>
              <p className="font-semibold">
                {student?.department || student?.program || "-"}
              </p>
            </div>
            <div>
              <p className="text-muted">FYP Phase</p>
              <p className="font-semibold">{student?.phase || "-"}</p>
            </div>
            <div>
              <p className="text-muted">Group Name</p>
              <p className="font-semibold">{student?.groupName || "-"}</p>
            </div>
            <div>
              <p className="text-muted">Supervisor</p>
              <p className="font-semibold">{student?.supervisor || "-"}</p>
            </div>
            <div>
              <p className="text-muted">Contact Number</p>
              <p className="font-semibold">{student?.contactNo || "-"}</p>
            </div>
          </div>
        </Card>

        <Card title="My Project">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted">Project Title</p>
              <p className="text-lg font-bold">
                {student?.projectTitle || "Project title not available yet"}
              </p>
            </div>

            <div>
              <p className="text-muted">Technologies / Tools</p>
              <p className="font-medium">
                {student?.technologies || "-"}
              </p>
            </div>

            <div>
              <p className="text-muted">Project Description</p>
              <p className="whitespace-pre-wrap">
                {student?.projectDescription || "No project description available yet."}
              </p>
            </div>
          </div>
        </Card>

        <CvCard />
        <FypDocuments />
        <FypProgress />
      </main>
    </RoleGuard>
  );
}

