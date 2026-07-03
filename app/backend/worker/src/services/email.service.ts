import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "Argus <noreply@argus.dev>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    /* no key in dev → surface a clear error the alert engine logs to AlertLog */
    throw new Error("RESEND_API_KEY not set");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
  return data;
}
