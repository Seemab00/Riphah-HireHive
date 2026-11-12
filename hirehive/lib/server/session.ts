import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "hh_session";
export type Session = { email: string; role: string };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET .env.local me nahi hai (kam az kam 16 characters)");
  return new TextEncoder().encode(s);
}

// Login ke baad signed, HTTP-only cookie (JavaScript isay padh nahi sakta).
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

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { email: String(payload.email), role: String(payload.role) };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}
