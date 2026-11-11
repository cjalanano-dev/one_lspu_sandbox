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
| `--accent` | `#4274D9` | Primary buttons, selected states, active nav, links |
| `--accent-strong` | `#2F5FC0` | Accent hover / pressed |
| `--accent-deep` | `#1B2A4A` | Reserved for deep brand bands |
| `--accent-ink` | `#FFFFFF` | Text on accent fill |
| `--accent-tint` | `#EAF0FD` | Selected / hover wash |
| `--accent-tint-2` | `#D6E2FA` | Accent tint hover |
| `--accent-line` | `#B9CBF5` | Hairline border on accent tint |

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
  - `tag-reserved` / `tag-occupied` — light gray fill
  - All tags: 2px corners (not pills)
- **Panels:** white fill, 1px hairline border, 2px corners.
- **Links:** `--accent` text, `--accent-strong` on hover.

## Where blue appears (and where it does not)

Blue is the primary, but it stays scarce so it still reads as emphasis.

**Blue:** primary buttons, active nav item, selected pills / tabs / chips / cards,
selected time slots and checkboxes, approved / available tags, text links,
focus rings, unread-notification dot.

**Monochrome:** body text, surfaces, borders, metadata, secondary outline buttons,
error / success banners, the landing hero bands, the organisation identity band,
logo and decorative chips, and every status tag other than approved / available.

**Photography** stays grayscale so the blue never competes with the imagery.

## Rules

- No raw colours in components — always a token (`var(--accent)`, `var(--ink)`, …).
- No Tailwind palette classes (`bg-blue-600` and friends) anywhere.
- Blue never carries meaning on its own: every coloured element also has a
  label and, where it represents state, an icon.
- No shadows, no gradients, no blur, no scale transforms.
- 2px radius everywhere; 1px hairline borders.
