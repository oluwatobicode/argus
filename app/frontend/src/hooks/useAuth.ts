import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
import type { Envelope } from "../types/api";

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/* the session probe — a rejected request means "not logged in", not "broken" */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<User>>("/auth/me");
      return res.data.data as User;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await axiosInstance.post<
        Envelope<Pick<User, "id" | "email" | "name">>
      >("/auth/login", body);
      return res.data.data!;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (body: {
      name: string;
      email: string;
      password: string;
    }) => {
      const res = await axiosInstance.post<Envelope<{ email: string }>>(
        "/auth/register",
        body,
      );
      return res.data.data!;
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (body: { email: string; otp: string }) =>
      axiosInstance.post("/auth/verify-otp", body),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (body: { email: string }) =>
      axiosInstance.post("/auth/send-otp", body),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => axiosInstance.post("/auth/logout"),
    onSuccess: () => queryClient.removeQueries({ queryKey: ["me"] }),
  });
}
