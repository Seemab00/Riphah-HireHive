import { Program, Team } from "./data";

// Each program has its own range of table numbers (continuous, no repeats).
//   BCA: 1 to 8     SE: 9 to 18     CS: from 19
// "start" is the first table number, "max" is how many tables the program can have.
export const RANGES: Record<Program, { start: number; max: number; label: string }> = {
  BCA: { start: 1, max: 8, label: "1 to 8" },
  SE: { start: 9, max: 10, label: "9 to 18" },
  CS: { start: 19, max: 20, label: "From 19" },
};

// The programs in the order we number them.
export const PROGRAMS: Program[] = ["BCA", "SE", "CS"];

// Gives a table number to every APPROVED team.
// Result looks like { 4: 1, 1: 9 }, meaning "team 4 -> table 1, team 1 -> table 9".
export function assignTables(teams: Team[]): Record<number, number> {
  const result: Record<number, number> = {};

  for (const program of PROGRAMS) {
    // 1. Take only the approved teams of this program.
    const approved = teams.filter((t) => t.program === program && t.status === "Approved");

    // 2. Give them numbers one by one, starting from the program's first number.
    approved.forEach((team, index) => {
      // If the program ran out of tables, this team gets no number.
      if (index < RANGES[program].max) {
        result[team.id] = RANGES[program].start + index;
      }
    });
  }

  return result;
}
