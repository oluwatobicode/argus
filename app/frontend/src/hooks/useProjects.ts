import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
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
