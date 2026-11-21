# Screenpipe design language — extracted reference

Extracted 2026-11-18 from (a) the Screenpipe desktop app source (`apps/screenpipe-app-tauri`, read statically, **not run**) and (b) the live landing page https://screenpipe.com/ (computed styles, CSSOM, network inventory, screenshots at 1440/1024/768/390 px).

This file is self-contained: it records measured values and observed patterns so a design system can be **re-implemented from scratch**. It deliberately contains no verbatim Screenpipe source files.

> **Licence boundary.** `screenpipe/LICENSE.md` §5 prohibits using the Licensed Work (source and documentation) "to build, offer, or operate a competing product or service" without a commercial licence. Do not copy Screenpipe's CSS, components, `DESIGN.md`, logo/mark, OG art, animation GIFs/Lottie, or copy text. Hex values, font names, sizes and measurements are facts and are listed here for re-implementation. Fonts below are SIL OFL (Google Fonts). This is an engineering note, not legal advice.

Conventions: `[INFERENCE]` marks conclusions not directly observed. App values are source declarations, not runtime-computed. Landing values are live computed styles.

---

## 0. Summary

**Shared DNA (app + landing):** ink `#0A0A0A` on bone `#F6F6F3`; warm-grey hairlines `#DFDFD8`; 8/6/4px radius; 1px borders; flat surfaces; 150ms transitions; isometric/tessellated "Escher" geometry; phosphor `#C7FF3E` reserved for live transformation/execution.

**Where app and landing differ**

| Area | App | Landing |
|---|---|---|
| Typography | Effectively all-mono UI (Inter body fallback) | Three voices: IBM Plex Mono / Space Grotesk / Crimson Text |
| Colour | Greyscale incl. status tokens (leaks: blue/amber/red usage meter, green rec dot, blue text selection) | Greyscale chrome + muted categorical hues inside illustrations; defined success/warning/destructive hues |
| Density | 32px rows, 10–12px labels | 64–128px section padding, 60px headlines |
| Dark mode | Full, user-switchable | Variables exist but never activates (stays light even under `prefers-color-scheme: dark`) |
| Phosphor | Rendered (live-turn glyph, pending result, brand loops) | Defined, not seen on the homepage |

**Stated philosophy (their own words, paraphrased):** "Escher monochrome with controlled phosphor intelligence." Bone = human/source material; trace grey = captured evidence; neutral signal = ready/selected/focused; phosphor = intelligence actively transforming or executing, and it must go out when work stops; ink = local system. Meaning must never rely on colour alone. Phosphor is never a generic success colour, button fill, badge, heading, link, or decorative background. No rainbow/aurora/AI gradients.

**Implementation vs. stated intent (divergences)**
- Space Grotesk / Crimson Text / IBM Plex Mono are only truly shipped on the landing page. App: Tailwind `sans` and `mono` both = `JetBrains Mono, SF Mono, IBM Plex Mono, ui-monospace, monospace` (none bundled); `<body>` uses Inter via next/font; Space Grotesk only for workflow headings; Crimson Text not loaded.
- "Pills rarely, flat by default": app source has `rounded-full` ×185 and `shadow-lg` ×44.
- Landing muted text computes to `#666666`, not trace `#78786F`.
- Landing uses off-system colours: `#111827` on /privacy, Claude/ChatGPT mock palettes, YC orange, per-illustration hues.

---

## 1. Shared palette (the core identity)

| Role | Hex | HSL triplet |
|---|---|---|
| Ink | `#0A0A0A` | `0 0% 4%` |
| Bone canvas | `#F6F6F3` | `60 14% 96%` |
| White surface | `#FFFFFF` | `0 0% 100%` |
| Warm secondary/muted/accent fill | `#EFEFEB` | `60 11% 93%` |
| Hover on warm fill | `#E3E3DE` | `60 9% 88%` |
| Border (light) | `#DFDFD8` | `60 9% 86%` |
| Trace (light) | `#77776E` | `60 4% 45%` |
| Trace (dark) | `#93938A` | `60 4% 56%` |
| Muted text (light) / (dark) | `#666666` / `#A3A3A3` | `0 0% 40%` / `0 0% 64%` |
| Neutral signal (light) / (dark) | `#333333` / `#B8B8B8` | `0 0% 20%` / `0 0% 72%` |
| Phosphor | `#C8FF3D` (documented as `#C7FF3E`; rgb `199 255 62`) | `77 100% 62%` |
| Phosphor ink (text on phosphor) | `#050505` | `0 0% 2%` |
| Phosphor mark on light bg (darkened) | `#6A9108` | `77 90% 30%` |

Ink alpha steps used on the landing for secondary text and fine lines: `.35 .55 .65 .7 .75` (text) and `.04 .1 .12 .15 .18 .2 .25 .3 .35` (borders/fills).

### 1.1 App token table (CSS variables, `hsl(var(--x))`)

| Token | Light | Dark |
|---|---|---|
| background | `#F6F6F3` | `#0A0A0A` |
| foreground | `#0A0A0A` | `#F5F5F5` |
| surface / card / popover / input | `#FFFFFF` | `#141414` |
| surface-secondary | `#EFEFEB` | `#212121` |
| surface-tertiary | `#E5E5E0` | `#292929` |
| card-hover | `#EFEFEB` | `#212121` |
| primary (fg) | `#0A0A0A` (`#FFFFFF`) | `#F5F5F5` (`#0A0A0A`) |
| primary-hover | `#333333` | `#CCCCCC` |
| primary-muted | `#EFEFEB` | `#262626` |
| secondary / muted / accent | `#EFEFEB` | `#242424` |
| secondary-hover / accent-hover | `#E3E3DE` | `#2E2E2E` |
| border | `#DFDFD8` | `#333333` |
| input-focus / ring | `#0A0A0A` | `#F5F5F5` |
| muted-foreground / text-secondary | `#666666` | `#A3A3A3` |
| text-tertiary | `#999999` | `#666666` |
| text-disabled | `#B3B3B3` | `#4D4D4D` |
| success (fg / muted) | `#333333` (`#FFF` / `#E6E6E6`) | `#CCCCCC` (`#000` / `#262626`) |
| warning (muted) | `#666666` (`#D9D9D9`) | `#999999` (`#262626`) |
| destructive (hover / muted) | `#000000` (`#333` / `#E6E6E6`) | `#FFFFFF` (`#CCC` / `#262626`) |
| info (muted) | `#666666` (`#E6E6E6`) | `#999999` (`#262626`) |
| sidebar-background | `#EFEFEB` | `#141414` |
| sidebar-accent | `#E3E3DE` | `#242424` |
| sidebar-border | `#DFDFD8` | `#333333` |
| brand-1..5 / color-1..5 (grey ramp) | `#000 #333 #666 #999 #CCC` | `#FFF #CCC #999 #666 #333` |
| signal (fg) | `#333333` (`#FFF`) | `#B8B8B8` (`#0A0A0A`) |
| phosphor / phosphor-ink | `#C8FF3D` / `#050505` | same |
| phosphor-mark | `#6A9108` | `#C8FF3D` |
| trace | `#77776E` | `#93938A` |

App status tokens are **greyscale**: status is distinguished by text/icon, not hue. The only banner with weight is the permission-failure banner (`bg-destructive` = black in light mode, 2px bottom border, 20px alert icon, 16px semibold label).

### 1.2 Landing token set (live `:root`)

```css
:root{
  --background:60 14% 96%; --foreground:0 0% 4%; --foreground-rgb:10 10 10;
  --card:0 0% 100%; --popover:0 0% 100%;
  --primary:0 0% 4%; --primary-foreground:0 0% 100%;
  --secondary:60 11% 93%; --muted:60 11% 93%; --accent:60 11% 93%;
  --muted-foreground:0 0% 40%;
  --border:60 9% 86%; --input:60 9% 86%; --ring:0 0% 4%;
  --destructive:0 72% 51%;   /* #DC2626-ish red */
  --success:142 71% 29%;     /* #15803D-ish green */
  --warning:32 95% 44%;      /* #DB6A06-ish amber */
  --overlay:0 0% 0%;
  --signal:0 0% 20%; --signal-foreground:0 0% 100%;
  --phosphor:77 100% 62%; --phosphor-foreground:0 0% 4%; --phosphor-rgb:199 255 62;
  --shadow-sm:0 1px 2px -1px hsl(var(--overlay)/.08);
  --shadow-md:0 4px 10px -2px hsl(var(--overlay)/.10);
  --shadow-lg:0 10px 24px -6px hsl(var(--overlay)/.14);
  --radius:.5rem; --navigation-height:3.5rem;
}
/* dark variant exists; dark body gets a 1px dot grid:
   radial-gradient(circle, hsl(var(--foreground)/.05) 1px, transparent 1px) */
```

### 1.3 Observed non-neutral colours (landing, inside illustrations/mocks only)

| Hex | Where |
|---|---|
| `#3A6BB6` blue | Database / REST API schematic |
| `#7A51B8` purple (75% fill `rgba(122,81,184,.75)`) | Audio waveform |
| `#378166` green (65% fill) | Privacy shield / redaction |
| `#AB4967` rose | Enterprise / device nodes |
| `#FAF9F5 #F0EEE6 #EEECE4 #DFD9CD #C96442 #292824` | Claude mock window (third-party look) |
| `#FF5A1F` | YC mark |

Computed text colour tally: `#0A0A0A` 739 elements, `#666666` 183, `#000` 114. Border tally: `#DFDFD8` on 1327 elements.

### 1.4 App colour leaks (non-neutral, contradicting "monochrome")
- Usage meter: `bg-blue-500` normal / `bg-amber-500` approaching / `bg-red-500` reached (6px bar, `rounded-full`, 16px indicator).
- Timeline recording dot: `green-400/500`.
- Text selection in `.prose` / `.selectable-text-layer`: `rgba(59,130,246,.35)`.
- Legacy `SplashScreen`: blue-600→purple-600 gradient (possibly unmounted).
- `app/error.tsx`: forced `bg-neutral-950 text-white`.

---

## 2. Typography

### 2.1 Landing (all fonts shipped as TTF, `font-display: swap`)

| Alias | Family | Shipped weights | Role |
|---|---|---|---|
| fontMono | IBM Plex Mono | 400 / 500 / 600 | Hero H1, eyebrows, buttons, wordmark, micro-labels |
| fontSans | Space Grotesk | 400 / 500 / 700 | Section headings, nav, UI text, mock-app text |
| fontSerif | Crimson Text | 400 / 600 / 700 | `<body>` default, links, body copy, quotes |

Fallbacks with metric overrides: mono → Arial (ascent 102.5%, descent 27.5%); sans → Arial (size-adjust 110.87%, ascent 88.75%, descent 26.34%); serif → Times New Roman (size-adjust 96.55%, ascent 98.32%, descent 36.31%).
Weights requested (sans 600, mono 700) are not all shipped; browsers will pick/synthesize the nearest face. [INFERENCE]

| Role | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Hero H1 (desktop) | Mono | 60 / 60 | 700 | −1.5px (−0.025em) |
| Hero H1 (390px) | Mono | 36 / 37.8 | 700 | −0.9px |
| Section H2 small | Sans | 30 / 36 | 600 | −0.75px |
| Section H2 | Sans | 36 / 40 | 600 | −0.9px |
| Studio H2 | Sans | 42 / 47.04 (fluid: 31.7 at 1024, 28 at 768) | 600 | −1.5px |
| FAQ H2 | Sans | 48 / 48 | 600 | normal |
| Footer CTA H2 | Sans | 60 / 60 (48 at 768, 36 at 390) | 600 | −2.4px (−0.04em) |
| Enterprise H1 | Sans | 76 / 76 | 500 | — |
| Card title H3 | Sans | 18 / 28 | 600 | −0.45px |
| Eyebrow | Mono, uppercase | 12 / 16 | 500 | 1.92px (0.16em) |
| Eyebrow (FAQ) | Mono, uppercase | 14 / 20 | 500 | 0.7px |
| Micro label | Mono | 9 / 13.5 | 400 | 1.62px (0.18em) |
| Micro label | Mono | 11 / 16.5 | 400 | 2.2px (0.2em) |
| FAQ group label | Sans, uppercase | 12 / 16 | 600 | 2.16px |
| Body | Serif | 16 / 24 | 400 | — |
| Body small / links | Serif | 14 / 24 | 400 | — |
| UI text | Sans | 14 / 20 and 15 / 24 | 400–600 | — |
| Primary button | Mono | 16 / 24 | 700 | −0.4px |
| Nav link / header button | Sans | 14 / 20 | 500 / 600 | — |
| Wordmark | Mono | 16 / 24 | 600 | −0.64px |
| Sub-page H1s | Sans | /how-to-install 60/60·600; /blog 48/48·700; post 36/40·700; /changelog 48/48·700; /privacy 30/36·600; 404 "404" 96/96·700 at `rgba(10,10,10,.1)` | | |

Voice split: mono = machine/system/label; sans = product headline and UI; serif = human explanatory prose. Display type uses ≈−0.025em tracking. Tiny tracked mono caps act as instrument-panel labels.

### 2.2 App

| Layer | Fact |
|---|---|
| Tailwind `font-sans` and `font-mono` | `JetBrains Mono, SF Mono, IBM Plex Mono, ui-monospace, monospace` (nothing bundled) |
| `<body>` | Inter (next/font, latin) — text without a font utility |
| Space Grotesk | `--font-workflow-heading` only |
| IBM Plex Mono 400/500 | Injected via Google stylesheet only in notification-panel and shortcut-reminder windows |
| Startup loader | Georgia/Baskerville serif tagline |
| Class counts | `font-medium` 646, `font-mono` 527, `font-semibold` 146, `font-sans` 97, `font-normal` 41, `font-bold` 23 |

Scale (first value scales with user font-size setting `--font-size-base`): xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32, 3xl 30/36, 4xl 36/40.
Micro sizes in common use: 9px (0.04em–0.2em tracking mono overlines), 10px, 11px, 12px labels. Buttons: mono + `tracking-wide`. Keycaps: 10px medium, leading-none, tracking-wide. Dialog title 18px semibold; description 14px muted. Active sidebar nav weight 600.

---

## 3. Geometry, borders, elevation, texture

**Radius**

| Utility | px | Use |
|---|---|---|
| 0 | 0 | App/window edges, split panes, rails, timelines, charts, canvases, structural geometry (landing: 1335 of ~1480 elements) |
| sm / `rounded` | 4 | Compact menu items, nested note boxes |
| md | 6 | Buttons, inputs, selects, nav buttons, inner cards, workflow nodes |
| lg (and xl/2xl/3xl collapsed) | 8 | Cards, dialogs, media, primary work surfaces, hero CTA, demo windows |
| full | pill/circle | Short statuses, avatars, toggles, circular controls |
| other | 2px ×20, 12px (recall panel), 20px ×1 | Specials |

Rule: nested surfaces step down in radius or stay flat; radius should aid parsing, not turn every region into a card.

**Borders:** 1px solid; default `#DFDFD8` / dark `#333`. Emphasis via ink alpha .12–.35; selection/primary via solid ink. Binary/sharp; no decorative gradients.

**Shadows**
| Token | Light | Dark |
|---|---|---|
| sm | `0 1px 2px -1px rgba(0,0,0,.08)` | α .24 |
| md | `0 4px 10px -2px rgba(0,0,0,.10)` | α .28 |
| lg | `0 10px 24px -6px rgba(0,0,0,.14)` | α .34 |

Others observed: chat composer `0 4px 18px rgba(0,0,0,.08)` (dark `.28`); landing cards `0 1px 2px 0 rgba(0,0,0,.05)` (×19), `0 3px 8px rgba(10,10,10,.04)` (×7); Claude mock window `0 8px 32px -20px rgba(0,0,0,.2)`; recall popover `0 12px 48px rgba(0,0,0,.18)`; ink focus ring `0 0 0 1px #0A0A0A`. 1442 of 1480 landing elements have no shadow. Floating layers only (composer, popovers, dialogs, overlays).

**Overlays:** modal scrim `bg-black/80`, z-50. Landing: header `backdrop-filter: blur(24px)` over `rgba(246,246,243,.95)`; viewer header `bg-background/95 backdrop-blur-sm`.

**z-index ladder (app):** 10 viewer header / sticky; 20 popovers; 30 timeline image gradients; 40 timeline controls; 45 URL pill; 50 dialogs, banners, overlay; 65 announcement bubble; 1000 overlay gradient. Landing: header 50, recall panel 60.

**Textures (landing)**
- Hero lattice: very pale isometric cube/tessellation field; softened by `radial-gradient(58% 62% at 50% 42%, bone 0%, bone/.78 40%, transparent 80%)`.
- Square grid: `linear-gradient(to right, rgba(10,10,10,.035) 1px, transparent 1px), linear-gradient(rgba(10,10,10,.035) 1px, transparent 1px)`.
- Dot grid: `radial-gradient(circle, rgba(10,10,10,.07) 1px, transparent 1px)`; finer `rgba(10,10,10,.1) 0.6px`.
- Crop/registration marks at section/header corners; 1px `rgba(10,10,10,.12)` frames; header becomes an inset, outlined, corner-marked bar after scroll. [INFERENCE: reads as print proof / instrument panel.]

---

## 4. Spacing and layout

### 4.1 Landing
| Region | Measure |
|---|---|
| Tailwind container | `padding 0 2rem`; max 1400 at ≥1400 |
| Header | fixed, z-50, 65px tall, `rgba(246,246,243,.95)`, blur 24px, 32px side padding; ≤1024px → 40×40 outlined hamburger |
| Hero | outer max 896px; padding 128/24/96; 641px tall at 1440 |
| Logo band | max 1200px; 24px side, 36px vertical; 284px tall |
| Content sections | inner max 1152px; padding 64/24 (48/24 small) |
| Section header copy | max 768px; titles max 672px |
| Studio section | padding 72/24; content max 1264px; intro grid 638.64 + 555.34, 70px gap |
| Capability grid | 3×2 ≥1024, 2 col at 768, 1 col at 390; cards ≈357×313; col gap 16, row gap 24 |
| FAQ list | max 880px |
| Footer | max 1440px; side padding 32/24/16; CTA grid padding 80px 0, gap 64, `minmax(0,1fr) auto` |

Breakpoints: 640 / 768 / 1024 / 1280 / 1536 + 1400 container; custom 600, 639, 850, 1100.
Section order and heights at 1440: header fixed · hero 641 · logo marquee 284 · overview video 834 · AI comparison 999 · Studio 1196 · capabilities 955 · testimonial wall ~2800 · centre CTA 458 · FAQ 1380 · footer ~980. Total ≈10,527px (≈16,523px at 390).

### 4.2 App shell
| Item | Value |
|---|---|
| Root | `flex h-screen min-h-0 overflow-hidden`; html/body overflow hidden |
| Sidebar | default 240px (15rem), user-resizable, `border-r`, top padding 32px (28px fullscreen); 6px hit target on seam with 1px hover line; width transition 300ms |
| Drag region | top 32px |
| Settings header | `px-6 py-3 border-b`, top pad 32; body `p-6`; opaque |
| Chat rail | `max-w-4xl` (896px), `px-5 sm:px-6 py-4 space-y-4` |
| Sidebar vibrancy | macOS only; fills white 8% (light) / 6% (dark) |
| Windows | main 1200×850 (macOS hidden title + overlay titlebar); search 680 wide (min 600) × 80; viewer 720×600 (min 400×300) with 40px header and 78px traffic-light pad; pipe 1200×850; login 460×700; shortcut reminder transparent/undecorated/always-on-top |
| Tray | white template PNG, left-click menu |
| Density | nav rows 32px min; controls 32px; inputs/buttons 40px |

---

## 5. Components

### 5.1 App primitives (shadcn "default", Radix, CVA, `tailwindcss-animate`, `@tailwindcss/typography`)
- **Button:** h-10 px-4 (default), h-8 px-3 (sm), h-11 px-8 (lg); mono + `tracking-wide`; 6px radius; 1px border; 150ms `transition-all`. Primary/outline hover = colour inversion; secondary/ghost hover = accent fill; link variant underlined; focus = 1px ring.
- **Input:** 40px, mono, 6px radius, border-colour change on focus (→ ink).
- **Card:** 8px radius, 1px border, no shadow; header padding 24px.
- **Dialog:** `max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg`; centred; 150ms opacity fade only (so the centring transform isn't overwritten); scrim `black/80`; title 18px semibold.
- **Alert:** 8px radius, 1px border, p-4, absolute icon at left-4/top-4.
- **Keycap:** 10px medium, e.g. `↑↓ navigate · ⏎ go to timeline · Esc back · ⌘⏎ ask AI`.
- **Scrollbars:** hidden globally; `.scrollbar-minimal` 8px, transparent track, thumb foreground 40%/60% hover, radius 4px.
- **Selection:** disabled globally except inputs/contenteditable/prose.
- **Focus:** 1px ring (app); landing 2px solid foreground outline with 2–3px offset (or −2/−4px inset).
- **Icons:** Lucide, 14px in rows, 16px in buttons.
- **Toasts, popovers, dropdowns, command palette, tabs, switch, slider, progress, skeleton (`bg-muted animate-pulse`), tooltip:** standard shadcn on the token set above.

### 5.2 App surfaces
- **Sidebar nav row:** min-h-32, gap 10px, `px-10 py-6`, 6px radius, transparent border, 150ms colour transition, 1px inset signal focus ring. Selected: border + card fill + 2px signal rail on the left (inset 4px top/bottom). Idle: muted text, `card/50` hover. Draggable on Y only (`opacity .9`, shadow-md, grip swap on hover, move/hide/reset menu). Footer: `border-t pt-2`, 14px icons, 12px medium text, 32×32 help button.
- **Settings:** left rail with grouped nav (10px medium tracked captions, 12px labels); rows `px-3 py-2 rounded-lg`; selected `bg-card shadow-sm border`; search popover min 320px; dense near-square control matrix with black toggles.
- **Search/command palette:** scope switcher `rounded-lg bg-muted/60 p-0.5`, tabs `h-7 min-w-58 rounded-md px-2.5 text-xs` (active: `bg-background shadow-sm`); 11px source chips; `⌘K` palette ("Type a command…", empty "No matching commands").
- **Chat:** user bubble right-aligned, max 82% width, `rounded-lg bg-muted/60 px-4 py-3 text-sm`. Composer `rounded-lg border bg-input`, focus `border-signal ring-1 ring-signal/15`, floating shadow, edge-masked scroll text, 32px control row at 12px. Attachments 64px high, max 240px, 40px preview, 20px circular destructive remove.
- **Live-turn glyph (phosphor):** 3×5 grid of 3px squares, 1px gaps; inactive `trace/45`; active phosphor with 1px inset phosphor-ink/60 ring; advances every 100ms (200ms while writing). Disclosure reveals a vertical spine with 5×5px phase nodes: current = phosphor, ended = foreground/50, future = trace; 10px mono labels. `LiveSignal`: 10×10px, 7-frame Unicode spinner at 140ms.
- **Timeline (rewind):** embedded bg-background / standalone black; 80px top + 64px bottom black→transparent gradients; controls z-40; URL pill `rounded-full bg-black/70 backdrop-blur-sm border-white/10`, 12px mono; skeleton 84/192px; empty state 96px icon zone with three 2px ping rings (`primary/20,30,40`, 3s infinite); smooth navigation 1000ms.
- **Onboarding/first-run:** ≤32rem centred column; segmented progress `max-w-sm`, 3px bars, 9px mono, 0.04em tracking; first-run card 360px, `border-foreground/20 shadow-lg p-5` over 55% scrim, enters opacity 0/y+12 → 1/0; 6px status dot; 10px tracked mono overline; copy "You're all set" / "Show me · 30 sec" / "I'll explore" / 9px note; learning banner with 8px square signal and 9px mono at 0.2em; next-step rows `grid-cols-[2rem_1fr] border-t px-4 py-3` with 32px icon squares.
- **Announcement bubble:** 340px, square, `shadow-lg shadow-black/10`, 150ms zoom-in-95 + fade.
- **Notification inbox:** 8px radius, `bg-popover shadow-lg`. **Update banner:** Sparkles icon, 12px text, 28px actions.
- **Pipe store:** permission rows with 14px Lucide icons ("Screen text (OCR)", "Audio transcripts", "Raw SQL", …); tab row 40px, 24px gap, bottom border.
- **Error page:** forced dark `bg-neutral-950`, 64px logo at 60% opacity, 18px medium title, 6px-radius buttons.

### 5.3 Landing components
- **Header:** mark + mono wordmark; Pricing, Enterprise (36px tall, 12px h-padding, 6px radius, 4px gap); Sign in; black Download (40px, 16px h-padding, 6px radius, `1px solid #0A0A0A`, sans 14/20 600, shadow-sm). Hover (declared): inverts to bone fill + ink text, translateY −2px, 300ms ease-out; 2px ring with 2px offset on focus. Enterprise page swaps right CTA to "Book a demo".
- **Primary CTA:** 320×56, 24px h-padding, 12px icon gap, 8px radius, 1px ink border, ink fill, bone text, mono 16/24 700 −0.4px, shadow `0 4px 10px -2px .1`. Hover (observed): inverts to bone fill/ink text over 150ms `cubic-bezier(.4,0,.2,1)`.
- **Secondary CTA:** 320×48, transparent, `1px solid rgba(10,10,10,.7)`, 8px radius, mono 14/20.
- **Hero proof:** orange square Y + "Backed by Y Combinator" (mono). On ≤768px the download button is replaced by an email form ("Send the desktop download link", black "Email me the download link").
- **Logo marquee:** two lanes of 82px; items 200px wide, 12px gap; monochrome via `filter: brightness(0)`; lane 1 drifts 48s linear infinite, lane 2 56s reverse; mask `linear-gradient(90deg, transparent, black 8%, black 92%, transparent)`; flanking 64×1px rules around 12px mono title "Used by teams and people at".
- **Video:** 1024px 16:9 poster, thin outline, 8px radius, large white circular play button.
- **AI comparison:** provider toggles (Claude / ChatGPT) 40px, pill, selected white + `shadow 0 1px 2px .05`; mode toggle (With / Without screenpipe) ink fill + bone label (selected) vs `#666`; mock window 1024×700, 8px radius, `1px rgba(0,0,0,.1)`, shadow `0 8px 32px -20px .2`, ~190px sidebar, 56px header, evidence chips, "3 sources" chip, outlined composer; toggles use `aria-pressed`.
- **Studio (interactive workflow demo, 1264×883):** white, `1px rgba(10,10,10,.18)`, 8px radius, no traffic lights. Toolbar 57px (`padding 14px 22px`, gap 16) with brand, divider, org name, and mono 10/15 "Interactive example · Sample data". Sub-bar 57px with underlined tab and black 11/16.5 button (6px radius, padding 8/12). Workspace grid `228 / 722 / 312`, 680px high. Left list (`rgba(246,246,243,.6)`, padding 24/14): selected card 199×113, white, `1px rgba(10,10,10,.35)`, 6px radius, padding 15/10. Centre: pale dotted canvas; nodes 228×41, white, 6px radius, `1px rgba(10,10,10,.25)` (selected: ink), 11/16.5 sans, padding 11/12, 10px icon gap; thin grey arrows; branch labels ("Amounts match?" Yes/No · exception); built on React Flow. Right evidence panel 312px (padding 22/20): record card 271px, bone doc bar, 9/13.5 label, status chip ("Needs review"), 4px-radius bone note (12px padding); bottom 88px opportunity strip (bone, 20/24 padding, 40px outlined icon tile, review CTA). Mobile: stacks; workflow choices become a horizontal row.
- **Capability cards:** framed illustration panel ≈357×192 (soft off-white, thin border, 6px radius) → mono uppercase category (OWN / CAPTURE / RECALL / CONNECT / CONTROL / DEPLOY) → 18/28 sans title → serif body on page background. Colour appears only inside panels.
- **Recall popover:** `min(880px, 100vw − 32px)`, 12px radius, `0 12px 48px rgba(0,0,0,.18)`, z-60; thumbnail "mini film" strip; scrubber cursor `ew-resize`, 2px focus outline offset 5px; text "Scroll down to rewind. Scroll up to return."; labelled fictional.
- **Testimonial wall:** lowercase heading; X-post screenshots; three groups with uppercase tracked mono labels over rules; three-column masonry of thin-outlined quote cards (serif quote, divider, bold sans attribution, mono org).
- **Centre CTA:** huge outlined wordmark with "waterline" clip-path reveal; 36/40 headline; mono platform line.
- **FAQ:** Radix accordion, white rows, thin border, soft corners, 51px collapsed row, chevron, first open; three groups (THE PRODUCT, GETTING USEFUL WORK BACK, FOR TEAMS).
- **Footer:** white, 1px top rule; 60/60 closing CTA; brand block with tagline and four small trust badges (SOC 2 Type 2, HIPAA, GDPR, CCPA); six link columns with mono 12/16 uppercase 500 headers (1.92 tracking, 20px bottom margin) and small grey serif links; "Ask AI about this page" row; legal + seven social icons.

---

## 6. Motion

**Principles (their own):** fast (150ms standard), minimal, causal, secondary; critique with reduced motion; provide a complete static state.

### 6.1 App
| Animation | Timing |
|---|---|
| Button hover / dialog / page transition | 150ms |
| Dialog fade | 150ms ease, opacity only |
| Accordion | 200ms ease-out |
| Sidebar width | 300ms |
| `pulse` | 2s `cubic-bezier(.4,0,.6,1)` infinite, opacity 1→.5→1 |
| Shimmer | 1.5s linear, background-position −200%→200% |
| Owned-browser load bar | 1.1s ease-in-out, translateX −100%→400% |
| Meeting listening sticks | `scaleY .3↔1`, inline duration + negative delay |
| Flow dot | 1.8s ease-in-out, left 0→calc(100%−3px) |
| Stepped pixel loops (brand/onboarding/pipe thinking) | `steps(n,end)`: packet 1.2s ×8, scan 1.5s ×6, core 600ms ×2, cursor 800ms ×1, flood 1.6s ×1, mobius 1.6s ×8, shut 1.4s ×6, waterfall 1.8s ×8 |
| Star-session pulse | 300ms ease-out, scale .65→1.15→1 |
| Startup loader | gather 4s `cubic-bezier(.4,0,.2,1)`, focus 4s ease-in-out infinite, reveal .9s ease-out, fragment delay index×−0.13s |
| Reduced motion | global `*{animation/transition-duration:.01ms; iteration-count:1; scroll-behavior:auto}` plus per-component static fallbacks |

Brand loop vocabulary (PR/brand assets, not for reuse): square-framed pixel animations named tessellate, lattice, mobius, scan, fork, shutter, waterfall, xor, stairs, meet, cycle; bone (light) or black (dark) field, dashed square frame, tiny mono caption (e.g. "E TESSELLATE", "LOOP — MÖBIUS"), exactly one lime phosphor cell/mark.

### 6.2 Landing
| Element | Behaviour |
|---|---|
| Hero (`sp-home-enter`) | 600ms `cubic-bezier(.16,1,.3,1)`, opacity 0→1, translateY 8→0; delays title 80ms, subtitle 150ms, CTA 230ms |
| Header | `fade-in` 300ms after 600ms delay (translateY −10→0) |
| Heading reveal | 700ms same curve; opacity .65→1, translateY 10→0, `clip-path inset(0 0 35%)→inset(0)`; 64×1px underline scales X over 550ms after 150ms |
| Card reveal | 600ms, translateY 12→0, opacity .55→1, delay `var(--sp-stagger)` |
| Logo marquee | 48s / 56s linear infinite, translateX −50% |
| Transfer dots | 5×5px, 32px travel, 3.6s ease-in-out, delay i×.45s, visible 25–70% |
| Scan line | 2px, 4.8s ease-in-out, fades in by 20% / out by 85% |
| Audio bars | 3px wide, 4px gap, `scaleY .3→.95`, 1.3s alternate, delay i×−.17s |
| Redaction | cover `scaleX .05→1→.05`, 5s ease-in-out; second line delayed 350ms |
| Provision | `scale .6→1`, opacity .15→1, 5.4s |
| Studio build | packet (left 0→calc(100%−7px)), scan (translateY 0→25px), core (opacity .18↔1), cursor (blink) |
| Ink link | underline `background-size 0→100%` 180ms ease-out; also on focus-visible |
| Ink button | ::after sheen (`linear-gradient(110deg, transparent 25%, currentColor 50%, transparent 75%)`, opacity .12) translateX −130%→130% in 650ms `cubic-bezier(.16,1,.3,1)` on fine-pointer hover/focus-visible |
| Surface cards | hover shifts dot-grid position to 12px 12px and fades pseudo-elements in |
| Recall mini film | transform/border-colour 400ms; active lift translateY 2px→−5px; indicator left 600ms |
| FAQ | height 200ms ease-out; chevron 180° in 200ms `cubic-bezier(.4,0,.2,1)`; row colour 150ms |
| Studio buttons | background/border-colour .15s; hover border → foreground |
| Waterline wordmark | clip-path polygon wave rising from 90% → 0 |
| Reduced motion | disables hero/reveal/rule-draw/sheen/illustration animation; marquee → static 3-col grid (2-col ≤639px); redaction held at `scaleX(1)` |

Easings in use: `cubic-bezier(.16,1,.3,1)` (expo-out) for reveals; `cubic-bezier(.4,0,.2,1)` for UI (85 elements); `ease-out` for 180/200ms; `ease-in-out` for illustration loops. Transition-duration tally: 0.15s ×66, 0.18s ×62, 0.2s ×14, 0.3s ×6, 0.4s ×8, 0.5s ×4, 0.6s ×1.

Interactions (all labelled as sample/fictional data): With/Without toggle and Claude/ChatGPT chrome swap, workflow switch (supplier invoice / customer handoff / weekly report), "Review this opportunity" → evidence panel flips to a proposal with "Return to evidence" / "Back to source", recall scrubber + thumbnail popover, integration carousel (Slack / Teams / HubSpot, prev/next).

---

## 7. Iconography, imagery, brand assets

- Icons: Lucide on both surfaces; real third-party logos in full colour inside integration tiles; customer logos forced mono via `brightness(0)`.
- Mark: pixel-scanline vector of an isometric/Escher-like diagonal form; app icon is the mark in ink on a bone rounded square (`rx` = 48/256 ≈ 19%).
- Favicon set: 16px `favicon.ico`, `icon.svg` (256 viewBox), 180px apple-touch icon; theme-color `#FFFFFF` (light) / `#000000` (dark).
- OG image 1200×630: bone canvas; black mark + wordmark top-left; large black sans headline; serif supporting copy; tiny mono domain; greyscale isometric architectural maze filling the right half.
- Imagery: real screen thumbnails, X-post screenshots, editorial video poster (not device-bezelled), monochrome logo wall. No stock photography. Product proof precedes explanatory diagrams.
- Structural motifs: dashed square frames, crop marks, dotted/grid canvases, 3×5 pixel scan glyph, tessellated/lattice/möbius pixel art, one lime accent cell.

---

## 8. Voice and copy patterns

- App: sentence case, direct, no marketing fluff ("Screen recording is off", "Building Your Memory", "Timeline crashed", "Memory paused", "You're all set"). Overlines are tracked mono caps. No forced casing via CSS.
- Landing: lowercase brand name ("screenpipe"), plain verbs ("Search what you've seen or heard…", "Raw history stays local by default."), literal-question FAQ headings, explicit sample-data disclosure ("Interactive example · Sample data"), human-in-control framing ("Keep payment approval with you."), mono eyebrow + sans headline + serif body trio, footer tagline "Turn what people know into what computers can scale."
- Principle: show source, trigger, action, destination and user control; avoid surveillance language and claims that remove human agency.

---

## 9. Other site pages (same system or divergent)

| Page | Notes |
|---|---|
| /enterprise | Same header, "Book a demo" CTA, Space Grotesk 76/76·500 H1, uppercase mono kicker, large preview |
| /pricing → /onboarding | Three cards (Free $0, Basic $21/mo, Business $42/seat/mo), annual/monthly switch, Business has heavy black border |
| /how-to-install | Installer pills (Mac Apple Silicon / Intel, Windows, Windows ARM, Linux), 3-step illustrated instructions |
| /blog, post | 3-col thin-bordered cards; centred serif reading column |
| /changelog | Standalone narrow column, vertical release timeline, mono uppercase section labels |
| /privacy | Standalone legal doc; H1 `#111827` (off-system) |
| 404 | "404" 96px at `rgba(10,10,10,.1)`, black + outline buttons |
| docs | Separate Mintlify shell on docs.screenpipe.com: dark `#0A0A0A`, H1 `#E0E0E0`, Space Grotesk 36 |

Tech stack observed: landing = Next.js App Router, Tailwind 3.4.19, Radix, React Flow, Lucide, ~45 JS chunks, 3 CSS files (≈258 kB main). App = Next.js + Tauri, Tailwind 3 + shadcn default/gray, Radix, CVA, `tailwindcss-animate`, `@tailwindcss/typography`, `framer-motion` (legacy import, `MotionConfig reducedMotion="user"`), TipTap/ProseMirror.

---

## 10. Re-implementation starter (written from the values above; not Screenpipe source)

```css
:root {
  color-scheme: light;
  --background: 60 14% 96%;   --foreground: 0 0% 4%;
  --surface: 0 0% 100%;       --surface-2: 60 11% 93%;   --surface-3: 60 9% 89%;
  --card: 0 0% 100%;          --popover: 0 0% 100%;
  --muted: 60 11% 93%;        --muted-foreground: 0 0% 40%;
  --accent: 60 11% 93%;       --accent-hover: 60 9% 88%;
  --border: 60 9% 86%;        --ring: 0 0% 4%;
  --primary: 0 0% 4%;         --primary-foreground: 0 0% 100%;
  --signal: 0 0% 20%;         --signal-foreground: 0 0% 100%;
  --trace: 60 4% 45%;
  --phosphor: 77 100% 62%;    --phosphor-ink: 0 0% 2%;   --phosphor-mark: 77 90% 30%;
  --radius: .5rem;            /* lg 8px, md 6px, sm 4px */
  --shadow-sm: 0 1px 2px -1px hsl(0 0% 0% / .08);
  --shadow-md: 0 4px 10px -2px hsl(0 0% 0% / .10);
  --shadow-lg: 0 10px 24px -6px hsl(0 0% 0% / .14);
  --ease-ui: cubic-bezier(.4, 0, .2, 1);
  --ease-reveal: cubic-bezier(.16, 1, .3, 1);
  --dur-ui: 150ms;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-sans: "Space Grotesk", system-ui, sans-serif;
  --font-serif: "Crimson Text", ui-serif, Georgia, "Times New Roman", serif;
}
.dark {
  color-scheme: dark;
  --background: 0 0% 4%;      --foreground: 0 0% 96%;
  --surface: 0 0% 8%;         --surface-2: 0 0% 13%;     --surface-3: 0 0% 16%;
  --card: 0 0% 8%;            --popover: 0 0% 8%;
  --muted: 0 0% 14%;          --muted-foreground: 0 0% 64%;
  --accent: 0 0% 14%;         --accent-hover: 0 0% 18%;
  --border: 0 0% 20%;         --ring: 0 0% 96%;
  --primary: 0 0% 96%;        --primary-foreground: 0 0% 4%;
  --signal: 0 0% 72%;         --signal-foreground: 0 0% 4%;
  --trace: 60 4% 56%;
  --phosphor-mark: 77 100% 62%;
  --shadow-sm: 0 1px 2px -1px hsl(0 0% 0% / .24);
  --shadow-md: 0 4px 10px -2px hsl(0 0% 0% / .28);
  --shadow-lg: 0 10px 24px -6px hsl(0 0% 0% / .34);
}
```

Font sources (all SIL OFL via Google Fonts): Space Grotesk (static 400/500/700), IBM Plex Mono (400/500/600), Crimson Text (400/600/700). Self-host the files for any deterministic render; do not rely on remote font fetches.

Design-checklist distilled from the source material: sentence-case labels; 1px solid borders; flat unless the surface floats; radius 8/6/4 by tier and 0 for structural geometry; composition mostly ink/bone/trace; every phosphor use marks something executing *now*, uses ink foreground, and disappears when execution stops; ready/selected/focus use neutral signal; state must be understandable without colour; 150ms transitions; hover = colour inversion for primary actions; product proof before explanatory diagrams; check light/dark, empty/loading/success/warning/error/disabled/hover/focus, and reduced motion.

---

## 11. Evidence limits

- App: source inspection only. Nothing was rendered; PR GIFs and committed screenshots may show earlier builds; notification-panel presentation not fully verified; `public/animations/*.json` contents not inspected.
- Landing: reduced-motion emulation was unavailable in the capture browser (rules read from CSS); per-card reveal stagger, integration-switch timing, video autoplay behaviour and individual Studio run/node transitions were not measured; dark mode was not capturable because the page does not switch. Mobile full-page capture showed a stitching artifact; section captures were used instead.
- Counts (class prefixes) are lexical matches across 382 non-test `.tsx` files, not rendered nodes or visual area. Landing tallies cover 1480 DOM elements including hidden/repeated ones.
