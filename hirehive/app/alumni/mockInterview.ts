import { Account, Team } from "@/lib/data";

// ============================================================
// Wafa's shared helpers for the mock interview + alumni parts.
//
// The 3 types below are EXACTLY the ones from the plan document.
// Simaab will also add them to lib/data.ts. Until then we keep our own copy here,
// so our pages compile today. Same names + same shape = nothing breaks later.
// (After Simaab's lib/data.ts has them, you may import them from there instead.)
// ============================================================

// Admin makes this (key: hirehive_interview_session)
export type InterviewSession = { date: string; venue: string; slotMinutes: number; slots: string[] };
export const emptySession: InterviewSession = { date: "", venue: "", slotMinutes: 15, slots: [] };

// Alumni books this (key: hirehive_mock_interviews). One record per booking.
export type MockInterview = {
  id: number;
  teamId: number;
  studentSap: string;
  studentName: string;
  alumniEmail: string;
  alumniName: string;
  slot: string; // e.g. "10:15"
  status: "Booked" | "Done";
  technical?: number; // 1 to 5
  communication?: number; // 1 to 5
  projectExplanation?: number; // 1 to 5
  recommendation?: "Ready" | "Needs improvement" | "Not ready";
  comment?: string;
};

// Admin's final decision (key: hirehive_clearance), by studentSap
export type Clearance = Record<string, "Cleared" | "Not cleared">;

// The names under which the lists are saved.
export const MOCK_KEYS = {
  session: "hirehive_interview_session",
  interviews: "hirehive_mock_interviews",
  clearance: "hirehive_clearance",
};

export const RECOMMENDATIONS: NonNullable<MockInterview["recommendation"]>[] = ["Ready", "Needs improvement", "Not ready"];

// Extra things an alumnus tells us when registering.
// They are saved inside the normal Account. (Ask Simaab to add these optional fields
// to the Account type in lib/data.ts. Until then we use this type.)
export type AlumniAccount = Account & {
  company?: string;
  designation?: string;
  contact?: string;
  graduationYear?: string;
  attendedBefore?: "Yes" | "No";
};

// Only teams that the Admin SELECTED can be interviewed.
// The old front end called this status "Approved", the new plan calls it "Selected". Both work.
export function isSelectedTeam(team: Team): boolean {
  const status = team.status as string;
  return status === "Selected" || status === "Approved";
}

// RULE 7: one slot can be booked only once. A booked slot (Booked or Done) is taken.
// If ma'am wants several alumni to interview at the same time, change ONLY this function.
export function slotTaken(interviews: MockInterview[], slot: string): boolean {
  return interviews.some((i) => i.slot === slot);
}

// Opens a CV that is saved as a data URL. (Browsers block opening data: links directly,
// so we turn it into a temporary file link first.)
export async function openCv(dataUrl: string, fileName: string) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const url = URL.createObjectURL(blob);
    const isPdf = blob.type === "application/pdf";
    if (isPdf) {
      window.open(url, "_blank");
    } else {
      // Word files cannot be shown in the browser, so they download.
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "CV";
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    window.alert("Could not open this CV.");
  }
}
