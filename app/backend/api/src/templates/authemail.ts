/* dark-themed transactional emails for the auth flow (OTP + welcome) */

const SHELL_OPEN = `
<div style="background:#0A0A0A;padding:32px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#ECEFE8;">
  <div style="max-width:520px;margin:0 auto;background:#111311;border:1px solid #20241E;border-radius:16px;padding:32px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:26px;">
      <div style="width:24px;height:24px;border-radius:50%;border:2.5px solid #A3E635;display:flex;align-items:center;justify-content:center;">
        <div style="width:8px;height:8px;border-radius:50%;background:#A3E635;"></div>
      </div>
      <span style="font-size:16px;font-weight:700;letter-spacing:-0.01em;">Argus</span>
    </div>`;

const SHELL_CLOSE = `
  </div>
  <div style="max-width:520px;margin:16px auto 0;text-align:center;font-size:11px;color:#565B52;font-family:monospace;">
    Argus · open-source error tracking
  </div>
</div>`;

interface OtpEmailInput {
  otp: string;
}

/* one-time passcode for email verification */
export function buildOtpEmail({ otp }: OtpEmailInput): {
  subject: string;
  html: string;
} {
  const subject = `${otp} is your Argus verification code`;

  const html = `${SHELL_OPEN}
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#A3E635;">
      Verify your email
    </div>
    <h1 style="font-size:20px;line-height:1.4;margin:12px 0 8px;color:#ECEFE8;">
      Confirm it's you
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#99A094;margin:0 0 24px;">
      Enter this code to finish setting up your account. It expires in 10 minutes.
    </p>
    <div style="background:#0A0C09;border:1px solid #20241E;border-radius:12px;padding:20px;text-align:center;">
      <span style="font-family:monospace;font-size:34px;font-weight:700;letter-spacing:0.32em;color:#ECEFE8;padding-left:0.32em;">
        ${otp}
      </span>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#565B52;line-height:1.6;">
      If you didn't request this, you can safely ignore this email — no account will be created without this code.
    </p>
  ${SHELL_CLOSE}`;

  return { subject, html };
}

interface WelcomeEmailInput {
  name: string;
  appUrl: string;
}

/* sent once, right after the email is verified */
export function buildWelcomeEmail({ name, appUrl }: WelcomeEmailInput): {
  subject: string;
  html: string;
} {
  const subject = "Welcome to Argus 🎉";
  const firstName = name?.split(" ")[0] || "there";

  const html = `${SHELL_OPEN}
    <div style="font-family:monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#A3E635;">
      You're in
    </div>
    <h1 style="font-size:22px;line-height:1.35;margin:12px 0 8px;color:#ECEFE8;">
      Welcome, ${firstName} 👋
    </h1>
    <p style="font-size:14px;line-height:1.65;color:#99A094;margin:0 0 20px;">
      Your email is verified and your account is ready. Create a project, drop the
      SDK into your app, and you'll see your first error within minutes.
    </p>
    <div style="background:#0A0C09;border:1px solid #20241E;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:13px;color:#C9CEC3;">
        <span style="color:#A3E635;">1.</span> Create your first project<br/>
        <span style="color:#A3E635;">2.</span> <span style="color:#C9CEC3;">npm install @argusdev/sdk-browser</span><br/>
        <span style="color:#A3E635;">3.</span> Paste your DSN &amp; ship
      </div>
    </div>
    <a href="${appUrl}/projects"
      style="display:inline-block;background:#A3E635;color:#0C0F08;font-weight:700;
      text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;">
      Open your dashboard →
    </a>
    <p style="margin-top:26px;font-size:12px;color:#565B52;line-height:1.6;">
      Questions? Just reply to this email — a human will read it.
    </p>
  ${SHELL_CLOSE}`;

  return { subject, html };
}
