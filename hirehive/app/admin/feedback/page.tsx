"use client";

import Card from "@/components/Card";
import { useStore } from "@/lib/useStore";
import { Feedback, KEYS } from "@/lib/data";

// Shows the feedback that alumni wrote.
export default function FeedbackPage() {
  const [feedback] = useStore<Feedback[]>(KEYS.feedback, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alumni feedback</h1>
        <p className="text-sm text-muted">Feedback about the event from alumni.</p>
      </div>

      <Card>
        <div className="space-y-4">
          {feedback.map((f) => (
            <div key={f.id} className="rounded-lg bg-surface p-4 text-sm">
              <div className="flex justify-between">
                <b>{f.alumniName}</b>
                <span className="text-muted">{f.date}</span>
              </div>
              <p className="mt-1 font-semibold text-brand">Rating: {f.rating} / 5</p>
              <p className="mt-1">{f.comment}</p>
            </div>
          ))}
        </div>
        {feedback.length === 0 && <p className="py-6 text-center text-sm text-muted">No feedback yet.</p>}
      </Card>
    </div>
  );
}
