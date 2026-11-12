"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";

type Mail = { id: number; to_email: string; subject: string; body: string; link: string | null; attachment_name: string | null; created_at: string };

// Bheji gayi emails ka content aur links (real email service lagne se pehle demo ke liye).
export default function OutboxPage() {
  const [mails, setMails] = useState<Mail[]>([]);
  const [loaded, setLoaded] = useState(false);
  function load() {
    fetch("/api/outbox", { cache: "no-store" }).then((r) => r.json()).then((j) => setMails(j.emails ?? [])).finally(() => setLoaded(true));
  }
  useEffect(load, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Email outbox</h1>
        <button onClick={load} className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand">Refresh</button>
      </div>
      {loaded && mails.length === 0 && <Card><p className="text-sm text-muted">No emails yet.</p></Card>}
      {mails.map((m) => (
        <Card key={m.id} title={m.subject}>
          <p className="text-xs text-muted">To: {m.to_email} · {new Date(m.created_at).toLocaleString()}</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm">{m.body}</pre>
          {m.attachment_name && <p className="mt-2 text-sm">Attachment: {m.attachment_name}</p>}
          {m.link && <a href={m.link} className="mt-2 block text-sm text-brand underline">{m.link}</a>}
        </Card>
      ))}
    </div>
  );
}
