import { Account, Role } from "./data";

// Login is handled on the server (/api/auth/*), with bcrypt password hashing and a signed HTTP-only cookie.
// The browser keeps only a password-free session cache so existing pages that use synchronous
// getUser() can continue working without changes.
// Actual security is enforced on the server; changing the cache does not grant API access.

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

// Some pages need the full account list rather than the cached user. Read accounts with useStore(KEYS.accounts).
export function getAccounts(): Account[] {
  const u = readCache();
  return u ? [u] : [];
}

// Create an account through open signup (student, lab, or volunteer only). Returns an error message or null.
export async function register(account: Account): Promise<string | null> {
  const { ok, json } = await post("/api/auth/register", account);
  if (!ok) return json.error ?? "Could not create the account.";
  writeCache(json.account);
  return null;
}

// Email and password are checked on the server. The account determines the role.
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

// Check the server-side session and refresh the cache. RoleGuard uses this function.
export async function refreshUser(): Promise<Account | null> {
  if (LOCAL) return readCache();
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const { account } = await res.json();
    writeCache(account ?? null);
    return (account as Account) ?? null;
  } catch {
    return readCache(); // Fall back to the cache when offline.
  }
}

export function logout() {
  writeCache(null);
  fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => {});
}

// Update the account on the server, then refresh the local cache.
// Password badalna ho to { password, currentPassword }. Error message ya null.
export async function updateAccount(
  email: string,
  changes: Partial<Account> & { currentPassword?: string }
): Promise<string | null> {
  const mine = readCache();

  try {
    const { ok, json } = await post("/api/auth/me", changes, "PATCH");

    if (!ok) {
      return json.error ?? "Could not save.";
    }

    if (json.account) {
      writeCache(json.account);
    } else if (
      mine &&
      mine.email.toLowerCase() === email.trim().toLowerCase()
    ) {
      const { password, currentPassword, email: _e, ...visible } =
        changes as Record<string, unknown>;

      writeCache({ ...mine, ...visible } as Account);
    }

    return null;
  } catch {
    return "Could not save. Please check your connection and try again.";
  }
}

// Every role has its own home page.
export function homeFor(role: Role): string {
  return role === "coordinator" ? "/coordinator" : "/" + role;
}
