
import { db } from "@/lib/server/db";

type GroupNotificationInput = {
  actorEmail: string;
  department: string;
  phase: string;
  groupName: string;
  title: string;
  message: string;
  relatedType: "document" | "progress";
  relatedId: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function notifyFypGroupMembers({
  actorEmail,
  department,
  phase,
  groupName,
  title,
  message,
  relatedType,
  relatedId,
}: GroupNotificationInput) {
  const database = db();

  const { data: accounts, error: accountsError } = await database
    .from("accounts")
    .select("email, role, data")
    .eq("role", "fyp");

  if (accountsError) throw accountsError;

  const actor = clean(actorEmail).toLowerCase();

  const recipients = (accounts || []).filter((account) => {
    const details = (account.data || {}) as Record<string, unknown>;

    return (
      clean(account.email).toLowerCase() !== actor &&
      clean(details.department) === department &&
      clean(details.phase) === phase &&
      clean(details.groupName) === groupName
    );
  });

  if (recipients.length === 0) return 0;

  const rows = recipients.map((account) => ({
    recipient_email: account.email,
    department,
    phase,
    group_name: groupName,
    title,
    message,
    related_type: relatedType,
    related_id: relatedId,
  }));

  const { error: insertError } = await database
    .from("fyp_group_notifications")
    .insert(rows);

  if (insertError) throw insertError;

  return recipients.length;
}
