import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../api/axiosInstance";
import type { Envelope, Usage } from "../types/api";

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const res = await axiosInstance.get<Envelope<Usage>>("/usage");
      return res.data.data as Usage;
    },
  });
}
