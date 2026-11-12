"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Admin ab database me pehle se seeded hai (scripts/seed-admin.mjs). Is liye ye page band hai.
export default function SetupAdminPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/login"); }, [router]);
  return null;
}
