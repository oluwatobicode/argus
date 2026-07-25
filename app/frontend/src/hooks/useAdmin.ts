import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
import type {
  AdminOrganizationsResponse,
  AdminStats,
  AdminUsersResponse,
  Envelope,
} from "../types/api";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<AdminStats>>(
        "/admin/stats",
      );
      return res.data.data as AdminStats;
    },
  });
}

export function useAdminUsers({
  search,
  page = 1,
  enabled = true,
}: {
  search?: string;
  page?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["admin", "users", search, page],
    enabled,
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<AdminUsersResponse>>(
        "/admin/users",
        { params: { page, ...(search ? { search } : {}) } },
      );
      return res.data.data as AdminUsersResponse;
    },
  });
}

export function useAdminOrganizations({
  search,
  page = 1,
  enabled = true,
}: {
  search?: string;
  page?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["admin", "organizations", search, page],
    enabled,
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<AdminOrganizationsResponse>>(
        "/admin/organizations",
        { params: { page, ...(search ? { search } : {}) } },
      );
      return res.data.data as AdminOrganizationsResponse;
    },
  });
}
