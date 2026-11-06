"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { Account, Feedback } from "@/lib/data";

// The overall open house feedback (rating + comment). The Admin reads it in "Alumni feedback".
export default function OverallFeedback({
  user,
  feedback,
  setFeedback,
}: {
  user: Account;
  feedback: Feedback[];
  setFeedback: (next: Feedback[]) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) {
      setError("Please write your feedback.");
      return;
    }
    setFeedback([
      ...feedback,
      {
        id: Date.now(),
        alumniName: user.name,
        alumniEmail: user.email,
        rating: rating,
        comment: comment.trim(),
        date: new Date().toLocaleDateString(),
      },
    ]);
    setComment("");
    setError("");
  }

  const mine = feedback.filter((f) => f.alumniEmail === user.email);

  return (
    <>
      <Card title="Overall open house feedback">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-3">
          <div>
            <label htmlFor="rating" className="mb-1 block text-sm font-semibold">Overall rating</label>
            <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} / 5</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="comment" className="mb-1 block text-sm font-semibold">Environment and experience</label>
            <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-400 px-3 py-3 text-sm" />
          </div>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Submit feedback</button>
        </form>
      </Card>

      {mine.length > 0 && (
        <Card title="My overall feedback">
          <div className="space-y-3">
            {mine.map((f) => (
              <div key={f.id} className="rounded-lg bg-surface p-4 text-sm">
                <p className="font-semibold text-brand">{f.rating} / 5 · {f.date}</p>
                <p className="mt-1">{f.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
