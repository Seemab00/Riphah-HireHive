"use client";

import { useEffect, useState } from "react";

// A "hook" is reusable page logic. This one works like useState, but it also
// saves the value in the browser (localStorage), so the data is still there after a refresh
// and every page can read it.
//
// Usage:  const [teams, setTeams, loaded] = useStore<Team[]>("hirehive_teams", []);
//   teams    -> the current value
//   setTeams -> call it with a new value to change AND save it
//   loaded   -> false for a split second, then true once the saved data was read
export function useStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  // When the page opens, read the saved value (if there is one).
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setValue(JSON.parse(saved) as T);
    setLoaded(true);
  }, [key]);

  // Change the value on the page and save it in the browser.
  function update(next: T) {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return [value, update, loaded] as const;
}
