# Oryn demo — design and build specification

## 1. Purpose and decisions

Make two three-minute narrated films and one clickable, deterministic representation of the same Oryn workflow. The hackathon cut comes first; the launch cut reuses its product shots and adds its own framing. The product is a governed workflow lifecycle, not a claim that a click proves a business outcome. The hero is Supplier invoice vs purchase order reconciliation at Calder & Vance Supply Co., AP East. The central dramatic proof is a boundary test, mixed Job outcomes, a held unknown, containment, correction, regression and scoped release.

**Deadline:** Wednesday 2026-12-02 at 5:00 PM Eastern. The event page says December 10; the Official Rules date controls planning. November 18 through December 2 inclusive is 15 calendar dates, indexed D0–D14, with 14 elapsed days. Finish the release candidate on D12, upload D13, and reserve D14 for access checks and submission. See §12 for daily gates.

**Fixed choices:** 1280×720 CSS authoring, DPR 2 capture, 2560×1440 source, 1920×1080 delivery, 60 fps; Vite, React 18, TypeScript, Tailwind 3.4, upstream shadcn/Radix, Lucide, CVA, tailwindcss-animate, React Flow; a shared deterministic film and clickable runtime; no network or backend. Use GSAP paused timelines for HyperFrames. Narration is Harikeshav's voice; no TTS. Show real branded mock applications and real Bob review footage. Do not claim customers, traction, certifications, production usage, invented benchmarks or unobserved Bob findings. Do not label on-screen material as sample or synthetic. One light-to-dark transition occurs at incident containment in each cut. Privacy copy must distinguish local durable evidence from authorized transient cloud inference.

## 2. Provenance and clean-room boundary

The design-language extraction is a measurement list, not implementation material. Independently author components and CSS from values specified here. Never copy Screenpipe code, CSS, components, documentation text, art, logos, animations, screenshots, prose, the isometric mark, tessellation, lime accent or its mono lowercase wordmark. Existing Screenpipe source and the reference storyboard are research only; no source files enter the worktree. Upstream shadcn/Radix and other dependencies retain their own licenses and notices. Confirm actual package versions and licenses at installation.

| Asset | Origin / license | Acquisition and controls |
|---|---|---|
| IBM Plex Mono 400/500/600/700 | IBM Plex, SIL OFL 1.1 | Download actual upstream font files including 700; self-host WOFF2; retain OFL and attribution |
| Space Grotesk 400/500/700 | upstream, SIL OFL 1.1 | Self-host; retain license and attribution |
| Crimson Text 400/600/700 | upstream, SIL OFL 1.1 | Self-host; retain license and attribution |
| Lucide icons | upstream ISC | Import only needed icons; retain notice |
| Oryn ring, wordmark, stage geometry | original project artwork | Construct from geometry in §3; export SVG and retain source |
| Gmail, NetSuite, Sheets, Slack, Zoom, HubSpot, Chrome, macOS marks | respective owners; trademark rights | Obtain official source; record URL and usage terms; use small nominative marks in original mock layouts; no suggestion of endorsement |
| Salesforce, Outlook, Excel, Teams, Meet, Edge marks | respective owners; trademark rights | Grey capability tiles only, never claim availability |
| User screenshots | user-provided | Static texture only; obtain consent, redact personal data, document source and approval |
| IBM Bob recording | user-created | Record actual session; redact secrets and private material before export |
| Music and effects | original or licensed | Record creator, URL, license, permitted commercial/video use and evidence; no track without documented rights |
| Live-action and voice | user-created | Keep original media and session metadata; no stock identity imagery |

Brand marks are nominative identifiers of portrayed applications, not proof of integration, sponsorship, or affiliation. The rules' third-party IP clause still applies: review permissible use and replace any mark if rights cannot be established. Do not replace a missing asset with another company's visual assets.

## 3. Design language

### 3.1 Roles and tokens

Bone is human and source material; trace is evidence; neutral signal means ready or selected; arc cyan means the simulator, a Job or a regression run is executing now; ink is the system; diagonal hatch means unknown. Passive observation and other processing indicators remain neutral with text. The arc extinguishes immediately when the eligible run stops. It is not success, button fill, static badge fill or decoration. Use icon shape and words as well as hue.

The HSL triplets below are canonical; rounded hex is provided for inspection. Some explicitly specified hex values are rounded differently from HSL conversion; use hex for the named canvas, border and arc, and HSL for other tokens. Contrast is relative luminance, WCAG sRGB, `(Llighter+.05)/(Ldarker+.05)`; small text requires 4.5:1. Ratios below are approximate and must be checked against actual browser-computed colors before shipping.

| Role | Light HSL / hex | Dark HSL / hex | Intended pair and approximate ratio |
|---|---|---|---|
| background | 60 14% 96% / #F6F6F3 | 0 0% 4% / #0A0A0A | foreground on background ≈18.2:1 |
| foreground | 0 0% 4% / #0A0A0A | 0 0% 96% / #F5F5F5 | on respective background ≈18:1 |
| surface | 0 0% 100% / #FFFFFF | 0 0% 8% / #141414 | foreground on surface ≈19.8:1 light, ≈16.8:1 dark |
| surface-2 | 60 11% 93% / #EFEFEB | 0 0% 13% / #212121 | foreground on surface-2 ≈17:1 light, ≈14.5:1 dark |
| border | 60 9% 86% / #DFDFD8 | 0 0% 20% / #333333 | decorative boundary, not text |
| muted foreground | 0 0% 40% / #666666 | 0 0% 64% / #A3A3A3 | on background ≈5.5:1 light, ≈7.8:1 dark |
| trace | 60 4% 45% / #77776E | 60 4% 56% / #93938A | evidence marks; use foreground for small text if contrast falls below 4.5:1 |
| signal | 0 0% 20% / #333333 | 0 0% 72% / #B8B8B8 | on background ≈11.6:1 light, ≈9.9:1 dark |
| arc | 191 100% 59% / #2FD8FF | same | #050505 on arc ≈12.5:1; executing only |
| arc ink | 0 0% 2% / #050505 | same | text on running arc only |
| arc mark | 191 85% 30% / #0B7D8E | #2FD8FF | mark on bone ≈4.5:1; use ink labels, not cyan text |
| success | 142 71% 29% / #15803D | use lighter #79D69A | success glyph, label in foreground |
| danger | 0 72% 51% / #DC2828 | use lighter #FF9191 | danger glyph, label in foreground |
| warning | 32 95% 44% / #DB7806 | use lighter #F7BE78 | warning glyph, label in foreground |

Status hues are not assumed accessible as text. Render all status text in foreground; pair colored 12px shape with ink/dark surface and a readable label. Arc mark is a graphic, not a thin decorative line whose contrast alone conveys execution.

### 3.2 Typography and density

No synthesized weight: ship the weights in §2. Declare individual `@font-face` URLs and explicit weight, `font-display: swap` for interactive mode; await `document.fonts.ready` and verify loaded faces before capture. Mono is system/data; Space Grotesk is UI and headings; Crimson Text is human explanatory prose. Use 4px base spacing: 4, 8, 12, 16, 24, 32, 48, 64. Product panel padding 24; dense tables 32px rows; label gap 4; control gap 8; section gap 24.

| Layer / role | Family | Size / line | Tracking | Weight |
|---|---|---|---|---|
| Product page title | Space Grotesk | 28/34px | -0.025em | 700 |
| Product section | Space Grotesk | 20/28px | -0.025em | 700 |
| Product card title | Space Grotesk | 16/22px | -0.01em | 500 |
| Product body | Space Grotesk | 14/20px | 0 | 400 |
| Human explanation | Crimson Text | 16/24px | 0 | 400 |
| Data / controls | IBM Plex Mono | 12/18px | 0 | 500 |
| Micro-label minimum | IBM Plex Mono | 11/16px | 0.04em | 500 |
| Stage headline | IBM Plex Mono | 48/52px | -0.025em | 600 |
| Stage kinetic emphasis | IBM Plex Mono | 56/60px | -0.025em | 600 |
| Stage eyebrow | IBM Plex Mono | 14/20px | 0.12em | 500 |
| Stage subtitle | IBM Plex Mono | 13–15/20px authored | 0 | 600 |
| Stage lower third | Space Grotesk | 20/26px | -0.01em | 700 |

At 1.5× delivery scaling, 11px authored becomes 16.5px at 1080p; subtitle 13–15px becomes 19.5–22.5px. Judge legibility after actual downsample, not by CSS size alone. Avoid wide letter-spacing on dense numbers. Table values align by decimal using tabular numerals.

### 3.3 Geometry, elevation, icons

Structural geometry radius 0; compact nested boxes 4px; controls 6px; dialogs and cards 8px. Use 1px solid borders; selected rows add a 2px inset neutral signal bar. Product is flat except floating surfaces: `sm: 0 1px 2px -1px rgba(0,0,0,.08)`, `md: 0 4px 10px -2px rgba(0,0,0,.10)`, `lg: 0 10px 24px -6px rgba(0,0,0,.14)`; dark alphas .24/.28/.34. Never use stage's hard offset shadows inside product UI. Use Lucide at 14px in rows, 16px in controls, 20px for notices, 24px for empty states; 1.75px stroke, round caps where inherent in icon. Preserve a 44px hit target on compact icon-only controls even if visual frame is 32px.

| z-index | Surface |
|---|---|
| 0 | product content |
| 10 | sticky header / table header |
| 20 | dropdown, tooltip, popover |
| 30 | HUD card |
| 40 | drawer backdrop |
| 50 | drawer and dialog |
| 60 | toast / notification |
| 70 | film cursor and click indicator |
| 80 | stage captions, never occluded |

### 3.4 Status language

| Label | Shape / hue | Meaning and rule |
|---|---|---|
| Approved for Guidance | outlined shield/check, neutral signal | approved human guidance, not execution authority |
| Verified Complete | check in circle, success | independent postcondition evidence exists |
| Outcome Unknown | hatched square, neutral | stop and reconcile; no blind resubmission |
| Passed | check, success | expected result and invariants verified |
| Passed — Expected Safe Escalation | bent arrow in circle, success | correct safe stop; not a failure |
| Failed | X in diamond, danger | expected result or invariant failed |
| Needs Revalidation | triangle/exclamation, warning | dependent version must be retested |
| Contained | square/stop, warning | bounded affected cases paused before repair |
| Approval Required | diamond/person, warning | authorized person must decide |
| Escalated | arrow to person, warning | human handoff has an owner |
| Held | pause bars in square, neutral hatch | work remains stopped; do not imply rejection |
| Running | moving node on ring, arc | light only during active execution |

Hatch uses repeating 45° 1px neutral strokes at 6px spacing on surface-2, clipped inside a square with solid foreground outline. Text remains solid foreground on an unhatched surface. In dark mode reverse line luminance; never use hatch alone as a label.

### 3.5 Orbit, mark and stage

For a 100-unit mark, center (50,50), radii 18, 31, 44; ring strokes 1.5 units; one 4-unit node moves on middle ring. An execution loop completes one orbit in 1.8s linear, phase derived from timeline time; on stop node becomes neutral and freezes. Loader uses 24px icon and one accessible status label, not indefinite motion in reduced-motion mode. Empty state uses a static 80px ring with node at twelve o'clock; section dividers use a 32px cropped ring segment; the brand mark uses 96px art without unrelated rings.

Wordmark is Space Grotesk 700 `Oryn`, tracking -0.04em, with O replaced by a custom open ring: outer diameter 1em, 0.11em stroke, gap 32° centered at 1 o'clock. Baseline aligns with font cap height; optical gap from O to r is -0.025em. Intro and reveal marks remain open. At the first independently verified Job readback and at the 3/3 verified limited-release readbacks, draw the missing arc over 400ms, hold 400ms, and synchronize `ring-close`; return to open where appropriate. The end-card mark may be closed.

Stage: bone canvas with `radial-gradient(circle, rgba(10,10,10,.12) 1px, transparent 1px)` spaced 24px; stage cards 2px ink outline, 6px 6px 0 ink shadow, 8px corner radius. Registration marks are 12px arms, 1px stroke, 8px beyond each stage frame corner. Product screenshot is a nested unshadowed surface. Both cuts use the same subtitle strip: x128–1152, y630–688, ink background, bone IBM Plex Mono 600 text at 13–15px authored, maximum two lines; never cover controls or essential facts. Use two separately keyed lower-thirds: `hackathon` displays `Harikeshav Rameshkumar` and `The Ohio State University`; `launch` displays `Harikeshav Rameshkumar` and `Oryn`. Both use a white 2px outlined card at x64 y548, maximum height 64px, with a 6px black offset; their shadow ends by y618, above the subtitle strip. Keep key content in the 80% title-safe region and general action in the 90% safe region.

Motion: product transitions 150ms `cubic-bezier(.4,0,.2,1)`; reveal 500–900ms and camera 600–1100ms `cubic-bezier(.16,1,.3,1)`; stagger 60ms, capped at 360ms. Type 28–34 characters/s using deterministic seeded per-character offsets. Cursor travel 350–900ms on cubic path with 1–3% overshoot; click scales to .97 for 90ms and expands an ink-alpha ring over 260ms. Pointer is a 20×24px black arrow with 1px white outline and hotspot at tip; hover target gets neutral outline, never arc. Prefer transforms and opacity; no layout animation. Reduced motion uses immediate state changes and static motifs.

Sound follows action and hierarchy: speech dominates, a quiet bed establishes momentum, and short nonverbal cues carry state changes without suggesting success where none exists. Cue specifications are in §9.

## 4. Component inventory

Common interactive contract: keyboard focus uses a 2px foreground outline and 2px offset, hover takes 150ms, disabled has an explanatory reason, errors are associated using `aria-describedby`, and all dialogs return focus to their trigger. Product components use the token set in §3. CVA maps below are design APIs, not copied source.

| Component / base | Anatomy, variants, sizes, states |
|---|---|
| Button / native + CVA | Icon optional, text, optional trailing icon; `variant: primary|secondary|outline|ghost|danger|link`; `size: sm|default|lg|icon`; 32/40/44/40px high, radius 6, horizontal padding 12/16/24/0. Primary ink/bone, hover inverse; danger uses label and icon, not hue alone. Loading replaces icon with ring and preserves width. |
| Input / native | Label, field, optional prefix/suffix, hint/error; 40px high, 6px radius, 12px padding, 1px border; `size: default|dense` = 40/32; `state: default|focus|invalid|disabled|readonly`; focus ring 2px. |
| Select / Radix Select | Label, 40px trigger, value, 16px chevron, popup rows 32px; `size: default|dense`, `state: default|open|invalid|disabled`; selected check, keyboard typeahead. |
| Tabs / Radix Tabs | 40px row, 24px gaps, selected 2px neutral underline; `variant: underline|segmented`, `size: default|dense`; arrow navigation and focus. |
| Badge / CVA | 24px label chip, 4px radius, horizontal 8px; `variant: neutral|outline`; no status implied. |
| StatusBadge / CVA | 24px, 12px glyph plus exact §3.4 label; `status: approved|verified|unknown|passed|safeEscalation|failed|revalidation|contained|approval|escalated|held|running`; color never sole meaning. Running arc disappears when stopped. |
| Table / native table | Header 32px, row 32px, cell 12px horizontal, 1px separators; fixed stable widths, numeric right aligned; `density: dense|comfortable` = 32/40. Sort button exposes direction; selected uses 2px rail; empty, loading, failed and no access states include action and reason. |
| Drawer / Radix Dialog | Right anchored 480px wide, full 720px high; scrim, title, close, scrollable content, sticky 64px action footer; `variant: evidence|approval`; trap focus; approval shows exact before/after, authority, evidence, Approve/Reject/Request Changes. |
| Dialog / Radix Dialog | Centered 512px max, 24px pad, 8px radius, shadow-lg, 80% black scrim; title 18/24, 16px gap; `variant: confirm|destructive|information`; 150ms opacity fade. |
| Popover / Radix Popover | 320px default, 8px radius, 12px padding, shadow-md, 8px offset; `align: start|center|end`; escape closes. |
| Tooltip / Radix Tooltip | 11/16 mono, 8px padding, dark foreground fill, 4px radius; opens after 400ms or focus; not the only source of a control name. |
| Toast / Radix Toast | 360×88px top-right, 8px radius, icon, title, explanation, optional action; `variant: info|warning|danger|success`; one visible at a time, priority queue, no auto-dismiss for critical action. |
| Command palette / Radix Dialog + command list | 640px wide, 48px search row, 32px result rows with type and state; `⌘K`, Escape, arrows and Enter; authorized objects only; empty `No matching commands`. |
| Breadcrumbs / nav | 28px row, 12/18 mono, slash separators, current page `aria-current`; last item never linked to itself. |
| Stepper / lifecycle ring | 14 labeled steps listed in §8; 18px nodes, 1px edges, status text; `orientation: horizontal|vertical|orbit`; current neutral signal unless actually running. |
| Timeline | 2px vertical line, 8px node, 16px between events; `kind: observation|decision|release`; timestamp, actor, event, evidence link; no fabricated event times. |
| Diff | two equal columns, 1px divider, before and after headers, rows 36px; added/removed icons and text, not color alone; narrow viewport stacks with labels. |
| Scenario grid | 4 columns × 7 rows of 96×52px tiles with 8px gaps form a 408×412px grid, centered in a 472×416px host; selected outline, glyph, short ID, accessible full title; tile state keyed by scenario outcome. |
| Case table | columns invoice 120, supplier 184, amount 100, PO 100, status 240, action 80; 32px row; amount right aligned, unknown opens evidence drawer. |
| Job progress | 8px segmented bar plus numeric counts and full outcome legend; no segment called success until verified. |
| Risk tier chip | 24px outlined chip `Tier 0` through `Tier 4` with name; shield shape, no color-only differentiation. |
| Autonomy ladder | six 54px rows, number, exact stage, description, gate state; locked rows explain unmet gate. Selected Stage 3 uses neutral signal rail. |
| Gate checklist | 24px icon and label per 40px row; counts `5/5`, `28/25`, `6/5`, `Owner approval`; check icon only after the correct passing suite and owner approval. |
| Graph node / @xyflow/react | 188×64px, 6px radius, 1px border, label/type/status, handles 8px; `kind: workflow|rule|agent|incident`; selected 2px ink outline. Edge 1.5px trace with arrow; approved solid, candidate dashed 5/3; selected dependency 2px signal. Provide equivalent list view and keyboard navigation. |
| Keycap | 22px height, 4px radius, 1px border, 11/16 mono, 6px padding; semantic `<kbd>`. |
| Notification card | 360×92px, 8px radius, 12px padding, 16px type icon, title, source, action; `kind: approval|incident|reminder|job`; one surfaced at a time. |
| HUD card | 320×144px, compact 12px padding, title, evidence, one main action and dismiss; `kind: peerFix|commitment|guide`; positioned beside, not over, relevant target. |
| App shell | 240px sidebar, 56px top bar, content x240–1280, padding 24; role and org selector at sidebar top, 32px nav rows, search and notification top-right. Shell never resizes during filmed navigation. |

### 4.1 Original application skins

Construct original simplified layouts, not copied DOM, source, screenshots or trademarked artwork beyond the small nominative marks. Each is a React view with the same 1280×720 coordinate space. macOS chrome uses a 28px menu bar, a 38px window title bar with 12px traffic-light circles at x20/40/60, and a 64px Dock centered at y646. Browser chrome is 48px, with 24px tabs, back/forward, address field and Chrome identifier; use fictional URLs and no real account identifiers.

| Surface | Measured construction for this project | Required content / action |
|---|---|---|
| Gmail | 184px left rail, 56px top search, inbox center 480px, PDF pane 560px | Brightwater invoice email, INV-48219 and PDF; open evidence |
| NetSuite | 48px header, 200px section rail, 16px form grid, 40px fields | bill/PO, variance hold, vendor record; show amounts and reminder |
| Google Sheets | 40px menu, 32px formula bar, 36px column header, 28px rows | `AP Exceptions Tracker`; invoice ID, supplier, issue, owner, state |
| Slack | 220px workspace rail, 56px channel header, 64px message composer | `#ap-escalations`, two missing-PO handoffs, no invented private capture |
| Zoom | 48px top bar, 2×2 call grid, 64px control rail | Dana and Priya labels, per-meeting consent before indicator |
| HubSpot | 56px top navigation, 220px side rail, 720px deal panel | draft 12% discount, blocked Tier 3 approval action |
| Chrome | 48px chrome with address field and mock tab titles | navigation between original app skins |
| macOS | 28px menu bar, 64px Dock, 38px window title | companion status, one-click pause; generic original Dock icons |

## 5. Screen and state catalogue

Coordinates are authored CSS pixels, measured from top left at 1280×720. Shared shell: sidebar `[0,0,240,720]`; top bar `[240,0,1040,56]`; breadcrumb `[264,72,700,24]`; main region `[264,112,992,584]`. Common stage frame `[48,40,1184,640]` when a screen is presented as a floating card; film camera may crop, but preserve subtitle-safe region. `P(x,y)` names click hotspot center. Unless stated, loading uses a 150ms neutral skeleton; empty gives a next action; errors give a reason and recovery; unavailable controls explain why. A selected role never bypasses authority. Fixture IDs refer to §6.

| ID | Purpose; layout and exact visible copy | Targets, variants, framing |
|---|---|---|
| SC01 | Desktop companion and menu bar. Menu x950–1260, y28–260; `Observation active`, `Pause observation`, `My Privacy`. | P(1100,112) pauses, P(1100,160) opens SC03. Paused is neutral, no active arc. Desktop fills stage frame. |
| SC02 | Enrollment wizard. Center card x320 y100 w640 h520; title `Your work, your choice`; separate capture and sharing controls, notice and consent. | P(1040,572) continues only after consent; P(390,572) back. Denied leaves observation off. 3-step progress above card. |
| SC03 | My Privacy. Main split 600/368; `Excluded apps, windows and URLs`, `Local retention: 7 days`, `Delete local history`, `Pause observation`. | P(1100,160) pause; P(1090,428) delete confirmation. Mandatory exclusions cannot be disabled; no deletion implies global removal. |
| SC04 | HUD card over mock NetSuite, x900 y148 w320 h144. `Known fix from AP East: Vendor tax ID format`; `Guide Me`; alternate `Confirm Kestrel handling-fee terms in writing`. | P(1095,257) opens guide; dismissal does not resolve underlying work. Only one card shown. |
| SC05 | Gmail skin: email and PDF for INV-48219. PDF shows `$18,420.00`, Brightwater Industrial, PO-1042; email at x200 y112. | P(745,286) open PDF, P(830,390) select invoice number. Excluded content is never displayed as capture evidence. |
| SC06 | NetSuite skin: vendor bill at x240 y104; invoice `$18,420.00`, PO `$17,980.00`, variance `$440.00`, `2.45%`, `Variance Hold`. | P(820,374) opens PO; P(1060,598) stages; approval required rather than auto-post. Reminder appears only in vendor context. |
| SC07 | Sheets skin: `AP Exceptions Tracker`, header y100, rows y132 onward. Missing-PO entries INV-48215 and INV-48218. | P(485,180) selects case; offline/unknown retains visible state; sheet never makes the case verified. |
| SC08 | Slack skin: `#ap-escalations`, messages at x260 y140 and y210; `Missing purchase order: INV-48215` and `Missing purchase order: INV-48218`. | P(400,185) opens linked case. Read-only unless authorized; message alone is not verification. |
| SC09 | Zoom skin: consent banner x200 y60 w880 h56, meeting tiles x200 y128 w880 h464; Dana Whitfield and Priya Nair. | P(980,88) accepts per-meeting consent; without it no recording indicator. Dana says `From the next cycle we're adding a handling line to every invoice.` |
| SC10 | HubSpot skin: deal x240 y112 w800, discount `12%`, `Requires Tier 3 approval - Daniel Okafor`. | P(1000,512) requests approval; submission remains blocked without approval. |
| SC11 | Meeting review: transcript left x264 w560, commitment right x848 w384. `Confirm Kestrel handling-fee terms in writing`, `Priya Nair`, `Fri 17:00`, source `00:14:32`, `subject to company approval`. | P(1050,342) edits deadline to `Fri 12:00`; P(1090,562) confirms. Unknown speaker is not inferred; confirmation is not company policy. |
| SC12 | Home: four cards in 2×2 grid x264 y128, 480×180; `Approvals`, `Incidents`, `Verified outcomes`, `Recent changes`; org `Calder & Vance`, role selector. | P(1200,28) notifications, P(135,54) role selector, P(620,28) search. Values follow current snapshot, not a combined total across periods. |
| SC13 | Workflow Discovery inbox: 992×440 list, candidate row `Supplier invoice vs purchase order reconciliation`, `3 demonstrations`, `Needs Review`. | P(550,200) opens SC14; no candidate means `No candidates yet`; unauthorized evidence is not exposed. |
| SC14 | Candidate review: three 292×120 demonstration cards; below, steps and evidence panel x880 w352; `variance exception rule: unverified until SME review`. | P(1090,600) approve contribution then request owner review; P(1040,360) evidence. D1–D3 retain source and employee consent. |
| SC15 | Playbook: heading and `Approved for Guidance`; left 608px procedure, right 360px rules/evidence. Playbook v1.0, owner Marcus. | P(1080,630) Agent Factory; `Publish` requires owner review and does not itself deploy agent. |
| SC16 | Operations Map: canvas x264 y112 w992 h560; workflow x340 y260, rule nodes x620 y170/350, agent x880 y260, incident x1080 y400. | P(974,292) selects Reconciler and highlights rule/incident edges; P(1190,136) table view. Candidate edges dashed. |
| SC17 | Agent Factory: intent field x304 y160 w880 h72: `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` Sections purpose, inputs, actions, rules, outputs and stopping points. | P(1050,600) continue to scope; unverified rule branch explicitly marked. Disabled if intent absent. |
| SC18 | Scope and permissions: left x264 w480, right x768 w464. `Tier 3 - Consequential`; six-stage ladder; Stage 3 gate `5/5 verified human examples`, `28 representative scenarios`, `6 edge/negative`, `Owner approval`. | P(1020,606) opens simulator. Before passing evaluation show gate pending, not satisfied; after v0.2 passes and owner approves show checks. |
| SC19 | Flight Simulator: suite `SIM-AP-RECON`, 28 tiles centered, header and `Run scenarios` button. | P(1100,160) starts ST07; running node only while running; cancel yields incomplete/not run, not passes. |
| SC20 | Results: left 28-cell grid, right replay 440px. v0.1 `21 Passed`, `6 Passed — Expected Safe Escalation`, `1 Failed`; v0.2 `22 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`. | P(500,292) opens `variance_exactly_2.00pct`; P(1050,590) fixes boundary then reruns. Exact 2.00% must auto-accept. |
| SC21 | Jobs queue: 992px table, `JOB-0117`, agent v1.0, `11 invoices`, AP East; scope confirmation dialog. | P(1110,170) opens start confirmation; P(780,520) confirms only if release and scope authorized. |
| SC22 | Job run: progress summary y112–204, table y220–672; the 11 rows come from invoices fixture. | P(1050,524) opens INV-48219 approval; P(1050,556) opens INV-48220 evidence. While running arc animates, on stop neutralizes. |
| SC23 | Approval drawer: x800 w480; `INV-48219`, invoice `$18,420.00`, PO `$17,980.00`, variance `$440.00 / 2.45%`; `Variance Hold` → `Matched - Variance Approved`. | P(1100,665) Approve as Daniel with valid delegation, then verify before increasing verified count. Reject/request changes remain distinct. |
| SC24 | Evidence drawer: x800 w480, `INV-48220`, `Outcome Unknown`, `ERP submit timed out`, `Held`, `Resubmission unavailable`; explanation says do not resubmit until reconciled. | P(1060,585) opens investigation; no retry or resubmit control for uncertain submission. Explicit gap is not an error disguised as a verified result. |
| SC25 | Job summary: 4 cards at x264/512/760/1008 y160, 232×160: `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`; `Partially complete`. | P(1080,370) opens filtered unknown; after approval and independent verification replace the snapshot with 8/2/0/1 over 150ms, never count up. A job with unresolved unknown is not completed. |
| SC26 | Incident Center: dark product theme, list x264 w300, detail x588 w644. `INC-0042`, `Contained`, `3 cases paused`, Kestrel, `$38.50 handling fee`; hypothesis `supplier document format change — unconfirmed`. | P(960,398) opens INV-48231 evidence, P(1090,600) teach after manual resolution. Wipe to dark at containment, not a toggle. |
| SC27 | Teach Oryn What Changed: centered 768px panel; exact question `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?` Answer `Yes`; link `AP-RULE-017`. | P(840,440) save correction; Marcus restricts scope to Kestrel layout v2. No new policy approval is invented. |
| SC28 | Repair proposal `REP-0042-1`: left diff x264 w480, right tests x768 w464; changes only `Interpret invoice totals`; `6 new regression cases`, `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`. | P(1080,570) run regression; P(1100,625) request release after complete passing results. Incomplete blocks release. |
| SC29 | Release governance: cohort panel x264 w480, watch panel x768 w464. `Kestrel Components invoices only`, `AP East only`, `3/3 Verified Complete`; `Repaired - Validated`. | P(1080,510) expand only after three independent verified outcomes and owner authorization; P(1090,630) close incident after expansion. |
| SC30 | Version history: table x264 y160 w992; Playbook v1.0 and agent v0.1, v0.2, v1.0, v1.1. | P(760,300) compare; P(1110,500) restore previous approved agent version for future jobs only; no undo of prior business effects. |
| SC31 | Policy change: `2.00% → 1.50%`, `effective Dec 1`, `1 playbook`, `1 agent`, `34 tests`, `Needs Revalidation`. | P(1090,590) review boundary tests; no auto-release or silent prior-policy continuation. |
| SC32 | Unsafe action block: 768px card; `12% discount`, `Requires Tier 3 approval - Daniel Okafor`, `Request approval`. | P(910,540) requests review; unauthorized action remains blocked. |
| SC33 | Command Center / 14-day X-ray: cards show the Job snapshot 7/2/1/1 and one contained incident, explicitly separate populations. | P(400,240) filters to Job; no fabricated 14-day employee counts, savings or success rates. Pilot eligibility needs ≥5 participating enrolled employees. |
| SC34 | Audit & export: table actor, event, object, scope, outcome; `Export audit pack` at top-right. | P(1110,136) opens export confirmation; no raw private media; insufficient authority gives reason. |
| SC35 | Notifications: left filter 220px, right card list; `Approval Required`, `INC-0042 Contained`, `Confirm Kestrel handling-fee terms in writing`. | P(740,220) opens approval. Show one toast at a time; dismiss is not resolve. |
| SC36 | Adapter matrix: header row five capability labels, app rows seven, 80px cells; explicit `Available` or `Unavailable` with dash. | P(420,214) opens capability detail; unavailable cells have text and do not react as enabled. |
| SC37 | Stage brand: centered ring and Oryn wordmark at y220, lower title at y350, URL pill x300 y470 w680; lifecycle ring is separate 14-node layout. | End URL `https://github.com/Harikeshav-R/Oryn`; no customer logos or traction line. Intro and reveal stay open; end-card mark may be closed. |

Screen-state assignment: ST01 SC02/SC03; ST02 SC01/SC05–SC09; ST03 SC11; ST04 SC13/SC14; ST05 SC15; ST06 SC17/SC18; ST07 SC19; ST08–09 SC20; ST10 SC21/SC22; ST11 SC23–SC25; ST12 SC26; ST13 SC27; ST14 SC28; ST15–16 SC29; ST17 SC16; ST18 SC04; ST19 SC31; ST20 SC10/SC32; ST21 SC30; ST22 SC33; ST23 SC34; ST24 SC35. SC36 and SC37 are cross-state presentation surfaces.

## 6. Canonical fixtures

All money is integer cents; display formats are derived. The following compact TypeScript-shaped data is normative. Missing PO is `null`; unspecified incident invoice amounts remain unknown, not fabricated. Scenario descriptions define deterministic test inputs and expected results, not claims of observed operational metrics.

```ts
const people = [
  ["priya", "Priya Nair", "AP Specialist", "Employee"],
  ["jamal", "Jamal Carter", "AP Specialist", "Employee"],
  ["marcus", "Marcus Webb", "AP Manager", "Workflow Owner"],
  ["elena", "Elena Ruiz", "Senior Accountant", "SME"],
  ["daniel", "Daniel Okafor", "Controller", "Approver"],
  ["tomas", "Tomas Reyes", "IT/Security Admin", "Admin"],
  ["dana", "Dana Whitfield", "Kestrel Components", "Supplier representative"],
] as const;
const suppliers = [
  "Brightwater Industrial", "Copperline Cables", "Northgate Pallets",
  "Orchard Lane Foods", "Harlow Tooling", "Ironbark Fasteners",
  "Vantage Print", "Meadowbrook Office", "Sable & Co. Logistics",
  "Kestrel Components"
] as const;
type CaseOutcome = "Verified Complete" | "Escalated: Missing Purchase Order"
  | "Approval Required (Tier 3)" | "Outcome Unknown";
type Invoice = { id: string; supplier: string; cents: number; po: string | null;
  outcome: CaseOutcome; poCents?: number };
const invoices: Invoice[] = [
  {id:"INV-48210", supplier:"Brightwater Industrial", cents:624000, po:"PO-1031", outcome:"Verified Complete"},
  {id:"INV-48211", supplier:"Copperline Cables", cents:311840, po:"PO-1032", outcome:"Verified Complete"},
  {id:"INV-48212", supplier:"Northgate Pallets", cents:190500, po:"PO-1034", outcome:"Verified Complete"},
  {id:"INV-48213", supplier:"Orchard Lane Foods", cents:1248000, po:"PO-1036", outcome:"Verified Complete"},
  {id:"INV-48214", supplier:"Harlow Tooling", cents:84725, po:"PO-1037", outcome:"Verified Complete"},
  {id:"INV-48215", supplier:"Ironbark Fasteners", cents:226000, po:null, outcome:"Escalated: Missing Purchase Order"},
  {id:"INV-48216", supplier:"Vantage Print", cents:52990, po:"PO-1039", outcome:"Verified Complete"},
  {id:"INV-48217", supplier:"Meadowbrook Office", cents:137612, po:"PO-1040", outcome:"Verified Complete"},
  {id:"INV-48218", supplier:"Sable & Co. Logistics", cents:441500, po:null, outcome:"Escalated: Missing Purchase Order"},
  {id:"INV-48219", supplier:"Brightwater Industrial", cents:1842000, po:"PO-1042", poCents:1798000, outcome:"Approval Required (Tier 3)"},
  {id:"INV-48220", supplier:"Northgate Pallets", cents:273250, po:"PO-1044", outcome:"Outcome Unknown"},
];
const demonstrations = [
  {id:"D1", person:"priya", time:"Mon 09:14", invoice:"INV-48203", supplier:"Brightwater Industrial"},
  {id:"D2", person:"priya", time:"Mon 10:02", invoice:"INV-48204", supplier:"Copperline Cables"},
  {id:"D3", person:"jamal", time:"Tue 13:40", invoice:"INV-48207", supplier:"Harlow Tooling"},
];
const gateExamples = {observed:3, archivedSmeVerified:2, required:5};
const playbook = {
  id:"PB-AP-RECON", title:"Supplier invoice vs purchase order reconciliation",
  version:"1.0", status:"Approved for Guidance", owner:"marcus",
  steps:[
    ["AP-STEP-01","Receive invoice and identify supplier"],
    ["AP-STEP-02","Locate purchase order and verify identity"],
    ["AP-STEP-03","Interpret invoice totals"],
    ["AP-STEP-04","Compare totals against approved variance rule"],
    ["AP-STEP-05","Stage ERP result or escalate"],
    ["AP-STEP-06","Verify authoritative business outcome"],
  ],
  rules:[
    {id:"AP-RULE-009", name:"Variance threshold", owner:"daniel",
      condition:"variance > 2.00% of PO requires Tier 3 approval; <= 2.00% auto-accepts within match"},
    {id:"AP-RULE-017", name:"Supplier handling fees", owner:"daniel",
      condition:"Use approved supplier terms; interpretation alone does not change policy"},
  ],
  exceptions:["Missing Purchase Order","Duplicate invoice","Approval Required",
    "Outcome Unknown","Unreadable PDF"]
};
const versions = [
  {id:"v0.1", kind:"agent", state:"candidate", suite:"SIM-AP-RECON", passed:21, safe:6, failed:1},
  {id:"v0.2", kind:"agent", state:"candidate", suite:"SIM-AP-RECON", passed:22, safe:6, failed:0},
  {id:"v1.0", kind:"agent", state:"released", stage:3, cohort:"AP East"},
  {id:"v1.1", kind:"agent", state:"repair", suite:"SIM-AP-RECON-34", passed:28, safe:6, failed:0},
  {id:"v1.0", kind:"playbook", state:"Approved for Guidance"}
];
```

### 6.1 Simulator suite

Every listed scenario has a stable ID, starting condition, expected business result, and explicit verdict. The only v0.1 defect is SCN-022; every other verdict remains unchanged. Six expected safe escalations are passing outcomes. Edge/negative gate is six: SCN-023–028. Boundary scenarios are additional coverage, not added to the six just to alter the stated gate.

| ID | Input / expected result | v0.1 → v0.2 |
|---|---|---|
| SCN-001 | Exact invoice/PO match; stage and verify | Passed → Passed |
| SCN-002 | Brightwater ordinary invoice; match | Passed → Passed |
| SCN-003 | Copperline ordinary invoice; match | Passed → Passed |
| SCN-004 | Northgate ordinary invoice; match | Passed → Passed |
| SCN-005 | Orchard Lane ordinary invoice; match | Passed → Passed |
| SCN-006 | Harlow ordinary invoice; match | Passed → Passed |
| SCN-007 | Vantage ordinary invoice; match | Passed → Passed |
| SCN-008 | Meadowbrook ordinary invoice; match | Passed → Passed |
| SCN-009 | Approved vendor and matching PO reference; match | Passed → Passed |
| SCN-010 | Invoice lines in different order; verify total | Passed → Passed |
| SCN-011 | Invoice has multiple matching lines; verify total | Passed → Passed |
| SCN-012 | Zero variance, two-decimal formatting; match | Passed → Passed |
| SCN-013 | Case-insensitive PO prefix; identify approved record | Passed → Passed |
| SCN-014 | Approved invoice date; match | Passed → Passed |
| SCN-015 | Existing tax amount covered by PO; match | Passed → Passed |
| SCN-016 | Approved handling line covered by terms; match | Passed → Passed |
| SCN-017 | Variance below threshold; accept within match | Passed → Passed |
| SCN-018 | Variance one cent below threshold; accept within match | Passed → Passed |
| SCN-019 | Negative variance within threshold; accept within match | Passed → Passed |
| SCN-020 | Already matched record with evidence; avoid duplicate write | Passed → Passed |
| SCN-021 | Verification readback matches staged values; verified complete | Passed → Passed |
| SCN-022 `variance_exactly_2.00pct` | Exact 2.00%; auto-accept within match | Failed → Passed |
| SCN-023 | Missing PO, Ironbark; escalate | Passed — Expected Safe Escalation → same |
| SCN-024 | Missing PO, Sable; escalate | Passed — Expected Safe Escalation → same |
| SCN-025 | Duplicate invoice; stop and escalate | Passed — Expected Safe Escalation → same |
| SCN-026 | Variance above 2.00%; request Tier 3 approval | Passed — Expected Safe Escalation → same |
| SCN-027 | ERP submit timeout; hold Outcome Unknown, do not resubmit | Passed — Expected Safe Escalation → same |
| SCN-028 | Unreadable PDF; stop and escalate | Passed — Expected Safe Escalation → same |

SCN-029–034 extend this exact suite, not replace any of its 28 members:

| ID | Regression input | Expected v1.1 outcome |
|---|---|---|
| SCN-029 | Kestrel layout v2, $4,175 subtotal + $38.50 handling = $4,213.50, PO terms cover fee | Passed |
| SCN-030 | Kestrel layout v2, same handling line appears after subtotal with different spacing | Passed |
| SCN-031 | Kestrel layout v2, handling line before total, permitted terms | Passed |
| SCN-032 | Kestrel layout v2, zero handling amount under permitted terms | Passed |
| SCN-033 | Kestrel layout v2, handling label capitalization differs, permitted terms | Passed |
| SCN-034 | Kestrel layout v2, approved handling line uses an additional separating rule above the total | Passed |

`SIM-AP-RECON-34` = the original 28 scenario references plus 6 above: the original failure and five nearby variations. v1.1 reports 28 Passed + 6 Passed — Expected Safe Escalation + 0 Failed = 34. No new rule, permission or supplier scope is inferred from these formatting variants. Unaffected scenarios retain expectations and verdicts; compare the same base suite separately when comparing v0.1 and v0.2.

### 6.2 Incident, evidence, release and measurements

```ts
const incident = {
  id:"INC-0042", status:"Contained", agentVersion:"v1.0",
  affected:["INV-48231","INV-48233","INV-48236"],
  observed:"Required amount could not be verified on 3 Kestrel invoices",
  hypothesis:{text:"supplier document format change", status:"unconfirmed"},
  containment:"Pause these 3 cases before repair",
  evidence:[
    {id:"E-0042-01", source:"INV-48231", fact:"Invoice $4,213.50"},
    {id:"E-0042-02", source:"PO-1051", fact:"PO $4,175.00"},
    {id:"E-0042-03", source:"INV-48231", fact:"$38.50 handling line after subtotal"},
    {id:"E-0042-04", source:"AP-RULE-017", fact:"Approved terms cover handling fee"},
  ],
  correction:{actor:"elena", case:"INV-48231", completedManually:true,
    answer:"Yes; billed on top of subtotal and within approved terms",
    policyChange:false},
  proposal:{id:"REP-0042-1", from:"v1.0", to:"v1.1",
    scope:"Kestrel Components layout v2 only", step:"Interpret invoice totals",
    before:"Do not include a separately positioned handling line without verified terms",
    after:"Include the handling line when approved Kestrel terms cover it",
    permissionsChanged:false, policyChanged:false, scenariosAdded:6},
  release:{cohort:"Kestrel Components invoices / AP East", firstVerified:3,
    firstObserved:3, owner:"marcus", stop:"pause on regression or unknown",
    expand:"owner-authorized after 3/3 verified", disposition:"Repaired - Validated"}
};
const commitment = {
  title:"Confirm Kestrel handling-fee terms in writing", owner:"priya",
  source:"Zoom 00:14:32", originalDue:"Fri 17:00", confirmedDue:"Fri 12:00",
  qualifier:"subject to company approval", consent:"per-meeting opt-in"
};
const jobSnapshots = {
  beforeApproval:{verified:7, escalated:2, approval:1, unknown:1, started:11},
  afterVerifiedApproval:{verified:8, escalated:2, approval:0, unknown:1, started:11}
};
```

Variance is `(1842000 - 1798000) / 1798000 × 100 = 2.447…%`, displayed `2.45%`; the threshold compares integer amounts, not the rounded displayed percentage. Kestrel difference is `421350 - 417500 = 3850` cents. A later 3/3 release watch is a separate cohort from JOB-0117; never add it to that Job's 11 cases. A verified rate, if displayed, uses 7/11 before approval or 8/11 after verified approval, and always separately labels 1/11 unknown; omit it if the denominator and snapshot do not fit. Do not calculate time saved. Before decision, the Job is `Partially Complete`; `Completed with Exceptions` is reserved for a later state only if all unresolved cases have appropriate resolved or explicitly handed-off terminal handling.

### 6.3 Notifications and audit

| ID | Recipient / title | Linked object and consequence |
|---|---|---|
| N-01 | Daniel / `Approval Required` | INV-48219; opens approval, not an implicit approval |
| N-02 | Marcus / `INC-0042 Contained` | three Kestrel cases paused; opens incident |
| N-03 | Priya / `Confirm Kestrel handling-fee terms in writing` | confirmed commitment, due Fri 12:00, context NetSuite vendor record |
| N-04 | Marcus / `Repair Ready` | REP-0042-1, appears after regression pass |
| N-05 | Marcus / `Release Status` | v1.1 limited cohort, appears only after authorization |

Audit event sequence uses logical order, not invented timestamps: A01 Priya consent; A02 Priya and Jamal approve their respective sanitized Demonstrations; A03 Marcus publishes PB-AP-RECON v1.0; A04 Marcus approves release v1.0 within AP East; A05 authorized operator starts JOB-0117; A06 Daniel approves INV-48219; A07 independent readback verifies that case; A08 Marcus contains INC-0042; A09 Elena records correction; A10 Marcus validates Kestrel-only scope; A11 regression evaluation completes; A12 Marcus authorizes limited release; A13 three cohort outcomes verified; A14 Marcus expands and closes; A15 authorized user exports audit pack. Store each `{id, actor, action, object, scope, outcome, order}` and show timestamps only when defined in source evidence.

### 6.4 Adapter matrix

`O=Observe, G=Guide, A=Assist, S=Run Supervised, R=Run Autonomously`. Every omitted cell is `Unavailable`, not an unlabeled grey cell. Zoom Observe requires per-meeting opt-in.

| App | O | G | A | S | R |
|---|---|---|---|---|---|
| Gmail | Available | Available | Available | Unavailable | Unavailable |
| NetSuite | Available | Available | Unavailable | Available | Unavailable |
| Google Sheets | Available | Available | Unavailable | Available | Unavailable |
| Slack | Available | Available | Unavailable | Unavailable | Unavailable |
| Zoom | Available, per-meeting opt-in | Available | Unavailable | Unavailable | Unavailable |
| HubSpot | Available | Available | Available | Unavailable | Unavailable |
| Chrome | Available | Available | Unavailable | Unavailable | Unavailable |

Salesforce, Outlook, Excel, Teams, Meet and Edge are grey mark tiles outside this demonstrated matrix. Their presence alone is not an availability claim.

## 7. Prototype architecture and film runtime

```text
demo/oryn-prototype/
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  public/
    fonts/                    # self-hosted faces plus OFL notices
    marks/                    # original Oryn and permitted third-party assets
  src/
    main.tsx
    app/App.tsx
    app/routes.ts
    app/shell.tsx
    components/ui/            # installed upstream primitives, adapted tokens
    components/domain/        # status, evidence, cases, graph, gates, diff
    fixtures/people.ts
    fixtures/invoices.ts
    fixtures/scenarios.ts
    fixtures/governance.ts
    fixtures/notifications.ts
    screens/SC01.tsx          # through SC37, grouped only where sensible
    state/types.ts
    state/reducer.ts
    state/guards.ts
    state/selectors.ts
    film/schema.ts
    film/hackathon.json
    film/launch.json
    film/resolveFrame.ts
    film/cursor.ts
    film/camera.ts
    film/FilmRoot.tsx
    skins/                    # Gmail, NetSuite, Sheets, Slack, Zoom, HubSpot, Chrome, macOS
    styles/tokens.css
    styles/product.css
    styles/stage.css
  hyperframes/
    index.html
    compositions/
    assets/
  scripts/
    audit-fixtures.ts
```

One typed reducer owns transitions in both modes. A film event invokes the same actions as clicking; fixture selectors derive counts. No screen owns an independent counter. State is replayed from a fixed initial snapshot and ordered events up to `t`; the film never depends on a previously rendered frame. Sorting uses `(time, sequence)` and time is integer frame index divided by 60. Animation interpolation is a pure function of local frame. Camera and cursor use no wall clock, asynchronous data fetch, network fonts, CSS infinite animation, timers, random jitter or pending promises. Fix locale `en-US`, timezone `America/New_York`, viewport and font bytes.

```ts
type Event =
 | {frame:number; seq:number; type:\"action\"; action:Action}
 | {frame:number; seq:number; type:\"camera\"; from:[number,number,number]; to:[number,number,number]; duration:number; easing:\"reveal\"}
 | {frame:number; seq:number; type:\"cursor\"; from:[number,number]; c1:[number,number]; c2:[number,number]; to:[number,number]; duration:number; click:boolean}
 | {frame:number; seq:number; type:\"type\"; target:string; text:string; charsPerSecond:number; seed:number}
 | {frame:number; seq:number; type:\"overlay\"; id:string; visible:boolean};
type Timeline = {fps:60; durationFrames:10800; seed:number; events:Event[]};
function resolveFrame(timeline:Timeline, frame:number):FrameView {
  const events = timeline.events.filter(event => event.frame <= frame);
  const state = events.reduce(reduceFilmEvent, initialState);
  return deriveView(state, events, frame, timeline.seed);
}
```

`reduceFilmEvent` applies action events once in deterministic order; `deriveView` samples active intervals and never mutates reducer state. A stateless hash of `(seed,target,charIndex)` yields bounded typing jitter; clamp event order so characters never reverse. For interactive use, `dispatch(action)` calls the same reducer; reset restores initial fixture snapshot. Clicking an unavailable control announces its guard, not a silent no-op. URL `/app?screen=SC22&state=ST10` selects a permitted snapshot; `/film/hackathon?frame=0` or `/film/launch?frame=0` seeks exactly. Validate query IDs against unions and reject unsupported combinations. No local storage affects film mode.

| State | Transition and guard | Effect |
|---|---|---|
| ST01 enrollment | `CONSENT` only after notice and category selection | enable permitted observation; ST02 |
| ST02 observation | `REVIEW_MEETING` after per-meeting consent | show source and proposed commitment; ST03 |
| ST03 meeting_review | `CONFIRM_COMMITMENT` after user edit/confirmation | save Fri 12:00 and source; ST04 |
| ST04 candidate_review | `PUBLISH` after contribution review and owner approval | playbook v1.0 Approved for Guidance; ST05 |
| ST05 playbook_published | `CREATE_AGENT` by owner | v0.1 candidate, no release; ST06 |
| ST06 agent_draft | `RUN_SIMULATION` with sealed suite | ST07, running indication |
| ST07 simulation_running | `COMPLETE_SIMULATION` for v0.1 | 21/6/1, stop arc, ST08 |
| ST08 simulation_failed | `FIX_AND_RUN` fixes exact-boundary condition | v0.2; execute suite; ST09 only on complete 22/6/0 |
| ST09 simulation_passed | `RELEASE_AND_START` after 5/5 examples, ≥25 passes including six edge/negative, owner approval, scope confirmation and action authorization | v1.0 Stage 3; pinned JOB-0117, ST10 |
| ST10 job_running | `PAUSE_FOR_APPROVAL` after fixed case events | 7/2/1/1 snapshot, held unknown, ST11 |
| ST11 approval_required | `APPROVE` only Daniel authorized, then `VERIFY_READBACK`; incident arrives in next cycle | 8/2/0/1 only after verification; ST12 contained |
| ST12 incident_open | `TEACH` after Elena completes INV-48231 manually | preserve containment, ST13 |
| ST13 correction_captured | `PROPOSE_REPAIR` after Marcus validates Kestrel layout v2 scope | REP-0042-1, no policy/permission change; ST14 |
| ST14 repair_testing | `LIMITED_RELEASE` only 28/6/0 and required owner authorization | v1.1 cohort AP East/Kestrel; ST15 |
| ST15 limited_release | `EXPAND_AND_CLOSE` only after 3/3 independently verified, owner approval | expanded release, incident disposition Repaired - Validated; ST16 |
| ST16 rollout_expanded_closed | `OPEN_MONTAGE` | ST17; keep earlier states in history |
| ST17 ops_map | `NEXT` | ST18 peer_guidance |
| ST18 peer_guidance | `NEXT` | ST19 policy_revalidation |
| ST19 policy_revalidation | `NEXT` | ST20 unsafe_blocked; 1 playbook, 1 agent, 34 tests marked |
| ST20 unsafe_blocked | `NEXT` | ST21 versions |
| ST21 versions | `NEXT` | ST22 command_center |
| ST22 command_center | `NEXT` | ST23 audit_export |
| ST23 audit_export | `NEXT` | ST24 notifications |
| ST24 notifications | `RESET` | return ST01; or navigate to permitted earlier view without rewriting history |

If a guard fails, retain state and provide named reason. Film shots can seek a defined state snapshot without faking a transition: reconstruct the prerequisite action history as events, then enter the requested view. For approval split decision, submission and independent verification into distinct events. For simulation split start and end, and show `Not Run` on canceled or incomplete scenarios. Presentation of montage states does not imply incident chronology changed.

Cursor samples cubic Bézier position from normalized local frame; click rings sample elapsed time and use ink. Camera transforms a single stage world around a fixed transform origin; scale 1–1.8, x/y interpolated from event bounds. Render product at 1280×720 inside stage card; use an explicit mode flag for stage chrome so product borders never inherit stage shadows. SC26 has one 400ms, 24-frame left-to-right ink wipe, sampled from absolute frame, switching the theme beneath it; all later dark states are legible. Both cuts use the x128–1152, y630–688 subtitle strip, IBM Plex Mono 600 at 13–15px authored. Mock skins are typed configuration of labels, geometry and mark paths, not remote sites or embedded third-party code.

Performance budget at DPR 2: 16.67ms/frame, target ≤8ms JS+style+layout, ≤4ms paint/composite, reserve ≥4ms; avoid animating width/height, filters, box-shadow or expensive grid layouts. Virtualize long interactive tables but pin the filmed rows. Use transforms, opacity, static SVG and predecoded media; limit simultaneous moving stage cards to 8, avoid live React Flow recomputation during camera motion, and snapshot graph geometry. Preload fonts/media before capture; no WebGL dependency. Detect dropped frames and capture memory on the target machine rather than assuming the budget is met.

## 8. Rendering and edit pipeline

Separate `hyperframes/index.html` root, `compositions/h01.html` etc., and `assets/` for permitted local footage, audio and fonts. Root `data-duration=\"180\"` and 60 fps; every timed element is `.clip` with `data-start`, `data-duration`, stable ID and track kind. Each scene uses a template, scoped styles and one paused timeline registered as `window.__timelines[compositionId]`; scene transitions are authored as bounded child animations. Never tween clip `display`, `visibility` or `autoAlpha`; do not transform an element in CSS if GSAP controls its transform. Media clips have correct `data-has-audio`; each audio element has an ID. Assets use relative `assets/...` paths. Declare deliberate overlap and overflow using HyperFrames attributes. Hold the final state until the composition ends; frame range is `[0,10800)` at 60 fps.

After building, use `npx hyperframes lint`, then `npx hyperframes check --json`; fix every error, inspect warnings, and do not accept zero sampled frames as a pass. Use `npx hyperframes snapshot --review` and inspect scene midpoints, reveal endpoints and the incident flip. Run `npx hyperframes preview --background`; open the resulting preview in the HyperFrames desktop app for editing. For the final approved cut use `npx hyperframes render --quality delivery -o renders/oryn-hackathon-v01.mp4`; inspect the CLI's actual 60fps configuration and output metadata rather than assuming a flag or default. HyperFrames requires Node 22+ and FFmpeg; use the installed CLI help to resolve version-specific flags. This document is a plan: no render has been run.

Fallback: local Playwright page at fixed viewport 1280×720 and deviceScaleFactor 2; wait for `document.fonts.ready`, image decode and explicit application readiness; for frame `n` call `window.renderFrame(n)` synchronously, wait two browser animation-frame callbacks only as a capture barrier, then screenshot the 2560×1440 viewport. The state and visible animation depend on `n`, not those callbacks. Capture `frame-%05d.png` for n=0..10799; encode with FFmpeg at 60fps. Disable network and assert no unexpected requests. Decode and compare first/last frames and several random-access frames against sequential captures.

Work in sRGB/Rec.709 consistently: convert the sRGB source to Rec.709 display-referred output with an explicit color-managed transform; tag final H.264 output `bt709` primaries/transfer/matrix and limited range. Do not simply relabel sRGB values as Rec.709. Downsample 2560×1440 to 1920×1080 with a high-quality Lanczos filter, preserving aspect ratio. Deliver MP4 H.264 High Profile, yuv420p, 60fps, target CRF 16–18, AAC 48kHz stereo 320kb/s, faststart; retain a lossless or mezzanine master. Burn the same subtitle strip for both cuts at authored x128–1152, y630–688, IBM Plex Mono 600, 13–15px; export SRT/VTT as well. Check 10800 frames and exactly 180 seconds. Mix final audio to -16 LUFS integrated, -1 dBTP maximum, measured after encode. Save `oryn-{hackathon|launch}-vNN-{draft|master|delivery}.{mp4|wav|srt|vtt}` and include revision/date in delivery log.

| Scene ID | Hackathon section / time | Launch section / time | Source |
|---|---|---|---|
| F01 | H1 00:00–00:26 | L1 00:00–00:10 | live hook, stage titles |
| F02 | H2 00:26–00:52 | L2 00:10–00:22 | app chaos, sources |
| F03 | H3 00:52–01:22 | L3 00:22–00:32 | mark, lifecycle, AI/Bob; Bob is hackathon-specific |
| F04 | H4 01:22–02:38 | L4 00:32–00:44 | enrollment, privacy |
| F05 | H4 | L5 00:44–00:56 | observation, meeting |
| F06 | H4 | L6 00:56–01:12 | discovery and playbook |
| F07 | H4 | L7 01:12–01:30 | agent, scope, gates |
| F08 | H4 | L8 01:30–01:46 | simulation and boundary fix |
| F09 | H4 | L9 01:46–02:04 | job, approval, unknown |
| F10 | H4 | L10 02:04–02:24 | containment, correction, repair, release |
| F11 | H4 | L11 02:24–02:44 | breadth, graph, audit and analytics |
| F12 | H5 02:38–03:00 | L12 02:44–03:00 | on-camera close and end card |

Lifecycle copy, in order: Observe → Understand → Review → Publish → Compile → Simulate → Authorize → Execute → Verify → Diagnose → Correct → Repair → Re-evaluate → Release. The scripts own exact edit points within these section boundaries.

## 9. Audio plan

Record mono 48kHz/24-bit WAV in a quiet, treated room; put absorptive blankets behind and beside the speaker, switch off fans and phone notifications. Place a cardioid microphone 15–20cm from mouth, slightly off-axis with a pop filter, and maintain position across takes. Aim peaks around -12 dBFS, never above -6 dBFS; record 30 seconds of room tone. Read each script section at natural pace, mark breaths and pauses, record three complete takes plus pickups without changing mic position. Capture H1–H5 and L1–L12 individually; priority pickups are the exact boundary, `7/2/1/1`, unknown/no resubmit, Kestrel containment, `28/6/0`, Bob facts after capture, and each close. Match inflection at sentence boundaries, leave a second of silence before and after each pickup, and slate cut/section/take aloud.

Design cues from original recordings or licensed sources; levels below are starting peaks relative to full scale before mastering, not promises about perceived loudness. Duck music 3–6dB under speech, 30ms attack / 250ms release; reduce overlapping effects by a further 3–6dB when speech masks consonants.

| Cue | Recipe / duration / spectral character | Starting peak |
|---|---|---|
| tick-key | short felt/plastic tap, 25–45ms, 2–5kHz; vary deterministically | -30 dBFS |
| tick-click | dry switch click, 35–60ms, 1–4kHz | -26 dBFS |
| whoosh-short | filtered noise sweep, 180–300ms, 300Hz–5kHz | -28 dBFS |
| whoosh-long | low-pass noise sweep, 500–900ms, 150Hz–4kHz | -30 dBFS |
| pop-card | soft wood tap plus short sine, 100ms, 250Hz–2kHz | -27 dBFS |
| slide-snap | soft friction then click, 180ms, 800Hz–4kHz | -28 dBFS |
| hatch-sweep | brushed paper/noise, 250ms, 500Hz–5kHz | -30 dBFS |
| stamp-verify | felt stamp plus low sine, 160ms, 180Hz–2kHz | -24 dBFS |
| chime-approve | two quiet sine partials, 420ms, 660/990Hz | -26 dBFS |
| low-thud-contain | low damped thud, 250ms, 80–250Hz | -24 dBFS |
| alarm-soft | two restrained pulses, 350ms, 500–900Hz | -27 dBFS |
| ring-close | glass/metal partials, 350ms, 1–3kHz; verified only | -28 dBFS |
| arc-hum | filtered 110Hz sine and quiet upper harmonic; only during a simulator, Job or regression run, with 80ms fades | -36 dBFS |
| riser | filtered noise with slow pitch rise, 600ms, 300Hz–4kHz | -32 dBFS |
| hit-hard | short muted percussion, 150ms, 100Hz–1.5kHz | -24 dBFS |
| paper-slide | close-mic paper friction, 250ms, 600Hz–6kHz | -30 dBFS |
| glitch-short | granular digital click, 100ms, 1–5kHz; use sparingly | -32 dBFS |
| mic-room-tone | matching recorded room ambience, continuous under edits | -50 dBFS or match room |

Music: 100–110 BPM, D minor or an equivalently restrained minor key, light percussion, muted synth pulse, sparse piano and warm low pad; avoid heroic orchestral builds. Source an original composition or a license explicitly allowing hackathon and public video distribution, edits, worldwide use, and perpetual hosting. Record proof and credit obligations. Arrange 26-second intro, restrained explanatory middle, increased movement under simulation, subdued containment, resolved end; leave space for voice. Mix chain: clip gain and gentle high-pass on voice, corrective EQ, light compression 2:1, de-esser if needed, automation, bus metering, true-peak limiter, final loudness measurement. Avoid blanket noise suppression that destroys voice articulation.

## 10. Solo shoot and capture plan

Use one quiet bright room with a simple neutral background and modest depth. Place subject center-right and leave left third for stage type; lock phone or camera on a tripod at eye level. Capture 4K/30 or 4K/60 with 1/60 or 1/120 shutter respectively, lock exposure and white balance, use the main lens at approximately 35–50mm equivalent by placing the camera farther away rather than digital zoom. Avoid artificial portrait blur. Key with a large window or diffused light 45° from face, white bounce opposite, separate subject from background by 1–2m. Wear solid ink or bone, no large logos or fine patterns. Use a teleprompter close to the lens, large text and natural pauses; record one take without it as a performance alternative.

| Shot | Framing / camera | Exact line source and purpose |
|---|---|---|
| H1-A | medium wide, subject right, hands visible | `hackathon-video-script.md` H1 on-camera opening, exact VO as written |
| H1-B | tighter chest-up, same eyeline and lighting | H1 subsequent hook and identity, exact VO as written |
| H5-A | medium wide matching H1-A | H5 on-camera close, exact VO as written |
| L1-A | medium wide, left space for type | `launch-video-script.md` L1 hook, exact VO as written |
| L1-B | tight alternate, same camera axis | L1 continuation, exact VO as written |
| L12-A | medium wide | L12 closing line, exact VO as written |
| room | locked empty frame | 10 seconds before and after footage, plus 30 seconds room tone |
| sync | both camera and external microphone recording | clap visibly once at start and once at end of long take; align transient in edit |

Record three takes per line plus one slower and one more energetic backup. Slate every take with cut, section and number; save original footage and separate audio, do not overwrite. Capture hands on keyboard, mouse beside laptop, blank workspace, and camera setup as optional nonessential b-roll; avoid personal documents or identifiable third parties. Collect `[USER SCREENSHOT 1: approved work-app overview, redacted]`, `[USER SCREENSHOT 2: approved spreadsheet or workflow artifact, redacted]`, and `[USER SCREENSHOT 3: approved business communication texture, redacted]`; each is a static, authorized texture, never evidence of an actual customer or a filmed external session.

**Real IBM Bob capture:** prepare a dedicated review session on the demo worktree. Close unrelated tabs; disable notifications, hide account identifiers and secrets, use a disposable local fixture, and inspect terminal scrollback. Record the actual Bob UI at 2560×1440 or larger and 60fps if feasible. Frame prompt, relevant repository path, Bob's review response, and the actual resulting diff/comment with enough dwell for reading; do not scroll through secret values. Record a clean uninterrupted master plus a controlled close crop. Before publishing inspect every frame and audio channel; apply opaque redaction or reshoot, not reversible blur. Collect `[BOB_SESSION_DATE: actual date and timezone]`, `[BOB_TASK: exact development task and prompt]`, `[BOB_REVIEW_SCOPE: actual file/commit range reviewed]`, `[BOB_FINDING: actual finding quoted or accurately summarized]`, `[BOB_ACTION: actual human response and resulting change]`, `[BOB_EVIDENCE: permitted screenshot or PR/review URL]`. If no finding occurs, state only what was actually reviewed; never invent a result.

## 11. IBM Bob primary-development workflow

Bob is the primary development tool for the prototype, not merely a visual credit. Record meaningful development sessions and actual human decisions. Use Bob for initial project scaffold and fixture types; ask it to build the shared reducer and views, then produce targeted tests or checks and review diffs. User remains responsible for reviewing generated code, correcting domain errors and accepting changes. Never submit private customer data, secrets or the main checkout's unrelated content.

| Day range | Concrete Bob work | Human review gate and retained evidence |
|---|---|---|
| D0–D2 | Ask Bob to scaffold Vite/React/TS, shared tokens, fixture types and Job data. | Review dependency licenses, numbers, HSL values; save prompt, response, session screenshot and diff. |
| D3–D5 | Ask Bob to implement enrollment, discovery, playbook and simulator reducer/screens. | Walk consent and authority paths, exact 2.00% boundary, no unsupported capability; retain session IDs and code review comments. |
| D6–D8 | Ask Bob to build Job/approval/unknown and incident/repair/rollout screens. | Verify hold/no duplicate, separate approval/readback, exact cohort and 34-case totals; capture Bob review of real diff. |
| D9–D11 | Ask Bob to implement deterministic film sampling, timeline and accessible interaction. | Compare seeked/sequential frames, reduced motion, no timers; retain specific issue and real response if one exists. |
| D12–D14 | Ask Bob to review changed code, number consistency, accessibility and build failures; resolve real findings. | Save final review, links to actual PRs if created, review comments and session screenshots; check submitted copy matches evidence. |

Judges should see a short genuine Bob review excerpt in H3, the resulting code or diff, and a concise first-person account grounded in `[BOB_*]` facts. Keep an evidence ledger with timestamp, prompt, output, action, file or commit and safe screenshot path. Do not assert Bob was primary unless the recorded work establishes that fact.

## 12. Calendar, gates, critical path and submission

Critical path: fixture and state contract → hero screens → simulator and Job outcomes → incident/repair → deterministic timing and capture → VO and edit → export → upload/access test → submission. Brand assets, shoot preparation, certificate and project page run in parallel; one person must explicitly reserve blocks instead of assuming simultaneous work. Protect D13–D14 as slack, not new feature time.

| Day / date | Prototype lane | Film, audio and submission lane | Exit gate |
|---|---|---|---|
| D0 Wed Nov 18 | Freeze bible, states and fixture model; Bob scaffold plan | Confirm official rules, certificate enrollment, storyboard mapping | all dependencies and deadline recorded |
| D1 Thu Nov 19 | Create shell, fonts, tokens, status primitives | draw ring and wordmark; acquire mark/license records | 1280×720 shell readable |
| D2 Fri Nov 20 | Implement people, 11 invoices, scenario fixtures | design stage, subtitle layout, shot setup | 7/2/1/1 and 21/6/1 arithmetic checks |
| D3 Sat Nov 21 | SC01–SC11 privacy, mocks, meeting | shoot location test, capture room tone | consent and pause visibly work |
| D4 Sun Nov 22 | SC12–SC18 discovery, playbook, scope | initial VO rehearsal and mock asset review | gate cannot precede passing simulation |
| D5 Mon Nov 23 | SC19–SC20 simulation, fix and comparison | draft film timeline through simulator | 21/6/1 becomes 22/6/0 only after fix |
| D6 Tue Nov 24 | SC21–SC25 Job, approval, evidence | record real Bob session, select excerpt | separate approval/readback; unknown held |
| D7 Wed Nov 25 | SC26–SC29 incident and repair | shoot H1/H5 and L1/L12, back up originals | containment precedes correction |
| D8 Thu Nov 26 | SC30–SC37 breadth and skins | record full VO and pickups; source licensed music | 28/6/0, 3/3 cohort separate from Job |
| D9 Fri Nov 27 | deterministic runtime, cursor and camera | collect screenshot permissions, sound palette | seeked frame equals sequential frame |
| D10 Sat Nov 28 | complete interactions and guard messages | assemble H1–H3 and Bob evidence | real Bob findings transcribed accurately |
| D11 Sun Nov 29 | accessibility, numeric audit, reduce motion | assemble H4–H5; captions and first mix | hackathon full 180s rough cut |
| D12 Mon Nov 30 | fix critical defects and freeze fixtures | hackathon picture lock; render master; draft slides/project page | legible 1080p, correct audio and citations |
| D13 Tue Dec 1 | no scope growth; fix blockers only | upload and private/public-link test; launch re-cut; certificate and slides | working link and all submission fields ready |
| D14 Wed Dec 2 | contingency for blockers, no speculative changes | submit well before 5:00 PM ET; verify receipt, then finish optional launch | confirmed submission and saved receipt |

Cut-down order if behind: first reduce decorative collage, extra camera moves, optional b-roll and montage dwell; then simplify nonessential skins to fewer static original panels while preserving all hero interaction and exact adapter labels; then omit optional launch polish until after hackathon submission. Never cut spoken narration, Bob evidence, privacy, the 2.00% failure/fix, mixed outcome and unknown, containment before repair, required project page/slides/certificate, or accessibility captions. Do not replace actual functionality required by judges with an empty visual.

Submission checklist:

- [ ] Final hackathon video at or under the stated limit, spoken narration audible, H1–H5 requirements visibly addressed.
- [ ] Upload YouTube, Vimeo or Drive; set public or otherwise organizer-accessible permissions; test exact link in a signed-out browser and on a second device.
- [ ] Project page includes problem, AI/technical approach, real Bob usage, video link, slides, team and university details.
- [ ] SkillsBuild certificate obtained and attached or linked as required.
- [ ] Slides exported, readable, accessible link verified; follow the hackathon script's slide outline.
- [ ] Team name and member Harikeshav Rameshkumar, The Ohio State University, challenge details accurate.
- [ ] Rules and any organizer-specific form fields checked; submit before 2026-12-02 5:00 PM ET.
- [ ] Save confirmation/receipt, submitted links and final files; re-open links signed out.

## 13. Quality assurance and acceptance

Review representative first, middle, last and transition frames for each scene, plus each cursor click and each state change at frame `n-1`, `n`, `n+1`. Check no blank frame or premature clip cutoff, no cyan after execution, no unintended dark theme before containment, and no drift between visual and voice. In addition to the frame counts, check audio starts at zero and the last word and URL remain readable before the end. Compare one random seek per scene with a sequential capture at the same frame; compare pixels after identical decoding, allowing only documented video decoding tolerance. Captures use fixed font files, locale, viewport and seed.

At 1080p inspect the delivered H.264 file, not only the source. Minimum authored product text is 11px, corresponding to 16.5px at delivery before camera scaling; subtitle is 19.5–22.5px delivered. Key values and action labels should reach at least 18px delivered and hold long enough to read. If a crop reduces text below the floor, enlarge the product card, reframe or remove nonessential content; never conceal a critical label. Check tiny source citations at 100% and on a laptop display. Use title-safe margins, no caption over important values, and verify each status using shape and text with grayscale review.

Contrast-check foreground against actual composited surfaces, including translucent layers, at ≥4.5:1 for normal text, ≥3:1 for large text and necessary non-text boundaries, and visible focus indicators. Status color glyphs are paired with black/white labels; dark mode needs separate measurements. Test focus order, tab, Shift-Tab, arrows, Enter, Escape, dialog focus trap and return, screen-reader names and live status announcements. Motion preference removes camera motion, cursor travel and orbit movement in the clickable build while preserving all information; film uses its designed motion.

Dead-end audit: open each SC01–SC37 from its normal navigation and return; try each guarded action without its prerequisite, verify an explanation and valid next step, then complete it. Verify denied consent, missing role, canceled suite, failed scenario, unknown ERP submission, rejected approval, incident pause, blocked release, no matching search, no authorized exports and empty notifications. Unknown cannot invoke an unqualified retry. Every action that changes state must either succeed with a visible result or explain its guard; browser reload at a supported state URL must not generate misleading history.

`scripts/audit-fixtures.ts` should load the same typed fixtures as the UI and check: exactly 11 unique invoices; 7/2/1/1 before approval; 8/2/0/1 only after approval and independent verification; no PO on exactly the two named missing-PO cases; integer variance comparison `44000*10000 > 1798000*200`; display rounds to 2.45%; 28 unique base scenario IDs, 21/6/1 → 22/6/0, exactly six expected safe escalations; 34 unique regression scenarios, 28/6/0, original 28 preserved; incident has three named cases and 421350−417500=3850; cohort 3/3 separate from Job population; gates 5/5 examples and 6 edge/negative; 2.00% → 1.50% policy change impacts 1 playbook, 1 agent, 34 tests. Check each fixture reference resolves, each screenshot/event ID exists, each role action is authorized, and every exact status label occurs without forbidden synonyms. Emit file, object ID, expected and actual values; exit nonzero on any mismatch.

Brand and terminology audit: scan UI, captions, slide draft and project page for `11 successful`, unsourced ROI, traction, customer claims, production/live claims, certification badges, real personal data, copied competitor language, lime, isometric geometry, unsupported capability, private recording access, policy inferred from SME answer, claims that a submit equals verification, and specific Bob findings without evidence. Ensure the two sourced-stat citations below match their publication and wording; Gartner forecast must be verified before publication or omitted:

- Ardent Partners, Payables Place, 2026-10-22: $9.90 and 11.6 days per invoice; 19.9% require manual exception handling; 38.3% straight through untouched. https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/
- Gartner, 2025-06-25, forecast over 40% of agentic AI projects canceled by end of 2027; **verify exact wording before publishing**. https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- If used, McKinsey Global Institute, *The social economy* (2012), approximately 19% of workweek searching/gathering information; cite year and identify the studied group as interaction workers.

Captions transcribe every spoken word, identify meaningful offscreen sounds only when needed, preserve terms and punctuation, avoid overlaps, and are manually corrected against final mix. Provide UTF-8 SRT with `HH:MM:SS,mmm` and WebVTT with `WEBVTT` header and `HH:MM:SS.mmm`; cue start < end, chronological order, maximum two lines and approximately 42 characters per line, minimum readable hold, no cue beyond 03:00. Burned strip is consistent with the sidecar; use appropriate line breaks rather than altering wording.

## 14. Risk register and judging map

| Risk | Likelihood / impact | Mitigation / owner |
|---|---|---|
| Official Rules third-party IP clause and real trademarks | Medium / high | Obtain official marks and permission or applicable license, use small nominative identifiers in original mock interfaces, no endorsement, retain provenance; replace if rights cannot be established. Harikeshav. |
| Dec 2 versus Dec 10 date discrepancy | Certain / high | Follow stricter Official Rules deadline Dec 2 5:00 PM ET; upload D13 and submit D14 early. Harikeshav. |
| Bob-primary requirement not demonstrable | Medium / high | Use Bob throughout actual development; retain prompts, sessions, diffs and review evidence; cite only observed work. Harikeshav. |
| Solo workload and schedule collision | High / high | Daily gates, critical path, D13–D14 reserve, cut ornamental work first; record sound and footage in batches. |
| Inconsistent Job, simulator or repair totals | Medium / high | Typed canonical fixture, integer comparisons, automated audit and screen-by-screen human check. |
| Unknown submission incorrectly retried | Medium / high | Dedicated held state, guard on duplicate writes, evidence drawer and explicit no-resubmit copy. |
| SME explanation mistaken for policy approval | Medium / high | Show rule linkage and bounded interpretation; no permissions or policy change; Marcus validates scope. |
| Music/mark/font rights unclear | Medium / high | Maintain asset ledger and license copies; use original/cleared alternative. |
| Bob capture leaks secrets or private context | Medium / high | Dedicated environment, inspect frame-by-frame, opaque redact or reshoot, archive safe master. |
| Render nondeterminism or frame drift | Medium / high | Frame-index pure runtime, no timers/network, font preload, cross-check random seeks, reserve fallback capture. |
| Voice unintelligible or rushed | Medium / medium | Treated room, three takes, prioritize critical numbers, loudness and caption review. |
| Brand names imply unsupported functionality | Medium / high | Explicit per-capability matrix, no availability inference from marks, Zoom consent. |
| Upload permissions or outage | Medium / high | Upload D13, signed-out and second-device link test, backup host and local master. |
| Gartner forecast wording not confirmed | Medium / medium | Verify primary source before publication; otherwise omit. |
| Stage/type legibility at 1080p | Medium / medium | Delivery-frame inspection, size floors and safe region, simplify before shrinking. |

| Criterion, 1–5 | Evidence in hackathon cut |
|---|---|
| Technical Execution | Shared state machine, deterministic simulator, actual Bob-supported build, guarded approval and readback, incident repair regression. |
| Innovation | Closed lifecycle linking Demonstrations, verification, scoped correction and controlled release rather than click automation alone. |
| Challenge Fit | Accounts-payable exception burden and documented invoice research; concrete employee, owner and approver needs. |
| Implementation & Feasibility | Defined scope and capabilities, explicit consent, bounded permissions, repeatable tests and rollout gates; working clickable prototype. |

## 15. Appendices

### 15.1 ID glossary and naming

| Prefix | Meaning |
|---|---|
| SC01–SC37 | screen or stage surface in §5 |
| ST01–ST24 | shared reducer state in §7 |
| H1–H5 / L1–L12 | hackathon / launch sections; exact script owns time and narration |
| F01–F12 | reusable film scene family, §8 |
| D1–D3 | employee-approved Demonstrations |
| INV / PO | invoice / purchase order business record |
| PB-AP-RECON | approved guidance playbook |
| AP-STEP / AP-RULE | playbook step / Business rule |
| SIM-AP-RECON / SCN | scenario suite / immutable scenario identifier |
| JOB-0117 | original 11-invoice Job; Case is one invoice |
| INC-0042 / REP-0042-1 | contained incident / bounded Repair proposal |
| E / A / N | evidence / ordered audit event / notification |
| v0.1, v0.2, v1.0, v1.1 | immutable agent versions; qualify playbook v1.0 separately |

Use `oryn-{cut}-{section}-{shot}-{take}` for recordings, `oryn-{cut}-vNN-{kind}` for exports, `SCnn-name.tsx` for screens, and stable case-sensitive fixture IDs. Never reuse an ID for a different business object. Keep raw footage, licensed sources, production exports, captions and project files in separate directories with read-only copies of originals.

### 15.2 Full asset manifest

| ID | File family | Source / rights / checks |
|---|---|---|
| A-FONT-01–03 | `fonts/{ibm-plex-mono,space-grotesk,crimson-text}/*` | OFL originals and licenses; IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700, Crimson Text 400/600/700; verify all actual files and glyph coverage |
| A-BRAND-01 | `marks/oryn-open-ring.svg` | original geometry §3; gap test at icon sizes |
| A-BRAND-02 | `marks/oryn-wordmark.svg` | original lettering using licensed font; preserve editable text/source |
| A-MARK-01–08 | `marks/{gmail,netsuite,sheets,slack,zoom,hubspot,chrome,macos}.*` | official mark provenance and rights recorded separately; no implied endorsement |
| A-MARK-09–14 | `marks/{salesforce,outlook,excel,teams,meet,edge}.*` | grey tile presentation only; actual source/rights recorded |
| A-CAMERA-H1/H5/L1/L12 | `footage/oryn-{cut}-{section}-*.mov` | user's own captures, three takes plus backup |
| A-VOICE-H1–H5/L1–L12 | `audio/vo/{cut}-{section}-*.wav` | user voice, 48kHz/24-bit, room tone retained |
| A-BOB | `footage/bob-review-redacted.mov` | genuine recorded Bob session, reviewed/redacted frame by frame |
| A-USER-01–03 | `textures/user-screen-{01..03}.*` | user-provided, authorized, redacted static textures |
| A-SFX | `audio/sfx/{cue-name}.wav` | recipes and levels §9; each original or documented license |
| A-MUSIC | `audio/music/bed.wav` | original or documented distribution rights and credit |
| A-CAPTIONS | `captions/oryn-{cut}-vNN.{srt,vtt}` | generated from final transcript, manually corrected |
| A-RENDER | `renders/oryn-{cut}-vNN-{master,delivery}.mp4` | rendered final outputs, metadata and accessibility checked |
| A-PROOF | `evidence/bob/*`, `evidence/licences/*`, `evidence/submission/*` | sanitized development evidence, asset rights and receipt; exclude secrets |

### 15.3 Cue sheet and caption style

| Cut | Scene | Frame in/out | Cue ID | Source / license | Gain | Duck | Notes |
|---|---|---|---|---|---|---|---|
| Hackathon | F09 | exact frame from script | stamp-verify | original / retained source | -24 dBFS peak | VO priority | only after readback |
| Hackathon | F10 | exact frame from script | low-thud-contain | original / retained source | -24 dBFS peak | VO priority | containment begins |
| Launch | F08 | exact frame from script | arc-hum | original synthesis | -36 dBFS peak | VO priority | fades at simulation stop |

Both cuts use the same caption strip: authored x128–1152, y630–688; ink `#0A0A0A`, IBM Plex Mono 600, bone `#F6F6F3`, 13–15px authored / 19.5–22.5px delivered, 8px vertical and 12px horizontal padding, at most two lines. Avoid covering evidence or essential control labels. Sidecars carry ordinary punctuation and do not describe purely decorative motion.

### 15.4 Worktree and delivery workflow

Work only in `~/Developer/Oryn-demo` on branch `demo/video`; `~/Developer/Oryn` remains clean and read-only. Keep this branch isolated; never merge it to main. Save logical commits on the demo branch after review, without staging unrelated changes; preserve source assets and license notices. Use Bun for JS package management and scripts when the project is built; retain a pinned lockfile. Record render version, source revision, exact timeline and asset checksums in a delivery manifest. Review script, fixtures and rendered frames together whenever a value changes; never edit an exported video to mask a contradictory underlying state.

### 15.5 Project page draft

**Problem.** Accounts-payable work spans invoices, purchase orders, approvals and multiple business systems. An automation can finish its clicks and still produce the wrong business outcome. Exceptions and changed supplier documents require a way to stop, explain and recover.

**Approach.** Oryn turns permitted Demonstrations into reviewable Playbooks and Agent candidates. A workflow owner defines scope and policy, evaluates representative scenarios, and releases a version with appropriate oversight. Jobs distinguish verified outcomes, escalations, required approvals and unknown submissions. An incident can be contained, corrected with expert input, tested against regression cases and released to a limited cohort. Private evidence stays local; specifically authorized cloud inference is transient and governed.

**IBM Bob.** I used IBM Bob to build and review the prototype. `[BOB_TASK: exact development work supported by Bob]`. In `[BOB_SESSION_DATE: actual date and timezone]`, Bob reviewed `[BOB_REVIEW_SCOPE: actual files or revision range]`; `[BOB_FINDING: only an actual finding, or accurately state that no specific finding is being claimed]`. I responded by `[BOB_ACTION: actual change and review decision]`. Evidence: `[BOB_EVIDENCE: permitted screenshot or actual review/PR URL]`. Replace all Bob slots with verified facts before submission.

**Team.** Harikeshav Rameshkumar, The Ohio State University. IBM AI Builders Challenge, North America — AI for Business.

**Slides.** Use the slide outline in `hackathon-video-script.md`; retain its problem, product, technical approach, Bob evidence, demonstration, impact and next-steps sequence. Include only sourced statistics and actual Bob findings.

## 16. Screen construction sheets: SC01–SC12

These sheets expand §5. Coordinates are absolute inside the 1280×720 product viewport. Box notation is `[left, top, width, height]`, while point notation is the pointer hotspot, not the top-left corner of the visual control. Shared shell regions remain fixed: sidebar `[0,0,240,720]`, header `[240,0,1040,56]`, breadcrumb `[264,72,700,24]`, content `[264,112,992,584]`. Within a stage card the whole viewport is transformed together. A screen's named core text below is the text to implement; surrounding fixture-derived values come directly from §6. Do not insert decorative filler labels or unexplained metrics.

**Common interaction and rendering rules for all sheets.** Hover changes a 1px boundary to foreground and, where appropriate, applies surface-2; it does not change layout. Keyboard focus adds a 2px foreground outline with 2px offset. Disabled controls retain readable labels, use an explanatory adjacent sentence, and expose the reason to assistive technology. Loading preserves layout with neutral static skeletons and the text `Loading`; a failed load gives `Unable to load` and a `Try again` action only for a safe read. An empty result names the missing object and a valid next step. Unknown business state uses a hatched glyph and explicit wording, never a fabricated value. In dark theme use the dark tokens in §3; switching theme changes only presentation, not data or authorization. Film enters dark at SC26 and retains that appearance during the incident sequence; it does not imply that other screens lack dark-mode support.

### SC01 — Desktop companion and menu bar

**Purpose and framing.** Establish visible observation and employee control. H4 uses this as the privacy montage begins; L4 uses a close crop of the menu and its status. Frame the full desktop `[0,0,1280,720]` at 1.0 before moving the stage camera to 1.45 centered at `(1090,130)`. Keep the caption strip below y630; never crop the pause control while the voice discusses it.

**Regions and copy.** Menu bar `[0,0,1280,28]` uses surface with foreground labels `Oryn`, `Observation active` and an icon. The menu `[930,28,326,240]` is surface, radius 8, border, shadow-md. Its header `[946,44,294,40]` contains `Observation active`; rows `[946,92,294,40]` and `[946,140,294,40]` read `Pause observation` and `My Privacy`. A final line `[946,200,294,32]` states `Capture status is visible`. The remaining desktop is bone, not a fabricated screenshot.

**Targets and states.** P(1100,112) pauses observation and changes both menu bar and menu label to `Observation paused`; P(1100,160) opens SC03. Passive observation uses a neutral indicator with text, never cyan or `arc-hum`; cyan and the hum are reserved for active simulator, Job and regression runs. While permissions are unavailable, display `Observation unavailable` and the missing permission; do not imply a successful pause or capture. The hover and focus rules above apply to both menu rows. On resume, require the permitted category and any updated notice.

### SC02 — Enrollment wizard

**Purpose and framing.** Show a meaningful choice before any observation. H4 and L4 use the same screen, with the camera pushing from the entire wizard to the consent controls. Keep the action footer and organization notice simultaneously visible.

**Regions and copy.** Bone surrounds the central surface card `[320,100,640,520]`, radius 8, border 1px. Header `[352,128,576,80]` contains `Your work, your choice` and `Review your organization's notice before enabling observation.` The progress rail `[352,216,576,24]` reads `Notice`, `Choose`, `Confirm`. Control rows `[352,260,576,48]`, `[352,316,576,48]`, and `[352,372,576,48]` read `Visual work observation`, `Meeting transcription`, and `Share reviewed contributions`; each has a distinct labeled switch. Notice `[352,430,576,56]` says `Meeting capture requires consent for each meeting.` Footer `[352,536,576,52]` contains `Back` and `Continue`.

**Targets and states.** P(390,572) returns to the preceding wizard step; P(1040,572) advances only if the notice and required choices are acknowledged. A denied category remains off; an incomplete notice yields `Review the notice to continue`. A policy load failure leaves every capture category off and gives a safe read retry. Focus walks through the notice and controls in reading order. Hover never marks a switch enabled; switch position, text and accessible state communicate its value.

### SC03 — My Privacy

**Purpose and framing.** Show exclusions, local retention, deletion and pause without suggesting that deletion removes an already published organizational record. H4 and L4 show the left half first, then the pause and retention panel in a 1.25 camera crop.

**Regions and copy.** Main heading `[264,112,992,40]` reads `My Privacy`. A left panel `[264,168,600,440]` lists `Excluded apps, windows and URLs`, `Password managers`, `Personal banking`, `Private browsing`, and `Add exclusion`. The right panel `[888,168,344,440]` contains `Local retention: 7 days`, `Pause observation`, `Delete local history`, and `Already shared contributions follow a separate removal process.` Surface is white or dark surface; each list separator is border, and mandatory exclusions use neutral lock glyphs.

**Targets and states.** P(1100,238) pauses; P(1060,350) opens the delete confirmation. Confirmation describes scope and offers `Cancel` and `Delete eligible local history`. Mandatory exclusions cannot be disabled and display `Required by policy`. Loading shows `Loading privacy settings` in the unchanged panel; failure says `Privacy settings unavailable` and leaves capture unchanged. A deletion success says `Eligible local history deleted` rather than promising deletion of external exports.

### SC04 — Contextual HUD

**Purpose and framing.** Demonstrate contextual help without interrupting or taking control of another application. H4 breadth and L11 show the peer fix; L5 may show the contextual reminder. The card occupies `[900,148,320,144]` above a mock app without covering its selected control.

**Regions and copy.** Card header `[912,160,296,24]` reads `Known fix from AP East: Vendor tax ID format`; body `[912,190,296,42]` reads `Check the vendor tax ID format before submitting.` Footer `[912,238,296,38]` holds `Guide Me` and `Dismiss`. Reminder variant replaces text with `Confirm Kestrel handling-fee terms in writing`, `Priya Nair · Fri 12:00`, and `View commitment`. Use a foreground icon, surface and 1px border; shadow-md is permitted because HUD floats.

**Targets and states.** P(1095,257) opens the guide; dismiss closes the card but never resolves a case or commitment. If the contextual surface cannot be identified, the card remains text-only and avoids an unverified screen highlight. Loading is a compact neutral placeholder; access failure says `Guidance unavailable for this context`. Both variants retain focus visibility and have distinct accessible names.

### SC05 — Gmail invoice and PDF

**Purpose and framing.** Place the hero invoice in a recognizable work context. L2 uses a fast crop; L5 and H4 show the email-to-invoice source. Stage camera may push to 1.6 on the invoice amount, but keep its ID and supplier together in the same frame.

**Regions and copy.** Chrome bar `[0,28,1280,48]`; mail rail `[0,76,184,644]`; message pane `[184,76,480,644]`; PDF pane `[664,76,616,644]`. Message header says `Brightwater Industrial`, `Invoice INV-48219`, `PO-1042`, and `Invoice attached`. PDF page `[704,124,520,512]` shows `INV-48219`, `Brightwater Industrial`, `PO-1042`, and `$18,420.00`. Use a small Gmail mark as a nominative identifier, with original layout, bone chrome and white document.

**Targets and states.** P(745,286) opens or selects the PDF; P(830,390) selects the invoice reference in the document. A loading page reads `Opening attachment`; a missing attachment reads `Attachment unavailable` and does not invent an amount. An excluded window renders no captured thumbnail. Selected source text uses neutral signal rather than cyan, and a focus outline surrounds the actual interactive target.

### SC06 — NetSuite bill and PO match

**Purpose and framing.** Make approval consequential and show the authoritative records needed to verify the result. H4 and L5/L9 use this view. Frame the comparison and status together; the camera must not show the result of approval before the approval event.

**Regions and copy.** App header `[0,28,1280,48]`; left rail `[0,76,200,644]`; bill form `[224,100,1024,540]`. Heading `Vendor bill` appears above `INV-48219`, `Brightwater Industrial`, `Invoice $18,420.00`, `PO-1042 $17,980.00`, `Variance $440.00 · 2.45%`, and `Variance Hold`. The lower action row presents `Review variance` and `Stage result`. The status uses warning glyph and foreground text, not an orange-filled primary button.

**Targets and states.** P(820,374) selects PO evidence; P(1060,598) stages the proposal but cannot approve it. A permitted contextual reminder appears only when the Kestrel vendor record is open; it is not attached to Brightwater's bill. A failed PO read says `Purchase order unavailable`; unknown submit status says `Outcome Unknown` and holds any repeat. After Daniel approves and an independent readback confirms the result, show `Matched - Variance Approved`.

### SC07 — Google Sheets exception tracker

**Purpose and framing.** Show the human handoff as a separate artifact rather than a proven business result. H2 may use an abstracted crop; H4 and L5 show a short overview with enough time to read the title.

**Regions and copy.** Menu `[0,28,1280,40]`, formula bar `[0,68,1280,32]`, column headings `[0,100,1280,36]`, grid `[0,136,1280,500]`. Document title is `AP Exceptions Tracker`; headers are `Invoice`, `Supplier`, `Issue`, `Owner`, `State`. Rows include `INV-48215 · Ironbark Fasteners · Missing Purchase Order` and `INV-48218 · Sable & Co. Logistics · Missing Purchase Order`. Owners and state are drawn from approved case handoff data only; do not invent named owner assignments.

**Targets and states.** P(485,180) selects a row and opens its linked case when the hit target is visible. `Tracker unavailable` preserves the last known displayed state without claiming synchronization. A selected cell gets a neutral 2px outline; a hovered row gets surface-2. Dark mode recolors the surrounding shell but preserves contrast in the sheet grid. A tracker entry is not independent ERP verification.

### SC08 — Slack escalation channel

**Purpose and framing.** Illustrate the destination of missing-PO follow-up. H2 uses a brief cropped message list; H4 and L11 may show the channel alongside the case. Keep both invoice IDs visible whenever the voice references two escalations.

**Regions and copy.** Rail `[0,28,220,692]`, channel header `[220,28,1060,56]`, messages `[220,84,1060,520]`, composer `[244,616,1012,64]`. Header reads `#ap-escalations`; message bodies read `Missing purchase order: INV-48215` and `Missing purchase order: INV-48218`. A muted label `Case link` identifies each link. The Slack mark is small and sourced; the interface is independently drawn.

**Targets and states.** P(400,185) opens the first linked case; P(400,255) opens the second. A disconnected channel says `Messages unavailable`; it does not silently display a successful send. The composer is read-only in this scene unless a separately authorized action is scripted. Hover underlines case links and focus gives an outline; a link's accessible name contains the invoice ID.

### SC09 — Zoom meeting and consent

**Purpose and framing.** Make per-meeting authorization visible before the meeting evidence appears. H4 and L5 start with the banner, then reveal the meeting. The banner must remain legible for the consent decision rather than flashing for a single frame.

**Regions and copy.** Consent banner `[200,60,880,56]` reads `Allow capture for this meeting?` and `Meeting recording requires participant notice and consent.` Buttons are `Not now` and `Allow for this meeting`. Grid `[200,128,880,464]` contains named tiles `Dana Whitfield` and `Priya Nair`; bottom controls `[200,592,880,64]` include microphone, camera and end controls. The quote reads `From the next cycle we're adding a handling line to every invoice.` The meeting indicator appears only after consent.

**Targets and states.** P(980,88) accepts only this meeting; P(820,88) declines. Without consent, show `Meeting capture off`, never a recording indicator. If source audio is unavailable, show `Transcript unavailable` rather than fabricated speaker attribution. A screen-reader announcement describes state changes; hover does not begin capture. Dark call chrome is a mock-app skin, distinct from the story's single product dark-mode flip.

### SC10 — HubSpot blocked discount

**Purpose and framing.** Show an unsafe action stopped, not executed. H4 breadth and L11 cut to the deal and then the approval requirement. The mock app uses its own restrained identifying header without duplicating a real product screenshot.

**Regions and copy.** Navigation `[0,28,1280,56]`; record rail `[0,84,220,636]`; deal panel `[244,108,992,540]`. The core field `[292,250,520,56]` reads `Discount` and `12%`. Inline alert `[292,330,768,96]` reads `Requires Tier 3 approval - Daniel Okafor`; action `[920,492,200,40]` reads `Request approval`. Alert uses warning shape and foreground text.

**Targets and states.** P(1000,512) requests approval, leaving the discount unapplied. Without authority or routing, show `Approval request unavailable` and a reason, not an enabled post action. If a request is sent, show `Approval requested`, not `Approved`. The focused request button has the common outline; hover inversion must not look like cyan execution.

### SC11 — Meeting review and commitment

**Purpose and framing.** Show that a proposed commitment is reviewed and can be edited. H4 and L5 pair the transcript with the right-hand review panel. Crop at 1.25 so the source timestamp and changed deadline fit in the same readable shot.

**Regions and copy.** Transcript `[264,128,560,488]`; review pane `[848,128,384,488]`. Transcript includes `Dana Whitfield`, `00:14:32`, and Dana's exact handling-line quote; Priya's line is `Send me the new layout; I'll confirm the terms in writing by Friday.` The review pane says `Confirm Kestrel handling-fee terms in writing`, `Owner: Priya Nair`, `Due: Fri 17:00`, `Source: 00:14:32`, and `subject to company approval`. Action buttons read `Edit`, `Confirm`, `Dismiss`.

**Targets and states.** P(1050,342) edits deadline to `Fri 12:00`; P(1090,562) confirms the revised item. If the meeting was not authorized, the review is blocked with `Meeting evidence unavailable`; if speaker attribution is uncertain, label it unknown rather than guessing. Confirming is a personal commitment, not organization-wide policy or another person's acceptance. Success reads `Confirmed Commitment`.

### SC12 — Shared shell and Home

**Purpose and framing.** Introduce persistent navigation and the current organizational role. H4 uses Home as a brief orienting frame; L11 returns to aggregate information through SC33. The shared shell remains at fixed position through all management views.

**Regions and copy.** Sidebar `[0,0,240,720]` begins with `Oryn`, `Calder & Vance`, and a role selector. It lists `Home`, `Operations Map`, `Playbooks`, `Agent Factory`, `Flight Simulator`, `Jobs`, `Incidents`, `Changes`, `Insights`, and `Settings`. Header includes `Search`, `Notifications`, and current role. Content cards `[264,128,472,180]`, `[760,128,472,180]`, `[264,332,472,180]`, `[760,332,472,180]` read `Approvals`, `Incidents`, `Verified outcomes`, `Recent changes`.

**Targets and states.** P(135,54) opens organization/role selection; P(620,28) opens search; P(1200,28) opens notifications. Roles offered are `Employee`, `Workflow Owner`, `Approver`, `Admin`, with permitted navigation determined by the current view's role assignment. Restricted pages state `You don't have access to this area`; they do not appear as empty success. Cards have neutral selection rails and no stage shadow inside the product layer.

## 17. Screen construction sheets: SC13–SC25

### SC13 — Workflow Discovery inbox

**Purpose and framing.** Show a proposed procedure emerging from reviewed evidence. H4 and L6 begin with the inbox and push toward the candidate row. Use full shell then camera scale 1.3 around `(700,215)`; keep its `Needs Review` state and count visible.

**Regions and copy.** Title strip `[264,112,992,48]` reads `Workflow Discovery`. Filters `[264,168,992,40]` read `All candidates`, `Needs Review`, `Owner`. Table `[264,220,992,400]` has columns `Candidate workflow`, `Demonstrations`, `Status`, `Owner`. Hero row `[264,252,992,48]` reads `Supplier invoice vs purchase order reconciliation`, `3 demonstrations`, `Needs Review`, `Marcus Webb`. White surface, border dividers and neutral badge distinguish the row.

**Targets and states.** P(550,276) opens SC14; row hover uses surface-2 and keyboard focus is outlined. An empty inbox says `No candidates yet` and offers `Review approved contributions`; a failed query offers a safe read retry. Missing source evidence is labeled `Evidence unavailable` and cannot be silently reconstructed. The exact selection does not publish the workflow.

### SC14 — Candidate review

**Purpose and framing.** Expose evidence alignment and one uncertain branch before owner review. H4 and L6 use the three cards as a film composition; camera pans across D1–D3 and settles on the uncertainty label rather than implying it is resolved.

**Regions and copy.** Heading `[264,112,992,48]` reads `Candidate workflow`; title beneath is `Supplier invoice vs purchase order reconciliation`. Cards `[264,184,292,120]`, `[568,184,292,120]`, `[872,184,292,120]` respectively show `D1 · Priya Nair · Mon 09:14 · INV-48203`, `D2 · Priya Nair · Mon 10:02 · INV-48204`, and `D3 · Jamal Carter · Tue 13:40 · INV-48207`. Steps panel `[264,328,592,270]` contains the six §6 step labels; evidence panel `[880,328,352,270]` reads `Evidence`, `Reviewed Contribution`, and `variance exception rule: unverified until SME review`. Footer says `Request owner review`.

**Targets and states.** P(1040,360) opens permitted evidence; P(1090,600) submits the reviewed candidate for owner review, not direct deployment. Unreviewed private source is unavailable to the owner; an absent contribution shows `Contribution unavailable`. A rejected or withdrawn contribution removes its evidence from unpublished synthesis. Selected cards use signal rail; confidence is a label, not proof.

### SC15 — Approved Playbook

**Purpose and framing.** Distinguish publication of human guidance from deployment of agent execution. H4 and L6 reveal the status only after owner approval. Stage framing keeps title and approval badge in view before the camera follows the steps.

**Regions and copy.** Header `[264,112,992,72]` reads `Supplier invoice vs purchase order reconciliation`, `Playbook v1.0`, `Approved for Guidance`, and `Owner: Marcus Webb`. Procedure `[264,208,608,384]` shows `Receive invoice and identify supplier`, `Locate purchase order and verify identity`, `Interpret invoice totals`, `Compare totals against approved variance rule`, `Stage ERP result or escalate`, `Verify authoritative business outcome`. Right rail `[896,208,336,384]` lists `AP-RULE-009 Variance threshold`, `AP-RULE-017 Supplier handling fees`, and `Evidence`. Bottom action says `Create Agent`.

**Targets and states.** P(1080,630) opens SC17. Before approval show `Needs Review` and disable `Publish` with a reason; publication requires Marcus's authority. Missing rule evidence keeps the branch unverified. The approved state uses check/shield and foreground label; it never turns the playbook into a running agent by itself.

### SC16 — Operations Map

**Purpose and framing.** Show dependencies, not a speculative causal guarantee. H4 breadth and L11 show the Reconciler selection and its rule/incident connections. Camera starts at 1.0 showing the full graph, moves to 1.25 centered at the agent node, and holds the adjacent labels in frame.

**Regions and copy.** Canvas `[264,112,992,560]`; toolbar `[280,128,960,40]` says `Operations Map`, `Map`, `Table`. Nodes are workflow `[320,260,188,64]`, `AP-RULE-009` `[580,170,188,64]`, `AP-RULE-017` `[580,350,188,64]`, `Supplier Invoice Reconciler` `[870,260,188,64]`, and `INC-0042` `[1040,400,188,64]`. Solid edges denote approved dependencies, dashed edges proposed relationships; no edge implies authority.

**Targets and states.** P(964,292) selects the agent and highlights its incident and rule edges in signal; P(1190,148) opens the equivalent table. Missing evidence is an explicit `Evidence unavailable` node detail. Graph loading uses a neutral skeleton; an empty map reads `No workflows available`. All nodes are keyboard reachable through a list view and retain a 2px focus indication.

### SC17 — Agent Factory

**Purpose and framing.** Translate a reviewed workflow into a candidate with visible limits, not a released agent. H4 and L7 show the typed intent. The camera tracks the field without cutting off `stage the result in the ERP`.

**Regions and copy.** Heading `[264,112,992,40]` reads `Create Agent`. Prompt `[304,160,880,72]` contains `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` A six-part structured result `[304,256,880,300]` is headed `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`. Mark the unresolved branch `Unverified — requires review`. Footer contains `Back`, `Review scope`.

**Targets and states.** P(1050,600) moves to SC18 when required fields exist. Generation uses a neutral indicator and text, not arc or `arc-hum`. Missing purpose produces a visible field error; failed generation preserves the typed intent and offers safe retry. No inferred action or source grants permission to execute.

### SC18 — Scope, risk and Stage 3 gate

**Purpose and framing.** Make action risk and readiness prerequisites legible. H4 and L7 show scope, then the autonomy ladder. Pan only after giving the gate list enough dwell to read.

**Regions and copy.** Scope panel `[264,128,480,472]` reads `AP East`, `Gmail`, `NetSuite`, `Google Sheets`, `Read: Tier 0`, `Tag/stage: Tier 1/2`, `Post/approve variance: Tier 3`, `Tier 3 - Consequential`. Ladder `[768,128,464,300]` lists `0 Observe`, `1 Suggest`, `2 Guide`, `3 Supervised Assist`, `4 Scoped Autopilot`, `5 Self-Maintaining Autopilot`. Gate `[768,448,464,152]` lists `5/5 verified human examples`, `28 representative scenarios`, `6 edge/negative`, and `Owner approval`.

**Targets and states.** P(1020,606) opens the simulator; selecting Stage 3 alone does not release. Before evaluation, show `Evaluation pending`, even if the suite is defined. After v0.2 passes and the owner approves, show satisfied checks. Unauthorized permissions show `Unavailable for this role`. A failure never colors the whole ladder cyan; success uses neutral signal and status glyphs.

### SC19 — Flight Simulator run

**Purpose and framing.** Show an evaluation of an exact candidate and sealed suite, with execution visually distinct from a pass. H4 and L8 start on the suite and then play the run. The camera moves toward the grid while retaining the candidate version and suite title.

**Regions and copy.** Header `[264,112,992,48]` reads `Flight Simulator`, `SIM-AP-RECON`, `Agent v0.1`. Grid `[304,184,472,416]` contains the 28 scenario tiles in four columns and seven rows; legend `[800,184,408,144]` reads `Passed`, `Passed — Expected Safe Escalation`, `Failed`, `Not Run`. Action `[1000,140,200,40]` reads `Run scenarios`. Progress `[800,352,408,72]` shows completed out of 28.

**Targets and states.** P(1100,160) starts the fixed evaluation; arc travels only while an attempt is running. Cancel marks remaining cases `Not Run`, and overall status `Incomplete`; it does not count them as failed or passed. If an expected outcome is missing, block the run and say `Define Expected Result`. A focus outline on each tile reveals its full scenario name.

### SC20 — Simulator results and replay

**Purpose and framing.** Show the boundary bug and the corrected version against the same scenario set. H4 and L8 give the failed tile, replay, fix and second totals separate beats. Camera scale 1.45 on the replay must not hide the rule.

**Regions and copy.** Summary `[264,112,992,64]` displays v0.1 `21 Passed`, `6 Passed — Expected Safe Escalation`, `1 Failed`. Grid `[264,192,472,416]`; replay `[760,192,472,416]` says `variance_exactly_2.00pct`, `Expected: auto-accept within match`, `Actual: escalated`, `AP-RULE-009`. Compare tab shows v0.2 `22 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`.

**Targets and states.** P(500,292) selects the boundary case; P(1050,590) applies the boundary fix and starts a new evaluation. A failed rerun leaves v0.2 ineligible. Incomplete run shows only finished verdicts and `Not Run` elsewhere. The old evaluation is immutable; selection uses neutral signal, failed tile uses danger glyph plus text, and running arc stops at completion.

### SC21 — Job queue and preflight

**Purpose and framing.** Show a specific Job request with bounded inputs and a fixed agent version. H4 and L9 begin with the preflight dialog, not an autonomous run appearing unprompted.

**Regions and copy.** Queue header `[264,112,992,48]` says `Jobs`. Table `[264,176,992,336]` shows `JOB-0117`, `Supplier Invoice Reconciler v1.0`, `AP East`, `11 invoices`, `Tier 3 - Consequential`. Confirmation dialog `[384,168,512,384]` says `Start Job`, `Selected population: 11 invoices`, `Scope: AP East`, `Agent version: v1.0`, `Approval required for Tier 3 actions`, `Cancel`, `Start Job`.

**Targets and states.** P(1110,170) opens the dialog; P(780,520) confirms after role, release and scope checks. A preflight failure says which check failed and leaves the Job unstarted. Missing history reads `Insufficient History for Estimate`; never invent duration or cost. Hover and focus are distinct for `Cancel` and `Start Job`, and Escape returns focus to the trigger.

### SC22 — Job run

**Purpose and framing.** Convey a batch of independently tracked cases, with a mixture of outcomes. H4 and L9 show the status progression and the two exceptions requiring attention. Preserve a view of the Job ID as the camera traverses the table.

**Regions and copy.** Header `[264,112,992,48]` reads `JOB-0117`, `Supplier Invoice Reconciler v1.0`, `AP East`. Progress `[264,168,992,56]` shows `11 invoices` and counts derived from event state. Case table `[264,232,992,384]` uses columns `Invoice`, `Supplier`, `Amount`, `PO`, `Status`; all eleven data rows use §6 verbatim, with no fabricated PO for the two missing cases. Footer uses `Pause`, `View summary`.

**Targets and states.** P(1050,524) opens INV-48219 approval when its row is in view; P(1050,556) opens INV-48220 evidence. If actual row placement differs, drive cursor target from measured element bounds rather than using a stale coordinate. Running glyph is arc only while active. A failure or unknown holds that Case; unrelated cases continue only when safe.

### SC23 — Approval drawer

**Purpose and framing.** Show the actual business change and the approver's authority, not a generic approve button. H4 and L9 hold this screen long enough to read the values and the before/after status. Keep drawer inside the caption-safe crop.

**Regions and copy.** Drawer `[800,0,480,720]`; header `[824,24,432,56]` reads `Approval Required`, `INV-48219`. Evidence `[824,100,432,176]` shows `Invoice $18,420.00`, `PO-1042 $17,980.00`, `Variance $440.00 · 2.45%`, `AP-RULE-009`. Diff `[824,300,432,160]` shows `Before: Variance Hold`, `After: Matched - Variance Approved`. Authority row says `Tier 3 approver: Daniel Okafor`; footer says `Reject`, `Request Changes`, `Approve`.

**Targets and states.** P(1100,665) approves only with Daniel's valid delegation and a current proposal; this records approval but does not yet count a verified result. Reject and request changes end that proposal without changing the bill. A stale proposal says `Approval expired`; missing evidence blocks approval. Focus is trapped, Escape closes without decision, and the trigger regains focus.

### SC24 — Outcome Unknown evidence drawer

**Purpose and framing.** Explain why an uncertain submission is held instead of being repeated. H4 and L9 show the text before leaving the Job; the hatch is a supporting visual, not a substitute for the words.

**Regions and copy.** Drawer `[800,0,480,720]`; title reads `INV-48220`, `Outcome Unknown`. Evidence panel `[824,112,432,224]` reads `ERP submit timed out`, `Submission may have reached the ERP`, `Held`, `Resubmission unavailable`. A later panel `[824,360,432,128]` says `Verify authoritative ERP state before deciding next work`. Footer has `Investigate` and `Close`; no retry or resubmit control is rendered.

**Targets and states.** P(1060,585) opens the investigation, not a duplicate submission. Missing readback states `Evidence unavailable` and maintains the hold. If independent evidence later establishes the result, append a separate verification event; retain the prior uncertainty in history. Loading uses neutral skeletons; the dark variant reverses hatch contrast and preserves readable foreground text.

### SC25 — Job summary

**Purpose and framing.** Make the batch arithmetic immediately auditable. H4 and L9 show the initial four outcomes, then the approved-and-verified snapshot. After independent readback, replace the complete snapshot over 150ms; never animate a count-up or suggest success before evidence exists.

**Regions and copy.** Title `[264,112,992,48]` reads `JOB-0117`, `Partially Complete`. Four cards, `[264,160,232,160]`, `[512,160,232,160]`, `[760,160,232,160]`, `[1008,160,224,160]`, display `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`. After approval and verification only, they display `8`, `2`, `0`, `1` respectively. Below `[264,344,968,176]` says `11 invoices` and offers `View cases`.

**Targets and states.** P(1080,370) opens the unknown-filtered case list; each card is keyboard operable if it is a filter. A loading snapshot says `Loading Job results`; stale data is labeled rather than replaced with zeros. Focus uses an outline and selected filter uses a signal rail. Background remains surface, with no hard stage shadow inside product cards.

## 18. Screen construction sheets: SC26–SC37

### SC26 — Incident Center

**Purpose and framing.** Make containment precede diagnosis and repair. H4 and L10 show the light-to-dark wipe as the affected scope stops; no settings toggle is clicked. Hold the three case IDs and `Contained` in one frame before moving to the evidence.

**Regions and copy.** Dark shell; incident list `[264,112,300,560]` has `INC-0042`, `Contained`, `Kestrel Components`. Detail `[588,112,644,560]` has heading `INC-0042`, `3 cases paused`, `INV-48231`, `INV-48233`, `INV-48236`, and `Supplier document format change — unconfirmed`. Comparison `[612,320,596,128]` reads `Expected: amount verifiable from invoice and PO`, `Actual: required amount could not be verified`, `$38.50 handling fee`. Controls are `View evidence`, `Teach Oryn What Changed`.

**Targets and states.** P(960,398) opens evidence; P(1090,600) opens teaching only after the manual correction is complete. During containment loading, show `Applying containment`; do not label cases contained until the state event completes. Failed containment shows `Containment failed` and leaves the relevant warning prominent. Missing evidence is an explicit gap; the unconfirmed hypothesis remains labeled. Use dark surface, border and light foreground; only active operations use arc.

### SC27 — Teach Oryn What Changed

**Purpose and framing.** Capture Elena's explanation without promoting it into company policy. H4 and L10 show one focused question, the answer and linked rule. The camera moves from the manually completed case to the question, then settles before the answer.

**Regions and copy.** Panel `[320,112,768,520]` contains `Teach Oryn What Changed`, `INV-48231`, `Completed manually by Elena Ruiz`, and `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?` Answer `[352,328,704,96]` says `Yes — billed on top of subtotal and within approved terms.` Evidence selector says `AP-RULE-017 Supplier handling fees`; scope says `Kestrel Components layout v2 only`. Buttons `Save correction`, `I Don't Know`, `Not a General Rule`, `Ask Another Expert`.

**Targets and states.** P(840,440) saves the correction only after Elena confirms the answer and evidence; Marcus subsequently validates scope. An unanswered question stays unresolved; `I Don't Know` does not create a rule. A conflicting answer opens a knowledge conflict, never a majority-vote resolution. A successful save reads `Correction captured`; the incident remains contained.

### SC28 — Repair proposal and regression

**Purpose and framing.** Show a bounded interpretation change, original failure, five nearby cases and the full regression result. H4 and L10 display the proposal before the results. Center the camera between diff and test summary so the version and totals remain readable.

**Regions and copy.** Header `[264,112,992,48]` reads `Repair proposal REP-0042-1`, `Agent v1.1`. Diff `[264,184,480,360]` is titled `Interpret invoice totals`, with `Before: separately positioned handling line not included without verified terms` and `After: include handling line when approved Kestrel terms cover it`. Scope line reads `Kestrel Components layout v2 only`; permissions and policy both say `No change`. Tests `[768,184,464,360]` say `6 new regression cases`, `34 scenarios`, `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`.

**Targets and states.** P(1080,570) runs regression; P(1100,625) requests release after completion. A running suite shows per-case progress and arc; canceled cases show `Not Run`. A failed invariant blocks release and reports `Failed`; an unknown result is `Inconclusive`, not a pass. Candidate remains separate from active v1.0. Hover and focus follow §16 common rules.

### SC29 — Release governance

**Purpose and framing.** Separate test pass from release approval, limited observation and expansion. H4 and L10 show the cohort first, the 3/3 evidence second, and incident closure only after owner action.

**Regions and copy.** Header `[264,112,992,48]` says `Release governance`, `Agent v1.1`. Cohort `[264,184,480,344]` reads `Limited Release`, `Kestrel Components invoices only`, `AP East only`, `Stage 3 Supervised Assist`, `Owner: Marcus Webb`. Watch `[768,184,464,344]` shows `3/3 Verified Complete`, `Stop on regression or unknown`, and `Expand release`. Final disposition banner `[264,552,968,64]` reads `Repaired - Validated` only after the incident is closed.

**Targets and states.** P(1080,510) expands after independent evidence and owner approval; P(1090,630) closes after expansion and confirmed disposition. While fewer than three cases are verified, the button says `Waiting for verified outcomes`. An unknown or regression stops expansion and leaves the incident open. No previous business write is undone by restoring a version.

### SC30 — Version history

**Purpose and framing.** Show immutable revisions and a safe restoration affordance. H4 and L10/L11 show the version list; camera remains wide enough to distinguish playbook and agent rows.

**Regions and copy.** Title `[264,112,992,48]` reads `Version history` and `Git for operations`. Table `[264,176,992,384]` has `Object`, `Version`, `State`, `Evidence`, `Actions`. Rows identify `Playbook v1.0 · Approved for Guidance`, `Agent v0.1 · Candidate`, `Agent v0.2 · Candidate`, `Agent v1.0 · Released`, `Agent v1.1 · Repair`. Compare drawer explains changed boundary or document interpretation and shows linked evaluations. Buttons `Compare` and `Restore Agent Version`.

**Targets and states.** P(760,300) compares equivalent suites; P(1110,500) opens a confirmation explaining future eligibility and non-rollback of past business effects. Insufficient authority disables restoration with a reason. Missing evidence remains `Evidence unavailable`; never delete historical failed results. Hover uses surface-2, and focus preserves row and action context.

### SC31 — Policy change and revalidation

**Purpose and framing.** Show dependency impact without silently mutating agents or continuing under old authority. H4 breadth and L11 present the policy change and all dependent counts in one crop.

**Regions and copy.** Header `[264,112,992,48]` reads `Policy change`, `AP-RULE-009 Variance threshold`. Change card `[264,184,480,240]` reads `2.00% → 1.50%`, `effective Dec 1`, `Needs Revalidation`. Dependency card `[768,184,464,240]` lists `1 playbook`, `1 agent`, `34 tests`, each `Needs Revalidation`. Footer reads `Review boundary tests`.

**Targets and states.** P(1090,590) opens proposed tests, including values below, exactly at and above 1.50%. Tests and approvals are required before changed behavior becomes eligible. If an explicit previous-policy continuation is unavailable, show `Previous-policy continuation not authorized`. Failed tests remain failed; no policy is represented as approved merely because a candidate was generated.

### SC32 — Unsafe action blocked

**Purpose and framing.** Demonstrate a consequence-based stop in a different workflow without implying general-purpose unrestricted automation. H4 breadth and L11 cut from SC10 to this notice, preserving the 12% value and named approver.

**Regions and copy.** Center card `[320,160,768,400]` contains `Action blocked`, `Discount: 12%`, `Requires Tier 3 approval - Daniel Okafor`, `The proposed change has not been applied`, `Request approval`, `Close`. A stop-square glyph and foreground text sit on surface-2; no cyan indicator remains once blocked. The warning triangle is reserved for `Needs Revalidation`.

**Targets and states.** P(910,540) requests approval; the success state is `Approval requested`, not `Discount applied`. A blocked request gives the routing reason and preserves the original deal. Focus reaches the reason before the action; Escape closes without approving. In dark mode use dark surface and foreground, preserving the warning shape.

### SC33 — Command Center and X-ray

**Purpose and framing.** Show accountable outcomes and limits without employee surveillance or ungrounded ROI. H4 ends on the Command Center; L11 shows a short X-ray overview. Keep population labels visible whenever counts appear.

**Regions and copy.** Header `[264,112,992,48]` says `Command Center` and `14-Day X-Ray`. First panel `[264,184,472,200]` says `JOB-0117`, `11 invoices`, `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`, or the later verified snapshot. Second panel `[760,184,472,200]` says `INC-0042`, `Contained`, `3 affected cases`, `Separate supplier cycle`. Method note `[264,408,968,88]` says `Counts shown for their stated populations`; X-ray setup notes at least five enrolled participants for team aggregates.

**Targets and states.** P(400,240) filters to the Job. Empty periods show `No verified outcomes in this period`, not a dash that could imply zero without evidence. Unknown reporting data says `Unavailable`; no employee ranking, hours saved or invented 14-day cohort is shown. Focus and hover reveal filter boundaries without changing counts.

### SC34 — Audit and export

**Purpose and framing.** Give a traceable sequence of attributed decisions and permissible export. H4 breadth and L11 show the sequence and export confirmation, without revealing private raw media.

**Regions and copy.** Header `[264,112,992,48]` says `Audit & export`; table `[264,176,992,416]` has columns `Actor`, `Action`, `Object`, `Scope`, `Outcome`. Use A01–A15 in logical order, displaying time only where explicitly available. Button `[1030,116,190,40]` says `Export audit pack`. Confirmation `[384,168,512,384]` states `Export authorized audit records`, `Private raw media is not included`, `Cancel`, `Export`.

**Targets and states.** P(1110,136) opens confirmation; export needs permission and shows `Export unavailable for this role` otherwise. A successful export yields an artifact name and scope, not a public-access guarantee. Failed export retains the audit screen and provides safe retry. Dialog traps focus and returns it on close.

### SC35 — Notification center

**Purpose and framing.** Surface approvals, incident and commitment in priority order without implying that acknowledgement resolves them. H4 breadth and L11 use the same center; one toast may appear at a time.

**Regions and copy.** Filter rail `[264,112,220,560]` has `All`, `Action Required`, `Incidents`, `Reminders`. List `[508,112,724,560]` contains `Approval Required · INV-48219`, `INC-0042 Contained`, and `Confirm Kestrel handling-fee terms in writing · Fri 12:00`. Each notification card shows its source object and action `View`.

**Targets and states.** P(740,220) opens the linked approval if authorized; other links open the incident or commitment. `Dismiss` acknowledges only the notification, not the underlying business object. An empty filter says `No notifications`; a stale feed says `Notifications unavailable`. Use text plus icon for urgency; no more than one transient overlay obscures content.

### SC36 — Adapter capability matrix

**Purpose and framing.** Show precise capability boundaries for each application. H4 breadth and L11 hold the matrix sufficiently long for the viewer to see that unsupported cells are explicitly unavailable. Grey logo-only tiles sit outside the matrix and make no capability claim.

**Regions and copy.** Header `[264,112,992,48]` reads `Application capabilities`. Table `[264,176,992,416]` contains column labels `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`; rows are `Gmail`, `NetSuite`, `Google Sheets`, `Slack`, `Zoom`, `HubSpot`, `Chrome`. Each cell says `Available` or `Unavailable`; Zoom Observe includes `per-meeting opt-in`. Values are exactly the §6.4 matrix.

**Targets and states.** P(420,214) opens a capability detail only if the selected cell supports that action; an unavailable cell is not a disabled-looking enabled button. Missing assessment reads `Not assessed`, separate from `Unavailable`. A small official mark may identify each app subject to provenance rules. Dark theme preserves cell borders and accessible label contrast.

### SC37 — Brand stage and lifecycle

**Purpose and framing.** Introduce Oryn and end each cut without customer proof or invented traction. H1/H3/H5 and L3/L12 use the mark; the lifecycle graphic is also used in H3. The launch end card holds the URL after typing completes.

**Regions and copy.** Stage `[0,0,1280,720]` uses bone dots and crop marks. Open-ring mark and `Oryn` center around `[390,210,500,120]`; optional lifecycle `[240,150,800,420]` uses the 14 exact step labels in §8. End card line reads `IBM AI Builders Challenge · AI for Business`; URL field `[300,470,680,56]` reads `https://github.com/Harikeshav-R/Oryn`. Subtitle strip sits inside the title-safe region.

**Targets and states.** End card is not an interactive browser address field in film; the clickable version may expose a real link with an accessible name. Intro and reveal marks remain open. The ring closes with `ring-close` only at the first verified Job readback and the 3/3 verified limited-release readbacks; the end-card mark may be closed. Arc is reserved for an active simulator, Job or regression run. Reduced motion displays the completed static composition without travel, flashing or typing.

## 19. Detailed status and motion construction

### 19.1 Status rendering matrix

Every status chip is a 24px-high flex row with a 12×12px glyph, 6px gap, 8px horizontal padding, 4px radius and a 1px border. Label is 12/18 IBM Plex Mono 500. Light text is `#0A0A0A`; dark text is `#F5F5F5`. Background defaults to surface, border defaults to `#DFDFD8` / `#333333`, and glyph stroke is 1.75px. The status-specific hue colors the glyph only; its exact text, shape and surrounding context carry the meaning. The `#79D69A`, `#FF9191` and `#F7BE78` dark glyphs are distinct extensions; run measured contrast checks in the actual implementation.

| Exact visible label | Glyph geometry | Light / dark glyph token | Background and border | Principal uses |
|---|---|---|---|---|
| Approved for Guidance | 10×11 shield, centered 5px check | signal / signal | surface, default border | SC15 Playbook v1.0 |
| Verified Complete | 10px circle with 6px check | success / dark-success | surface, default border | SC22, SC25, SC29 |
| Outcome Unknown | 10px outlined square filled with diagonal hatch | trace / trace-dark | surface, default border; hatch only inside glyph | SC24 and SC25 |
| Passed | 8px check, no enclosing ring | success / dark-success | surface, default border | SC20 and SC28 |
| Passed — Expected Safe Escalation | 10px circle with 5px bent arrow | success / dark-success | surface, default border | six simulation cases |
| Failed | 10px diamond with centered 5px X | danger / dark-danger | surface, default border | v0.1 boundary scenario |
| Needs Revalidation | 10px triangle with 1px vertical mark and dot | warning / dark-warning | surface, default border | SC31 and dependent objects |
| Contained | 10px square with centered 4px stop square | warning / dark-warning | surface, default border | SC26 incident |
| Approval Required | 10px diamond with 4px person silhouette | warning / dark-warning | surface, default border | SC23 and notification |
| Escalated | 10px angled arrow ending at 3px person node | warning / dark-warning | surface, default border | missing PO cases |
| Held | 10px square, hatch, 2×5px pause bars | trace / trace-dark | surface, default border | SC24 unknown submit |
| Running | 10px ring with 3px traveling node | arc-mark on bone / arc on dark | surface, default border | only active simulation or execution |

`Not Run`, `Incomplete`, `Inconclusive`, `Blocked`, `Approval requested` and `Evidence unavailable` are additional explicit UI states. Use neutral outline and text for incomplete/unavailable; use a stop-square glyph for blocked; use hatch confined to a separate glyph for `Inconclusive` when insufficient evidence. The warning triangle is reserved for `Needs Revalidation`; Escalated uses arrow/person. Hatch never sits behind text. Do not equate any of them with a completed verdict. A status chip is never a navigation control unless a button or link semantic is explicitly supplied.

### 19.2 Drawing equations and exact timing

For the ring motif, with center `(cx,cy)` and design-space radii `18,31,44`, the ring paths are `M cx+r,cy A r,r 0 1 0 cx-r,cy A r,r 0 1 0 cx+r,cy`, each stroke 1.5 units and no fill. The node center is `(cx+31 cos θ, cy+31 sin θ)`, with `θ=−π/2 + 2π·fract((frame−startFrame)/108)` while an active run exists. At 60fps this is 108 frames or 1.8s per revolution, approximately 3.333° per frame. Compute angle from absolute frame, not from the previous node position. Stop the arc at the run end frame; use a neutral static node for the subsequent non-running state. For reduced motion choose a fixed node at the top and render the word `Running` while applicable.

The custom O uses a 100-unit viewBox, a 78-unit outer diameter and an 8.6-unit stroke centered on a 34.7-unit path radius. The missing 32° arc is centered at −45°; path endpoints are −61° and −29°. Draw the absent segment as a separate path with matching cap and stroke, hidden through intro and reveal. At the first verified Job readback and the 3/3 verified limited-release readbacks, interpolate `stroke-dashoffset` from full segment length to zero over 24 frames, hold for 24 frames, and play `ring-close`; restore the open state for ordinary brand compositions. The end-card mark may remain closed. Align the mark to the cap height of the adjacent `ryn`; adjust optical space by −0.025em and use overall tracking −0.04em.

The stage dot is a 1px radius ink circle at alpha .12 at coordinates `(12+24i,12+24j)`; the image is static and cannot scroll relative to its world. Each stage card has a 2px ink outline, 8px radius, and hard shadow offset `(6,6)` with blur zero. Crops are 12px arms of 1px ink at 12% opacity, set 8px outside the outer border. On live action, lower-third background is white with 2px ink border and the same 6px stage shadow; never transfer this shadow to the nested product card. A subtitle strip has 12px horizontal, 8px vertical padding, a 4px gap between lines and hard square edges.

The cursor uses a closed arrow path in a 20×24px box, ink fill, 1px white outline, tip hotspot `(1,1)`; the stroke is outside the visible fill and preserves contrast over dark product surfaces. Click circle center equals hotspot, grows from radius 3px to 18px over 260ms, 1.5px ink stroke, opacity .55 to 0; press compresses a button to `.97` over 90ms, then returns by 180ms. Never fire the click ring before the pointer reaches its target. Cursor movement is 21–54 frames, click ring 16 frames, UI transition 9 frames, camera 36–66 frames, reveals 30–54 frames. Stagger is 4 frames per item, maximum 22 frames. These integers are the film equivalents of §3 durations, rounded to nearest frame.

## 20. Film schemas, seek math and concrete composition plan

### 20.1 Validation schema and worked ten-second clip

Film time uses integer frames to avoid floating-point boundary disagreements. A schema validator rejects negative frames, noninteger durations, duplicate `(frame,seq)` pairs, events whose spans exceed the scene, unknown actions, unknown screen IDs and camera scales outside 1–1.8. Coordinates are finite numbers in the authored canvas. Any event changing business state is an `action`; camera, cursor and type events only affect the presentation.

```json
{
  \"fps\": 60,
  \"durationFrames\": 600,
  \"seed\": 418,
  \"events\": [
    {\"frame\": 0, \"seq\": 0, \"type\": \"action\", \"action\": {\"type\": \"OPEN_SCREEN\", \"screen\": \"SC02\"}},
    {\"frame\": 0, \"seq\": 1, \"type\": \"camera\", \"from\": [640, 360, 1.0], \"to\": [640, 345, 1.2], \"duration\": 54, \"easing\": \"reveal\"},
    {\"frame\": 60, \"seq\": 2, \"type\": \"cursor\", \"from\": [460, 500], \"c1\": [590, 520], \"c2\": [830, 500], \"to\": [1040, 572], \"duration\": 42, \"click\": true},
    {\"frame\": 102, \"seq\": 3, \"type\": \"action\", \"action\": {\"type\": \"ACKNOWLEDGE_NOTICE\"}},
    {\"frame\": 132, \"seq\": 4, \"type\": \"action\", \"action\": {\"type\": \"OPEN_SCREEN\", \"screen\": \"SC03\"}},
    {\"frame\": 180, \"seq\": 5, \"type\": \"camera\", \"from\": [640, 345, 1.2], \"to\": [970, 340, 1.35], \"duration\": 48, \"easing\": \"reveal\"},
    {\"frame\": 240, \"seq\": 6, \"type\": \"cursor\", \"from\": [1040, 572], \"c1\": [1070, 460], \"c2\": [1090, 340], \"to\": [1100, 238], \"duration\": 42, \"click\": true},
    {\"frame\": 282, \"seq\": 7, \"type\": \"action\", \"action\": {\"type\": \"PAUSE_OBSERVATION\"}},
    {\"frame\": 360, \"seq\": 8, \"type\": \"overlay\", \"id\": \"privacy-copy\", \"visible\": true},
    {\"frame\": 420, \"seq\": 9, \"type\": \"type\", \"target\": \"privacy-copy\", \"text\": \"You control observation.\", \"charsPerSecond\": 30, \"seed\": 418},
    {\"frame\": 570, \"seq\": 10, \"type\": \"overlay\", \"id\": \"privacy-copy\", \"visible\": false}
  ]
}
```

This is a ten-second **construction example**, not a replacement for the approved script's timing. `OPEN_SCREEN` selects an authorized view, not an implicit enrollment. `ACKNOWLEDGE_NOTICE` records only the notice; it does not start capture. `PAUSE_OBSERVATION` is a safe no-op only if the control reports already paused; it must not imply that enrollment was granted. If the preceding actual scenario lacks observation permission, use a filmed snapshot with explicit preconditions rather than showing a false enabled state.

For a camera event with start frame `f0`, duration `d`, and current frame `f`, use `u=clamp((f−f0)/d,0,1)`. Solve the cubic Bézier timing curve's x component for `u`, then evaluate its y component with control points `(0.16,1)` and `(0.3,1)`; linearly interpolate center x, center y and scale with the resulting eased scalar. Transform world point `(x,y)` into screen point `(640+s(x−cx), 360+s(y−cy))`. This definition avoids ambiguity about CSS transform order. Crop only stage-world content, not the fixed subtitle layer.

For cursor travel use cubic Bézier `B(u)=(1−u)^3 P0 + 3(1−u)^2u P1 + 3(1−u)u² P2 + u³ P3`. Apply the same ease to `u`; set `P3` to the actual element hotspot. If overshoot is used, add a bounded damped excursion that ends exactly at `P3` before the click; cap distance at 1–3% of path length. Never implement overshoot by making the click target itself move. For typing, assign each character a deterministic `frame = start + floor(i·60/rate + jitter(seed,i))`, with monotonic clamping and at most one-frame jitter. The `type` event is cosmetic unless the corresponding action is separately dispatched.

### 20.2 TypeScript transition table

The transition table is intentionally explicit: the reducer looks up the current state and action, checks the guard against the current context, returns either a new immutable state plus effect descriptions or the same state with an accessible reason. It never performs network or timer effects. Film playback applies deterministic recorded completion actions at specified frames; interactive mode uses the same state logic and user-triggered completion controls.

```ts
type StateId =
  | \"ST01\" | \"ST02\" | \"ST03\" | \"ST04\" | \"ST05\" | \"ST06\"
  | \"ST07\" | \"ST08\" | \"ST09\" | \"ST10\" | \"ST11\" | \"ST12\"
  | \"ST13\" | \"ST14\" | \"ST15\" | \"ST16\" | \"ST17\" | \"ST18\"
  | \"ST19\" | \"ST20\" | \"ST21\" | \"ST22\" | \"ST23\" | \"ST24\";
type GuardName =
  | \"consented\" | \"meetingConsented\" | \"commitmentConfirmed\" | \"ownerApproved\"
  | \"always\" | \"suiteSealed\" | \"runComplete\" | \"boundaryFixedAndPassed\"
  | \"releaseAuthorized\" | \"casesEvaluated\" | \"approvedAndReadBack\"
  | \"manualCorrection\" | \"scopeValidated\" | \"regression34Passed\"
  | \"cohortVerifiedAndApproved\";
type Transition = { from: StateId; event: string; guard: GuardName;
  to: StateId; effect: string };
const transitions: readonly Transition[] = [
  {from:\"ST01\",event:\"CONSENT\",guard:\"consented\",to:\"ST02\",effect:\"enable permitted categories\"},
  {from:\"ST02\",event:\"REVIEW_MEETING\",guard:\"meetingConsented\",to:\"ST03\",effect:\"open meeting review\"},
  {from:\"ST03\",event:\"CONFIRM_COMMITMENT\",guard:\"commitmentConfirmed\",to:\"ST04\",effect:\"record confirmed deadline\"},
  {from:\"ST04\",event:\"PUBLISH\",guard:\"ownerApproved\",to:\"ST05\",effect:\"publish Playbook v1.0\"},
  {from:\"ST05\",event:\"CREATE_AGENT\",guard:\"ownerApproved\",to:\"ST06\",effect:\"create v0.1 candidate\"},
  {from:\"ST06\",event:\"RUN_SIMULATION\",guard:\"suiteSealed\",to:\"ST07\",effect:\"begin evaluation\"},
  {from:\"ST07\",event:\"COMPLETE_SIMULATION\",guard:\"runComplete\",to:\"ST08\",effect:\"record 21/6/1\"},
  {from:\"ST08\",event:\"FIX_AND_RUN\",guard:\"boundaryFixedAndPassed\",to:\"ST09\",effect:\"record v0.2 22/6/0\"},
  {from:\"ST09\",event:\"RELEASE_AND_START\",guard:\"releaseAuthorized\",to:\"ST10\",effect:\"pin v1.0 and start JOB-0117\"},
  {from:\"ST10\",event:\"PAUSE_FOR_APPROVAL\",guard:\"casesEvaluated\",to:\"ST11\",effect:\"record 7/2/1/1\"},
  {from:\"ST11\",event:\"NEXT_CYCLE_INCIDENT\",guard:\"approvedAndReadBack\",to:\"ST12\",effect:\"record 8/2/0/1 and contain INC-0042\"},
  {from:\"ST12\",event:\"TEACH\",guard:\"manualCorrection\",to:\"ST13\",effect:\"capture Elena's explanation\"},
  {from:\"ST13\",event:\"PROPOSE_REPAIR\",guard:\"scopeValidated\",to:\"ST14\",effect:\"create REP-0042-1\"},
  {from:\"ST14\",event:\"LIMITED_RELEASE\",guard:\"regression34Passed\",to:\"ST15\",effect:\"authorize named Kestrel cohort\"},
  {from:\"ST15\",event:\"EXPAND_AND_CLOSE\",guard:\"cohortVerifiedAndApproved\",to:\"ST16\",effect:\"expand and close incident\"},
  {from:\"ST16\",event:\"OPEN_MONTAGE\",guard:\"always\",to:\"ST17\",effect:\"show map\"},
  {from:\"ST17\",event:\"NEXT\",guard:\"always\",to:\"ST18\",effect:\"show peer guidance\"},
  {from:\"ST18\",event:\"NEXT\",guard:\"always\",to:\"ST19\",effect:\"show policy change\"},
  {from:\"ST19\",event:\"NEXT\",guard:\"always\",to:\"ST20\",effect:\"show blocked action\"},
  {from:\"ST20\",event:\"NEXT\",guard:\"always\",to:\"ST21\",effect:\"show versions\"},
  {from:\"ST21\",event:\"NEXT\",guard:\"always\",to:\"ST22\",effect:\"show Command Center\"},
  {from:\"ST22\",event:\"NEXT\",guard:\"always\",to:\"ST23\",effect:\"show audit\"},
  {from:\"ST23\",event:\"NEXT\",guard:\"always\",to:\"ST24\",effect:\"show notifications\"},
  {from:\"ST24\",event:\"RESET\",guard:\"always\",to:\"ST01\",effect:\"restore initial snapshot\"},
];
```

`boundaryFixedAndPassed` must encapsulate a completed rerun, not trigger a pass by itself. The real implementation should represent the intermediate v0.2 run with a run-phase field, keeping ST08 until the completion action. Similarly, `regression34Passed` includes 28 ordinary passes, six expected safe escalations, zero failures, complete evidence and owner authorization. `approvedAndReadBack` only becomes true after separate approval and readback events; incident arrival is a distinct event in the next cycle. A screen route is presentation state, not a replacement for these guards.

### 20.3 HyperFrames file-level plan

```text
demo/oryn-prototype/hyperframes/
  index.html                       # root, 180 seconds, one host per scene
  compositions/
    h01-intro.html                 # H1, 0–26
    h02-problem.html               # H2, 26–52
    h03-solution-bob.html          # H3, 52–82
    h04-demo.html                  # H4, 82–158
    h05-impact-close.html          # H5, 158–180
    l01-hook.html                  # L1, 0–10
    l02-chaos.html                 # L2, 10–22
    l03-reveal.html                # L3, 22–32
    l04-privacy.html               # L4, 32–44
    l05-observe.html               # L5, 44–56
    l06-discover.html              # L6, 56–72
    l07-create.html                # L7, 72–90
    l08-simulate.html              # L8, 90–106
    l09-run.html                   # L9, 106–124
    l10-heal.html                  # L10, 124–144
    l11-breadth.html               # L11, 144–164
    l12-close.html                 # L12, 164–180
  assets/
    fonts/                         # copied licensed faces
    footage/                       # cleared, redacted footage
    audio/                         # unique IDs and local audio files
    marks/                         # permitted local marks
  renders/                         # generated outputs; do not commit large masters by default
```

Keep separate root compositions for hackathon and launch, each mounting only its own scene hosts and shared assets. Scene IDs in the §8 F01–F12 table identify reusable source families, while the file names here identify cut-specific edit windows; the two systems are intentionally not one-to-one. One caption-track host per root contains the final caption groups. For each HTML scene, place markup, styles and scripts inside `<template>`, scope styles to the composition root, register a paused timeline with its matching `data-composition-id`, and ensure every clip has `[start,start+duration)` visibility. `data-track-index` organizes editor lanes; z-index decides paint order.

The renderer must seek the prototype's time model and the HyperFrames timeline to the same frame. A scene starts with an explicit initial snapshot and applies events deterministically; entering in the middle of a scene cannot depend on previous playback. Keep the film cursor above the product and below captions; use no active CSS animation that progresses independently from the paused timeline. If a clip includes footage audio, mark it explicitly; otherwise mute the clip and use a separately timed voice track. Validate asset paths, fonts and media durations before requesting final render.

## 21. Hour-level production blocks

Times below are local Eastern planning blocks, not promises of uninterrupted work. Protect breaks and use the named gate to decide whether the next block can start. A missed gate consumes the explicit contingency block or removes optional motion, never the safety or submission requirements.

### D5 — Monday November 23: simulation and comparison

| Time ET | Work block | Concrete deliverable / exit check |
|---|---|---|
| 09:00–10:00 | Review sealed fixture IDs and intent with Bob; inspect base branch and exact 2.00% rule. | All 28 scenarios have unique IDs, expected outcomes and version-independent inputs. |
| 10:00–11:30 | Build suite grid and deterministic run-phase representation. | SC19 renders 28 labeled tiles and shows `Not Run` before execution. |
| 11:30–12:00 | Break and preserve Bob session evidence. | Prompt and relevant diff stored without credentials. |
| 12:00–13:30 | Build v0.1 results and failed-case replay. | `21 Passed`, six safe escalations, one failure; first divergence explains exact boundary. |
| 13:30–14:30 | Implement candidate boundary correction and rerun transition. | v0.2 is a separate immutable version; 22/6/0 appears only after complete evaluation. |
| 14:30–15:00 | Meal / screen break. | No new scope. |
| 15:00–16:00 | Build side-by-side comparison and guard Stage 3 readiness. | Same suite is compared; no Stage 3 release on v0.1. |
| 16:00–17:00 | Bob review and human review of numbers, permissions and keyboard focus. | Record actual review findings and fixes, without inventing a finding. |
| 17:00–18:00 | Contingency for blocking defects. | If unused, start scene timing rather than adding features. |

### D7 — Wednesday November 25: containment and shoot

| Time ET | Work block | Concrete deliverable / exit check |
|---|---|---|
| 09:00–10:00 | Build INC-0042 details, three affected IDs, containment state and evidence. | Containment appears before repair; hypothesis remains unconfirmed. |
| 10:00–11:00 | Build Elena's correction and scoped repair proposal with Bob. | AP-RULE-017 is cited; no policy or permission change is inferred. |
| 11:00–12:00 | Implement regression and release gates. | 34-case suite, 28/6/0, six new cases and 3/3 release cohort are distinct. |
| 12:00–13:00 | Break, prepare shoot room, silence notifications and check wardrobe. | Camera, lighting, microphone, backdrop and power ready. |
| 13:00–13:30 | Record white balance, exposure, 30 seconds room tone and sync clap. | Clean audio peaks and frame alignment confirmed from a short playback. |
| 13:30–14:30 | Shoot H1 wide and tight, three takes each plus slow backup. | Hook uses the hackathon script's exact lines. |
| 14:30–15:15 | Shoot H5, L1 and L12, matching eyeline and lighting. | Each close and launch hook has three usable takes. |
| 15:15–15:45 | Record b-roll and empty frame, then stop recording. | Keyboard, hands, room and clean plate, no private information visible. |
| 15:45–16:30 | Copy camera and microphone originals to two locations and inspect. | Checksums or byte counts match; originals remain unchanged. |
| 16:30–18:00 | Contingency: retake unusable lines or finish release screen. | No shoot media is deleted until backups and playback are confirmed. |

### D12 — Monday November 30: picture lock and deliverables

| Time ET | Work block | Concrete deliverable / exit check |
|---|---|---|
| 09:00–10:00 | Freeze story fixtures, export script timing and resolve all Bob fact slots from actual evidence. | No unverified Bob finding or obsolete regression count appears. |
| 10:00–11:30 | Inspect 1080p screenshots for every section and the dark flip. | Key labels and numbers meet legibility floor; no cyan after stopped work. |
| 11:30–12:00 | Correct captions and source lines against final narration. | SRT/VTT cues and burned strip use matching words. |
| 12:00–13:00 | Break and organize project-page proof, certificate and slides. | All materials accessible locally and links inventoried. |
| 13:00–14:30 | Lock picture and render delivery candidate; listen on headphones and speakers. | Duration, frame count, audio sync and -16 LUFS / -1 dBTP target measured. |
| 14:30–15:30 | Review encoded file, transitions, statuses and counters. | One defect list with timestamps; critical defects fixed together. |
| 15:30–16:30 | Write project page and export slides using script outline. | Problem, approach, real Bob usage, team and video link sections ready. |
| 16:30–17:30 | Final render if needed, package captions and evidence ledger. | Versioned master and delivery file, SRT, VTT, slides and source credits present. |
| 17:30–18:30 | Contingency for render or upload failure. | Preserve D13 for upload/access testing rather than further design work. |

On D13, upload the hackathon cut before starting the launch re-cut. On D14, check the public link, final form, team information and certificate early; submit with time to recover from a failed upload or permission setting. Save the confirmation receipt and retain the exact video version linked in the project page.
