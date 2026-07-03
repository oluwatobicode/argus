export interface Envelope<T> {
  statusCode: number;
  status: "success" | "failed";
  message: string;
  data?: T;
  error?: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type Level = "FATAL" | "ERROR" | "WARNING" | "INFO" | "DEBUG";
export type IssueStatus = "UNRESOLVED" | "RESOLVED" | "IGNORED";
export type Plan = "FREE" | "PRO";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
}

export interface Usage {
  plan: Plan;
  used: number;
  limit: number;
  month: string;
  breakdown: { errors: number; warnings: number; info: number };
}

export type AlertType = "NEW_ISSUE" | "ERROR_RATE";

export interface AlertRule {
  id: string;
  projectId: string;
  name: string;
  type: AlertType;
  threshold: number | null;
  windowMinutes: number | null;
  notifyEmail: string | null;
  webhookUrl: string | null;
  enabled: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertInput {
  name: string;
  notifyEmail?: string;
  webhookUrl?: string;
  enabled?: boolean;
}

export interface StackFrame {
  filename: string;
  function?: string;
  lineno: number;
  colno?: number;
}

export interface Issue {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  culprit: string | null;
  status: IssueStatus;
  level: Level;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueEvent {
  id: string;
  issueId: string;
  projectId: string;
  level: Level;
  message: string;
  stacktrace: { frames: StackFrame[] } | null;
  contexts: {
    browser?: { name: string; version: string };
    os?: { name: string; version: string };
  } | null;
  tags: Record<string, string> | null;
  userContext: { id?: string; email?: string } | null;
  request: { url?: string; method?: string } | null;
  timestamp: string;
  receivedAt: string;
}

export type IssueDetail = Issue & { events: IssueEvent[] };

export interface IssuesResponse {
  issues: Issue[];
  pagination: Pagination;
}

export interface EventsResponse {
  events: IssueEvent[];
  pagination: Pagination;
}

export interface ProjectKey {
  id: string;
  publicKey: string;
  dsn: string;
  label?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  platform: string | null;
  keys: ProjectKey[];
}
