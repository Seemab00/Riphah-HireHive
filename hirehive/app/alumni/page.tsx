"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import TopBar from "@/components/TopBar";
import Card from "@/components/Card";
import EventCard from "@/components/EventCard";
import { getUser } from "@/lib/auth";
import { useStore } from "@/lib/useStore";
import { Account, Feedback, KEYS } from "@/lib/data";

export default function AlumniHome() {
  const [user, setUser] = useState<Account | null>(null);
  const [feedback, setFeedback] = useStore<Feedback[]>(KEYS.feedback, []);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
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

  // Only my own feedback.
  const mine = feedback.filter((f) => user && f.alumniEmail === user.email);

  return (
    <RoleGuard role="alumni">
      <TopBar links={[{ label: "Home", href: "/alumni" }]} />
      <main className="space-y-6 p-6 md:px-12">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted">Alumni dashboard</p>
        </div>

        <EventCard />

        <Card title="Share your feedback">
          <form onSubmit={handleSubmit} className="max-w-xl space-y-3">
            <div>
              <label htmlFor="rating" className="mb-1 block text-sm font-semibold">Overall rating</label>
              <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}
                className="rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} / 5</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comment" className="mb-1 block text-sm font-semibold">Environment and experience</label>
              <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
                className="w-full rounded-lg border border-gray-400 px-3 py-3 text-sm" />
            </div>
            {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Submit feedback</button>
          </form>
        </Card>

        {mine.length > 0 && (
          <Card title="My feedback">
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
      </main>
    </RoleGuard>
  );
}
