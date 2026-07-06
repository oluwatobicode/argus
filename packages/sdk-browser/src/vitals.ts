import {
  sendEnvelope,
  type TransactionEnvelope,
  type WebVitals,
} from "@argusdev/sdk-core";

/*
 * Core web vitals capture — one `page.load` transaction per page view.
 *
 * Collection: PerformanceObserver with buffered:true (so entries that fired
 * before init() are still caught), CLS ignores shifts near user input
 * (hadRecentInput). Report: exactly once, on pagehide/visibilitychange→hidden,
 * sent with keepalive so it survives the navigation.
 *
 * Golden rule applies: nothing here may ever throw into the host app.
 */
export function startVitals(url: string, publicKey: string): void {
  try {
    if (typeof PerformanceObserver === "undefined") return;

    const vitals: WebVitals = {};
    const observers: PerformanceObserver[] = [];
    let reported = false;

    const observe = (
      type: string,
      onEntries: (entries: PerformanceEntry[]) => void,
    ) => {
      try {
        const po = new PerformanceObserver((list) =>
          onEntries(list.getEntries()),
        );
        po.observe({ type, buffered: true } as PerformanceObserverInit);
        observers.push(po);
      } catch {
        /* entry type unsupported in this browser — skip it */
      }
    };

    /* LCP — the LAST candidate entry wins */
    observe("largest-contentful-paint", (entries) => {
      const last = entries[entries.length - 1];
      if (last) vitals.lcp = Math.round(last.startTime);
    });

    /* CLS — cumulative, ignoring shifts within ~500ms of user input */
    observe("layout-shift", (entries) => {
      for (const entry of entries as Array<
        PerformanceEntry & { value: number; hadRecentInput: boolean }
      >) {
        if (!entry.hadRecentInput) {
          vitals.cls = Number(((vitals.cls ?? 0) + entry.value).toFixed(4));
        }
      }
    });

    /* FCP */
    observe("paint", (entries) => {
      const fcp = entries.find((e) => e.name === "first-contentful-paint");
      if (fcp) vitals.fcp = Math.round(fcp.startTime);
    });

    const report = () => {
      if (reported) return;
      reported = true;
      for (const po of observers) po.disconnect();

      /* TTFB + total page duration from the navigation entry */
      let duration = 0;
      try {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (nav) {
          vitals.ttfb = Math.round(nav.responseStart);
          duration = Math.round(nav.duration || nav.loadEventEnd || 0);
        }
      } catch {
        /* navigation timing unavailable — send what we have */
      }

      /* nothing measured (e.g. background tab that never rendered) → skip */
      if (duration <= 0 && Object.keys(vitals).length === 0) return;

      const envelope: TransactionEnvelope = {
        type: "transaction",
        name: `page.load ${window.location.pathname}`,
        duration: Math.max(duration, 0),
        timestamp: Date.now(),
        status: "ok",
        vitals,
      };

      void sendEnvelope(url, publicKey, envelope, { keepalive: true });
    };

    /* whichever fires first wins; pagehide covers navigation, visibilitychange
       covers tab close/switch on mobile */
    window.addEventListener("pagehide", report);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") report();
    });
  } catch {
    /* never break the host app over metrics */
  }
}
