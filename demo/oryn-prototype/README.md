# Oryn prototype

Vite + React 18 + TypeScript + Tailwind 3.4 + shadcn/ui (Radix) + Lucide + class-variance-authority + `@xyflow/react`, managed with `bun`.
No backend, no network calls. Film state is a pure function of fixtures and an integer frame at **30 fps**.

```sh
bun install
bun run dev         # http://localhost:5173
bun run typecheck   # tsc for src/ and for the config files
bun run lint        # eslint; also bans timers, rAF, Math.random and Date.now
bun run build       # typecheck, then a relative-base static build in dist/
```

Render state is selected by query string: `?theme=light|dark`, `?mode=app|film`, `?frame=<int>`, `?running=1`, `?reduced=1`, `?view=foundation|controls|overlays|composites|film-runtime`, `?open=role` (controls view: role menu starts open).
`mode=film` is the 1280x720 authored canvas; `mode=app` is fluid. Unsupported values fall back to the default.

## Anchors for timelines and capture

- `#product-root` (also `[data-product-root]`): carries `data-theme`, `data-mode` and `data-fonts`.
- `window.__ORYN_FONTS__` and `<html data-fonts>`: `loading` | `loaded` | `unavailable`. A capture must wait for `loaded`.
  In `mode=film` the content stays `visibility: hidden` while loading, and an `unavailable` face replaces the content with a diagnostic (`[data-fonts-diagnostic]`, `role="alert"`).

## Fonts (CMP-02)

Ten self-hosted WOFF2 faces, one real upstream file per weight, no variable fonts, no `local()` sources, no remote font URLs.
All three families are SIL OFL 1.1.

| Family | Weight | File |
|---|---:|---|
| IBM Plex Mono | 400 | `public/fonts/IBMPlexMono-Regular.woff2` |
| IBM Plex Mono | 500 | `public/fonts/IBMPlexMono-Medium.woff2` |
| IBM Plex Mono | 600 | `public/fonts/IBMPlexMono-SemiBold.woff2` |
| IBM Plex Mono | 700 | `public/fonts/IBMPlexMono-Bold.woff2` |
| Space Grotesk | 400 | `public/fonts/SpaceGrotesk-Regular.woff2` |
| Space Grotesk | 500 | `public/fonts/SpaceGrotesk-Medium.woff2` |
| Space Grotesk | 700 | `public/fonts/SpaceGrotesk-Bold.woff2` |
| Crimson Text | 400 | `public/fonts/CrimsonText-Regular.woff2` |
| Crimson Text | 600 | `public/fonts/CrimsonText-SemiBold.woff2` |
| Crimson Text | 700 | `public/fonts/CrimsonText-Bold.woff2` |

- Licences and attribution: `public/fonts/licenses/` (`OFL-IBM-Plex.txt`, `OFL-Space-Grotesk.txt`, `AUTHORS-Space-Grotesk.txt`, `CONTRIBUTORS-Space-Grotesk.txt`, `OFL-Crimson-Text.txt`).
- Provenance and sha256 checksums: `public/fonts/PROVENANCE.md`. The files are a verbatim copy of `demo/video/stage-kit/assets/fonts/` (PRE-02).
- `@font-face` declarations: `src/styles/fonts.css`. Face manifest and loader: `src/fonts/faces.ts`. Keep the two identical; a drift shows up as an unavailable face.
- `font-synthesis: none` is set globally, so a missing weight is never faked.
- `U+2318` (command key) is missing from all ten faces. Draw it as inline SVG or write `Ctrl K`/`Cmd K`; never let the browser fall back to a system font.
- Crimson Text has no `tnum` feature. Put numbers in IBM Plex Mono (monospaced) or Space Grotesk (`tnum`).

## Tokens and type (CMP-01, CMP-02)

- Colour tokens: `src/styles/tokens.css` (light and dark), mapped to Tailwind names in `tailwind.config.ts`. Arc cyan (`arc`) is execution-only.
- Type scale: `src/lib/type-scale.ts` is the single source. Use the `type-title|section|card|body|prose|data|micro` classes. The smallest size is 11px.
- Radii 0/4/6/8, 1px hairlines, floating shadows `sm|md|lg` only. There is no stage hard shadow in the product layer.
- Neutral unknown hatch: `src/components/ui/hatch.tsx` (`theme`, `light`, `dark`, `neutral`). It has no children, so it can never sit behind text.
- Execution orbit: `src/components/domain/orbit.tsx`. The node angle is a pure function of the frame (54 frames per orbit at 30 fps).

The page at `/` is the Foundation specimen for these items.

## Basic controls (CMP-03 to CMP-08)

Specimen: `/?view=controls` (one frame scrubber drives orbit, typing and the film press).

| Item | Files | Film anchor (`data-anchor`) |
|---|---|---|
| CMP-03 Button | `src/components/ui/button.tsx` | `action-button` |
| CMP-04 Input, textarea, Field | `src/components/ui/field.tsx`, `src/lib/typing.ts` | `intent-field`, `deadline-field` (set by the caller) |
| CMP-05 Select, tabs | `src/components/ui/select.tsx`, `tabs.tsx` | `role-select` |
| CMP-06 Badge, status badge | `src/components/ui/badge.tsx`, `src/components/domain/status-badge.tsx`, `status-glyphs.tsx`, `src/data/status.ts` | `status-badge` |
| CMP-07 Dense table | `src/components/ui/table.tsx`, `table-row.ts`, `src/components/domain/case-table.tsx`, `audit-table.tsx`, `src/data/invoices.ts`, `audit.ts` | `case-table`, `audit-table` |
| CMP-08 Lifecycle stepper | `src/components/domain/lifecycle-stepper.tsx`, `orbit.tsx` (`OrbitNode`) | `lifecycle-stepper` |

- Anchors repeat when a component repeats; a timeline picks an instance by its own selector.
- Film press: `Button pressFrame` (frames since the click began) scales to .97 over 90 ms and holds; `null` is not pressed. Reduced motion: no transform.
- Disabled buttons use `aria-disabled`, so they stay focusable and `disabledReason` is read by assistive tech. `onClick` is not called while disabled or loading.
- Cyan (`arc`) appears only where `running`/`executing` is true: `OrbitNode`, `Orbit`, `StatusBadge status="running"`, `LifecycleStepper running`. A stopped running badge reads `Stopped` in neutral.
- `Orbit` (three rings) is for 32px and up. At 24px or less use `OrbitNode`, whose 1.5px ring stays visible.
- Case table selection is presentation only (`selectedId`); it never reads or writes an outcome.
- Audit rows are `{id, order, actor, action, object, scope, outcome}`; fields the source does not state are `null` and render as an em dash. No timestamps.
- Case table headers Invoice, Supplier, Amount and PO sort (none, ascending, descending) with `aria-sort`; default is fixture order so filmed rows stay pinned. The audit table is an ordered history and does not sort.
- Row `Open` only selects the row until the drawer (CMP-09) exists; it grants nothing.

## Approval, release and contextual cards (CMP-31 to CMP-37)

The `/?view=composites` specimen includes approval authority, regression results, limited rollout, version comparison, notifications, contextual guidance, and role selection.
Approval and independent readback are distinct events. A role selection is not a financial delegation.
The regression suite retains the original 28 scenarios and adds six cases; its completed result is 28 passed, six expected safe escalations, and zero failed.
The three watched rollout outcomes form a separate cohort from JOB-0117. Expansion requires independent evidence and owner authority.
Restoring an approved agent version applies to future jobs only; notification and HUD dismissal never resolve their underlying work.

## Shell, graph and privacy (CMP-38 to CMP-44)

The `/?view=composites` specimen includes a fixed shell, application capabilities, job metrics, an operations graph, meeting commitment, masked fields, and source attribution.
Navigation, search, notifications, transcript access, and identity selection use explicit grants; capability labels do not grant authority.
The meeting requires per-meeting opt-in. A deadline edit remains separate from confirmation, and unavailable quotation timestamps remain unknown.
The three protected fields accept no raw values and remain masked in light, dark, and reduced-motion views.

## Fixture data (DAT-01 to DAT-13)

Canonical local records live in `src/data/`. Money uses integer cents; unknown amounts are `null`.
Job approval and readback are separate, and incident rollout cases are not part of JOB-0117.
Scenario verdicts belong to their evaluated version. Notification and audit visibility require explicit lifecycle evidence.
These records describe fixture identities and a deterministic demonstration, not customers or live operation.

## Film runtime (RT-03, FRT-01 to FRT-03)

`src/film/` turns `film/<cut>/<clip-id>.timeline.json` into a frame view. `resolveFrame(timeline, frame, { reducedMotion })` sorts events by `(frame, seq)`, replays the reducer from the immutable initial state (`startAt` replays the canonical prerequisites of a phase), and derives camera, pointer, named anchors, outlines, typed text and the execution orbit from the frame alone. Nothing carries over between frames, so any seek order gives the same result.
`validateTimeline` is the authoring gate: sorted unique `(frame, seq)`, pointer travel 350-900 ms (11-27 frames), tip inside its named target through landing and hover, a click either matches a reducer action at its landing frame or is `inert`, scripted rejections must be rejected, typing 28-34 chars/s, and no pointer or typing on `liveFootage`.
`buildSidecar(timeline)` returns the `demo/video/clips/<cut>/<clip-id>.json` document: one pointer entry and one entry per anchor for every frame in 1280x720 authored CSS pixels after the camera; a hidden pointer or anchor is explicit with null coordinates.
Camera is `[x, y, zoom]`: the world point at the viewport centre and the scale; identity is `[640, 360, 1]`.
`useFilmClock()`, `FilmClockProvider`, `sampleMotion(start, frames, easing)(clock)` and `useSampledMotion` give components film time; `FilmOverlays` and `FilmTypedText` draw the pointer, click ring, outlines and caret in neutral ink, never the execution cyan.
Specimen: `/?view=film-runtime` (frame scrubber, reduced-motion toggle) plays `film/sample/runtime-check.timeline.json`.

## Capture (BOB-03d)

```text
bun run scripts/capture.ts --cut <hackathon|launch> --clip <clip-id>
bun run scripts/capture.ts --help
```

Reads `film/<cut>/<clip-id>.timeline.json`, builds the app, serves it on loopback and drives headless Chrome at 1280x720 CSS, DPR 2, locale `en-US`, timezone `America/New_York`, through `?view=film-capture&mode=film`. Frames 0 to `durationFrames - 1` each come from `resolveFrame(timeline, frame)` (fixture baseline plus every prior ordered event), so a reverse or out-of-order seek equals a linear capture. PNG frames pipe to ffmpeg and produce `demo/video/clips/<cut>/<clip-id>.mp4` (silent, 2560x1440, 30 fps, exactly `durationFrames` frames) and the same-name `.json` sidecar. Needs Chrome (`ORYN_CHROME`), ffmpeg (`ORYN_FFMPEG`) and ffprobe (`ORYN_FFPROBE`) on the machine. Output is written as `.partial` files and replaces accepted files only after every check passes; a failure prints `capture failed [code]: ...` and exits 1, usage errors exit 2.

Timeline fields the capture requires in addition to `validateTimeline`: `scene`, `filmStartFrame` (absolute film frame of local frame 0; local frames always start at 0) and an `entry` (`H-nnn` for hackathon, `L-nnn` for launch; `RT-nn`/`FRT-nn` for the `sample` cut) on every event. `durationFrames` must equal the roadmap length for the clip (`scripts/clips.ts`; the launch run is 525 frames and heal 615). Optional `assets` lists images under `public/` that must exist and decode before frame 0. A clip captures only if its screen is registered in `src/app/film-surfaces.ts`; each anchored element carries `data-film-anchor="<name>"`.
Optional `theme` (`light` default, or `dark`) sets the product theme for the whole clip; a mid-clip light-to-dark wipe (FX-01) is not captured by this script. The sidecar keeps the section 0.3 keys only: `scene`, `filmStartFrame` and `entry` stay in the timeline.

Sidecar (`coordinateSpace: "authored-css-1280x720"`, one sample per frame, final index `frameCount - 1`, `durationSeconds = frameCount / 30`):

```json
{
  "cut": "launch", "clipId": "lk-l9-run", "fps": 30, "width": 2560, "height": 1440,
  "coordinateSpace": "authored-css-1280x720", "frameCount": 525, "durationSeconds": 17.5,
  "cursor": [{"frame": 0, "x": null, "y": null, "visible": false, "phase": "hidden"}],
  "anchors": {"<anchor-name>": [{"frame": 0, "rect": {"x": 0, "y": 0, "width": 1, "height": 1}, "visible": true}]}
}
```

`cursor.x/y` are null while hidden; `phase` is `hidden|travel|press|hover|rest`; an anchor's `rect` is null with `visible: false` when hidden. Rectangles are after the camera. During the run each anchor's DOM `getBoundingClientRect` is compared with the sidecar at every frame (limit 1 CSS px) and the pointer tip within 0.1 px; after the pass the start, first-click, middle and final frames are re-seeked in reverse and must match their linear DOM digest and PNG hash. The encode is probed with ffprobe (no audio, `r_frame_rate=30/1`, 2560x1440, `nb_read_frames` equal to both the timeline and the sidecar).

`--cut sample --clip runtime-check` captures the fixture-backed runtime check (the `startAt: ST03` commitment with six anchors); it exists to prove the interface and is not a product frame. Its output stays out of git (`demo/video/clips/.gitignore`).

The capture digest compares a canonical serialisation of the canvas (attributes and `style` declarations sorted, an empty `style=""` dropped, React `useId` counters masked), not `outerHTML`: React lists attributes in the order it first set them and leaves an empty `style` after clearing a declaration, so the same frame reached by a jump would otherwise differ from the linear pass without drawing anything differently.

## Shell, consent and desktop (BOB-04)

`/?view=product` is the clickable product (`ProductApp`): one reducer, every screen a pure function of `state`. `?screen=SC12&state=ST02&actor=marcus&theme=dark` deep-links through the reducer's own guards; add `&mode=film` for the fixed 1280x720 canvas. `FilmProduct` renders the same `ProductScreen` from a resolved film frame, with no `dispatch`.

| Item | Files | Film anchors |
|---|---|---|
| SC12-FRAME shell | `src/product/Shell.tsx`, `destinations.ts` | `role-selector`, `role-option-<person>`, `search`, `command-palette`, `bell`, `navigation`, `nav-<destination>`, `breadcrumbs` |
| SC12 Home | `HomeScreen.tsx`, `destinations.ts` | `home-cards`, `card-approvals`, `card-incidents`, `card-verified-outcomes`, `card-recent-changes` |
| SC02 enrollment | `EnrollmentScreen.tsx`, `enrollment-layout.ts` | `notice`, `review-notice`, `understand`, `capture-consent`, `work-applications`, `visual-observation`, `sharing-consent`, `contribution`, `continue`, `back`, `decline` |
| SC03 My Privacy | `PrivacyScreen.tsx`, `privacy-layout.ts` | `exclusions`, `retention`, `masked-fields`, `privacy-pause`, `delete-local-history`, `delete-dialog`, `delete-confirm`, `delete-cancel` |
| SC01 + APP-12 desktop | `DesktopScreen.tsx`, `desktop-data.ts` | `tray-icon`, `companion-menu`, `pause-observation`, `my-privacy-link`, `excluded-window`, `excluded-cue`, `dock` |
| APP-11 browser | `BrowserFrame.tsx`, `AppViews.tsx` | `browser-tabs`, `tab-gmail`, `tab-netsuite`, `tab-tracker`, `tab-slack`, `tab-zoom`, `tab-hubspot` |

- Presentation state (`state.ui`: wizard step, notice disclosure, one open overlay, search query, delete dialog, browser tab and history, desktop foreground) lives in the reducer so the film replays it. It carries no business authority. `src/state/ui.test.ts` covers the guards: Accept and continue needs the acknowledged notice, Continue needs a capture category, sharing never substitutes for capture, declining never starts observation, deletion needs a confirm and removes local history only.
- A role selection is a viewpoint change. Navigation rows and Home cards follow the viewpoint (`destinations.ts`); a card the viewpoint may not read shows its reason, never figures. A destination the lifecycle has not reached is refused by the reducer (`OPEN_SCREEN`), and the refusal is shown.
- Anchors are rendered on every frame; one the current screen does not show is `display: none`, and the timeline mirrors that with an `anchor:<name>` overlay event. `scripts/author-product-clips.ts` derives those events from the rendered markup for every frame, so edit `src/product/clip-specs.ts` and run `bun run scripts/author-product-clips.ts` rather than the JSON; a test fails when the JSON drifts from its spec.
- Film timelines: `film/hackathon/hk-h4a-enroll.timeline.json` (H-057 to H-062, 180 frames, film frame 2460) and `film/launch/lk-l4-privacy.timeline.json` (L-035 to L-046, 360 frames, film frame 960). The launch clip's frames 270-359 (L-044 to L-046) are stage montage in the storyboard, so the product holds the My Privacy view with the pointer on `Delete local history`, never clicked. `film/sample/shell-tour.timeline.json` (270 frames) is a fixture-backed tour (role change, search, a refused Home card, all six browser tabs, and the SC01 excluded-window moment at frames 210-254: a blank window with `Excluded window — not captured` below it); it is not a storyboard clip, and the excluded-window state is in no storyboard clip because neither script entry shows it. No camera event, caption or stage typography is baked into any of them.
- The pointer is hidden during H-061 and L-040 to L-042, as the storyboard says; it keeps travelling while hidden so the next clip frame starts where the previous one ended.
- No idle cyan: passive observation uses neutral ink only. No network: the six app marks are bundled assets and every address is a fictional `.example` host.

## Work surfaces and meeting (BOB-05)

Original mock work applications (no real DOM, assets or copy; bundled marks only; fictional `.example` hosts) and two Oryn screens. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC05&actions=[{"type":"OPEN_MESSAGE","record":"INV-48231"}]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| APP-01 Gmail, APP-02 invoice documents | `src/product/apps/GmailView.tsx`, `InvoiceDocument.tsx`, `gmail-layout.ts`, `src/data/inbox.ts` | `inbox-list`, `inbox-row-inv-48219/-48231/-48210/-48203`, `message-pane`, `attachment`, `document-viewer`, `document-page`, `invoice-id`, `po-number`, `invoice-total`, `handling-fee`, `invoice-v1`, `gmail-back`, `gmail-compare-toggle`, `gmail-close-document` |
| APP-03 NetSuite bill and PO, APP-04 vendor record | `apps/NetSuiteView.tsx`, `erp-layout.ts` | `erp-bill`, `erp-po`, `erp-invoice-total`, `po-total`, `erp-variance`, `erp-status`, `erp-match-action`, `erp-stage`, `vendor-list`, `vendor-row-kestrel`, `vendor-row-brightwater`, `vendor-record`, `vendor-name` |
| SC04 HUD (reminder, peer fix, Guide Me) | `apps/Hud.tsx`, `erp-layout.ts` (`hudAnchorRects(placement)`) | `hud-reminder`, `hud-peer-fix`, `guide-me`, `guide-next`, `guide-back`, `guide-done`, `hud-dismiss` |
| APP-06 AP Exceptions Tracker | `apps/TrackerView.tsx`, `tracker-layout.ts` | `tracker-title`, `tracker-formula`, `tracker-grid`, `tracker-row-inv-<n>` and `tracker-cell-inv-<n>` for the six rows |
| APP-07 Slack `#ap-escalations` | `apps/SlackView.tsx`, `slack-layout.ts`, `src/data/slack-channel.ts` | `slack-channel`, `slack-message-inv-<n>`, `slack-link-inv-<n>`, `slack-case`, `slack-composer` |
| APP-08 Zoom meeting and per-meeting consent | `apps/ZoomView.tsx`, `zoom-layout.ts` | `meeting-consent`, `consent-action`, `consent-decline`, `recording-indicator`, `meeting-ended`, `tile-dana`, `tile-priya`, `meeting-quote`, `quote-dana`, `quote-priya`, `end-meeting` |
| SC11 meeting review | `src/product/MeetingReviewScreen.tsx`, `meeting-review-layout.ts` | `transcript`, `commitment-card`, `deadline`, `confirm-commitment`, `meeting-source`, `commitment-status`, `commitment-caveat` |

- One current record (`state.ui.app.record`) drives the Gmail message, its document, the NetSuite bill and the tracker/Slack references, so an identity and its evidence are never selected apart. The four contexts and their exact fixtures are in `src/data/work-records.ts` (INV-48219, INV-48210, D1 INV-48203, Kestrel INV-48231); an amount the source does not state is `null` and renders as an em dash, never inferred.
- `OPEN_SCREEN` for SC04 to SC09 brings that application's tab forward, and SC05 to SC09 are free from ST01: the work applications exist before Oryn observes anything (the problem montage shows the tray as `Observation off`). SC04 still needs the confirmed commitment (ST04).
- NetSuite status for INV-48219: `Variance Hold` until an authorized approval; `Awaiting verification` after it; `Matched - Variance Approved` only after an independent `VERIFY_READBACK` (`verified`). Approval alone never shows the verified text.
- Meeting: the recording indicator needs `recordingActive(state, 'priya')` (observation on AND this meeting consented) and the meeting not ended; quotations need the same, Dana first, then Priya. Declining, a generic Resume or an ended meeting leave capture off. SC11 keeps `Fri 17:00` (proposal, struck once edited) and the corrected `Fri 12:00` (editable `Due`) visible together; Confirm saves any draft first and enters ST04, whose route is SC13 (BOB-06), so the clickable app moves to Workflow Discovery. The film holds the confirmed review for its storyboard beat (H-068, L-055) with an explicit `OPEN_SCREEN SC11` cut in the clip spec. `confirm-commitment` stays visible as a disabled `Confirmed` control so the pointer's target survives the click.
- SC04: `hudKind(state)` picks the single card. The reminder needs the confirmed commitment AND the Kestrel vendor record open in NetSuite and reads `commitment.confirmedDue`; the peer fix belongs to route SC04. Dismissing hides that card only; opening the Kestrel record again shows it once more. Guide Me advances only by explicit Next/Back/Done and resolves nothing. `ui.app.hud` also holds `placement` (`upper` `[900,148,320,144]` or `lower` `[900,430,320,144]`) and `motion` (`short` 150 ms / 10 px vertical for the hackathon cut, `long` 500 ms / 20 px horizontal for the launch cut).
- Pointer targets: a `target` anchor must stay visible, with the pointer visible, until the next pointer event. A placed pointer (`duration: 0`, a hard cut) is exempt from the continuity rule; a click on a control that disappears after the click (an inbox row, a vendor row) names no target.

### Clips

Specs live in `src/product/clip-specs-work.ts`; regenerate with `bun run scripts/author-product-clips.ts`. Entries with no product action carry an explicit `cursor` hidden event so every storyboard entry appears in the timeline.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h2-problem` (ST01, no observation) | 780 | f0 Gmail INV-48210, pointer to the attachment, click opens the document (H-014); f60 NetSuite INV-48210 / PO-1031 / $6,240.00 (H-015); f90 tracker, f120 pointer hovers the INV-48210 row, f150 Slack (H-016); f180-419 hold, no pointer (H-017-H-020 stage cards); f420 NetSuite, inert click on `Match purchase order` at f439 (H-021); f480 hold (H-022); f540 Kestrel INV-48231 earlier and current layouts overlapping, fee outlined from f558 (H-023); f600-779 hold (H-024-H-026). H-025's three cropped windows reuse f40 (Gmail), f70 (NetSuite) and f160 (Slack). |
| `hk-h4b-observe` (enrollment replayed at f0: work apps only, sharing off) | 210 | f0 Gmail D1 INV-48203, click opens the document at f15 (H-063); f30 NetSuite D1 (no PO, no total), f48 tracker D1 cell focused for the Sheets crop (H-064); f60 Zoom, consent click f77, recording indicator after it (H-065); f90 Dana's quotation, no pointer (H-066); f120 SC11 proposal `Fri 17:00` (H-067); f150 typed `Fri 12:00`, saved at f162, Confirm click lands f173 (H-068); f180 Kestrel vendor record with the reminder `Fri 12:00` (H-069). |
| `lk-l2-chaos` (ST01) | 360 | f0 Gmail INV-48219, f15 document with a 150 ms outline on `$18,420.00` (L-009/L-010); f30 NetSuite bill, f45 tracker, f60 Slack, f90 Zoom pending consent, f105 NetSuite (L-011-L-016); f120 pointer, inert press at f132 (L-017); f150 hold, no pointer; f180-359 Gmail with the document open as the foreground invoice (L-018-L-024). Triptych and strips (L-019/L-020) reuse f20, f35, f45, f60. |
| `lk-l5-observe` (enrollment replayed at f0) | 360 | f0 Gmail inbox, row click f11, attachment f26 (L-047); f30 NetSuite D1 (L-048); f60 tracker, D1 cell focused f75 (L-049); f90 Zoom, consent f106 (L-050); f120 Dana, f150 Priya, no pointer (L-051/L-052); f180 SC11, deadline typed from f220 (L-053/L-054); Confirm lands f255 (L-055); f270 vendor list, click f282 opens the record, reminder at the lower edge entering over 500 ms (L-056); f300-329 hold (L-057 stage); f330-359 SC13 `Needs Review`, pointer enters from (1100, 420) (L-058, BOB-06). |

Camera moves, captions and every stage composition stay out of the clips. The Gmail, NetSuite, tracker, Slack and Zoom surfaces are the same components the clickable app renders.

## Discovery and playbook (BOB-06)

Three Oryn screens and one drawer, in the organizational shell. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC14&state=ST04&actions=[…]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| SC13 Workflow Discovery | `src/product/DiscoveryScreen.tsx`, `discovery-layout.ts` | `candidate-row`, `demonstrations`, `demo-row-d1`/`-d2`/`-d3`, `discovery-filters`, `filter-all`, `filter-needs-review`, `filter-published`, `empty-state`, `empty-action` |
| SC14 candidate review | `CandidateReviewScreen.tsx`, `candidate-layout.ts` | `candidate-evidence`, `request-review`, `approve-contribution`, `candidate-title`, `candidate-confidence`, `candidate-uncertainty`, `demonstration-cards`, `demo-card-d1`/`-d2`/`-d3`, `proposed-steps`, `evidence-link-d1`/`-d2`/`-d3`, `rule-link`, `owner-review-status` |
| Evidence and rule drawer (SC14 and SC15) | `EvidenceDrawer.tsx`, `focus-trap.ts` | `rule-drawer`, `drawer-close` |
| SC15 playbook | `PlaybookScreen.tsx`, `playbook-layout.ts` | `playbook`, `publish`, `agent-factory`, `playbook-title`, `playbook-owner`, `playbook-status`, `playbook-steps`, `playbook-decisions`, `playbook-exceptions`, `playbook-evidence`, `rule-009`, `rule-017`, `demo-link-d1`/`-d2`/`-d3` |

`src/product/discovery.ts` holds the view decisions (who may read each screen, the reducer's own refusal text for a disabled control). Access only decides what a viewpoint sees and grants nothing: the Workflow Owner and the two contributors read SC13 and SC14, only the Workflow Owner reads SC15, and anyone else sees `Not available` with the reason and none of the evidence.

- State: `state.ownerReviewRequestedBy` (business) and `state.ui.discovery` (`filter`, `candidateSelected`, `demonstration`, `drawer`; presentation). New actions: `REQUEST_OWNER_REVIEW` (ST04; a contributor, once every contribution is approved, once only) and the presentation actions `SELECT_CANDIDATE`, `SET_DISCOVERY_FILTER`, `SELECT_DEMONSTRATION`, `OPEN_DRAWER` (`evidence`, `AP-RULE-009`, `AP-RULE-017`; from SC14 or SC15 only) and `CLOSE_DRAWER`. `PUBLISH` now also needs a requested owner review (new guard `ownerReview`); the canonical script requests it as Jamal, the last contributor to approve. Leaving SC14 or SC15, and publishing, close the drawer. SC15 is reachable at ST04 (the preview before `Publish`) and SC17 at ST05 (the Agent Factory button), the same one-state-earlier rule as SC19, SC21, SC27 and SC28.
- Contributor approval, owner review and publication are three separate actions. `Approve contribution` approves the current person's own Demonstrations, `Request owner review` only asks, and `Publish` (SC15, Workflow Owner with the `publish-playbook` grant) is the only action that publishes. Publishing is human guidance only: `Agent Factory` stays unavailable until then and only opens the factory; no agent version exists afterwards.
- `Approved for Guidance` is the neutral `StatusBadge status="approved"` (outlined shield with a check, ink colour), shown only after publication and fading in over 150 ms from the `PUBLISH` frame. Before it SC15 reads `Draft · Review pending` or `Draft · Review requested`.
- Confidence is the category `Confidence: Medium`, never a number, and `Variance exception rule: unverified until SME review` stays beside it with a warning triangle. SC13 says the three demonstrations are observations, not verified examples, and set no policy.
- The drawer is modal in the clickable app (focus moves to Close, Tab cycles inside it, Escape and the scrim close it, focus returns to the opener). In a film it is an opacity ramp so its rectangle never moves; there is no focus handling.

### Clips

Specs live in `src/product/clip-specs-discovery.ts` (shared builders in `clip-spec-kit.ts`); regenerate with `bun run scripts/author-product-clips.ts`.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4c-playbook` (`startAt` ST04) | 210 | f0 SC13, three rows, Priya's viewpoint, pointer travels to the candidate row (H-070); click lands f34 and opens SC14 (H-071); f60 pointer rests on `D1 · sanitized source` (H-072); f90 sidebar selector click lands f104, `Marcus Webb` chosen f116 (H-073); f120 AP-RULE-009 drawer opens f135 (H-074); f150 SC15 draft, `Publish` click lands f166 (H-075); f180 pointer on Evidence (H-076). |
| `lk-l6-discover` (`startAt` ST04, Marcus) | 480 | f0 SC14, D1 selected f15 (L-059); D2 selected f30, no pointer (L-060); D3 selected f74 (L-061); f90 SC15 draft, `Publish` lands f105 (L-062); f120-419 SC15 held, no pointer (L-063-L-072, stage ring); f420 SC14 `Confidence: Medium`, pointer on D1 (L-073); f450 SC15, pointer on AP-RULE-009 (L-074). |
| `lk-l5-observe` tail | 360 | f330 SC13 `Needs Review` (L-058): the pointer enters from (1100, 420) and reaches the candidate row at f352. Sharing is off in this cut, so the rows read `Observed`. |

At f0 both new clips replay the contributor decisions that precede the owner's review (Priya approves D1 and D2; Jamal turns his own sharing on, approves D3 and requests the owner's review). A contributor must share before approving and the earlier clips leave sharing off, so this is the one place a reconstructed prerequisite differs from the previous clip; the screens show each card's contribution decision.

## Agent definition and gates (BOB-07)

Two Oryn screens in the organizational shell, for the Workflow Owner. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC17&state=ST05&actions=[…]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| SC17 Agent Factory | `src/product/FactoryScreen.tsx`, `factory-layout.ts`, `factory.ts` | `intent`, `agent-sections`, `section-purpose`/`-inputs`/`-actions`/`-rules`/`-outputs`/`-stopping-points`, `unverified-branch`, `branch-evidence`, `continue`, `rule-drawer`, `drawer-close` |
| SC18 scope, risk, autonomy and release gate | `ScopeScreen.tsx`, `scope-layout.ts`, `factory.ts` | `scope`, `scope-team`/`-queue`/`-apps`/`-agent`/`-action`/`-authority`, `confirm-scope`, `autonomy-ladder`, `ladder-stage-0` to `-5`, `risk`, `risk-tier`, `tier-4`, `gate`, `gate-examples`, `gate-scenarios`, `gate-edge`, `gate-owner`, `gate-provenance`, `approve-release`, `open-simulator`, `deploy`, `rule-drawer`, `drawer-close` |
| Shared data | `src/data/agent-draft.ts` (sections, tiers, stages, scope), `src/data/gate.ts` | |

- State: `state.ui.factory.intent` (presentation) and the actions `SET_INTENT` (ST05 only, 280 characters at most) and the existing `CREATE_AGENT`, which now needs the demonstration intent (surrounding and repeated whitespace ignored) and the `create-agent` grant: a blank intent is refused with guard `intent` before the grant is checked. `DrawerKind` gained `examples` (SC18 only); the AP-RULE-009 drawer also opens from SC17. The canonical script sets the intent before it creates the agent. SC17 opens from ST05, SC18 from ST06.
- SC17 has four states: empty, typing (the film shows the typed prefix and caret from `film.texts.intent`; in the clickable app the field is a real textarea), generated (six sections and the unverified branch, v0.1, rows fading in 60 ms apart) and the source drawer. `Continue` is disabled with the reducer's own reason until the intent is valid; on ST05 it creates the draft and opens SC18, on the draft it only opens SC18. Enter in the field creates the draft. Nothing is cyan: generation is instantaneous, so there is no running state, and there is no model selector.
- SC18: every gate row is read from `gateChecks(state)` and is checked only by its own event: examples by approved contributions (plus the two archived SME-verified cases), the two scenario rows by a completed v0.2 evaluation, owner approval by `APPROVE_RELEASE`. `28/25` and `6/5` are requirements against suite coverage, not proof, so the scenario rows read `Pending` until the evaluation event. The header says `Satisfied` only when all four rows are checked. `Approve release` (owner), `Confirm scope` and `Deploy` each dispatch their own action; `Deploy` is disabled with the first unmet gate condition, then the reducer's own refusal (the owner approval, the confirmed scope and a start-job grant are all required; one job is not blanket approval of a Tier 3 action). Stage 3 is selected with a neutral rail, stages 4 and 5 are locked, and Tier 4 is a cross row with no handler. `Open Flight Simulator` opens SC19.
- Layout deviation: the inventory's right panel `[768,112,464,560]` cannot hold a 164 px risk block, a 324 px ladder with 54 px rows and a 200 px gate (688 px), so the ladder sits under the scope in the 32 px dense variant CMP-22 allows, and the right panel holds risk, gate and the release actions.

### Clips

Specs live in `src/product/clip-specs-agent.ts`; regenerate with `bun run scripts/author-product-clips.ts`. `ClipSpec.overlays` (new) carries overlay switches such as `caret:intent`.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4d-agent` (`startAt` ST05, Marcus) | 210 | f0 SC17 empty, pointer click lands f11 and focuses the field (H-077); typing from f12 at 34 characters a second, no pointer (H-078); the last character lands f87 and the same frame creates the draft, pointer hidden until f60 and travelling to where the branch appears (H-079); f90 SC18, pointer on the scope panel (H-080); f120 pointer on Stage 3 with the neutral selected outline (H-081); f150 no pointer, four gate rows (H-082); f180 pointer to the 5/5 row, the provenance drawer opens f192 (H-083). |
| `lk-l7-create` (`startAt` ST05, Marcus) | 540 | f0 SC17 empty, click lands f14 (L-075); typing from f30 at 30 characters a second (L-076 to L-078); intent in the reducer at the last character, draft created f120 (L-079); pointer on the unverified branch f150 (L-080); `Review evidence` lands f194, the AP-RULE-009 drawer names v0.1 and Elena Ruiz (L-081); f210 SC18 scope, pointer on the scope panel (L-082); f240-329 no pointer (L-083 to L-085); f330 pointer on the 5/5 row, hover only (L-086); f360-419 no pointer (L-087, L-088); f420 pointer on the action boundary (L-089); f450 pointer reaches `Open Flight Simulator` without pressing it (L-090); f480 cut to SC19 with the pointer travelling to `Run Evaluation` (L-091), the press lands f522 and the first evaluation runs from there (L-092, BOB-08). |

Conflict, not hidden: the intent is 84 characters (the inventory says 81) and needs at least 75 frames at the fastest permitted 34 characters a second after the click, so in `hk-h4d-agent` the generated rows have 3 frames (f87 to f89) before the storyboard's cut to SC18 at f90. Extending the clip is the owner's call (`scripts/clips.ts`, roadmap section 0.3). The gate is pending on every frame of both clips: only the examples row is checked, and the satisfied state belongs to the BOB-08 clips (H-091, L-105 to L-107).

Owner decisions for BOB-07 (recommendations accepted): `hk-h4d-agent` keeps 210 frames and the 3-frame generated rows; the SC18 layout stands; `CREATE_AGENT` stays restricted to the demonstration intent; Elena Ruiz is named in the drawer but is not a selectable viewpoint; `lk-l7-create` f480-539 is re-authored by BOB-08 with SC19. Hackathon typing runs at 34 characters a second (the storyboard says 32) so the intent completes at f87. The SC17 heading is the shared 28 px `type-title` (H-077 names 24 px), the intent fits one line (H-078 says two), and the pointer replaces storyboard hotspots with real anchors. The full deviation register, items (a) to (o), is in `docs/video/ROADMAP.md` under BOB-07.

## Flight Simulator and results (BOB-08)

Two Oryn screens in the organizational shell, for the Workflow Owner. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC19&state=ST06&actions=[…]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| SC19 Flight Simulator | `src/product/SimulatorScreen.tsx`, `SimTiles.tsx`, `simulator.ts`, `simulator-layout.ts` | `sim-version`, `sim-status`, `sim-progress`, `scenario-grid`, `run-scenarios`, `cancel-run`, `scenario-detail`, `safe-cases`, `safe-case-scn-023` to `-028` |
| SC20 results, replay, compare | `src/product/ResultsScreen.tsx`, `EvidenceDrawer.tsx` (replay), `simulator.ts` | `results`, `failed-scenario`, `result-detail`, `safe-results`, `safe-result-scn-023` to `-028`, `compare-versions`, `rerun`, `version-compare`, `equality-row`, `replay`, `replay-rule-link`, `rule-drawer`, `drawer-close` |
| Shared data | `src/data/simulation.ts` (28 scenarios, `COMPARATORS`, `CATEGORIES`, `SAFE_CASES`, `positionAfter`) | |

- State: `state.ui.simulator` (`view` grid or row stream, `runLabel` `Run scenarios` or `Run Evaluation`, `runFrames`, `runLead`, `compare`; presentation only) and the actions `SET_SIMULATOR`, `SET_COMPARE`; `SELECT_SCENARIO` now takes `null`; the drawer gained `replay` (SC20, only for SCN-022 once an evaluation is complete) and the AP-RULE-009 drawer opens from SC20. The reducer already routes on the phase: `RUN_SIMULATION` and `FIX_AND_RUN` land on SC19, `COMPLETE_SIMULATION` on SC20. `RUN_SIMULATION` and `FIX_AND_RUN` reset `runLead`; `FIX_AND_RUN` also clears the selection and the comparison.
- A verdict is read only from a completed run. Idle: 28 `Not Run` tiles. Running: tiles before the executing one read `Executed`, the executing one is the only cyan, the count is capped at 27 of 28 until `COMPLETE_SIMULATION`. Cancelled: the executed count freezes, the rest stay `Not Run`, nothing is a pass, the phase stays ST07 and the run can be started again. Finished: the run's own verdicts. After a failed v0.1 (ST08) SC19 is idle on the corrected v0.2: its run control binds to v0.2 (`FIX_AND_RUN`) and no verdict of v0.1 is carried across.
- Counts: v0.1 `21 Passed`, `6 Passed — Expected Safe Escalation`, `1 Failed`, `27/28 intended outcomes correct`; v0.2 `22 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`, `28/28 intended outcomes correct`. Both sum to 28. The six safe escalations are listed one by one and are never counted as failures. Exactly 2.00% auto-accepts (v0.2 comparator `> 2.00% requires approval`); v0.1's `≥ 2.00% requires approval` is the recorded bug and is never rewritten: the comparison reads the two completed runs independently and shows `Not Run` for a v0.2 that has not been evaluated.
- Replay and rule: the replay drawer (`[800,0,480,720]`) shows `Expected: accept` and `Actual: escalate` side by side with `> 2.00% requires approval`; its rule link replaces it with the AP-RULE-009 drawer, which repeats the scenario, both outcomes and the rule sentence (the unverified-branch warning belongs to the candidate review, not to the results). Closing returns to the same selected failure.
- Cyan exists only while an evaluation executes: the orbit in the status, the progress fill and the one executing tile or row. The clickable app has its own run clock in `ProductApp` (30 ticks a second from the run's start, then `COMPLETE_SIMULATION`); a film derives the same count from its frame, the landing frame of the run action and `runLead`.
- Layout: 96 x 52 tiles with 8 px gaps (408 x 412) centred in the 472 x 416 host (`[300,220,…]` on SC19, `[264,200,…]` on SC20); the launch row stream (`view: 'stream'`) is 28 rows of 19 px (30 px before BOB-12) clipped to the same host and follows the executing row.

### Clips

Specs live in `src/product/clip-specs-simulate.ts`; regenerate with `bun run scripts/author-product-clips.ts`.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4e-simulate` (`startAt` ST06, Marcus) | 240 | f0 SC19 idle, `Run scenarios` pressed, lands f15, the suite executes 15 frames (H-084); f30 `COMPLETE_SIMULATION` opens SC20 at 21 / 6 / 1, pointer to the failed scenario (H-085); f60 press lands f71 and opens the replay (H-086); f90 the rule link lands f105 and opens AP-RULE-009 (H-087); f120 drawer closed, `Compare versions` lands f135, v0.1 against the proposed v0.2 (H-088); f150 SC19 bound to v0.2, `Run scenarios` lands f165 (H-089); f180 v0.2 completes at 22 / 6 / 0, no pointer (H-090); f210 SC18, `Approve release` lands f222 and `Confirm scope` f234, `Deploy` enabled and not pressed (H-091). |
| `lk-l8-simulate` (`startAt` ST07, Marcus) | 480 | f0 the run begun in `lk-l7-create` continues (`runLead` 18 of 48 frames) as the row stream (L-093); f30 it completes, SC20 at 21 / 6 / 1 (L-094); the press on SCN-022 lands f90 and opens the replay (L-095, L-096); the rule link lands f135 (L-097); f150 drawer closed, SCN-023 selected at f164 (L-098); f180-239 no pointer (L-099, L-100); f240 `Compare versions` lands f255 (L-101); f270 SC19 grid bound to v0.2, `Run Evaluation` lands f284 and runs 16 frames (L-102); f300 v0.2 at 22 / 6 / 0 (L-103); f330 comparison, the pointer on the aligned equality row by f359 (L-104); f360 SC18 with the evaluation's two rows checked (L-105); `Approve release` lands f405 and `Confirm scope` f417 (L-106); f420-479 SC18 held, no pointer (L-107, L-108 is SC21, BOB-09's). |
| `lk-l7-create` tail | 540 | f480-539: see BOB-07; the simulator is drawn from f480. |

The gate on SC18 is checked by its own events: the examples row by the approved demonstrations, the two scenario rows by the completed v0.2 evaluation (v0.1's failed run never satisfies them), the owner row by `Approve release`. `Confirm scope` is a separate press (the reducer's `RELEASE_AND_START` needs it); neither clip presses `Deploy`, which now only opens the job queue (BOB-09; the job is started from SC21). SC18's `Confirm scope` button is 160 px wide (was 128) so its `Scope confirmed` state fits.

## Jobs, approval and unknown outcome (BOB-09)

Five Oryn screens in the organizational shell, read by the Workflow Owner and the Approver (`jobAccess`; any other viewpoint sees `Not available` with the reason and no anchor). Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC22&state=ST09&actions=[…]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| SC21 Jobs queue and `Confirm job scope` | `src/product/JobsScreen.tsx`, `focus-on-open.tsx`, `job.ts` | `jobs-queue`, `job-row`, `confirm-job-scope`, `confirm-selection`, `job-preflight`, `job-scope-dialog`, `start-job`, `cancel-job-start` |
| SC22 eleven-case job | `JobScreen.tsx`, `job.ts` | `job-progress`, `open-summary`, `job-table`, `case-row-inv-48210` to `-48220`, `approval-row`, `unknown-row` |
| SC23 approval drawer, SC24 unknown-outcome drawer | `JobDrawers.tsx` | `approval-drawer`, `approval-diff`, `approval-authority`, `approval-evidence`, `approve`, `reject`, `request-changes`, `readback`, `approval-close`; `unknown-case`, `unknown-hold`, `resubmit-unavailable`, `unknown-evidence`, `investigate`, `unknown-close` |
| SC25 job summary | `JobSummaryScreen.tsx`, `job.ts` | `job-summary`, `summary-status`, `summary-snapshot`, `summary-verified`, `summary-escalated`, `summary-approval`, `summary-unknown`, `summary-readback`, `open-cases` |
| Layout and view decisions | `job-layout.ts` (every rect and anchor list), `job.ts` (`caseRows`, `summaryCards`, `snapshotLabel`, `approvalView`, the refusal texts) | |

- Routes: SC21 is the `jobs` scene, SC22 to SC24 share the `job` scene (SC23 and SC24 are drawers over the SC22 table, so the table never moves) and SC25 is the `job-summary` scene. Every drawer opens and closes by `OPEN_SCREEN`.
- State: `state.ui.job` (`selection`, `dialog`, `startCancelled`, `filter`, `investigating`, `tip`, `evidence`, `snapshot`; presentation only) and the actions `CONFIRM_SELECTION`, `OPEN_JOB_SCOPE`, `CANCEL_JOB_START`, `SET_JOB_FILTER`, `SET_JOB_VIEW`. Starting is three separate events: `CONFIRM_SELECTION` (the frozen 11 invoices), `OPEN_JOB_SCOPE` (the `Confirm job scope` dialog) and `RELEASE_AND_START`, which now also needs that open dialog (guard `jobScope`) after the release gate and the start-job grant, so the confirmation precedes the run and a cancel (`CANCEL_JOB_START`) starts nothing. `Deploy` on SC18 now only opens the queue (`OPEN_SCREEN SC21`); the canonical script confirms the selection and opens the scope before it starts the job.
- Rows and counts: outcomes are `state.job.outcomes`, evaluated by `EVALUATE_CASE` in any order; the one running (cyan) row is the first still-queued row while `running.job`, and nothing is cyan after `PAUSE_FOR_APPROVAL`. Counts are `jobCounts(state)`: 7 / 2 / 1 / 1 once the eleven cases have an outcome. An approval sets the decision and `Awaiting verification` and moves no count; only the separate `VERIFY_READBACK` moves INV-48219 to verified (8 / 2 / 0 / 1). INV-48220 can be neither decided, read back nor retried, and no screen has a retry or resubmit control: `Resubmit unavailable` is a status line with an information icon, and the label is `Partially Complete`, never `11 successful`.
- SC25 snapshots: before the readback the cards read `Before approval` 7 / 2 / 1 / 1; after it `After approval and verification` 8 / 2 / 0 / 1, replaced together in one 150 ms opacity swap (no count-up) from the later of the `VERIFY_READBACK` and `SET_JOB_VIEW` landing frames. `snapshot: 'before'` keeps the time-stamped preapproval snapshot on screen after the readback (labelled `Earlier snapshot`), which the launch storyboard needs (L-122 shows it after L-118's readback). Clicking verified, escalated or approval sets the SC22 filter (rows outside it are dimmed in place, never moved) and opens SC22; the unknown card opens SC24.
- The clickable app evaluates the eleven cases one at a time and settles the job, and delivers the independent readback after an approval, with its own clock in `ProductApp.tsx`; a film replays the same actions from its timeline.

### Clips

Specs live in `src/product/clip-specs-job-hackathon.ts` and `clip-specs-job-launch.ts`; regenerate with `bun run scripts/author-product-clips.ts`. Selection, the start authorization, the decision authorization, the awaiting-verification interval (overlay event `job:awaiting-verification`) and the independent readback are separate timeline events at separate frames.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4f-job` (`startAt` ST09, Marcus) | 330 | f0 SC21 with the 11 invoices confirmed and the `Confirm job scope` dialog open (the Deploy press and the two confirmations are cuts: 30 frames cannot hold three presses), `Start job` lands f14 (H-092); f30 SC22, first row running, INV-48210 verified f45 (H-093); the other six verified by f72 (H-094); INV-48215 f96, INV-48218 f101, INV-48219 f108, INV-48220 f112 (H-095); f120 `PAUSE_FOR_APPROVAL` and SC25 at 7 / 2 / 1 / 1, cyan off (H-096); the press on the unknown card lands f161 and opens SC24 (H-097); f180 Daniel's viewpoint, the approval row lands f193 and opens SC23 (H-098); `Approve` lands f225, `Awaiting verification` (H-099); f240 SC25 still 7 / 2 / 1 / 1, `VERIFY_READBACK` f250 and 8 / 2 / 0 / 1 (H-100); f270 SC24 held, the pointer hovers `Investigate` (H-101); f300 SC05 Kestrel INV-48231 with the handling fee outlined (H-102). |
| `lk-l9-run` (`startAt` ST09, Marcus) | 525 | f0 SC21 preflight dialog, `Start job` lands f15 (L-109); f30 SC22, INV-48210 and -48211 f33-36 (L-110), -48212 to -48214 f63-69 (L-111), -48215 and -48218 f93-96 (L-112), -48216 and -48217 f123-126 (L-113); f150 INV-48219 and -48220, `PAUSE_FOR_APPROVAL`, Daniel's viewpoint, the approval row lands f165 (L-114); f180 evidence expanded (L-115); f210 the before and after diff (L-116); `Approve` lands f255 (L-117); `VERIFY_READBACK` f285 (L-118); f300 the unknown row lands f315 and opens SC24 (L-119); f330 `Investigate` hovered, the resubmission note f345 (L-120); f360 hold (L-121); f390 SC25 `Before approval` 7 / 2 / 1 / 1 (L-122); f420 `After approval and verification` 8 / 2 / 0 / 1 (L-123); f450 the unknown card hovered (L-124); f480 SC05 Kestrel INV-48231 (L-125); f510-524 the first half of L-126 (the three-card incident, the dark wipe and the rest of L-126 belong to the stage layer and `lk-l10-heal`; the clip ends at 02:03.50). |
| `lk-l8-simulate` tail | 480 | f450-479 (L-108): SC21 with the eleven proposed invoices, `Confirm 11 invoices` lands f465, the selection fixed. |

## Contain, teach, repair and release (BOB-10)

Four Oryn screens, one original-ERP context and one transition, built by a coding-agent session with parallel sub-agents (one per screen group, one for the timeline tests, one read-only reviewer), not IBM Bob. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC26&state=ST12&actor=marcus&actions=[…]` replays ordered reducer actions (guards included) after the deep link.

| Item | Files | Film anchors |
|---|---|---|
| SC26 Incident Center | `src/product/IncidentScreen.tsx`, `incident-layout.ts`, `incident.ts` | `incident`, `affected-cases`, `fee-comparison`, `incident-hypothesis`, `incident-evidence`, `incident-contain`, `incident-teach`, `incident-manual`, `incident-case-1` to `-3` |
| FX-01 containment wipe | `ContainmentWipe.tsx`, `FilmProduct.tsx`, `incident.ts` (`CONTAINMENT_WIPE_FRAMES`, `wipeEdge`, `preContainmentState`) | none (the main layer carries the anchors) |
| SC27 Teach Oryn What Changed | `TeachScreen.tsx`, `teach-layout.ts`, `teach.ts` | `teach-question`, `correction-source`, `teach-yes`, `link-rule`, `save-correction`, `teach-scope`, `teach-notice`, `review-repair`, `teach-back` |
| SC28 repair proposal and 34-scenario regression | `RepairScreen.tsx`, `repair-layout.ts`, `repair.ts`, `use-regression-clock.ts` | `repair-diff`, `regression-results`, `repair-scope-panel`, `validate-scope`, `open-repair-diff`, `regression-tiles`, `run-regression`, `request-release`, `regression-case-029` to `-034` |
| SC29 limited release, watch, expansion, closure | `ReleaseScreen.tsx`, `release-layout.ts`, `release.ts`, `use-cohort-clock.ts` | `limited-release`, `verified-three`, `expand-release`, `approve-limited-release`, `cohort-outcome-1` to `-3`, `close-incident`, `release-scope`, `affected-case-history`, `release-owner`, `cohort-evidence` |
| APP-05 manual completion, peer validation, held timeout | `apps/NetSuiteView.tsx`, `apps/erp-layout.ts` (`APP05_RECTS`) | `manual-completion`, `manual-form`, `complete-manually`, `teach-correction`, `tax-validation`, `tax-id-field`, `timeout-banner` |

- State: `state.ui.incident` (`evidence`, `outcome`, `answer`, `ruleLinked`; presentation only) and the actions `SET_INCIDENT_VIEW`, `SET_TEACH_ANSWER` and `LINK_TEACH_RULE` (ST12 only). `CONTAIN_INCIDENT` now sets the theme to dark (it was set on entering ST12, i.e. before containment); ST12 therefore starts light with `incident.status 'open'` and the wipe is the visual of the containment dispatch. `TEACH` needs a complete draft (answer Yes and the linked AP-RULE-017) in addition to the authority and the manual completion (guard `correctionDraft`): the correction is saved only by that explicit action and never changes policy, a threshold or a grant. `EXPAND_AND_CLOSE` is split into `EXPAND_RELEASE` (owner, 3/3 independent readbacks, no stop; the incident stays contained) and `CLOSE_INCIDENT` (owner, after the expansion; records `Repaired - Validated`, keeps `containedCaseIds` and `manualCompletions`; leaves ST15 for ST16). `SC29` opens from ST14 for the owner review; `SC28` from ST13.
- Cyan exists only while `running.regression` (the 34 tiles and the progress fill on SC28). SC26, SC27 and SC29 draw none. The hypothesis `Supplier document format change — unconfirmed` never has a verified-cause badge; INV-48233 and INV-48236 show an em dash, never an amount; the three cases are paused individually and the screen says only those three are paused.
- The held timeout of APP-05 shows on the NetSuite tab only while `state.selectedCase` is INV-48220 and its job outcome is Outcome Unknown (explicit `SELECT_CASE`; `OPEN_BILL` and `RECORD_IDS` do not include INV-48220); otherwise `ui.app.record` picks INV-48231 (manual completion, Elena) or the peer tax-ID validation. The three contexts never render together, and no retry or resubmit control exists.
- The clickable app wires `useRegressionClock` (30 ticks a second for `ui.simulator.runFrames`, then `COMPLETE_REGRESSION`) and `useCohortClock` (one independent readback per second while the release is limited) in `ProductApp.tsx`; a film replays the same actions from its timeline.
- `ProductFilmSurface` now wraps the screen in `data-theme={state.theme}`, so a film follows the reducer's theme (the capture's `?theme=` query still sets the page default); the wipe is the only product light-to-dark change in a cut.

### FX-01 wipe

One left-to-right wipe of 12 frames (400 ms at 30 fps), a pure function of the frame: from the landing frame `L` of `CONTAIN_INCIDENT` the leading edge is `round(1280 * (i + 1) / 12)` px for `i = frame - L`, 0 to 11, so the first frame shows the edge at 107 px, the middle (`i = 5`) at 640 px and the last (`i = 11`) at 1280 px, the fully dark contained frame. Left of the edge is the real contained dark screen, right of it the same SC26 in its light pre-containment state, with an opaque ink 12 px strip on the edge so no mixed-theme seam shows. Frame `L + 12` is the plain dark screen. The wipe is absent in the clickable app and under reduced motion (the dark frame appears at once), and no theme toggle is filmed.

### Clips

Specs live in `src/product/clip-specs-heal.ts`; regenerate with `bun run scripts/author-product-clips.ts`. Both clips start at ST11 (`startAt`) and replay Daniel's approval, its independent readback and the viewpoint change to Marcus as f0 cuts (the incident arrives only after the readback verified the approval).

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4g-heal` (film frame 3840, 02:08.00) | 420 | f0 Gmail INV-48231 with the fee outlined (H-103); f30 incident opens, containment lands and the wipe runs f30 to f41 = 02:09.00 to 02:09.40 absolute (H-104); f42 dark, the three pause glyphs 80 ms apart from f42 (H-105); f90 hypothesis hovered (H-106); f120 Elena in the original ERP, INV-48231 completed manually, `Teach Oryn What Changed` lands f135 and opens SC27 (H-107); `Yes` f168 (H-108); the rule link f195, `Save correction` f207 (H-109); `Validate scope` f224, SC28 (H-110); `Open repair diff` lands f253 and proposes the repair (H-111); `Run regression` lands f281, 18 frames of execution, cyan only then (H-112); f300 completed 28 / 6 / 0 (H-113); f330 flat light, owner review, `Approve limited release` lands f345 (H-114); the three readbacks land f366, f369, f372 (H-115); `Expand release` lands f403, `Close incident` f417 (H-116). |
| `lk-l10-heal` (film frame 3705, 02:03.50) | 615 | f0 the incident is open in its light pre-containment state (L-126); containment lands f9 and the wipe runs f9 to f20 = 02:03.80 to 02:04.20 absolute, dark from f21 (L-126, L-127); f45 group hovered (L-128); f75 the fee comparison (L-129); f105 the hypothesis (L-130); f135 Elena's ERP, `Teach Oryn What Changed` lands f150 (L-131); f165 the question (L-132); `Yes` f197, the rule f209, `Save correction` f221 (L-133); `Validate scope` lands f240 (L-134); `Open repair diff` f267 (L-135); six new cases hovered (L-136); `Run regression` lands f329, 15 frames of execution (L-137); f345 completed 28 / 6 / 0 (L-138); `Approve limited release` lands f390 (L-139); f405 cohort (L-140, L-141); the three readbacks land together f471 (L-142); `Expand release` lands f510 (L-143), `Close incident` f540 (L-144); f555 the version history SC30 in the dark theme (L-145), f585 the restore explanation (L-146, BOB-11). |

## Breadth and application capabilities (BOB-11)

Seven organizational screens, the HubSpot work application, an adapter tile view and the OS timeout banner, built by a coding-agent session with four parallel sub-agents (one per screen group) and a read-only reviewer, not IBM Bob. Every view is a pure function of `state` and the film frame; `/?view=product&screen=SC16&state=ST17&actions=[…]` replays ordered reducer actions (guards included) after the deep link. The viewpoint decides access: a viewpoint whose navigation lacks the destination sees `Not available: <reason>` and hidden anchors, never authority from a role label.

| Item | Files | Film anchors |
|---|---|---|
| SC16 Operations Map | `MapScreen.tsx`, `map-layout.ts`, `map.ts` | `map-graph`, `map-table`, `map-toggle-graph`, `map-toggle-table`, `map-workflow`, `map-rule-009`, `map-rule-017`, `map-agent`, `map-incident`, `map-edge-*` (five), `map-detail` |
| SC30 Version history | `VersionsScreen.tsx`, `versions-layout.ts`, `versions.ts` | `version-row`, `version-playbook`, `version-v01`, `version-v02`, `version-v10`, `version-v11`, `version-compare-evaluation`, `version-compare-repair`, `version-comparison`, `restore-previous`, `version-restore-hint`, `version-restore-dialog`, `version-restore-cancel`, `version-restore-confirm` |
| SC31 Policy change | `PolicyScreen.tsx`, `policy-layout.ts`, `policy.ts` | `policy-diff`, `policy-effective`, `policy-impact`, `impact-playbook`, `impact-agent`, `impact-tests`, `review-boundary-tests`, `boundary-tests` |
| SC32 and APP-09 HubSpot | `apps/HubSpotView.tsx`, `apps/hubspot-layout.ts` | `discount-draft`, `discount-field`, `blocked-action`, `blocked-submit`, `request-approval`, `approval-requested`, `deny-request` |
| SC33 Command Center and 14-Day X-Ray | `CommandScreen.tsx`, `command-layout.ts`, `command.ts` | `command-center`, `cc-verified`, `cc-exceptions`, `cc-incidents`, `cc-release`, `cc-tab-command`, `cc-tab-xray`, `cc-xray`, `cc-job-detail` |
| SC34 Audit and export | `AuditScreen.tsx`, `audit-layout.ts`, `audit.ts` | `audit-export`, `audit-table`, `audit-drawer`, `audit-confirm`, `audit-confirm-export`, `audit-confirm-cancel`, `audit-complete`, `audit-evaluation-row` |
| SC35 Notifications and the toast | `NotificationsScreen.tsx`, `NotificationToast.tsx`, `notifications-layout.ts`, `notifications.ts` | `notifications`, `notification-filters`, `filter-*` (four), `notice-N-01` to `notice-N-05`, `notice-expanded`; on every organizational scene `notification-toast`, `toast-dismiss`, `toast-open` |
| SC36 capability matrix and APP-10 tiles | `CapabilitiesScreen.tsx`, `capabilities-layout.ts`, `capabilities.ts` | `capability-matrix`, `adapter-tiles`, `cap-headers`, `cap-row-*` (seven), `cap-cell-gmail-observe`, `cap-extras`, `cap-detail` |
| APP-13 OS timeout banner | `apps/NetSuiteView.tsx`, `apps/erp-layout.ts` (`APP05_RECTS.timeout`) | `timeout-banner` (now [872,90,360,88]), `timeout-close`, `timeout-review` |

- State: `state.ui.breadth` (`map`, `versions`, `policy`, `command`, `audit`, `notifications`, `capability`, `timeout`; presentation only) and the actions `SET_MAP_VIEW`, `SELECT_MAP_NODE`, `SET_VERSION_VIEW {compare, restore, hint}`, `SET_POLICY_VIEW`, `SET_COMMAND_VIEW`, `SET_AUDIT_EXPORT`, `SET_NOTIFICATION_VIEW`, `SURFACE_TOAST`, `DISMISS_TOAST`, `SET_CAPABILITY_VIEW`, `DISMISS_TIMEOUT_BANNER`, `DENY_UNSAFE_REQUEST`. Business actions: `RESTORE_VERSION` (needs the open confirmation and Marcus's new `restore-version` grant; sets `state.restoredVersion` to `agent-v1.0`, ST21 to ST24 only, nothing already committed changes), the existing `EXPORT_AUDIT_PACK` (appends A15 and closes the drawer; the confirmation is a UI gate, the canonical script exports directly) and `REQUEST_APPROVAL` (ST20; a second request is refused; the action stays blocked). An approval of the 12% discount is never modelled or drawn: nobody holds `apply-discount`.
- `OPEN_SCREEN` to another screen closes the SC30 dialog, the SC34 drawer, the SC36 popover and the SC35 expanded notice. Entering ST18 and ST20 brings the NetSuite and HubSpot tabs forward (`reducer.ts` `ENTRY_EFFECTS`), so a route and its tab agree after `NEXT`.
- One toast: `SURFACE_TOAST` is refused while one shows; `DISMISS_TOAST` hides the toast only. N-04 and N-05 cannot surface or open before their own event (`noticeOccurred`). The SC35 center lists every occurred, undismissed notice in priority order with a recipient label for the Workflow Owner, Approver and Admin viewpoints (Employees see only their own); opening checks the viewer's own access.
- Policy: SC31 shows the 34 tests from `POLICY_IMPACT` (equal to `REGRESSION_SIZE`); the boundary tests are proposals; no control deploys or revalidates.

### Clips

Specs live in `src/product/clip-specs-breadth.ts` (and the SC30 tail of `clip-specs-heal.ts`); regenerate with `bun run scripts/author-product-clips.ts`. Both clips start at ST17 as Marcus; hard cuts pass skipped states with several `NEXT` in one frame; no click presses `Request approval`, `Restore` or `Export`.

| Clip | Frames | Product content by local frame |
|---|---:|---|
| `hk-h4h-breadth` (film frame 4260, 02:22.00) | 480 | f1 the Reconciler selected, lands f14 (H-117); f30 hold (H-118); f60 the rule edge hovered (H-119); f90 SC31 (ST19) (H-120); f120 proposed boundary tests, impacted agent hovered (H-121); f150 Jamal's SC04 card, `Guide Me` lands f165 (H-122); f180 HubSpot, blocked 12% discount hovered (H-123); f210 SC30, v0.1 against v0.2 lands f224 (H-124); f240 SC33, exceptions hovered (H-125); f270 SC34, the export drawer opens f284, nothing exported (H-126); f300 SC35, one toast f306 (H-127); f330 plate, toast dismissed (H-128); f360 SC36 matrix (H-129); f391 NetSuite row outlined from f405 (H-130); f420 hold (H-131); f450 SC33 again, 8 / 2 / 0 / 1 (H-132). |
| `lk-l11-breadth` (film frame 4320, 02:24.00) | 600 | f0 plate over SC16 (L-147); the Reconciler lands f45 (L-148); f60 SC31 (L-149); f90 boundary tests and the impacted agent (L-150); f120 Jamal's card, `Guide Me` pointer (L-151), the press lands f162 (L-152); f180 HubSpot, `Submit` pressed inert f195 (L-153); f210 `Request approval` hovered, not pressed (L-154); f240 SC33 (L-155); f270 `14-Day X-Ray` lands f283 (L-156); f300 SC34, export drawer f315 (L-157); f330 SC35, bell lands f343, `N-01` expanded f345 (L-158); f360 thirteen tiles (L-159); f390 matrix headers (L-160); f420 to f539 row outlines (L-161 to L-164); f540 to f599 hold, no pointer (L-165, L-166). |

The launch clip also ends `lk-l10-heal` with SC30: f555 `OPEN_MONTAGE` and four `NEXT` (ST21, dark), f556 the restore control hovered (L-145), f585 the future-only explanation (L-146).

## Product gap pass (BOB-12)

Every product-side Part D gap (`GAP-SC-*`, `GAP-CMP-*`) was audited against its original owner and amended in place; there is no new screen or owner. The per-gap ledger (entries, files, viewed frames, Done when, deviations, open questions) is `docs/video/bob-12-gap-ledger.md`.

- A film action that lands on clip frame 0 is the replayed start state: `motionProgress` (`src/product/contract.ts`) and the document slide in `apps/InvoiceDocument.tsx` give it no entry motion, so the first frame of a clip equals the last frame of the clip before it (for example `hk-h4g-heal` f0 shows the open Kestrel PDF).
- SC25's stored `Before approval` snapshot is an entry, not a swap: it is fully visible on its first frame; only the readback and the switch to the current snapshot fade over 150 ms.
- SC24 carries the timeout evidence card and the separate `Business postcondition` card with a connector (`hk-h4f-job` f270-f299); its source link selects INV-48220 and opens the NetSuite tab, which already shows the held timeout.
- `src/fonts/faces.test.ts` pins the real IBM Plex Mono 700 face (declared in `fonts.css` and `faces.ts`, digest equal to `public/fonts/PROVENANCE.md`, no font synthesis).
