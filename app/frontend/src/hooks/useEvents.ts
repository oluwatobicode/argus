import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
import type { Envelope, EventsResponse } from "../types/api";

/* paginated raw events for one issue — one per page drives the stack-trace stepper */
export function useEvents(
  projectId: string,
  issueId: string,
  page: number,
  limit = 1,
) {
  return useQuery({
    queryKey: ["events", projectId, issueId, page, limit],
    enabled: Boolean(projectId && issueId),
    placeholderData: keepPreviousData /* no flicker while stepping */,
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<EventsResponse>>(
        `/projects/${projectId}/issues/${issueId}/events`,
        { params: { page, limit } },
      );
      return res.data.data as EventsResponse;
    },
  });
}
