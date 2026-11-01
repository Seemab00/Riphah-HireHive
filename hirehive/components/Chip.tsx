import { Status } from "@/lib/data";

// A small colored label, like "Approved" or "Pending".
const styles = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  teal: "bg-soft text-brand",
};

// Pick the chip color that belongs to a status: Approved = green, Rejected = red, Pending = yellow.
export function statusColor(status: Status): keyof typeof styles {
  if (status === "Approved") return "green";
  if (status === "Rejected") return "red";
  return "yellow";
}

export default function Chip({
  color,
  children,
}: {
  color: keyof typeof styles; // only "green" | "yellow" | "red" | "blue" | "teal" are allowed
  children: React.ReactNode;
}) {
  return (
    <span className={"inline-block rounded-full px-3 py-1 text-xs font-semibold " + styles[color]}>
      {children}
    </span>
  );
}
