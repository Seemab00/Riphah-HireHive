import { Resend } from "resend";
import { db } from "./db";

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  opts: { link?: string; attachmentName?: string } = {}
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Resend email configuration is missing.");
  }

  const { error: outboxError } = await db().from("email_outbox").insert({
    to_email: to,
    subject,
    body,
    link: opts.link ?? null,
    attachment_name: opts.attachmentName ?? null,
  });

  if (outboxError) {
    throw new Error(`Email outbox error: ${outboxError.message}`);
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
