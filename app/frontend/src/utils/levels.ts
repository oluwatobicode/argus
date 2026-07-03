import type { IssueStatus, Level } from "../types/api";

export const LEVEL_META: Record<
  Level,
  { color: string; bg: string; border: string }
> = {
  FATAL: {
    color: "#C22A31",
    bg: "rgba(194,42,49,0.12)",
    border: "rgba(194,42,49,0.4)",
  },
  ERROR: {
    color: "#F04438",
    bg: "rgba(240,68,56,0.1)",
    border: "rgba(240,68,56,0.35)",
  },
  WARNING: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.35)",
  },
  INFO: {
    color: "#4C8DFF",
    bg: "rgba(76,141,255,0.1)",
    border: "rgba(76,141,255,0.35)",
  },
  DEBUG: {
    color: "#8A8F84",
    bg: "rgba(138,143,132,0.1)",
    border: "rgba(138,143,132,0.3)",
  },
};

export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string }
> = {
  UNRESOLVED: { label: "Unresolved", color: "#F04438" },
  RESOLVED: { label: "Resolved", color: "#A3E635" },
  IGNORED: { label: "Ignored", color: "#666B60" },
};
