import { Account, KEYS, Role } from "./data";

// This is a MOCK account system for the showcase.
// Accounts are saved in the browser (localStorage). The real backend will replace this later.
// IMPORTANT: every function here must run in the browser (inside a click handler or useEffect).

// Emails are compared in lower case, so "Ali@x.com" and "ali@x.com" are the same account.
function clean(email: string): string {
  return email.trim().toLowerCase();
}

// Read all accounts.
export function getAccounts(): Account[] {
  const text = localStorage.getItem(KEYS.accounts);
  return text ? (JSON.parse(text) as Account[]) : [];
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem(KEYS.accounts, JSON.stringify(accounts));
}

// Create a new account and log it in.
// Returns an error message, or null when everything went well.
export function register(account: Account): string | null {
  const accounts = getAccounts();
  const email = clean(account.email);

  // One email can have only ONE account (and so only ONE role).
  const existing = accounts.find((a) => clean(a.email) === email);
  if (existing) {
    return "This email is already registered as " + existing.role + ". Please sign in.";
  }

  // Volunteers must wait for the admin to approve them.
  const newAccount: Account = {
    ...account,
    email: email,
    volunteerStatus: account.role === "volunteer" ? "Pending" : undefined,
    volunteerStage: account.role === "volunteer" ? 1 : account.volunteerStage,
    volunteerStageDecisions: account.role === "volunteer" ? ["Pending", "Pending", "Pending"] : account.volunteerStageDecisions,
  };
  saveAccounts([...accounts, newAccount]);
  localStorage.setItem(KEYS.session, email); // log in
  return null;
}

// Check the email and password. The ROLE comes from the account, nobody can choose it.
export function login(emailText: string, password: string): { error?: string; account?: Account } {
  const email = clean(emailText);
  const account = getAccounts().find((a) => clean(a.email) === email);

  if (!account) return { error: "No account found with this email. Please create an account first." };
  if (account.password !== password) return { error: "Wrong password." };

  localStorage.setItem(KEYS.session, email); // log in
  return { account: account };
}

// Who is logged in right now? Returns null when nobody is.
export function getUser(): Account | null {
  const email = localStorage.getItem(KEYS.session);
  if (!email) return null;
  return getAccounts().find((a) => clean(a.email) === email) ?? null;
}

// Log out.
export function logout() {
  localStorage.removeItem(KEYS.session);
}

// Change some fields of one account, for example { cvName: "my-cv.pdf" }.
export function updateAccount(email: string, changes: Partial<Account>) {
  const target = clean(email);
  saveAccounts(getAccounts().map((a) => (clean(a.email) === target ? { ...a, ...changes } : a)));
}

// Every role has its own home page.
export function homeFor(role: Role): string {
  return role === "coordinator" ? "/coordinator" : "/" + role; // each role has its own dashboard
}
