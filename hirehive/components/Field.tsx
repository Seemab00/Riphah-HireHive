"use client";

import { useId } from "react";

// One label with one input box under it. Every form in the project uses this.
// "onChange" gives you the new text, so you can write: onChange={(text) => setName(text)}
export default function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  hint = "",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean; // true = a bigger box for long text
}) {
  const id = useId(); // a unique id, so the label is connected to its input
  const style = "w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm";

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={style} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={style} />
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
