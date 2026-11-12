"use client";

import { useEffect, useRef, useState } from "react";

// Pehle jaisa hi: const [value, update, loaded] = useStore<T>(key, initial);
// Ab data browser me nahi, database me hai: GET/PUT /api/data/[key].
//
// Internet na ho ya demo fallback chahiye to .env.local me NEXT_PUBLIC_STORE_MODE=local likho:
// tab purani localStorage wali tarah chalta hai.
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
          // 401 (login nahi) ya error: initial value rehti hai, page crash nahi hota.
        }
      } catch (e) {
        console.error("useStore load failed:", key, e);
      }
      if (!cancelled) setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, [key]);

  // Page par foran badlo (optimistic), phir database me save karo.
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
          // Save fail hua to database wali asli value wapas lao, taake screen jhooth na bole.
          const back = await fetch(`/api/data/${key}`, { cache: "no-store" });
          if (back.ok) { const { value: v } = await back.json(); setValue((v ?? initialRef.current) as T); }
        }
      })
      .catch((e) => console.error("useStore save failed:", key, e));
  }

  return [value, update, loaded] as const;
}
