"use client";

import { useState } from "react";
import Field from "./Field";
import { Program } from "@/lib/data";

// The information that the form hands back when it is submitted.
export type TeamData = {
  title: string;
  program: Program;
  technology: string;
  supervisor: string;
  members: string[];
  sapIds: string[];
};

// A form to enter one FYP team. The admin uses it to add a team, and a student uses it to register.
// "existingSapIds" are the SAP IDs already used in other teams (a SAP ID can be in only one team).
export default function TeamForm({
  onSubmit,
  buttonLabel,
  existingSapIds,
}: {
  onSubmit: (data: TeamData) => void;
  buttonLabel: string;
  existingSapIds: string[];
}) {
  const [title, setTitle] = useState("");
  const [program, setProgram] = useState<Program>("SE");
  const [technology, setTechnology] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [names, setNames] = useState(["", "", ""]); // up to 3 member names
  const [saps, setSaps] = useState(["", "", ""]);   // up to 3 SAP IDs
  const [error, setError] = useState("");

  // Change one member name (position i) without touching the others.
  function changeName(i: number, text: string) {
    const copy = [...names];
    copy[i] = text;
    setNames(copy);
  }
  function changeSap(i: number, text: string) {
    const copy = [...saps];
    copy[i] = text;
    setSaps(copy);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !technology.trim() || !supervisor.trim()) {
      setError("Please fill in the project title, technology and supervisor name.");
      return;
    }

    // Go through the 3 member rows and keep the filled ones.
    const members: string[] = [];
    const sapIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const name = names[i].trim();
      const sap = saps[i].trim();

      if (name === "" && sap === "") continue; // an empty row is fine, skip it
      if (name === "" || sap === "") {
        setError("Member " + (i + 1) + " needs both a name and a SAP ID.");
        return;
      }
      if (!/^\d+$/.test(sap)) {
        setError("SAP ID of member " + (i + 1) + " must contain only numbers.");
        return;
      }
      if (sapIds.includes(sap)) {
        setError("SAP ID " + sap + " is written twice in this team.");
        return;
      }
      if (existingSapIds.includes(sap)) {
        setError("SAP ID " + sap + " is already in another team.");
        return;
      }
      members.push(name);
      sapIds.push(sap);
    }

    if (members.length === 0) {
      setError("Add at least one team member.");
      return;
    }

    // Everything is correct: give the data to the page that uses this form.
    onSubmit({ title: title.trim(), program, technology: technology.trim(), supervisor: supervisor.trim(), members, sapIds });

    // Empty the form for the next team.
    setTitle("");
    setTechnology("");
    setSupervisor("");
    setNames(["", "", ""]);
    setSaps(["", "", ""]);
    setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Project title" value={title} onChange={setTitle} />
        <div>
          <label htmlFor="team-program" className="mb-1 block text-sm font-semibold">Program</label>
          <select
            id="team-program"
            value={program}
            onChange={(e) => setProgram(e.target.value as Program)}
            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm"
          >
            <option value="BCA">BCA</option>
            <option value="SE">SE</option>
            <option value="CS">CS</option>
          </select>
        </div>
        <Field label="Technology" value={technology} onChange={setTechnology} placeholder="For example React, Node.js" />
        <Field label="Supervisor name" value={supervisor} onChange={setSupervisor} />
      </div>

      {/* Three member rows. Row 1 is required, rows 2 and 3 are optional. */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-4 md:grid-cols-2">
          <Field label={"Member " + (i + 1) + " name"} value={names[i]} onChange={(t) => changeName(i, t)} />
          <Field label={"Member " + (i + 1) + " SAP ID"} value={saps[i]} onChange={(t) => changeSap(i, t)} />
        </div>
      ))}

      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

      <button type="submit" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white">
        {buttonLabel}
      </button>
    </form>
  );
}
