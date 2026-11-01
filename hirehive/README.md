# Riphah HireHive — enhanced front-end prototype

Next.js 14 + React 18 + TypeScript + Tailwind CSS. This package extends the existing front-end showcase and reuses its existing dependencies and browser-local data model.

## Run locally
1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm install` (requires access to the npm registry).
4. Run `npm run dev`.
5. Open http://localhost:3000.

## First-run demo setup
1. Open `/setup-admin` and create the initial Admin account using `tazzaina.malik@riphah.edu.pk` and the temporary password supplied for your demo (for example, `Tazzaina_987`).
2. Sign in and use the Admin sidebar to open Staff / coordinators, Volunteer selection, AI team suggestions, and QR check-in design.
3. Create coordinator accounts with an assigned level, department, phase, email, and temporary password. The app does not send email automatically.
4. Register sample students, FYP teams, volunteers, companies, and lab staff to test the workflows.

## Added / updated prototype features
- Public signup no longer offers the Admin role; first-run Admin setup is separate.
- Role-based dashboards remain available for FYP students, regular students, volunteers, companies, lab staff, and alumni. Coordinator/sub-admin accounts have their own dashboard.
- Admin can create coordinator accounts with a level, department, and phase.
- Student/FYP profile editing and CV upload/visibility controls. The demo stores CV files (up to 2 MB) as browser-local data URLs, and companies can see only CVs whose owner enabled visibility.
- FYP team registration/approval and template submission status tracking for Proposal, Quarterly Report, Final Report, and Poster.
- Transparent rules-based team suggestion prototype (not a live AI model).
- Volunteer selection workflow: FYP Student Coordinator → Faculty Coordinator → Primary FYP Incharge/Admin final decision; status and stage decisions are tracked.
- Selection email is prepared through a `mailto:` link; the app does not send email by itself.
- Existing event setup, table allocation, printable tags, and LCD request/issue/return reporting are retained.
- QR check-in design page supports manual demo check-in only; it does not scan or validate actual QR codes.

## Important limitations — not production ready
- Authentication, accounts, roles, teams, and CV data are stored in browser `localStorage`. Passwords are not securely hashed and there is no server-side authorization or database. Do not use this prototype with real credentials or sensitive CVs.
- Department and role restrictions are UI-level demo restrictions, not server-enforced security.
- No actual email delivery, password reset, email verification, AI API, camera QR scanning, mobile app, WhatsApp integration, or production file storage is implemented.
- First-run Admin setup is only for this browser demo; it is not a secure production provisioning mechanism.
- Data exists only in the browser/profile where it was entered. Clearing browser storage deletes it.

## Main folders
- `app/`: role dashboards and admin modules
- `components/`: shared UI components
- `lib/data.ts`: role types, records, and storage keys
- `lib/auth.ts`: prototype localStorage authentication
- `lib/useStore.ts`: localStorage-backed React state
- `lib/useTeams.ts`: team registration and status helpers
- `lib/tables.ts`: table allocation rules

## Suggested production work still required
Use a server-side authentication provider or API, hashed passwords, secure sessions, database-backed records, private CV storage, server-enforced role/department authorization, configured email delivery, audit logs, and a real signed QR workflow before production deployment.
