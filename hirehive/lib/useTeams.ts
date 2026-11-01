"use client";

import { KEYS, Status, Team } from "./data";
import { useStore } from "./useStore";

// Gives a page the list of teams plus the functions to add, approve, reject and delete.
export function useTeams() {
  const [teams, setTeams, loaded] = useStore<Team[]>(KEYS.teams, []);

  // Add a new team. The id is the current time in milliseconds, so it is always different.
  // New teams are "Pending" unless we say otherwise.
  function addTeam(data: Omit<Team, "id" | "status">, status: Status = "Pending") {
    setTeams([...teams, { ...data, id: Date.now(), status, templateStatuses: data.templateStatuses ?? { Proposal: "Not submitted", "Quarterly report": "Not submitted", "Final report": "Not submitted", Poster: "Not submitted" } }]);
  }

  // Change the status of ONE team.
  function setStatus(id: number, status: Status) {
    setTeams(teams.map((team) => (team.id === id ? { ...team, status: status } : team)));
  }

  // Update fields on one team, including template submission statuses.
  function updateTeam(id: number, changes: Partial<Team>) {
    setTeams(teams.map((team) => team.id === id ? { ...team, ...changes } : team));
  }

  // Delete a team.
  function removeTeam(id: number) {
    setTeams(teams.filter((team) => team.id !== id));
  }

  return { teams, addTeam, setStatus, updateTeam, removeTeam, loaded };
}
