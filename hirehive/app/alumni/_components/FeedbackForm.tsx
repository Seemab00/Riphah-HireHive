"use client";

import { useState } from "react";
import { MockInterview, RECOMMENDATIONS } from "../mockInterview";

type Result = Pick<MockInterview, "technical" | "communication" | "projectExplanation" | "recommendation" | "comment">;

const selectStyle = "w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm";

// One score box: 1 to 5.
function Score({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectStyle}>
        <option value={0}>Choose 1 to 5</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}

// The feedback form that opens under ONE booking.
export default function FeedbackForm({ studentName, onSubmit, onClose }: { studentName: string; onSubmit: (result: Result) => void; onClose: () => void }) {
  const [technical, setTechnical] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [projectExplanation, setProjectExplanation] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!technical || !communication || !projectExplanation) {
      setError("Please give all three scores (1 to 5).");
      return;
    }
    if (!recommendation) {
      setError("Please choose a recommendation.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a short comment.");
      return;
    }
    onSubmit({
      technical,
      communication,
      projectExplanation,
      recommendation: recommendation as Result["recommendation"],
      comment: comment.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-brand bg-white p-4">
      <p className="text-sm font-bold">Interview feedback for {studentName}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Score label="Technical" value={technical} onChange={setTechnical} />
        <Score label="Communication" value={communication} onChange={setCommunication} />
        <Score label="Project explanation" value={projectExplanation} onChange={setProjectExplanation} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Recommendation</label>
        <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} className={selectStyle}>
          <option value="">Choose one</option>
          {RECOMMENDATIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Comment</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-400 px-3 py-3 text-sm" />
      </div>
      <p className="text-xs text-muted">The student and the Admin will see this feedback. You cannot change it after submitting.</p>
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">Submit feedback</button>
        <button type="button" onClick={onClose} className="rounded-lg border border-brand px-5 py-3 text-sm font-semibold text-brand">Close</button>
      </div>
    </form>
  );
}
