// The HireHive logo: an amber hexagon with a teal dot, plus the name.
// Props: "dark" is true when the logo sits on a light background.
export default function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <path d="M15 2l11 6.5v13L15 28 4 21.5v-13z" fill="#F2A900" />
        <circle cx="15" cy="15" r="5" fill="#0B5C6B" />
      </svg>
      <span className={"text-lg font-bold " + (dark ? "text-ink" : "text-white")}>HireHive</span>
    </div>
  );
}
