# ONE Facility — Design System

**World:** Campus wayfinding (institutional signage).
**Mode:** Operate — task-first dashboards, reservation flows, admin review.
**Palette:** Monochrome structure with a single blue primary. Blue carries primary
actions and selected states only; text, surfaces, borders and metadata stay neutral.
Zero gradients, zero blur, zero shadows.

## Tokens (src/index.css)

### Structure — monochrome

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FFFFFF` | Cards, panels, nav |
| `--surface` | `#FAFAFA` | Page background |
| `--surface-2` | `#F5F5F5` | Muted panels, hover |
| `--ink` | `#0A0A0A` | Body text, secondary emphasis |
| `--muted` | `#525252` | Secondary text |
| `--faint` | `#A3A3A3` | Metadata, disabled |
| `--line` | `#E5E5E5` | Hairline borders |
| `--line-strong` | `#0A0A0A` | Emphasis borders |
| `--ink-dark` | `#1A1A1A` | Dark bands, decorative chips |
| `--gray-medium` | `#BABABA` | Unavailable legend swatch |

### Primary accent — blue

| Token | Value | Role |
|---|---|---|
| `--accent` | `#006BFF` | Primary buttons, selected states, active nav, links |
| `--accent-text` | `#0057D1` | Accent TEXT on light surfaces |
| `--accent-strong` | `#0052CC` | Accent hover / pressed |
| `--accent-deep` | `#0B2A5B` | Deep brand bands, banners |
| `--accent-ink` | `#FFFFFF` | Text on accent fill |
| `--accent-tint` | `#EAF0FD` | Selected / hover wash |
| `--accent-tint-2` | `#D6E2FA` | Accent tint hover |
| `--accent-line` | `#B9CBF5` | Hairline border on accent tint |

Contrast against `#FFFFFF`: `--accent` 4.62:1, `--accent-text` 6.39:1,
`--accent-strong` 6.82:1, `--accent-deep` 14.03:1. All pass WCAG AA.

| Token | Value | Role |
|---|---|---|
| `--radius` | `0.125rem` (2px) | All corners |

## Type

- System grotesque for UI (system-ui stack)
- Monospace (`font-mono`) for room codes, dates, times, table metadata, IDs
- Headlines: `font-black` / `font-extrabold`, tight tracking (`-0.04em` to `tracking-tighter`), line-height near 1
- Minimum text size: 12px (`text-xs`) — no sub-12px labels
- One spacing rhythm; more space above headings than below

## Components

- **Buttons:** `btn-primary` / `btn-accent` = blue fill / white text, `--accent-strong` on hover; `btn-outline` = white / black border; `btn-text` = no fill. All 2px corners, hairline borders, 120–160ms transitions, no scale transforms.
- **Inputs:** white fill, 1px hairline border, blue focus ring (via global `:focus-visible`), no box-shadow.
- **Tags (status):** state conveyed by fill + label + icon, never colour alone:
  - `tag-approved` / `tag-available` — blue fill, white text
  - `tag-pending` — transparent fill, blue border + blue text
  - `tag-rejected` / `tag-cancelled` — light gray fill, muted text
  - `tag-maintenance` — light gray fill, muted text (hatch used on floor plans)
  - `tag-reserved` / `tag-occupied` — accent tint fill, accent-line border
  - All tags: 2px corners (not pills)
- **Panels:** white fill, 1px hairline border, 2px corners.
- **Links:** `--accent-text` text, `--accent-deep` on hover.

## Where blue appears (and where it does not)

Blue is the primary and carries the brand. It is used on every surface that
represents an identity, an action, or a selected state.

**Brand — blue**
- Logo mark (navbar, landing, auth pages, 404 / 403)
- "ONE LSPU" wordmark — `--accent`, deepens to `--accent-deep` on hover
- Landing hero bands and closing band — `--accent-deep`
- Login page left panel — `--accent-deep`
- Organisation dashboard identity band — `--accent-deep`

**Primary actions — blue**
- `.btn-primary` / `.btn-accent`, and every inline CTA (book, reserve,
  submit, approve, decline, confirm, retry, save)

**Selected state — blue**
- Active navbar item, unread-notification dot
- Selected building card, floor pill, view tab, status filter tab
- Selected equipment chip, time slot, checkbox
- Approval stepper "done" nodes and timeline dots
- Selected room on the floor plan, and the "Selected" legend swatch

**Informational — blue**
- Approved / available tags, pending tags
- Success / info banners — `--accent-deep`
- Photo badges (facility code, category)
- Text links, focus rings, input focus borders

**Hover — blue everywhere**
Every interactive hover carries the accent: `--accent-tint` wash, `--accent-text`
label, `--accent-line` / `--accent` border. Nav items, dropdown rows, outline and
text buttons, list rows, cards, the bell, notification rows, menu toggles and the
password reveal all hover blue. There is no grey hover left in the app.

**Monochrome**
- Body text, surfaces, borders, metadata
- Secondary outline buttons
- **Error banners** — errors stay dark, so error vs. success is
  distinguishable without relying on hue
- Rejected / cancelled / maintenance tags
- White CTA buttons sitting on the deep-blue bands (maximum contrast)

**Photography** stays grayscale so the blue never competes with the imagery.

## Rules

- No raw colours in components — always a token (`var(--accent)`, `var(--ink)`, …).
- No Tailwind palette classes (`bg-blue-600` and friends) anywhere.
- Blue never carries meaning on its own: every coloured element also has a
  label and, where it represents state, an icon.
- No shadows, no gradients, no blur, no scale transforms.
- 2px radius everywhere; 1px hairline borders.
