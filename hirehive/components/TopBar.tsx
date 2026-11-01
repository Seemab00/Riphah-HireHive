"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import Logo from "./Logo";

// The teal bar at the top of the student, company and volunteer pages.
// "links" is the list of menu items, for example [{ label: "My project", href: "/student" }].
export default function TopBar({ links }: { links: { label: string; href: string }[] }) {
  const pathname = usePathname(); // the address we are on now, like "/student"
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between bg-brand px-6 py-4 text-white md:px-12">
      <Logo />
      <nav className="flex items-center gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            // The page we are on gets the amber background.
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold " +
              (pathname === link.href ? "bg-accent text-ink" : "text-white")
            }
          >
            {link.label}
          </Link>
        ))}
        <Link href="/profile" className="rounded-lg px-4 py-2 text-sm font-semibold text-white">My profile</Link>
        <button onClick={handleLogout} className="rounded-lg px-4 py-2 text-sm font-semibold underline">
          Log out
        </button>
      </nav>
    </header>
  );
}
