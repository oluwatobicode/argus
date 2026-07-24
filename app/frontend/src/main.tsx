import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { init, ArgusErrorBoundary } from "@argusdev/sdk-react";
import "./index.css";
import App from "./App.tsx";

/* dogfood: the Argus dashboard monitors itself with the Argus SDK 🐕 */
const argusDsn = import.meta.env.VITE_ARGUS_DSN as string | undefined;
if (argusDsn) {
  init({ dsn: argusDsn });
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ArgusErrorBoundary
      fallback={
        <div style={{ padding: 40, fontFamily: "monospace", color: "#ECEFE8" }}>
          something broke — and yes, it reported itself.
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#111311",
              color: "#ECEFE8",
              border: "1px solid #2A2F27",
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 13,
            },
            success: {
              iconTheme: { primary: "#A3E635", secondary: "#0C0F08" },
            },
            error: {
              iconTheme: { primary: "#F04438", secondary: "#0C0F08" },
              duration: 5000,
            },
          }}
        />
      </QueryClientProvider>
    </ArgusErrorBoundary>
  </StrictMode>,
);
