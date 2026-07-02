import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<Pick<User, "id" | "email" | "name">>("/auth/login", {
        method: "POST",
        body,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api<{ email: string }>("/auth/register", { method: "POST", body }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (body: { email: string; otp: string }) =>
      api("/auth/verify-otp", { method: "POST", body }),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (body: { email: string }) =>
      api("/auth/send-otp", { method: "POST", body }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => queryClient.removeQueries({ queryKey: ["me"] }),
  });
}
