"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/Card";

type ProgressUpdate = {
  id: string;
  posted_by_name: string;
  title: string;
  content: string;
  technologies: string;
  created_at: string;
};

export default function FypProgress() {
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUpdates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/fyp-progress");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load progress updates.");
      }

      setUpdates(result.updates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load updates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setError("Please enter both a title and progress update.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/fyp-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, technologies }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit progress update.");
      }

      setTitle("");
      setContent("");
      setTechnologies("");
      setMessage("Progress update submitted successfully.");
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Written Progress Updates">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="progress-title" className="mb-1 block text-sm font-medium">
              Update Title
            </label>
            <input
              id="progress-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Database design completed"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="progress-technologies" className="mb-1 block text-sm font-medium">
              Technologies / Tools Used (Optional)
            </label>
            <input
              id="progress-technologies"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              maxLength={500}
              placeholder="e.g. Next.js, TypeScript, Supabase"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="progress-content" className="mb-1 block text-sm font-medium">
              Progress Details
            </label>
            <textarea
              id="progress-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Describe the work completed, challenges, or next steps..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
            <p className="mt-1 text-right text-xs text-muted">
              {content.length}/5000 characters
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Progress Update"}
          </button>
        </form>

        <div className="border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Group Progress History</h3>
            <button
              type="button"
              onClick={() => void loadUpdates()}
              disabled={loading}
              className="text-sm font-medium text-brand underline disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted">No progress updates have been posted yet.</p>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <article key={update.id} className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold">{update.title}</h4>
                  {update.technologies && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">Technologies / Tools: </span>
                      {update.technologies}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {update.content}
                  </p>
                  <p className="mt-3 text-xs text-muted">
                    Posted by {update.posted_by_name} on{" "}
                    {new Date(update.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
