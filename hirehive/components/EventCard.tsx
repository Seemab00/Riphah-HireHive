"use client";

import Card from "./Card";
import { emptyEvent, EventInfo, KEYS } from "@/lib/data";
import { useStore } from "@/lib/useStore";

// Shows the open house details that the admin entered in "Event setup".
// Students, volunteers, companies and alumni all use this card.
export default function EventCard() {
  const [event] = useStore<EventInfo>(KEYS.event, emptyEvent);

  // If the admin has not entered anything yet, say so.
  const empty = !event.name && !event.date && !event.venue;

  return (
    <Card title="Open house">
      {empty ? (
        <p className="text-sm text-muted">The admin has not announced the open house details yet.</p>
      ) : (
        <div className="space-y-1 text-sm">
          <p className="text-lg font-bold">{event.name}</p>
          <p><b>Date:</b> {event.date}</p>
          <p><b>Venue:</b> {event.venue}</p>
          {event.deadline && <p><b>Registration deadline:</b> {event.deadline}</p>}
        </div>
      )}
    </Card>
  );
}
