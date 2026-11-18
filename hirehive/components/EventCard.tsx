
"use client";

import Card from "./Card";
import { emptyEvent, EventInfo, KEYS } from "@/lib/data";
import { useStore } from "@/lib/useStore";

export default function EventCard() {
  const [event, , eventLoaded] = useStore<EventInfo>(
    KEYS.event,
    emptyEvent
  );

  const empty = !event.name && !event.date && !event.venue;

  return (
    <Card title="Open House">
      {!eventLoaded ? (
        <p className="text-sm text-muted">
          Loading event details...
        </p>
      ) : empty ? (
        <p className="text-sm text-muted">
          The admin has not announced the Open House details yet.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-lg font-bold">{event.name}</p>

          {event.date && (
            <p><b>Date:</b> {event.date}</p>
          )}

          {event.time && (
            <p><b>Time:</b> {event.time}</p>
          )}

          {event.venue && (
            <p><b>Venue:</b> {event.venue}</p>
          )}

          {event.description && (
            <div>
              <b>Description:</b>
              <p className="mt-1 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {event.deadline && (
            <p><b>Registration deadline:</b> {event.deadline}</p>
          )}

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
            <p className="font-bold text-amber-900">
              Attendance Compulsory
            </p>
            <p className="mt-1 text-amber-800">
              All FYP students are required to attend the Open House.
              Attendance will be recorded through QR check-in or manual
              verification.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
