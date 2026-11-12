
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

const COOKIE = "hh_session";

export type Session = { email: string; role: string };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET .env.local me nahi hai (kam az kam 16 characters)");
  }
  return new TextEncoder().encode(s);
}

// Login ke baad signed, HTTP-only cookie.
export async function createSession(email: string, role: string) {
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// JWT verify karne ke baad database se current role confirm hota hai.
export async function getSession(): Promise<Session | null> {
  try {
    const token = cookies().get(COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret());
    const email = String(payload.email ?? "").trim().toLowerCase();

    if (!email) return null;

    const { data, error } = await db()
      .from("accounts")
      .select("email, role")
      .eq("email", email)
      .maybeSingle();

    if (error || !data?.email || !data?.role) return null;

    return {
      email: data.email,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}
