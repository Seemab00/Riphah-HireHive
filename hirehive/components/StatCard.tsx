// A small box with a label and a big number, like "Tables assigned 09".
export default function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      {/* padStart(2, "0") turns 5 into "05" so numbers look like the mood board */}
      <p className="text-4xl font-bold text-brand">{String(value).padStart(2, "0")}</p>
    </div>
  );
}
