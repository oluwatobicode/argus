/* the brand loader: A-mark pulsing inside a spinning lime ring, at any size */
export function Loader({ size = 64 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-border-2 border-t-lime" />
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ width: size / 2, height: size / 2 }}
      >
        <img
          src="/argus-logo.png"
          alt="Loading"
          className="h-full w-full scale-[3.2] animate-pulse object-contain"
        />
      </div>
    </div>
  );
}

/* full-screen (auth gates, first paint) */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-0">
      <Loader size={64} />
    </div>
  );
}

/* inline, centered within a page's content area */
export function PageLoader() {
  return (
    <div className="flex justify-center py-20">
      <Loader size={40} />
    </div>
  );
}
