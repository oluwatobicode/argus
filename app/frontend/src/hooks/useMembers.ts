import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { Envelope, MemberRole, OrgMember } from "../types/api";

const onErr = (err: unknown, fallback: string) =>
  toast.error(err instanceof ApiError ? err.message : fallback);

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res =
        await axiosInstance.get<Envelope<OrgMember[]>>("/organizations/members");
      return res.data.data ?? [];
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: MemberRole }) => {
      const res = await axiosInstance.post<Envelope<OrgMember>>(
        "/organizations/members",
        input,
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added");
    },
    onError: (err) => onErr(err, "Couldn't add member"),
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: MemberRole }) =>
      axiosInstance.patch(`/organizations/members/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Role updated");
    },
    onError: (err) => onErr(err, "Couldn't update role"),
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/organizations/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member removed");
    },
    onError: (err) => onErr(err, "Couldn't remove member"),
  });
}
