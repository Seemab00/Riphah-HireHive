import { Team } from "@/lib/data";

// The printed tag that is placed on a team's table.
export default function TagCard({ team, tableNumber }: { team: Team; tableNumber: number }) {
  return (
    <div className="w-full max-w-md rounded-xl border-2 border-brand bg-white p-6">
      <p className="text-sm text-muted">Table number</p>
      <p className="text-6xl font-bold text-brand">{String(tableNumber).padStart(2, "0")}</p>

      <h3 className="mt-3 text-xl font-bold">{team.title}</h3>
      <p className="mt-1 text-sm text-muted">
        {team.program} · {team.technology}
      </p>

      <p className="mt-3 text-sm">
        <b>Supervisor:</b> {team.supervisor}
      </p>
      <p className="mt-1 text-sm">
        <b>Team:</b>{" "}
        {/* Shows "Ali Khan (54910), Sara Ahmed (54911)" */}
        {team.members.map((name, i) => name + " (" + team.sapIds[i] + ")").join(", ")}
      </p>
    </div>
  );
}
