import { Account, Role } from "./data";

// Login ab server par hota hai (/api/auth/*): password bcrypt se hash, aur signed HTTP-only cookie.
// Browser me sirf "session cache" rehta hai (account bina password ke) taake purane pages
// jo getUser() sync istemal karte hain, bina badle chalte rahein.
// Asli security server par hai: cache badalne se API ka access nahi milta.

const CACHE = "hirehive_session_user";
const LOCAL = process.env.NEXT_PUBLIC_STORE_MODE === "local";

function readCache(): Account | null {
  try {
    const text = localStorage.getItem(CACHE);
    return text ? (JSON.parse(text) as Account) : null;
  } catch {
    return null;
  }
}
function writeCache(a: Account | null) {
  if (a) localStorage.setItem(CACHE, JSON.stringify(a));
  else localStorage.removeItem(CACHE);
}

async function post(url: string, body?: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

// Kuch pages ko purani list chahiye thi (sirf cache wala user). Ab accounts useStore(KEYS.accounts) se lo.
export function getAccounts(): Account[] {
  const u = readCache();
  return u ? [u] : [];
}

// Naya account (sirf student / lab / volunteer open signup). Error message ya null.
export async function register(account: Account): Promise<string | null> {
  const { ok, json } = await post("/api/auth/register", account);
  if (!ok) return json.error ?? "Could not create the account.";
  writeCache(json.account);
  return null;
}

// Email + password server par check hote hain. Role account se aata hai.
export async function login(emailText: string, password: string): Promise<{ error?: string; account?: Account }> {
  const { ok, json } = await post("/api/auth/login", { email: emailText, password });
  if (!ok) return { error: json.error ?? "Could not sign in." };
  writeCache(json.account);
  return { account: json.account as Account };
}

// Sync, cache se (purane pages ke liye).
export function getUser(): Account | null {
  return readCache();
}

// Server se asli haal (cookie valid hai ya nahi) aur cache refresh. RoleGuard isay istemal karta hai.
export async function refreshUser(): Promise<Account | null> {
  if (LOCAL) return readCache();
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const { account } = await res.json();
    writeCache(account ?? null);
    return (account as Account) ?? null;
  } catch {
    return readCache(); // internet nahi: cache par chalao
  }
}

export function logout() {
  writeCache(null);
  fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
}

// Apna profile badlo, e.g. { cvName: "cv.pdf" }. Cache foran badalta hai, server par save background me.
// Password badalna ho to { password, currentPassword }. Error message ya null.
export async function updateAccount(email: string, changes: Partial<Account> & { currentPassword?: string }): Promise<string | null> {
  const mine = readCache();
  if (mine && mine.email.toLowerCase() === email.trim().toLowerCase()) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, currentPassword, email: _e, ...visible } = changes as Record<string, unknown>;
    writeCache({ ...mine, ...visible } as Account);
  }
  const { ok, json } = await post("/api/auth/me", changes, "PATCH");
  if (!ok) return json.error ?? "Could not save.";
  if (json.account) writeCache(json.account);
  return null;
}

// Every role has its own home page.
export function homeFor(role: Role): string {
  return role === "coordinator" ? "/coordinator" : "/" + role;
}
