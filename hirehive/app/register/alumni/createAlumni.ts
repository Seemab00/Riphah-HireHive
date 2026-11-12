import { register, logout } from "@/lib/auth";
import { AlumniAccount } from "@/app/alumni/mockInterview";

// ============================================================
// THE ONLY PLACE that talks to the "account system" for alumni registration.
//
// TODAY: it uses the browser account system (lib/auth.ts).
// TUESDAY (after Simaab finishes POST /api/onboard): replace the inside of
// createAlumniAccount with ONE fetch call to /api/onboard. The form page does not change.
// ============================================================

export type AlumniForm = {
  name: string;
  email: string;
  company: string;
  designation: string;
  contact: string;
  program?: "BCA" | "SE" | "CS";
  graduationYear?: string;
  attendedBefore?: "Yes" | "No";
};

// A random password like "Kp7mXq3Rzt". Letters that look alike (0 O, 1 l I) are left out.
export function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const random = new Uint32Array(length);
  crypto.getRandomValues(random);
  return Array.from(random, (n) => chars[n % chars.length]).join("");
}

// Creates the alumni account. Returns { error } or { password }.
export async function createAlumniAccount(form: AlumniForm): Promise<{ error?: string; password?: string }> {
  const password = generatePassword();

  const account: AlumniAccount = {
    name: form.name,
    email: form.email,
    password: password,
    role: "alumni",
    program: form.program,
    company: form.company,
    designation: form.designation,
    contact: form.contact,
    graduationYear: form.graduationYear,
    attendedBefore: form.attendedBefore,
  };

  const problem = register(account); // "register" also logs the new person in...
  if (problem) return { error: problem };

  logout(); // ...but the plan says: they get an email and then log in themselves. So log out again.
  return { password: password };
}
