import { randomBytes } from "crypto";

export type AccountRow = {
  email: string;
  role: string;
  name: string;
  password_hash: string;
  must_change_password: boolean;
  data: Record<string, unknown>;
};

export const cleanEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

// DB row -> front-end Account (password hash kabhi nahi jata).
export function toAccount(r: AccountRow) {
  return { ...r.data, email: r.email, role: r.role, name: r.name, mustChangePassword: r.must_change_password };
}

// Front-end Account -> (email, role, name, baqi fields data me).
export function splitAccount(a: Record<string, any>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, role, name, password, mustChangePassword, currentPassword, ...data } = a;
  return { email: cleanEmail(email), role: String(role ?? ""), name: String(name ?? ""), data };
}

// 10 characters, confusing letters (0/O, 1/l) ke baghair.
export function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function appUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}
