import { prisma } from "../config/db.config";
import { sendEmail } from "./email.service";
import { buildNewIssueEmail } from "../templates/alertemail";

interface NewIssue {
  id: string;
  projectId: string;
  title: string;
  culprit: string | null;
  level: string;
  firstSeen: Date;
}

/*
 * Fired from the processor when an issue is seen for the first time.
 * Loads NEW_ISSUE rules for the project and delivers via email + webhook.
 * Best-effort: every failure is logged (console + AlertLog) but never thrown —
 * an alert problem must not fail event processing.
 */
export async function evaluateNewIssue(issue: NewIssue): Promise<void> {
  try {
    const rules = await prisma.alertRule.findMany({
      where: { projectId: issue.projectId, enabled: true, type: "NEW_ISSUE" },
    });
    if (rules.length === 0) return;

    const project = await prisma.project.findUnique({
      where: { id: issue.projectId },
      select: { name: true },
    });
    const projectName = project?.name ?? "your project";
    const issueUrl = `${process.env.FRONTEND_URL ?? ""}/projects/${issue.projectId}/issues/${issue.id}`;

    for (const rule of rules) {
      let triggered = false;

      if (rule.notifyEmail) {
        const email = rule.notifyEmail;
        triggered = true;
        await deliver(rule.id, issue.id, "email", email, () => {
          const { subject, html } = buildNewIssueEmail({
            projectName,
            title: issue.title,
            culprit: issue.culprit,
            level: issue.level,
            issueUrl,
          });
          return sendEmail({ to: email, subject, html });
        });
      }

      if (rule.webhookUrl) {
        const url = rule.webhookUrl;
        triggered = true;
        await deliver(rule.id, issue.id, "webhook", url, () =>
          postWebhook(url, { projectName, issue, issueUrl }),
        );
      }

      if (triggered) {
        await prisma.alertRule.update({
          where: { id: rule.id },
          data: { lastTriggeredAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error("[alerts] evaluation failed:", err);
  }
}

async function deliver(
  alertRuleId: string,
  issueId: string,
  channel: string,
  target: string,
  send: () => Promise<unknown>,
): Promise<void> {
  try {
    await send();
    await prisma.alertLog.create({
      data: { alertRuleId, issueId, channel, target, success: true },
    });
    console.log(`🔔 alert sent (${channel} → ${target})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.alertLog.create({
      data: { alertRuleId, issueId, channel, target, success: false, error: message },
    });
    console.error(`[alerts] ${channel} delivery failed:`, message);
  }
}

async function postWebhook(url: string, payload: unknown): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "new_issue", ...(payload as object) }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}
