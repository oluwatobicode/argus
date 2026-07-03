interface NewIssueEmailInput {
  projectName: string;
  title: string;
  culprit: string | null;
  level: string;
  issueUrl: string;
}

/* dark-themed HTML email for a NEW_ISSUE alert */
export function buildNewIssueEmail({
  projectName,
  title,
  culprit,
  level,
  issueUrl,
}: NewIssueEmailInput): { subject: string; html: string } {
  const subject = `[Argus] New ${level} in ${projectName}`;

  const html = `
  <div style="background:#0A0A0A;padding:32px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#ECEFE8;">
    <div style="max-width:520px;margin:0 auto;background:#111311;border:1px solid #20241E;border-radius:16px;padding:28px;">
      <div style="font-family:monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#A3E635;">
        New issue · ${projectName}
      </div>
      <h1 style="font-size:18px;line-height:1.4;margin:12px 0 6px;color:#ECEFE8;font-family:monospace;">
        ${title}
      </h1>
      ${
        culprit
          ? `<div style="font-family:monospace;font-size:12px;color:#666B60;">${culprit}</div>`
          : ""
      }
      <a href="${issueUrl}"
        style="display:inline-block;margin-top:22px;background:#A3E635;color:#0C0F08;font-weight:700;
        text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;">
        View issue →
      </a>
      <p style="margin-top:24px;font-size:12px;color:#565B52;">
        You're receiving this because an alert rule fired for ${projectName}.
      </p>
    </div>
  </div>`;

  return { subject, html };
}
