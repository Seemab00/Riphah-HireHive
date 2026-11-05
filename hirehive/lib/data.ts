// ===== Roles =====
// Every account has exactly ONE role. The role decides which dashboard the person can open.
export type Role = "admin" | "fyp" | "student" | "volunteer" | "lab" | "company" | "alumni" | "coordinator";

// The names shown on screen for each role.
export const ROLE_LABELS: Record<Role, string> = {
  fyp: "FYP Student",
  student: "Regular Student",
  volunteer: "Volunteer",
  lab: "Lab Staff",
  company: "Company",
  alumni: "Alumni",
  admin: "Admin",
  coordinator: "Coordinator / Sub-admin",
};

// The order of the options in the sign up list.
export const ROLE_ORDER: Role[] = ["fyp", "student", "volunteer", "lab", "company", "alumni"];

// Students and volunteers are Riphah students, so they must use their SAP email.
// Every other role can use any email.
export const SAP_DOMAIN = "@students.riphah.edu.pk";
export function needsSapEmail(role: Role): boolean {
  return role === "fyp" || role === "student" || role === "volunteer";
}

// ===== Types =====
export type Program = "BCA" | "SE" | "CS";
export type Status = "Pending" | "Approved" | "Rejected";

// One person's account.
export type Account = {
  name: string;               // for a company this is the company name
  email: string;
  password: string;           // saved as plain text ONLY because this is a front end showcase
  role: Role;
  sapId?: string;             // students and volunteers only
  program?: Program;          // students and volunteers only
  volunteerStatus?: Status;   // volunteers only: waiting for the admin, approved or rejected
  placement?: string;         // volunteers only: where the admin placed them
  shift?: string;             // volunteers only: their working time
  cvName?: string;            // file name of the uploaded CV
  cvVisible?: boolean;        // may companies see the CV?
  cvDataUrl?: string;         // prototype-only local CV preview; use private file storage in production
  coordinatorLevel?: "incharge" | "faculty" | "student";
  department?: "SE" | "CA" | "CS" | "All";
  phase?: "FYP1" | "FYP2" | "All";
  volunteerStage?: number;    // 1 student coordinator, 2 faculty coordinator, 3 in-charge, 4 selected, -1 rejected
  volunteerStageDecisions?: string[];
  volunteerExperience?: string;
  taskChecklist?: string[];
};

// One FYP team registration.
export type Team = {
  id: number;
  ownerEmail: string;   // who registered it (the student's email, or "admin")
  title: string;
  program: Program;
  technology: string;
  supervisor: string;   // just a name, the supervisor has no login
  members: string[];
  sapIds: string[];     // same order as members
  status: Status;
  templateStatuses?: Record<string, "Not submitted" | "Submitted" | "Reviewed">;
};

// One LCD request from a team. The lab staff approve it, give the LCD and take it back.
export type LcdRequest = {
  id: number;
  teamId: number;
  teamTitle: string;
  reason: string;
  status: Status;
  issued: boolean;      // true when the LCD was handed to the team
  returned: boolean;    // true when the team gave it back
};

// The open house details that the admin enters. Everyone sees them.
export type EventInfo = { name: string; date: string; venue: string; deadline: string };
export const emptyEvent: EventInfo = { name: "", date: "", venue: "", deadline: "" };

// Feedback written by an alumnus.
export type Feedback = {
  id: number;
  alumniName: string;
  alumniEmail: string;
  rating: number;       // 1 to 5
  comment: string;
  date: string;
};
// Mock interview scheduled with an alumnus.
export type MockInterview = {
  id: number;
  teamId: number;
  alumniEmail: string;
  slot: string;
  meetingLink?: string;
  status: "Scheduled" | "Done";
  score?: number;
  recommendation?: "Ready" | "Needs improvement" | "Not ready";
  comment?: string;
};

// "This company is interested in this team's project."
export type Interest = { company: string; teamId: number };

// The names under which each list is saved in the browser (localStorage).
export const KEYS = {
  accounts: "hirehive_accounts",
  session: "hirehive_session",
  teams: "hirehive_teams",
  lcd: "hirehive_lcd",
  event: "hirehive_event",
  feedback: "hirehive_feedback",
  interests: "hirehive_interests",
  checkins: "hirehive_checkins",
  mockInterviews: "hirehive_mock_interviews",
};
