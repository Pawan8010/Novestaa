# PDFIndia Design System

**Product:** PDFIndia — 100% private, browser-based document prep for Indian exams and portals  
**Attribution:** A Novesta product  
**Visual Direction:** Clean, trustworthy, fast utility interface inspired by Stripe and Smallpdf. Mobile-first (`360px` to `1440px`), single-elevation card surfaces, zero visual clutter, and deterministic feedback.

---

## 1. Brand Identity & Logo Rules

- **Logo:** Crisp inline SVG combining a folded document corner icon with a small navy (`#0F172A`) and saffron (`#EA580C`) accent badge, followed by **PDF** in `--color-navy` (`#0F172A`) and **India** in `--color-saffron` (`#EA580C`, rendered at bold display/wordmark scale `>= 20px`).
- **Strict Prohibition:** Never use the State Emblem of India (Lion Capital of Ashoka), the Ashoka Chakra, national flag geometry, or any Indian government department seal or logo.
- **Non-Affiliation:** PDFIndia is an independent toolset and never mimics official government portal chrome.

---

## 2. Design Tokens (Tokens Only — No Raw Ad-Hoc Hex Values in Components)

All UI surfaces, borders, text, icons, and interactive states must reference CSS custom properties defined in `src/index.css`.

### Color Palette
| Token | Value | Usage | Contrast vs `#FFFFFF` |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#F8FAFC` | Page canvas background (60% neutral field) | — |
| `--color-surface` | `#FFFFFF` | Cards, dropzones, inputs, modals (30% structural) | — |
| `--color-surface-subtle` | `#F1F5F9` | Table headers, secondary panels, segmented track | — |
| `--color-navy` | `#0F172A` | Primary headings, body text, primary buttons | **17.85:1** (AAA) |
| `--color-navy-hover` | `#1E293B` | Hover/active state for primary navy buttons | **14.63:1** (AAA) |
| `--color-text-secondary` | `#475569` | Body descriptions, metadata, form hints | **7.58:1** (AAA) |
| `--color-text-muted` | `#64748B` | Captions, placeholders (never below 4.5:1) | **4.76:1** (AA) |
| `--color-saffron` | `#EA580C` | **Large text (`>= 24px` or `>= 18.66px` bold), icons & graphics ONLY** | **3.56:1** (AA Large / UI) |
| `--color-saffron-text` | `#C2410C` | **Any small text (`< 18.66px`), links, active indicators** | **5.18:1** (AA Normal) |
| `--color-saffron-soft` | `#FFF7ED` | Subtle highlight surface for active tool hints | — |
| `--color-success` | `#15803D` | Verified preset match text & icons | **5.14:1** (AA Normal) |
| `--color-success-bg` | `#F0FDF4` | Success banner fill | — |
| `--color-success-border` | `#BBF7D0` | Success banner 1px border | — |
| `--color-error` | `#B91C1C` | Validation failure, out-of-range alerts, locked PDF notice | **6.47:1** (AA Normal) |
| `--color-error-bg` | `#FEF2F2` | Error banner fill | — |
| `--color-error-border` | `#FECACA` | Error banner 1px border | — |
| `--color-border` | `#E2E8F0` | Standard 1px hairline border for cards, dividers, inputs | — |
| `--color-border-strong` | `#CBD5E1` | Hover border & interactive control outline | — |

### Typography
- **Font Family:** Self-hosted `Inter` (`@fontsource/inter`, weights `400`, `500`, `600`, `700`) with `system-ui, sans-serif` fallback. Zero external Google Fonts network requests.
- **Numeric Figures:** All file sizes (`38.42 KB`, `1.14 MB`), pixel/mm dimensions (`413 × 531 px`, `35.0 × 45.0 mm`), percentages (`-64%`), and table values strictly use `font-variant-numeric: tabular-nums`.
- **Type Scale:**
  - Page H1: `clamp(1.75rem, 3.2vw, 2.5rem)`, weight `700`, line-height `1.15`, `letter-spacing: -0.025em`, `text-wrap: balance`.
  - Section H2: `clamp(1.375rem, 2.4vw, 1.875rem)`, weight `600`, line-height `1.2`, `letter-spacing: -0.02em`.
  - Card H3: `1.125rem`, weight `600`, line-height `1.35`.
  - Body: `0.9375rem`–`1rem` (`15px–16px`), weight `400`, line-height `1.6`.
  - Small / Label / Meta: `0.8125rem`–`0.875rem` (`13px–14px`), weight `500`.

### Radius, Spacing & Elevation
- **Radius:**
  - `--radius-md`: `12px` (buttons, inputs, thumbnails, banners, alerts)
  - `--radius-lg`: `16px` (main tool workspace containers, dropzones, modals, content cards)
- **Borders:** Single `1px solid var(--color-border)` (`#E2E8F0`). Avoid nested bordered cards inside cards; use whitespace and `1px` horizontal dividers.
- **Shadows:**
  - `--shadow-sm`: `0 1px 2px rgba(15, 23, 42, 0.05)`
  - `--shadow-md`: `0 4px 16px -2px rgba(15, 23, 42, 0.07), 0 2px 6px -2px rgba(15, 23, 42, 0.04)`
- **Motion:** Transitions limited to `color`, `background-color`, `border-color`, `opacity`, `transform` within `150ms–200ms`. Respects `@media (prefers-reduced-motion: reduce)`.

---

## 3. Component States Matrix

Every interactive element (buttons, preset cards, tabs, dropzones, inputs, sliders, checkboxes, accordion triggers) must implement all seven states:

| State | Visual & Behavioral Specification |
| :--- | :--- |
| **Default** | Clear affordance: primary buttons use `--color-navy` fill + `#FFFFFF` text; secondary buttons use `--color-surface` fill + `1px solid var(--color-border)` + `--color-navy` text. |
| **Hover** | Pointer hover transitions within `150ms`: primary shifts to `--color-navy-hover`; secondary shifts border to `--color-border-strong` and background to `--color-surface-subtle`. |
| **Focus-Visible** | Mandatory `2px solid var(--color-saffron)` outline with `2px` offset (`:focus-visible`) on every interactive element, never suppressed. |
| **Active / Pressed** | Tactile `transform: scale(0.985)` on buttons; active tool tabs and preset selectors show `--color-navy` fill + `#FFFFFF` text or `2px solid var(--color-navy)` border + `--color-saffron-soft` tint with `aria-pressed="true"` or `aria-selected="true"`. |
| **Disabled** | `opacity: 0.5`, `cursor: not-allowed`, no hover shift, `disabled` HTML attribute set. |
| **Loading / Busy** | Inline spinner icon + explicit progress text (`"Compressing page 4 of 12…"`), deterministic progress bar (`role="progressbar"`), `aria-busy="true"`, and working **Cancel** button for multi-step jobs. |
| **Error** | High-contrast banner (`--color-error-bg`, `1px solid --color-error-border`, `--color-error` text + alert icon, `role="alert"`) stating exact cause and recovery action (never hue-only). |

---

## 4. Keyboard, Pointer & Touch Behaviour

- **Touch Targets:** Minimum `44px × 44px` hit area on mobile (`>= 40px` on desktop) for all buttons, tabs, checkboxes, and reorder controls.
- **Keyboard Navigation:**
  - Skip-to-main-content link (`#main-content`) visible on focus.
  - Full `Tab` / `Shift+Tab` reachability across header links, tool switcher tabs, upload dropzone, preset selectors, crop zoom/offset controls, Up/Down reorder buttons, Download, and Clear All Files.
  - `Enter` / `Space` activates dropzones, preset buttons, checkboxes, and accordions.
  - `Escape` closes mobile navigation drawers and returns focus to the trigger button.
- **Pointer & Touch Drag:**
  - Interactive image cropper supports mouse drag, touch drag (`touch-action: none` on the crop frame), zoom slider, and keyboard arrow nudging (`ArrowUp/Down/Left/Right`) for fine positioning.
  - PDF Merger supports both pointer drag-and-drop AND explicit Up/Down buttons for full keyboard & touch accessibility.
- **Object URL & Memory Hygiene:**
  - Never persist user files in `localStorage` or `IndexedDB`.
  - Revoke every `URL.createObjectURL` on file replacement, clear, and component unmount.

---

## 5. Ad Placement & Layout Stability Rules

- Ad slots (`728×90` leaderboard on desktop / responsive mobile banner, `300×250` sidebar) strictly reserve exact fixed height (`min-h-[90px]`, `min-h-[250px]`) to guarantee `CLS = 0`.
- Never place an ad adjacent to a **Download** button, file upload dropzone, or tool action controls.
- Do not load third-party ad scripts until site approval AND user consent via the cookie consent banner.

---

## 6. WCAG 2.2 AA Testable Checks & QA Checklist

- [ ] **Contrast (1.4.3):** All normal text `>= 4.5:1` (`--color-saffron-text` `#C2410C` used for all small saffron text; `#EA580C` restricted strictly to icons, graphics, and bold display wordmark).
- [ ] **Non-text Contrast (1.4.11):** Input borders, focus rings, icons, and progress tracks `>= 3:1` against adjacent surfaces.
- [ ] **Keyboard Only (2.1.1 / 2.4.7):** Complete every tool workflow (upload → configure → process → download → clear) using keyboard alone with clearly visible `:focus-visible` outlines.
- [ ] **Target Size (2.5.8):** All touch targets `>= 44px` on `360px` mobile viewports with no crowding.
- [ ] **Live Regions (4.1.3):** Verification results (`Verified: Fits ...`), errors (`Unlock this file first.`), and progress updates announce via `role="status"` / `role="alert"`.
- [ ] **Zero Layout Shift (CLS):** Fixed aspect ratios for cropper/preview panes and fixed heights for ad placeholders.
- [ ] **Privacy Verification:** Browser Network tab confirms zero outgoing requests containing user file bytes across all 5 tools.
- [ ] **Responsive Integrity:** Verified at `360px`, `768px`, `1024px`, and `1280px+` with zero horizontal overflow.
