import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "../api/axiosInstance";
import type {
  Envelope,
  IssueDetail,
  IssuesResponse,
  IssueStatus,
  Level,
} from "../types/api";

interface IssuesQuery {
  projectId: string;
  status: IssueStatus;
  level?: Level | "ALL";
  page?: number;
}

/* paginated issue list for one status/level/page */
export function useIssues({
  projectId,
  status,
  level = "ALL",
  page = 1,
}: IssuesQuery) {
  return useQuery({
    queryKey: ["issues", projectId, status, level, page],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<IssuesResponse>>(
        `/projects/${projectId}/issues`,
        { params: { status, page, ...(level !== "ALL" ? { level } : {}) } },
      );
      return res.data.data as IssuesResponse;
    },
  });
}

const STATUSES: IssueStatus[] = ["UNRESOLVED", "RESOLVED", "IGNORED"];

/* counts for the status tabs — one cheap query per status (limit 1, read total) */
export function useIssueCounts(projectId: string) {
  const results = useQueries({
    queries: STATUSES.map((status) => ({
      queryKey: ["issueCount", projectId, status],
      enabled: Boolean(projectId),
      queryFn: async () => {
        const res = await axiosInstance.get<Envelope<IssuesResponse>>(
          `/projects/${projectId}/issues`,
          { params: { status, limit: 1 } },
        );
        return res.data.data!.pagination.total;
      },
    })),
  });

  return {
    UNRESOLVED: results[0].data ?? 0,
    RESOLVED: results[1].data ?? 0,
    IGNORED: results[2].data ?? 0,
  } as Record<IssueStatus, number>;
}

/* onboarding: poll until the project's first event lands, then stop */
export function useFirstEvent(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["firstEvent", projectId],
    enabled: Boolean(projectId) && enabled,
    refetchInterval: (query) => (query.state.data ? false : 3000),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<IssuesResponse>>(
        `/projects/${projectId}/issues`,
        { params: { limit: 1 } },
      );
      return res.data.data!.pagination.total > 0;
    },
  });
}

/* single issue + its 10 latest events (embedded by the API) */
export function useIssue(projectId: string, issueId: string) {
  return useQuery({
    queryKey: ["issue", projectId, issueId],
    enabled: Boolean(projectId && issueId),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<IssueDetail>>(
        `/projects/${projectId}/issues/${issueId}`,
      );
      return res.data.data as IssueDetail;
    },
  });
}

export function useUpdateIssueStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      issueId,
      status,
    }: {
      issueId: string;
      status: IssueStatus;
    }) =>
      axiosInstance.patch(`/projects/${projectId}/issues/${issueId}`, {
        status,
      }),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issueCount", projectId] });
      queryClient.invalidateQueries({ queryKey: ["issue", projectId] });
      toast.success(`Marked as ${status.toLowerCase()}`);
    },
    onError: () => toast.error("Couldn't update the issue"),
  });
}
