
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@/components/Card";
import { useStore } from "@/lib/useStore";
import { Account, KEYS } from "@/lib/data";
import { BrowserQRCodeReader } from "@zxing/browser";

type Checkin = {
  email: string;
  name: string;
  checkedInAt: string;
};

type Attendance = {
  id: string;
  student_email: string;
  student_name: string;
  sap_id: string;
  department: string;
  phase: string;
  group_name: string;
  attendance_method: "qr" | "manual";
  checked_in_by: string;
  checked_in_at: string;
};

export default function CheckinDesignPage() {
  const [accounts] = useStore<Account[]>(KEYS.accounts, []);
  const [checkins, setCheckins] = useStore<Checkin[]>(KEYS.checkins, []);
  const companies = accounts.filter((a) => a.role === "company");

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [sapId, setSapId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [eventName, setEventName] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const scanBusy = useRef(false);

  function toggle(c: Account) {
    const exists = checkins.some((x) => x.email === c.email);
    setCheckins(
      exists
        ? checkins.filter((x) => x.email !== c.email)
        : [
            ...checkins,
            {
              email: c.email,
              name: c.name,
              checkedInAt: new Date().toLocaleString(),
            },
          ]
    );
  }

  const loadAttendance = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/fyp-attendance");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load attendance.");
      }

      setAttendance(result.attendance || []);
      setEventName(result.event?.name || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load attendance."
      );
    }
  }, []);

  useEffect(() => {
    void loadAttendance();

    return () => {
      controlsRef.current?.stop();
    };
  }, [loadAttendance]);

  async function markAttendance(payload: { token?: string; sapId?: string }) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/fyp-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not mark attendance.");
      }

      setMessage(
        `${result.attendance.student_name} (${result.attendance.sap_id}) was checked in successfully.`
      );
      setSapId("");
      await loadAttendance();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not mark attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startScanner() {
    if (!videoRef.current) return;

    setError("");
    setMessage("");
    scanBusy.current = false;

    try {
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result && !scanBusy.current) {
            scanBusy.current = true;
            controlsRef.current?.stop();
            setScanning(false);

            void markAttendance({ token: result.getText() }).finally(() => {
              scanBusy.current = false;
            });
          }
        }
      );

      controlsRef.current = controls;
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not start the camera. Check browser permissions."
      );
    }
  }

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();

    if (!sapId.trim()) {
      setError("Enter a SAP ID.");
      return;
    }

    void markAttendance({ sapId: sapId.trim() });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Open House Check-in</h1>
        <p className="text-sm text-muted">
          Compulsory Open House attendance for FYP students.
        </p>
      </div>

      <Card title="FYP Student Attendance">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted">Current event</p>
            <p className="text-lg font-semibold">
              {eventName || "No Open House event has been announced."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line p-4">
              <p className="text-3xl font-bold">{attendance.length}</p>
              <p className="text-sm text-muted">Students checked in</p>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-3xl font-bold">
                {attendance.filter((a) => a.attendance_method === "qr").length}
              </p>
              <p className="text-sm text-muted">QR check-ins</p>
            </div>
          </div>

          {message && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-3 rounded-lg border border-line p-4">
            <h2 className="font-semibold">Scan student QR code</h2>

            <video
              ref={videoRef}
              className="w-full max-w-md rounded-lg bg-black"
              muted
              playsInline
            />

            <div className="flex flex-wrap gap-2">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={loading}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Start QR Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold"
                >
                  Stop Scanner
                </button>
              )}
            </div>

            <p className="text-xs text-muted">
              Allow camera access in your browser. Scanning requires localhost
              or HTTPS.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-line p-4">
            <h2 className="font-semibold">Manual attendance fallback</h2>

            <form onSubmit={submitManual} className="flex flex-wrap gap-2">
              <input
                value={sapId}
                onChange={(e) => setSapId(e.target.value)}
                placeholder="Enter student SAP ID"
                className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Mark Attendance"}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Student attendance records</h2>
            <button
              type="button"
              onClick={() => void loadAttendance()}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {attendance.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-line p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.student_name}</p>
                    <p className="text-sm text-muted">
                      SAP ID: {item.sap_id}
                    </p>
                    <p className="text-sm text-muted">
                      {item.department}, {item.phase}, {item.group_name}
                    </p>
                  </div>

                  <span className="rounded-full border border-line px-3 py-1 text-xs">
                    {item.attendance_method === "qr" ? "QR Scan" : "Manual"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted">
                  Checked in: {new Date(item.checked_in_at).toLocaleString()}
                </p>
              </div>
            ))}

            {attendance.length === 0 && (
              <p className="py-5 text-center text-sm text-muted">
                No FYP students have checked in yet.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Company QR flow: existing demo">
        <div className="space-y-3">
          <p className="text-sm text-muted">
            The existing company check-in prototype is preserved. It is
            separate from FYP student attendance.
          </p>

          <p className="text-3xl font-bold">{checkins.length}</p>
          <p className="text-sm text-muted">
            Company check-ins recorded in this browser
          </p>

          <div className="space-y-3">
            {companies.map((company) => {
              const checked = checkins.some(
                (x) => x.email === company.email
              );

              return (
                <div
                  key={company.email}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4"
                >
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-sm text-muted">{company.email}</p>
                    {checked && (
                      <p className="mt-1 text-xs text-muted">
                        Checked in:{" "}
                        {
                          checkins.find((x) => x.email === company.email)
                            ?.checkedInAt
                        }
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(company)}
                    className={
                      checked
                        ? "rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand"
                        : "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
                    }
                  >
                    {checked ? "Undo demo check-in" : "Simulate check-in"}
                  </button>
                </div>
              );
            })}

            {companies.length === 0 && (
              <p className="py-5 text-center text-sm text-muted">
                No company accounts registered yet.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
