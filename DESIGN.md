# ONE Facility — Design System

**World:** Campus wayfinding (institutional signage).  
**Mode:** Operate — task-first dashboards, reservation flows, admin review.  
**Palette:** Strict monochrome, neutral (no slate-blue tint). Zero gradients, zero blur, zero shadows, zero saturated accents.

## Tokens (src/index.css)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FFFFFF` | Cards, panels, nav |
| `--surface` | `#FAFAFA` | Page background |
| `--surface-2` | `#F5F5F5` | Muted panels, hover |
| `--ink` | `#0A0A0A` | Text, primary buttons, selected states |
| `--muted` | `#525252` | Secondary text |
| `--faint` | `#A3A3A3` | Metadata, disabled |
| `--line` | `#E5E5E5` | Hairline borders |
| `--line-strong` | `#0A0A0A` | Emphasis borders, focus rings |
| `--radius` | `0.25rem` | All corners (2px) |

## Type

- System grotesque for UI (system-ui stack)
- Monospace (`font-mono`) for room codes, dates, times, table metadata, IDs
- Headlines: `font-black` / `font-extrabold`, tight tracking (`-0.04em` to `tracking-tighter`), line-height near 1
- Minimum text size: 11px (no 10px micro-labels)
- One spacing rhythm; more space above headings than below

## Components

- **Buttons:** `btn-primary` = black fill / white text; `btn-outline` = white / black border; `btn-text` = no fill. All 2px corners, hairline borders, 120–160ms transitions, no scale transforms.
- **Inputs:** white fill, 1px hairline border, black focus ring, no box-shadow.
- **Tags (status):** state conveyed by fill + label + icon, never color alone:
  - `tag-approved` / `tag-available` — black fill, white text
  - `tag-pending` — white fill, black border
  - `tag-rejected` / `tag-cancelled` — light gray fill, muted text
  - `tag-maintenance` — light gray fill, muted text (hatch used on floor plans)
  - `tag-reserved` / `tag-occupied` — light gray fill
- **Panels:** white fill, 1px hairline border, 2px corner, no shadow.
- **Dialog:** black/60 backdrop (no blur), `aria-modal`, focus trap, Escape closes, focus restored on close, `X` close button, panel anchored `relative`.
- **Skeleton:** light gray pulse block.
- **ErrorBoundary:** black alert box, white text, "Try again" reset.

## Floor Plan

Architectural line drawing: white canvas, black perimeter, black corridor, mono room codes. Room states:
- Available — white fill, black stroke
- Hover — light gray fill
- Selected — black fill, white text
- Maintenance — light gray fill + diagonal hatch
- Unavailable — gray fill

Keyboard: `tabIndex={0}`, `role="button"`, `aria-label` with name/code/capacity/status, Enter/Space activation, visible focus.

## Imagery

- Facility photography desaturated globally (`filter: grayscale(1)`).
- Missing images render a neutral outlined placeholder, never an empty `src`.
- Favicon and avatar placeholder redrawn in black and white.

## Motion

- 120–160ms border/background/color transitions only.
- `prefers-reduced-motion` reduces all durations to 0.01ms.
- No scale, rotate, or glow effects.

## Accessibility

- Skip link to `#main-content`
- `*:focus-visible` 2px black outline
- Programmatically associated labels on all inputs, selects, radios, checkboxes
- `role="alert"` error boxes; black fill for errors
- Keyboard operability on floor plan, dialogs, dropdowns

## What was removed (anti-reference)

- Sky / indigo / emerald / amber / rose / purple utility classes (158 removed)
- Gradient hero, gradient text, blur blobs, colored shadows, `active:scale-95`
- Colored icon tiles and status pills
- `rounded-3xl` soft cards
- Dark navy header with gradient logo
- Dark blue/purple floor-plan canvas
- 10px uppercase labels, emoji in notifications

## Finish

`unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance`.
