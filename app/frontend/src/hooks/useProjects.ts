import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { Envelope, Project } from "../types/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<Project[]>>("/projects");
      return res.data.data ?? [];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await axiosInstance.post<Envelope<Project>>("/projects", {
        name,
      });
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't create project",
      ),
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await axiosInstance.patch<Envelope<Project>>(
        `/projects/${projectId}`,
        { name },
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project renamed");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't rename"),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      axiosInstance.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete"),
  });
}
