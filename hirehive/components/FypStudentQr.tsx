
"use client";

import { useState } from "react";
import QRCode from "qrcode";
import Card from "@/components/Card";

type EventDetails = {
  name: string;
  date: string;
  time: string;
  venue: string;
};

export default function FypStudentQr() {
  const [qrImage, setQrImage] = useState("");
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateQr() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/fyp-qr", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not generate the QR code.");
      }

      const image = await QRCode.toDataURL(result.token, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setQrImage(image);
      setEvent(result.event);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the QR code."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="My Open House Attendance QR">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Generate your personal QR code for compulsory Open House attendance.
          Ask an Admin to scan it at the event.
        </p>

        <button
          type="button"
          onClick={generateQr}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : qrImage
              ? "Refresh Attendance QR"
              : "Generate Attendance QR"}
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {qrImage && (
          <div className="space-y-3 rounded-lg border p-4 text-center">
            {event && (
              <div className="text-sm">
                <p className="font-semibold">{event.name}</p>
                <p>Date: {event.date}</p>
                {event.time && <p>Time: {event.time}</p>}
                <p>Venue: {event.venue}</p>
              </div>
            )}

            <img
              src={qrImage}
              alt="Personal Open House attendance QR code"
              className="mx-auto h-64 w-64"
            />

            <p className="text-sm font-medium text-green-700">
              Your attendance QR is ready.
            </p>

            <p className="text-xs text-gray-500">
              Valid until: {new Date(expiresAt).toLocaleString()}
            </p>

            <p className="text-xs text-gray-500">
              Use this QR code only to verify your attendance.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
