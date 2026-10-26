import "server-only";

/**
 * Transactional email via Resend (https://resend.com) using its REST API.
 *
 * If `RESEND_API_KEY` is not configured, emails are logged to the server console instead —
 * convenient for local development (copy the verification / reset link from the logs).
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  delivered: "resend" | "console";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MatchLab <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `\n[email:console] (RESEND_API_KEY not set)\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.text}\n`
    );
    return { ok: true, delivered: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo || process.env.EMAIL_REPLY_TO
          ? { reply_to: input.replyTo || process.env.EMAIL_REPLY_TO }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error", res.status, body);
      return { ok: false, error: `Resend ${res.status}`, delivered: "resend" };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id, delivered: "resend" };
  } catch (error) {
    console.error("[email] Failed to send email", error);
    return { ok: false, error: String(error), delivered: "resend" };
  }
}
