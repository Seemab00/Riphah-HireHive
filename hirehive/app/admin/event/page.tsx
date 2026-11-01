"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Field from "@/components/Field";
import { useStore } from "@/lib/useStore";
import { emptyEvent, EventInfo, KEYS } from "@/lib/data";

export default function EventSetupPage() {
  const [event, setEvent, loaded] = useStore<EventInfo>(KEYS.event, emptyEvent);

  // The boxes of the form. They start empty, then take the saved values.
  const [form, setForm] = useState<EventInfo>(emptyEvent);
  const [saved, setSaved] = useState(false); // shows "Saved" after pressing the button

  // When the saved event is read from the browser, copy it into the form.
  useEffect(() => {
    if (loaded) setForm(event);
  }, [loaded, event]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEvent(form);   // save it
    setSaved(true);
  }

  // Change one field of the form and hide the "Saved" message.
  function change(field: keyof EventInfo, text: string) {
    setForm({ ...form, [field]: text });
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event setup</h1>
        <p className="text-sm text-muted">These details are shown to everyone who logs in.</p>
      </div>

      <Card title="Open house details">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          <Field label="Event name" value={form.name} onChange={(t) => change("name", t)} placeholder="FYP Open House 2026" />
          <Field label="Date" type="date" value={form.date} onChange={(t) => change("date", t)} />
          <Field label="Venue" value={form.venue} onChange={(t) => change("venue", t)} placeholder="Gulberg Green Campus" />
          <Field label="Registration deadline" type="date" value={form.deadline} onChange={(t) => change("deadline", t)} />
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Save event</button>
            {saved && <span className="text-sm font-semibold text-green-800">Saved</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
