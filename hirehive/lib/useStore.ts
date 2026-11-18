"use client";

import { useEffect, useRef, useState } from "react";

// Usage remains unchanged: const [value, update, loaded] = useStore<T>(key, initial).
// Data is now stored in the database instead of the browser: GET/PUT /api/data/[key].
//
// To use the local demo fallback when offline, set NEXT_PUBLIC_STORE_MODE=local in .env.local.
// The store will then use localStorage as before.
const LOCAL = process.env.NEXT_PUBLIC_STORE_MODE === "local";

export function useStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (LOCAL) {
          const saved = localStorage.getItem(key);
          if (saved && !cancelled) setValue(JSON.parse(saved) as T);
        } else {
          const res = await fetch(`/api/data/${key}`, { cache: "no-store" });
          if (res.ok) {
            const { value: v } = await res.json();
            if (v !== null && v !== undefined && !cancelled) setValue(v as T);
          }
          // On 401 (not signed in) or another error, keep the initial value and avoid crashing the page.
        }
      } catch (e) {
        console.error("useStore load failed:", key, e);
      }
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, [key]);

  // Update the page immediately (optimistically), then save to the database.
  function update(next: T) {
    setValue(next);
    if (LOCAL) {
      localStorage.setItem(key, JSON.stringify(next));
      return;
    }
    fetch(`/api/data/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: next }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = (await res.json().catch(() => ({}))).error ?? res.statusText;
          console.error("useStore save failed:", key, msg);
          // If saving fails, restore the database value so the UI remains accurate.
          const back = await fetch(`/api/data/${key}`, { cache: "no-store" });
          if (back.ok) { const { value: v } = await back.json(); setValue((v ?? initialRef.current) as T); }
        }
      })
      .catch((e) => console.error("useStore save failed:", key, e));
  }

  return [value, update, loaded] as const;
}
