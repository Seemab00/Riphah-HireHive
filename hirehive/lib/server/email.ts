import { db } from "./db";

// Abhi email "outbox" table me save hoti hai (Admin ke Email outbox page par dikhti hai).
// Real email baad me: bas is function ke andar SMTP/Resend ki call jod do, baqi code nahi badlega.
export async function sendEmail(to: string, subject: string, body: string, opts: { link?: string; attachmentName?: string } = {}) {
  const { error } = await db().from("email_outbox").insert({
    to_email: to,
    subject,
    body,
    link: opts.link ?? null,
    attachment_name: opts.attachmentName ?? null,
  });
  if (error) console.error("outbox error:", error.message);
}
