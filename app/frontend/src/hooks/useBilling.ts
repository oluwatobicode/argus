import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiError, axiosInstance } from "../api/axiosInstance";
import type { Envelope } from "../types/api";

/* start a Bachs checkout → redirect the browser to the hosted checkout */
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

/* cancel subscription (at period end or immediately) */
export function useCancelSubscription() {
  return useMutation({
    mutationFn: async (cancelAtPeriodEnd: boolean = true) => {
      const res = await axiosInstance.post<Envelope<null>>("/billing/cancel", {
        cancel_at_period_end: cancelAtPeriodEnd,
      });
      return res.data.message;
    },
    onSuccess: (msg) => {
      toast.success(msg ?? "Subscription canceled");
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't cancel subscription",
      ),
  });
}
