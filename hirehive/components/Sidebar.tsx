"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import Logo from "./Logo";

// The admin pages. Add a new line here when a new admin page is ready.
const links = [
  { label: "Dashboard", href: "/admin" },
  { label: "Registrations", href: "/admin/registrations" },
  { label: "Volunteers", href: "/admin/volunteers" },
  { label: "Volunteer selection", href: "/admin/volunteer-selection" },
  { label: "Staff / coordinators", href: "/admin/staff" },
  { label: "AI team suggestions", href: "/admin/ai-recommendations" },
  { label: "QR check-in design", href: "/admin/checkin" },
  { label: "My profile", href: "/profile" },
  { label: "Tables and tags", href: "/admin/tables" },
  { label: "LCD report", href: "/admin/lcd" },
  { label: "Event setup", href: "/admin/event" },
  { label: "Alumni feedback", href: "/admin/feedback" },
  { label: "Email outbox", href: "/admin/outbox" },
];

// The teal menu on the left side of every admin page.
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    // "print:hidden" hides the sidebar when we print the table tags.
    <aside className="flex w-60 shrink-0 flex-col bg-brand px-4 py-6 text-white print:hidden">
      <div className="mb-6 px-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              "rounded-lg px-3 py-3 text-sm font-semibold " +
              (pathname === link.href ? "bg-accent text-ink" : "text-white")
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* mt-auto pushes the logout button to the bottom */}
      <button onClick={handleLogout} className="mt-auto rounded-lg px-3 py-3 text-left text-sm font-semibold underline">
        Log out
      </button>
    </aside>
  );
}
