import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { AlertInput, AlertRule, Envelope } from "../types/api";

export function useAlerts(projectId: string) {
  return useQuery({
    queryKey: ["alerts", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<AlertRule[]>>(
        `/projects/${projectId}/alerts`,
      );
      return res.data.data ?? [];
    },
  });
}

const onErr = (err: unknown, fallback: string) =>
  toast.error(err instanceof ApiError ? err.message : fallback);

export function useCreateAlert(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AlertInput) => {
      const res = await axiosInstance.post<Envelope<AlertRule>>(
        `/projects/${projectId}/alerts`,
        input,
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", projectId] });
      toast.success("Alert rule created");
    },
    onError: (err) => onErr(err, "Couldn't create alert"),
  });
}

export function useUpdateAlert(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<AlertInput> & { id: string }) => {
      const res = await axiosInstance.patch<Envelope<AlertRule>>(
        `/projects/${projectId}/alerts/${id}`,
        input,
      );
      return res.data.data!;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["alerts", projectId] }),
    onError: (err) => onErr(err, "Couldn't update alert"),
  });
}

export function useDeleteAlert(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/projects/${projectId}/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", projectId] });
      toast.success("Alert rule deleted");
    },
    onError: (err) => onErr(err, "Couldn't delete alert"),
  });
}
