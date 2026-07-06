import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
import type {
  Envelope,
  TransactionSummary,
  VitalsSummary,
} from "../types/api";

export function useTransactions(projectId: string, days: number) {
  return useQuery({
    queryKey: ["transactions", projectId, days],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<TransactionSummary[]>>(
        `/projects/${projectId}/performance/transactions`,
        { params: { days } },
      );
      return res.data.data ?? [];
    },
  });
}

export function useVitals(projectId: string, days: number) {
  return useQuery({
    queryKey: ["vitals", projectId, days],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<VitalsSummary>>(
        `/projects/${projectId}/performance/vitals`,
        { params: { days } },
      );
      return res.data.data as VitalsSummary;
    },
  });
}
