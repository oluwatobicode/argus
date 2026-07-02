# Argus — Design System (v2)

Dark-first, developer-tool aesthetic. True black, lime signal, monospace for anything code-shaped. Reference points: Sentry, Vercel, Linear + the Byteship-style skin (pill buttons, big radii, icon-led sidebar).

---

## 1. Color

### Surfaces (true-black, slight green cast)

| Token         | Hex                   | Use                               |
| ------------- | --------------------- | --------------------------------- |
| `--bg-0`      | `#0A0A0A`             | App backdrop                      |
| `--bg-1`      | `#0A0C09`             | Inset wells (inputs, code blocks) |
| `--surface`   | `#111311`             | Cards, panels                     |
| `--surface-2` | `#121412` / `#181B17` | Controls, hover, raised           |
| `--border`    | `#20241E`             | Card borders                      |
| `--border-2`  | `#2A2F27`             | Control borders                   |
| `--divider`   | `#1A1D18` / `#161916` | Row dividers, hairlines           |

### Text

| Token      | Hex       | Use                   |
| ---------- | --------- | --------------------- |
| `--text`   | `#ECEFE8` | Primary               |
| `--text-2` | `#99A094` | Secondary / body      |
| `--text-3` | `#666B60` | Muted / meta          |
| `--text-4` | `#565B52` | Hints, section labels |

### Brand accent

- **Lime `#A3E635`** — primary buttons (dark text `#0C0F08` on lime), active nav, links, focus, glows. Glow: `rgba(163,230,53,0.25–0.4)`.
- Accent gradient for avatars/project marks: `linear-gradient(135deg, #A3E635, #3DD68C)`.

### Level colors (semantic only — never decorative)

| Level   | Hex       | Chip bg / border                |
| ------- | --------- | ------------------------------- |
| FATAL   | `#C22A31` | `rgba(194,42,49,0.12)` / `0.4`  |
| ERROR   | `#F04438` | `rgba(240,68,56,0.1)` / `0.35`  |
| WARNING | `#F59E0B` | `rgba(245,158,11,0.1)` / `0.35` |
| INFO    | `#4C8DFF` | `rgba(76,141,255,0.1)` / `0.35` |
| DEBUG   | `#8A8F84` | `rgba(138,143,132,0.1)` / `0.3` |

### Status

- **Unresolved** `#F04438` (rows full-opacity, dot glows)
- **Resolved** lime `#A3E635` (rows dimmed 0.5, title struck)
- **Ignored** `#666B60` (rows dimmed 0.5)

## 2. Typography

- **UI: Space Grotesk** (400/500/600/700) — headings, body, buttons, nav.
- **Code/data: JetBrains Mono** (400/500/600/700) — issue titles, culprits, stack frames, DSNs, counts, timestamps, section eyebrow labels.
- Scale: page title 28/700 (-0.02em) · card title 14–15/600 · body 13–14 · meta 11–12 · mono code 12.5–13 · big stat 24–32/600 mono.
- Eyebrow/section labels: mono 10–11px, uppercase, letter-spacing 0.16–0.22em, `--text-4` or accent.

## 3. Shape & elevation

- Radii: **999px pills** for all buttons/tabs/chips/badges · **12px** inputs & nav items · **14–16px** inner wells · **18–24px** cards · **28px** hero cards.
- Borders are 1px hairlines; elevation via background step + occasional accent glow (`box-shadow: 0 4px 24px rgba(163,230,53,0.25)` on primary CTAs).
- Ambient: faint radial lime wash at top of pages `radial-gradient(…rgba(163,230,53,0.05–0.08), transparent)`.

## 4. Components

- **Primary button:** lime pill, dark text, 700 weight, lime glow.
- **Secondary:** `#181B17` bg, `#2A2F27` border, pill.
- **Ghost/danger:** transparent or `rgba(240,68,56,0.08)` + red border, pill.
- **Sidebar nav item:** 12px radius, icon (17px, 1.8 stroke, rounded caps) + label; active = lime-tinted bg `rgba(163,230,53,0.08)` + border `0.22` + lime icon.
- **Tabs:** pill segmented buttons with counts; active = lime tint.
- **Level badge:** pill chip, colored dot + mono uppercase label in level color.
- **Inputs:** `#0A0C09` well, `#2A2F27` border, 12px radius, mono text, 44px height.
- **Issue row:** level dot (glow if unresolved) · mono title (truncate) · dim culprit + level · right-aligned mono ×count + relative time.
- **Stack trace:** top frame tinted in level color w/ 2px left bar, fn name `#F0568B`; app frames lime fn names; vendor frames 0.5 opacity.

## 5. Rules

- Dark mode only. No pure white.
- Color = signal only (level/status/brand). Never decorative.
- Monospace for anything a developer would copy or grep.
- Relative timestamps, absolute on hover.
- Density over airiness; no illustrations in core flows; no emoji (except the single 🎉 in first-event celebration).
- 🔜 features ship as nav items with `SOON` pill + designed empty states.

## 6. Files

- `Argus Dashboard v2.dc.html` — current canonical prototype (this system).
- `Argus Dashboard.dc.html` — v1 (blue/violet skin, superseded).
- `Argus Design System.dc.html` — v1 token reference page (colors partially superseded by this doc).
