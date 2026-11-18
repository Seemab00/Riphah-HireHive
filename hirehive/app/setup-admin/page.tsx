"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Admin account is already seeded in the database (scripts/seed-admin.mjs), so this page is disabled.
export default function SetupAdminPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/login"); }, [router]);
  return null;
}
