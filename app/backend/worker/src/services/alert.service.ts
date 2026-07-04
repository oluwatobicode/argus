import { prisma } from "../config/db.config";
import { sendEmail } from "./email.service";
import { buildNewIssueEmail, buildErrorRateEmail } from "../templates/alertemail";

interface NewIssue {
  id: string;
  projectId: string;
  title: string;
  culprit: string | null;
  level: string;
  firstSeen: Date;
}

/*
 * NEW_ISSUE — fired when an issue is seen for the first time.
 * Best-effort: failures are logged (console + AlertLog), never thrown.
 */
export async function evaluateNewIssue(issue: NewIssue): Promise<void> {
  try {
    const rules = await prisma.alertRule.findMany({
      where: { projectId: issue.projectId, enabled: true, type: "NEW_ISSUE" },
    });
    if (rules.length === 0) return;

    const projectName = await getProjectName(issue.projectId);
    const issueUrl = `${frontend()}/projects/${issue.projectId}/issues/${issue.id}`;

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
          postWebhook(url, { type: "new_issue", projectName, issue, issueUrl }),
        );
      }

      if (triggered) await touch(rule.id);
    }
  } catch (err) {
    console.error("[alerts] new-issue evaluation failed:", err);
  }
}

/*
 * ERROR_RATE — fired when events in the last `windowMinutes` cross `threshold`.
 * Runs on every event; a cooldown (one window) stops it re-firing each event.
 */
export async function evaluateErrorRate(projectId: string): Promise<void> {
  try {
    const rules = await prisma.alertRule.findMany({
      where: { projectId, enabled: true, type: "ERROR_RATE" },
    });
    if (rules.length === 0) return;

    const now = Date.now();
    let projectName: string | null = null;
    const issuesUrl = `${frontend()}/projects/${projectId}/issues`;

    for (const rule of rules) {
      const windowMinutes = rule.windowMinutes ?? 5;
      const threshold = rule.threshold ?? 100;
      const windowMs = windowMinutes * 60_000;

      /* cooldown: don't re-fire within one window of the last trigger */
      if (rule.lastTriggeredAt && now - rule.lastTriggeredAt.getTime() < windowMs) {
        continue;
      }

      const since = new Date(now - windowMs);
      const count = await prisma.event.count({
        where: { projectId, receivedAt: { gte: since } },
      });
      if (count < threshold) continue;

      projectName ??= await getProjectName(projectId);
      let triggered = false;

      if (rule.notifyEmail) {
        const email = rule.notifyEmail;
        triggered = true;
        await deliver(rule.id, null, "email", email, () => {
          const { subject, html } = buildErrorRateEmail({
            projectName: projectName!,
            count,
            windowMinutes,
            threshold,
            issuesUrl,
          });
          return sendEmail({ to: email, subject, html });
        });
      }

      if (rule.webhookUrl) {
        const url = rule.webhookUrl;
        triggered = true;
        await deliver(rule.id, null, "webhook", url, () =>
          postWebhook(url, {
            type: "error_rate",
            projectName,
            count,
            windowMinutes,
            threshold,
            issuesUrl,
          }),
        );
      }

      if (triggered) await touch(rule.id);
    }
  } catch (err) {
    console.error("[alerts] error-rate evaluation failed:", err);
  }
}

/* ---- helpers ---- */

const frontend = () => process.env.FRONTEND_URL ?? "";

async function getProjectName(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  return project?.name ?? "your project";
}

function touch(ruleId: string) {
  return prisma.alertRule.update({
    where: { id: ruleId },
    data: { lastTriggeredAt: new Date() },
  });
}

async function deliver(
  alertRuleId: string,
  issueId: string | null,
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
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } finally {
    clearTimeout(timeout);
  }
}
