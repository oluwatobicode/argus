# Project instructions — Argus

- All Argus designs follow **DESIGN.md** (v2 system): true-black surfaces with green cast, lime `#A3E635` accent, Space Grotesk (UI) + JetBrains Mono (code/data), pill buttons, 12–24px card radii, icon-led sidebar.
- `Argus Dashboard v2.dc.html` is the canonical prototype; build new screens as part of it or matching it.
- Color is semantic only: level colors (fatal `#C22A31`, error `#F04438`, warning `#F59E0B`, info `#4C8DFF`, debug `#8A8F84`) and status (unresolved red, resolved lime, ignored gray).
- Dark mode only, dense layouts, monospace for anything copyable/greppable, relative timestamps.

## Engineering rules

- **Keep it simple.** Smallest change that solves the problem. No premature abstractions, no extra layers/wrappers/config beyond what the task needs.
- **Think before coding.** Read the relevant files, confirm the data shape, outline the approach before writing.
- **Server state = React Query + Axios only.** All requests go through `@tanstack/react-query` hooks that call the shared `src/api/axiosInstance.ts` (configured with `withCredentials` for the session cookie). No raw `useEffect + axios/fetch` in components.
- **Hooks:** `src/hooks/`, one file per resource (e.g. `useIssues.ts`). Each `useXxx()` wraps `useQuery`/`useMutation` and returns the React Query result directly. Types co-located or from a shared types file (`src/types/`).
- **Components consume hooks, render UI.** No data-fetching inside components.
- **Structure:** split into `utils/` (pure helpers), `components/` (feature views), `hooks/` (data), `ui/` (presentational primitives). If a piece can stand alone, extract it into the matching folder.
- **Think in entities.** Model around clear objects/cohesive responsibilities; a single owner over scattered free functions.
- **Feedback = toasts.** Success/error/important state changes surface via react-hot-toast — never `alert()`, never silent failures. (Form field validation stays inline next to the field.)
