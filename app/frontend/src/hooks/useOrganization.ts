import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { Envelope, Organization } from "../types/api";

/* onboarding: org-less users (OAuth signups) create their organization */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await axiosInstance.post<Envelope<Organization>>(
        "/organizations",
        { name },
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Organization created");
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't create organization",
      ),
  });
}
