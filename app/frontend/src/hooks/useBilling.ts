import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { Envelope } from "../types/api";

/* start a Polar checkout → redirect the browser to the hosted checkout */
export function useCheckout() {
  return useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post<Envelope<{ url: string }>>(
        "/billing/checkout",
      );
      return res.data.data!.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't start checkout",
      ),
  });
}

/* open the Polar customer portal (manage / cancel) */
export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post<Envelope<{ url: string }>>(
        "/billing/portal",
      );
      return res.data.data!.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't open billing portal",
      ),
  });
}
