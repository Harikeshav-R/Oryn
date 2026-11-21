# Oryn demo: mock screen and component build inventory

Everything the camera sees in either 3-minute cut, itemised so it can be built before any video is generated. Sources: `hackathon-video-script.md` (H-001..H-154), `launch-video-script.md` (L-001..L-176), `oryn-demo-design-and-build.md` (SC01-SC37, ST01-ST24, tokens), PRODUCT.md and GLOSSARY.md. Every storyboard entry (330) was audited against this inventory; the audit and its gap items are Part D.

## 1. How to use this document

1. Read section 2 (conventions) and section 4 (resolved decisions) once.
2. Build in the order of section 5. Do not start a screen before the components it depends on exist.
3. Each item has: purpose, priority, where it appears (entry IDs + timestamps), layout in 1280x720 authored px, visual spec, exact content, states/variants, interactions, in-component animation, bound data, dependencies, pitfalls, a "Done when" checklist and an effort size. Tick the checklist rows at the end of each Part as items are finished.
4. When an item lists entry IDs, open that storyboard entry; it says exactly what the camera does with the item (crop, zoom, cursor action). Build only what the cameras need to see (section 6, fidelity tiers).
5. Where Part D lists a GAP item for something, it supersedes or extends the Part A/B/C description; the GAP spec wins on conflicts.

## 2. Conventions

| Topic | Rule |
|---|---|
| Canvas | Author at 1280x720 CSS px; capture at DPR 2 (2560x1440); deliver 1080p. Coordinates are `[x,y,w,h]` from top-left. |
| Layers | PRODUCT layer = flat bone/white surfaces, 1px warm hairlines, radii 8/6/4, no hard shadows. STAGE layer (video only) = dotted bone canvas, 2px ink outline, 6px hard offset shadow, crop marks, subtitle strip. |
| Colour rules | Arc cyan `#2FD8FF` appears ONLY while something is executing (simulator run, job run, regression run) and goes dark when it stops. Passive observation, ready, selected, completed are neutral. Status is always text + a distinct glyph; Outcome Unknown uses the neutral hatch (never behind text). |
| Fonts | IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700, Crimson Text 400/600/700; self-hosted WOFF2, OFL notices retained; never synthesize a weight. |
| Motion | UI 150ms `cubic-bezier(.4,0,.2,1)`; stage reveals/camera 500-900ms `cubic-bezier(.16,1,.3,1)`; film is a pure function of time (no timers, random, network). |
| Subtitle strip | One spec for both cuts: x128-1152, y630-688, IBM Plex Mono 600, 13-15px authored, white on #0A0A0A, one line. |
| Data | All numbers/names from the fixtures in Part B (DAT-xx). Job JOB-0117 = 11 invoices: 7 Verified Complete, 2 Escalated, 1 Approval Required, 1 Outcome Unknown (after approval and independent readback: 8/2/0/1). Simulator SIM-AP-RECON = 28 scenarios (first run 21 Passed, 6 Passed — Expected Safe Escalation, 1 Failed; after fix 22/6/0). After repair 34 scenarios = 28 Passed + 6 Passed — Expected Safe Escalation + 0 Failed (6 new regression cases = the original failure + 5 nearby variants). |
| Real brands | Gmail, NetSuite, Google Sheets, Slack, Zoom, HubSpot, Chrome, macOS appear as ORIGINAL simplified mock UIs with small nominative marks; Salesforce, Outlook, Excel, Teams, Meet, Edge only as grey logo tiles. Never copy third-party DOM, screenshots or source. |
| Disclosure | No on-screen disclosure of any kind (owner's decision). |
| ID prefixes | `SC` product screen, `CMP` component, `DAT` data module, `RT` state/runtime (Part B), `APP` third-party mock view, `STG` stage graphic, `FX` effect/transition, `FRT` film-runtime overlay (Part C; renamed from `RT` to avoid collision with Part B), `GAP` audit gap (Part D). |

### 2.1 Name-to-number map for component references in Part A
Part A refers to components by name; use these numbers (Part B): Button CMP-03, Input CMP-04, Stepper/loader CMP-08, Dialog/Drawer CMP-09, Popover/Tooltip CMP-10, Toast/CommandPalette CMP-11, Breadcrumbs/Keycap CMP-12, StatusBadge CMP-06, Table CMP-07, Timeline CMP-15, Diff CMP-16, ScenarioGrid CMP-17, CaseTable CMP-19, JobProgress CMP-20, RiskTierChip CMP-21, AutonomyLadder CMP-22, GateChecklist CMP-23, NotificationCard CMP-35, HUDCard CMP-36, GraphNode CMP-41. (Part A text already shows the number next to each name.)

## 3. Inventory at a glance

| Part | Content | Items | Words | Effort (sum of S=1h M=2h L=4.5h XL=8h) |
|---|---|---:|---:|---:|
| A | Oryn product screens and shell | 31 | ~10,200 | ~92 h |
| B | Components (CMP), data (DAT), state and runtime (RT) | 60 | ~15,600 | ~110 h |
| C | Third-party mock apps (APP), stage graphics (STG), effects (FX), film overlays (FRT) | 40 | ~12,900 | ~103 h |
| D | Storyboard coverage matrix, 65 gap items (GAP), 22 contradictions | 65 | ~21,000 | ~91 h |
| Total | | 196 | | ~396 h as a single human hand-coding every item to full fidelity |

Of the 131 items in Parts A to C, 126 appear in BOTH cuts (2 hackathon-only, 2 launch-only, 1 neither), so building one cut does not shortcut the other. Part D's 65 gap items are cut-specific additions: 34 for the hackathon cut (~46.5 h) and 31 for the launch cut (~44.5 h).

### 3.1 Reality check on effort
~396 h hand-coded does not fit in the 14 days left (Nov 18 to Dec 2) next to the shoot, narration, SFX, edit, slides and project page. The estimates assume one person writing every component by hand at full interactive fidelity. To make the plan fit you must (a) apply the fidelity tiers in section 6, (b) build only what each storyboard crop shows ("frame-first"), (c) generate component code with IBM Bob (which is also the contest requirement) and spend your own time reviewing against "Done when", and (d) treat GAP items as edits to existing items wherever the gap is only copy, a label or a variant (most of the 44 S-sized gaps are). These effort numbers are estimates, not measurements; re-measure after the first three screens and re-plan.

## 4. Resolved decisions (binding; apply while building)

These resolve conflicts found by the audit (full table with file/line evidence: Part D, "Storyboard and inventory contradictions"). The two scripts and the design document are being updated to match; if you still see the old wording in them, follow this list.

| # | Decision |
|---|---|
| 1 | Unresolved batch snapshot label is **Partially Complete** (never "Completed with exceptions") while INV-48220 is held. |
| 2 | The Oryn mark stays **open** through intro/reveal. It closes (400ms close + 400ms hold, `ring-close`) only on a genuine verified readback (first Verified Complete in the job beat; 3/3 at limited release). The end-card mark may be closed because the loop ended in a verified release. |
| 3 | Passive observation uses a **neutral** capture indicator plus text; no cyan, no `arc-hum`. Cyan only while the simulator, a job or a regression run executes. |
| 4 | Subtitle strip: x128-1152, y630-688, Plex Mono 600, 13-15px (both cuts). |
| 5 | Release-gate checklist shows only independently evidenced checks; scenarios and owner approval stay hollow/pending until the evaluation passes and the owner approves. |
| 6 | **Approved for Guidance** is a neutral outlined shield/check badge with text (not green). |
| 7 | IBM Plex Mono **700** is bundled as a real face (OFL). |
| 8 | Repair suite = **34** scenarios (28 Passed + 6 Passed — Expected Safe Escalation + 0 Failed); policy-impact count = 34 tests; any "33"/"27 Passed" is obsolete. |
| 9 | Escalated glyph = arrow/person + label; warning triangle is reserved for Needs Revalidation. |
| 10 | After the approval click show a pending-verification beat, then independent evidence, then 8/2/0/1 (no instant jump). Job summary counts swap by a 150ms snapshot replacement, no count-up. |
| 11 | Outcome Unknown: no retry/resubmit control; show a "Resubmission unavailable" explanation and an investigation action only. Hatch never sits behind text. |
| 12 | The SC26 dark wipe is one 400ms absolute-frame wipe at containment (before repair). Light/dark are scripted render states per cut, not a user-operated toggle. |
| 13 | Scenario grid: 28 tiles of 96x52 with 8px gaps occupy 408x412, centred in the 472x416 host. A film-only scenario row-stream variant of the same 28 scenarios exists for launch L-093 (see GAP-SC-L-07). |
| 14 | Problem-section mismatch graphics use abstract differing bars and "Result not verified"; never invent an invoice amount. |
| 15 | Use SC04 wording "Check the vendor tax ID format" (with the article) everywhere. |
| 16 | The memory montage needs `[USER SCREENSHOT 1]` and `[USER SCREENSHOT 2]` (two separately authorised, irreversibly redacted textures); a third is optional. |
| 17 | A long transcript line in the launch cut is a pre-composed sentence revealed by a mask over 900ms, not keystroke typing (typing is 28-34 chars/s elsewhere). |
| 18 | Enrollment wizard labels are cut-specific ("Review notice", "I understand", "Permitted work observation") inside the same accessible wizard; capture and sharing consent stay independent. |

## 5. Recommended build order

| Phase | Build | IDs |
|---|---|---|
| 0 Foundation | Project scaffold, tokens, fonts, state reducer, runtime scaffold, fixtures skeleton | CMP-01, CMP-02, RT-01, RT-02, RT-03, DAT-01 to DAT-13, FRT-01, FRT-04, FRT-06 |
| 1 Primitives | Button, inputs, select/tabs, badges/status, table, stepper, drawer/dialog, popover/tooltip, toast/command, breadcrumbs/keycap/avatar, switch/checkbox, progress/skeleton | CMP-03 to CMP-14 |
| 2 Hero composites | Timeline, diff, scenario grid, evidence, case table, job progress, risk chip, ladder, gate, demonstration/candidate/playbook/agent blocks, scope list, incident, expected-vs-actual, approval check, regression list, cohort, version row, notification, HUD, role selector, top bar/nav, capability cell, metric, graph node, commitment, masking field, source line | CMP-15 to CMP-44 |
| 3 Shell + hero screens | App shell, then in storyline order: SC02, SC03, SC01, SC11, SC13, SC14, SC15, SC17, SC18, SC19, SC20, SC21, SC22, SC23, SC24, SC25, SC26, SC27, SC28, SC29 | SC12-FRAME, SC01 to SC29 |
| 4 Mock apps | Chrome/macOS frame first, then Gmail + PDFs, NetSuite (+ reminder, manual case, error/timeout), Sheets, Slack, Zoom, HubSpot | APP-11, APP-12, APP-01 to APP-10, APP-13 |
| 5 Stage layer | Canvas/frames, brand + chips, lifecycle ring, type + lower third, kinetic type, stats, failure visuals, architecture diagram, Bob frame, collage, masking card, intent pill, end card, effects | STG-01 to STG-16, FX-01 to FX-05, FRT-02, FRT-03, FRT-05 |
| 6 Breadth screens | Montage screens (cheap, F3 plates) | SC16, SC30 to SC36 |
| 7 Gap pass | Apply every GAP item (mostly edits to items above) | GAP-* (Part D) |
| 8 Verification | Run the number-consistency check, frame through each storyboard entry in preview, tick every "Done when" | all |

## 6. Fidelity tiers (how much to build per item)

| Tier | Meaning | Use for |
|---|---|---|
| F1 interactive | Real state-driven component with hotspots and variants | Hero-thread screens where the cursor clicks and state changes: SC02, SC03, SC11, SC14, SC15, SC17, SC18, SC19, SC20, SC21, SC22, SC23, SC25, SC26, SC27, SC28, SC29 |
| F2 animated composition | One composition animated on the film timeline; no business logic | Stage graphics, mock-app views that the cursor only passes over, lifecycle ring, collage |
| F3 plate | Single static composition, no state | Montage-only screens shown for under about 2 seconds: SC30 to SC36, SC12 Home, APP-13, STG-12, STG-13 |

An item shown in only one or two storyboard entries should start at F3 and be promoted only if its entry needs a cursor action or state change.

## 7. Master checklist

Each Part ends with its own checklist table (columns: ID, Name, Priority, Effort, Depends on, Appears in, Done). Use those tables as the working list. Part D's checklist covers the 65 GAP items.

---

# Part A — Oryn product screens

This inventory covers the product frame, product screens, screen-specific drawers and dialogs, and the exact filmed states. Part B owns reusable `CMP-*` primitives; Part C owns `APP-*` third-party surfaces and `STG-*` stage treatment. Coordinates are authored at 1280×720. Entry ranges include the surrounding continuous shot where the next entry does not repeat the screen identifier.

## Shared screen-level conventions

Every item below inherits these concrete values unless it overrides them. Light canvas bone `#F6F6F3`, ink `#0A0A0A`, white `#FFFFFF`, secondary `#EFEFEB`, hairline `#DFDFD8`, trace `#77776E`, signal `#333333`; dark canvas `#0A0A0A`, surface `#141414`, secondary `#212121`, hairline `#333333`, foreground `#F5F5F5`, trace `#93938A`, signal `#B8B8B8`. White cards and dark cards use 1px borders, radius 8; controls radius 6; nested boxes radius 4; structural edges radius 0. No hard-offset stage shadow inside product UI. Floating menus use shadow-md, drawers/dialogs shadow-lg. Page heading Space Grotesk 700 28/34, section 700 20/28, card title 500 16/22, body 400 14/20; human explanatory copy Crimson Text 400 16/24; identifiers, controls and numbers IBM Plex Mono 500 12/18; micro-label minimum 11/16 with .04em tracking. Use tabular numerals. Lucide 1.75px strokes: 14px rows, 16px controls, 20px notices, 24px empty states; icon-only hit area ≥44px.

Status text stays foreground: green check-in-circle Verified Complete, green check Passed, green bent-arrow-in-circle Passed — Expected Safe Escalation, red X-in-diamond Failed, warning triangle Needs Revalidation, warning square Contained, warning person/diamond Approval Required, warning arrow/person Escalated, hatched square Outcome Unknown, hatched pause-square Held. Hatch is 45°, 1px strokes at 6px spacing, clipped to the glyph or background panel, never over text. Arc `#2FD8FF` is reserved for an actively running node/progress indicator, disappears on stop, and is not a button, generic success or decoration. Default interaction motion is 150ms `cubic-bezier(.4,0,.2,1)` for opacity, color or transform; no loops except an executing orbit, 1800ms linear, phase from film time. Reduced motion shows the final static state. Every interactive element has a 2px foreground focus outline with 2px offset; Tab/Shift-Tab reach controls, Enter/Space activate, Escape dismisses overlays and focus returns to trigger. Dialogs trap focus. Disabled controls explain why. State changes and animations must be deterministic from the film state/time, with no timers, randomness or network.

### SC12-FRAME — Shared app shell and navigation
- **Purpose / what the viewer perceives:** A stable product instrument around all organizational screens; role context and permission boundaries remain visible across navigation.
- **Priority:** P0, throughout the product shots; P1 for all additional clickable routes.
- **Appears in:** H-056–H-062 01:21–01:28, H-070–H-132 01:35–02:38; L-035–L-040 00:32–00:38, L-058–L-160 00:55–02:38 where shell is not cropped.
- **Canvas & layout:** Sidebar `[0,0,240,720]`, top bar `[240,0,1040,56]`, breadcrumbs `[264,72,700,24]`, content `[264,112,992,584]`. Fixed shell never resizes during filmed navigation. Sidebar has 24px inset, organization/role selector at top, 32px navigation rows; top bar search center-right, bell at x1200.
- **Visual spec:** Shared light/dark tokens and type above; sidebar surface-2, active nav 2px inset signal rail, 6px row radius; 16px Lucide icons. Header and separators 1px hairline, z10.
- **Exact content:** Organization `Calder & Vance`; role choices `Employee`, `Workflow Owner`, `Approver`, `Admin`. Navigation: `Home` (House), `Workflow Discovery` (Search), `Playbooks` (BookOpen), `Operations Map` (Network), `Agent Factory` (Bot), `Flight Simulator` (FlaskConical), `Jobs` (ListChecks), `Incident Center` (ShieldAlert), `Version History` (History), `Command Center` (LayoutDashboard), `Audit & Export` (FileClock), `Notifications` (Bell), `Application Capabilities` (Grid2X2), `My Privacy` (Shield). Search placeholder `Search workflows, agents and cases`; command palette empty text `No matching commands`. Breadcrumbs use slash separators and current page is not a link.
- **States & variants to build:** Employee/Priya for enrollment and meeting; Workflow Owner/Marcus for review, agent and release; Approver/Daniel for approval; Admin/Tomas for capabilities. Role selector open/closed, selected nav, light/dark, focused search and notification bell. Role changes are view changes, never privilege escalation.
- **Interactions & hotspots:** Role selector P(135,54); global search P(620,28), `⌘K`; bell P(1200,28) opens SC35; each nav row opens its named screen; Escape closes popovers. Back/forward preserve state and authorized visibility.
- **Animations needed in-component:** Nav and popover 150ms standard UI easing; role change immediate; no cyan for idle or selected. Theme flip belongs to SC26 and occurs at containment only.
- **Data bound:** `people`, role assignments, selected organization, authorized destination and current ST01–ST24.
- **Depends on:** CMP-03 Button, CMP-12 Breadcrumbs, CMP-11 CommandPalette, CMP-10 Popover, CMP-35 NotificationCard, SC12, SC35.
- **Build notes & pitfalls:** These nav labels/icons resolve unspecified source details consistently; no remote private evidence even for Admin. Product remains fixed-width under camera crop.
- **Done when:** Sidebar and header line up; selector changes permitted viewpoint; current breadcrumb and nav match; keyboard opens and dismisses search; no idle cyan appears.
- **Effort:** M.

### SC01 — Desktop companion, status and menu
- **Purpose / what the viewer perceives:** Priya sees whether observation is on and can pause it in one action; an excluded window never becomes evidence.
- **Priority:** P0, active and paused; excluded-window state P0; resumed state P1 clickable completeness.
- **Appears in:** H-062 01:27–01:28; L-038–L-039 00:35–00:37 and L-043–L-044 00:40–00:42.
- **Canvas & layout:** Desktop underlay is Part C; product menu `[950,28,310,232]`, status row at y64, pause at y96–128, privacy at y144–176. Exclusion cue appears adjacent to excluded window, not over its contents; z20.
- **Visual spec:** White, hairline, radius 8, shadow-md, 12px padding; CircleDot, Pause, Shield 16px; neutral status and readable labels. No agent execution cyan for observation.
- **Exact content:** Active `Observation active`, `Capture active`, `Pause observation`, `Pause`, `My Privacy`; paused `Observation paused`, `Resume observation`; excluded cue `Excluded window — not captured`.
- **States & variants to build:** Active menu; one-click paused; excluded-window moment without a thumbnail or captured content; resumed after explicit action. Denied enrollment keeps observation off.
- **Interactions & hotspots:** Tray menu via Part C; P(1100,112) pause/resume; P(1100,160) opens SC03; Escape closes; pause preserves independent sharing choice and yields ST02 paused.
- **Animations needed in-component:** Menu opacity/translate 150ms standard; status swaps immediately; excluded cue remains static; reduced motion immediate.
- **Data bound:** ST01 consent, ST02 capture permission, pause and exclusion list.
- **Depends on:** CMP-10 Popover, CMP-03 Button, SC03, APP-macOS.
- **Build notes & pitfalls:** Never render an excluded surface in screenshots, transcript, search or candidate evidence. Status describes observation, not agent execution.
- **Done when:** Active and paused text differ; pause takes one action; Privacy opens; excluded content is absent; no cyan appears.
- **Effort:** M.

### SC02 — Enrollment wizard
- **Purpose / what the viewer perceives:** Priya deliberately reviews notice, separately selects capture and organizational sharing, then enables permitted work only.
- **Priority:** P0 for notice, scope and consent; P1 for back/denial completeness.
- **Appears in:** H-055–H-059 01:20–01:25; L-035–L-036 00:32–00:34.
- **Canvas & layout:** Three-step indicator above centered card `[320,100,640,520]`; card header 24px padding, 40px rows, separate footer with Back left and continue right. The H shot may crop to x300–980; L shot x350–930.
- **Visual spec:** White card, bone canvas, neutral stepper with labels, 1px hairline, 8px radius; heading 28/34; checkbox 16px; check and disclosure use distinct icons.
- **Exact content:** `Your work, your choice`; `Priya Nair`; `Calder & Vance`; `Employee`; step labels `Notice`, `Capture and sharing`, `Work scope`; `Work applications`, `Excluded windows`; `Visual observation`, `Organizational contribution`; `Accept and continue`, `Back`, `Continue`, `Decline`. Explain durable private evidence stays on device; authorized cloud inference is transient; sharing requires separate review.
- **States & variants to build:** Notice unchecked; notice accepted; separate capture/sharing selection; work scope with approved apps and mandatory exclusions; complete; denied, observation off. Previously accepted controls persist when moving back.
- **Interactions & hotspots:** P(1040,572) continue only with required consent; P(390,572) Back; checkbox labels are clickable; disabled Continue explains missing consent. Finish leads ST02, decline remains ST01/off.
- **Animations needed in-component:** 150ms opacity swap, no auto-advance; reduced motion instant.
- **Data bound:** `people.priya`, organization, notice acceptance, capture categories, sharing choice, application and window exclusions.
- **Depends on:** CMP-08 Stepper, CMP-04 Input, CMP-03 Button, SC01, SC03.
- **Build notes & pitfalls:** Capture and contribution are independent; neither acceptance nor inference authorization makes a reviewed contribution. Do not auto-record meetings.
- **Done when:** All three steps exist; unchecked consent blocks advance; sharing can differ from capture; mandatory exclusions remain; declining never starts observation.
- **Effort:** L.

### SC03 — My Privacy, exclusions and masking
- **Purpose / what the viewer perceives:** Employee controls observation and local retention, sees protected fields masked before storage, and can delete eligible local history.
- **Priority:** P0 for exclusions, pause, retention and masking; P1 for delete dialog interaction.
- **Appears in:** H-060–H-061 01:25–01:27; L-037, L-040–L-042 00:34–00:35 and 00:37–00:40.
- **Canvas & layout:** Shell main `[264,112,992,584]`, left settings column 600px, right summary 368px with 24px gap; retention and controls beneath exclusions; delete dialog centered max 512px z50.
- **Visual spec:** Three protected rows 40px high, white with ink mono labels and neutral hatch blocks, never actual values. Shield, EyeOff, Pause, Trash2 16px; warning 20px. Dialog uses 80% black scrim.
- **Exact content:** `My Privacy`; `Excluded apps, windows and URLs`; `Mandatory exclusions`; `Local retention: 7 days`; `Delete local history`; `Pause observation`; `BANK ACCT`, `TAX ID`, `CARD`; delete dialog `Delete local history?`, `Delete eligible local history from this device. Shared contributions and published knowledge are not removed.`, `Cancel`, `Delete local history`.
- **States & variants to build:** Active; paused; exclusion list including locked mandatory entries; masked preview with all three values absent from first frame; delete confirmation, cancel and deletion receipt; legal hold where applicable explains unavailable deletion without extending retention.
- **Interactions & hotspots:** P(1100,160) pause; P(1090,428) opens deletion confirmation; Cancel/Escape preserves history; confirm deletes eligible local history only and returns receipt. Checkbox controls cannot disable mandatory exclusions.
- **Animations needed in-component:** Mask hatch may reveal 500ms as graphic but actual protected value never exists onscreen; dialog fade 150ms; reduced motion immediate.
- **Data bound:** ST01/ST02, privacy preferences, retention 7 days, eligible local purge scope.
- **Depends on:** CMP-09 Dialog, CMP-03 Button, CMP-04 Input, SC01.
- **Build notes & pitfalls:** Local durable raw capture versus authorized transient cloud processing must be accurate. Do not claim global erasure or show the contents of excluded windows.
- **Done when:** Three separate exclusion categories show; mandatory protection is locked; all three fields are masked; pause works; delete warns of local-only scope.
- **Effort:** L.

### SC04 — Contextual HUD, reminder and guide
- **Purpose / what the viewer perceives:** One unobtrusive, context-specific suggestion helps Jamal or reminds Priya without taking over their work.
- **Priority:** P0 for peer fix and commitment reminder; P1 for full Guide Me traversal unless cut shows its open state.
- **Appears in:** H-069 01:34–01:35, H-122 02:27–02:28; L-056 00:53–00:54, L-151–L-152 02:28–02:30.
- **Canvas & layout:** One HUD `[900,148,320,144]` or lower-right edge beside the underlying target; z30. 12px padding, title, evidence, primary action, dismiss. Guide sequence expands within same anchored card and avoids covering target.
- **Visual spec:** White radius 8, 1px hairline, shadow-md; Lightbulb, ListChecks, X, ArrowRight 16px; title 16/22 Space Grotesk; evidence 12/18 mono. No cyan for a static recommendation.
- **Exact content:** `Known fix from AP East: Vendor tax ID format`; `Guide Me`; `Confirm Kestrel handling-fee terms in writing`; `Fri 12:00`; guide `Check the vendor tax ID format`, `Update the permitted field`, `Review the result`, `Next`, `Back`, `Done`, `Dismiss`.
- **States & variants to build:** Peer fix; commitment reminder; Guide Me open, step 1/2/3, completed and dismissed. Guidance is published knowledge; dismissing or completing guidance does not resolve the source case or verify a business outcome.
- **Interactions & hotspots:** P(1095,257) opens guide; Next/Back traverse; Done closes guidance; X dismisses only card. Focus returns to trigger; no autonomous change is made.
- **Animations needed in-component:** 150ms opacity/position transition; step change 150ms; no loop; reduced motion immediate.
- **Data bound:** ST18, peer fix title and approved source; ST03 confirmed commitment, Priya, Fri 12:00.
- **Depends on:** CMP-36 HUDCard, CMP-03 Button, APP-NetSuite, SC11.
- **Build notes & pitfalls:** Only one card at a time. Never show a colleague's private captured screen; the underlying NetSuite view belongs to Part C.
- **Done when:** Both cards show exact text; reminder appears only on Kestrel context; Guide Me steps advance manually; dismissal leaves work unresolved.
- **Effort:** M.

### SC11 — Meeting review and confirmed commitment
- **Purpose / what the viewer perceives:** Priya reviews a proposed commitment against its meeting evidence, corrects the deadline, and explicitly confirms it.
- **Priority:** P0, proposed, edited and confirmed.
- **Appears in:** H-067–H-068 01:32–01:34; L-053–L-055 00:50–00:53.
- **Canvas & layout:** Transcript `[264,112,560,520]`, commitment card `[848,112,384,520]`; 24px padding, title then owner, due, source and note rows. Confirm at lower right.
- **Visual spec:** Flat white cards, warm hairlines, 8px radius; suggested neutral badge, confirmed check; FileText and Clock 16px. Human transcript Crimson Text 16/24.
- **Exact content:** `Confirm Kestrel handling-fee terms in writing`; `Priya Nair`; `Fri 17:00` changed to `Fri 12:00`; `00:14:32`; `subject to company approval`; `Suggested`, `Confirmed Commitment`, `Confirm`. Transcript: `From the next cycle we're adding a handling line to every invoice.` and `Send me the new layout; I'll confirm the terms in writing by Friday.`
- **States & variants to build:** Suggested unconfirmed; due-date editing; changed deadline; explicit confirmation; source unavailable or unknown speaker is labeled unknown, never guessed.
- **Interactions & hotspots:** P(1050,342) edits deadline; P(1090,562) confirms and creates ST03 confirmed; source link focuses transcript. Enter saves field, Escape cancels edit.
- **Animations needed in-component:** 150ms field and status change; typed change is deterministic, no loop; reduced motion instant.
- **Data bound:** Priya, Dana, meeting source `00:14:32`, due time and confirmation.
- **Depends on:** CMP-04 Input, CMP-03 Button, CMP-15 Timeline, SC04, APP-Zoom.
- **Build notes & pitfalls:** Meeting capture needs separate consent; confirmation is neither policy approval nor another person's acceptance. Keep note after confirmation.
- **Done when:** Original and corrected deadlines are distinct; source is visible; explicit Confirm changes status; caveat remains; reminder uses Fri 12:00.
- **Effort:** M.

### SC12 — Home and role context
- **Purpose / what the viewer perceives:** Authorized users enter a concise snapshot and switch to another granted viewpoint without changing underlying permissions.
- **Priority:** P1 clickable completeness; shared shell itself is P0.
- **Appears in:** SC12 is specified but not independently named in either cut; shell appears throughout H-056–H-132 and L-035–L-160.
- **Canvas & layout:** Four cards in 2×2 grid starting `[264,128]`, each 480×180, gaps 16px; shell remains SC12-FRAME.
- **Visual spec:** Flat white, radius 8, 1px hairline; title 16/22; 24px section gutters; Lucide Bell, ShieldAlert, CircleCheck, History.
- **Exact content:** `Home`, `Approvals`, `Incidents`, `Verified outcomes`, `Recent changes`; `Calder & Vance`; role choices in SC12-FRAME. Show counts only when derived from selected snapshot.
- **States & variants to build:** Employee, Workflow Owner, Approver, Admin; selected role and authorization-limited card content; empty or denied view with reason.
- **Interactions & hotspots:** P(135,54) opens selector; cards navigate to corresponding views; P(1200,28) notifications, P(620,28) search. Selecting a role cannot grant missing authority.
- **Animations needed in-component:** Card hover 150ms neutral; selector 150ms; reduced motion instant.
- **Data bound:** Current snapshot, roles, authorization, relevant ST state.
- **Depends on:** SC12-FRAME, CMP-03 Button, CMP-06 StatusBadge.
- **Build notes & pitfalls:** Do not add values across reporting periods or reveal raw local evidence.
- **Done when:** Four cards appear; role label matches selection; a card opens its route; unauthorized content stays unavailable.
- **Effort:** S.

### SC13 — Workflow Discovery inbox
- **Purpose / what the viewer perceives:** Three employee-approved demonstrations suggest a workflow that still needs review.
- **Priority:** P0 candidate and three-demonstration list; P1 empty/no-access states.
- **Appears in:** H-070 01:35–01:36; L-058 00:55–00:56.
- **Canvas & layout:** Shell content `[264,112,992,440]`; heading and filter top, candidate row at y176–224, evidence rows below 32px high.
- **Visual spec:** White table, warm row separators, neutral `Needs Review` warning with triangle; 14px row icons, mono identifiers.
- **Exact content:** `Workflow Discovery`; `Supplier invoice vs purchase order reconciliation`; `3 demonstrations`; `Needs Review`; `D1 · Priya Nair · Mon 09:14 · INV-48203 · Brightwater Industrial`; `D2 · Priya Nair · Mon 10:02 · INV-48204 · Copperline Cables`; `D3 · Jamal Carter · Tue 13:40 · INV-48207 · Harlow Tooling`; empty `No candidates yet`.
- **States & variants to build:** Candidate visible, selected, empty, no access with reason, neutral loading 150ms.
- **Interactions & hotspots:** P(550,200) opens SC14/ST04; row supports Enter. Filters do not disclose unauthorized evidence.
- **Animations needed in-component:** Selection 150ms; skeleton 150ms, deterministic; no loop.
- **Data bound:** demonstrations D1–D3, candidate title, status and contribution permissions.
- **Depends on:** SC12-FRAME, CMP-07 Table, CMP-06 StatusBadge, SC14.
- **Build notes & pitfalls:** Three demonstrations are not five verified examples and do not establish policy; no invented numeric confidence.
- **Done when:** All three source rows match fixtures; candidate is Needs Review; selection opens review; empty state offers next action.
- **Effort:** M.

### SC14 — Candidate review and rule/evidence drawers
- **Purpose / what the viewer perceives:** Contributors and owner inspect sanitized examples, uncertain interpretation and governing evidence before publication.
- **Priority:** P0 candidate, evidence and AP-RULE-009 drawer; P1 rejected/empty states.
- **Appears in:** H-071–H-074 01:36–01:40; L-059–L-061 00:56–00:59, L-073 01:10–01:11.
- **Canvas & layout:** Three demonstration cards 292×120 across left area; proposed steps below; evidence rail `[880,112,352,480]`; overlay drawer `[800,0,480,720]`, sticky footer 64px.
- **Visual spec:** Flat white 8px cards, 1px rules; drawer shadow-lg and scrim, z50; triangle for unverified rule, file links in foreground.
- **Exact content:** `Match supplier invoice to purchase order and stage result in ERP`; `Suggested`; `Confidence`; `Variance exception rule: unverified until SME review`; D1–D3 exactly as SC13; `AP-RULE-009`, `variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept`; `Approve contribution`, `Request owner review`, `Evidence`, `Close`.
- **States & variants to build:** Three source cards default and selected; uncertainty shown; evidence drawer; AP-RULE-009 detail; contributor-approved then owner review requested. Unverified branch remains unverified until authorized SME review.
- **Interactions & hotspots:** P(1040,360) opens evidence; P(1090,600) approves contribution and requests owner review; Esc closes drawer and returns focus; only authorized source links open.
- **Animations needed in-component:** Drawer slide/opacity 150ms standard; no autoplay; reduced motion instant.
- **Data bound:** demonstrations, consent, evidence references, AP-RULE-009 owner Daniel and approval.
- **Depends on:** SC13, CMP-09 Drawer, CMP-03 Button, CMP-06 StatusBadge, SC15.
- **Build notes & pitfalls:** Source screenshots are only authorized sanitized derivatives; inference and contributor approval do not publish or create policy. Show confidence as a label without fabricated percentage.
- **Done when:** All three provenance records visible; warning is explicit; exact threshold is correct; drawer traps focus; owner review remains separate.
- **Effort:** L.

### SC15 — Approved Playbook
- **Purpose / what the viewer perceives:** Marcus publishes a reviewed human-facing procedure with rules, exceptions and linked evidence.
- **Priority:** P0 published guidance; P1 prior-to-publication and denied actions.
- **Appears in:** H-075–H-076 01:40–01:42; L-062 00:59–01:00, L-074 01:11–01:12.
- **Canvas & layout:** Main procedure `[264,112,608,560]`, rules/evidence `[896,112,360,560]`; page title above sections; Agent Factory action near P(1080,630).
- **Visual spec:** White flat cards and dividers, 8px radius; outlined shield/check `Approved for Guidance` is neutral, not execution cyan; 16px icons.
- **Exact content:** `Supplier invoice vs purchase order reconciliation · v1.0`; `Approved for Guidance`; `Owner: Marcus Webb`; `Steps`, `Decisions`, `Exceptions`, `Evidence`; six steps: `Receive invoice and identify supplier`; `Locate purchase order and verify identity`; `Interpret invoice totals`; `Compare totals against approved variance rule`; `Stage ERP result or escalate`; `Verify authoritative business outcome`. `AP-RULE-009 Variance threshold`; `AP-RULE-017 Supplier handling fees`; exceptions `Missing Purchase Order`, `Duplicate invoice`, `Approval Required`, `Outcome Unknown`, `Unreadable PDF`; `Publish`, `Agent Factory`.
- **States & variants to build:** Draft/review pending; approved for guidance; evidence or rule drawer; scroll to section; publish disabled without owner review.
- **Interactions & hotspots:** Publish only after owner approval; evidence opens SC14 drawer; P(1080,630) opens SC17; Enter/Space activate.
- **Animations needed in-component:** 150ms standard selection and drawer; no success animation suggesting agent deployment.
- **Data bound:** `PB-AP-RECON` v1.0, AP-STEP-01–06, rules 009/017, D1–D3, Marcus.
- **Depends on:** SC12-FRAME, CMP-07 Table, CMP-09 Drawer, CMP-06 StatusBadge, SC17.
- **Build notes & pitfalls:** Publication is human guidance, not agent release. AP-RULE-009 auto-accepts at or below 2.00%.
- **Done when:** All six steps appear; owner and version visible; both rule links present; Approved for Guidance is distinct from deploy.
- **Effort:** L.

### SC16 — Operations Map, selection and table
- **Purpose / what the viewer perceives:** Authorized viewer inspects dependencies between workflow, rules, agent and incident through equivalent graph and list views.
- **Priority:** P0 default and selected Reconciler; P1 table view accessibility.
- **Appears in:** H-117–H-119 02:22–02:25; L-148 02:25–02:26.
- **Canvas & layout:** Canvas `[264,112,992,560]`; workflow node `[340,260,188,64]`; rule nodes `[620,170,188,64]` and `[620,350,188,64]`; agent `[880,260,188,64]`; incident `[1080,400,160,64]`; right detail overlays selected graph.
- **Visual spec:** 188×64 white nodes, radius 6, 1px border, 8px handles; trace 1.5px arrow edges, candidate dashed 5/3, selected 2px neutral signal. No cyan selection.
- **Exact content:** `Operations Map`; `Supplier invoice vs purchase order reconciliation`; `AP-RULE-009 Variance threshold`; `AP-RULE-017 Supplier handling fees`; `Supplier Invoice Reconciler`; `INC-0042`; `Graph`, `Table`, `Evidence`.
- **States & variants to build:** Default graph; selected Reconciler with rule/incident edges highlighted and detail open; table listing same nodes and relationships; selected keyboard focus.
- **Interactions & hotspots:** P(974,292) selects agent; P(1190,136) toggles table; arrow keys navigate graph nodes and Enter opens detail; table rows mirror selection.
- **Animations needed in-component:** 150ms edge/selection color and drawer fade; static graph, no execution animation.
- **Data bound:** ST17 graph nodes, approved/candidate edges, rules 009/017, incident 0042.
- **Depends on:** SC12-FRAME, CMP-41 GraphNode, CMP-07 Table, CMP-09 Drawer, SC26.
- **Build notes & pitfalls:** Use React Flow with keyboard-equivalent table. Keep graph content under frame during cinematic crop; candidate edges must be dashed.
- **Done when:** All four object types are visible; selected edges are neutral; details cite rule and incident; table matches graph.
- **Effort:** L.

### SC17 — Agent Factory intent and draft
- **Purpose / what the viewer perceives:** A reviewed playbook becomes an editable proposed agent definition with explicit boundaries and stopping points.
- **Priority:** P0 empty/typed intent and generated structure; P1 invalid/disabled state.
- **Appears in:** H-077–H-079 01:42–01:45; L-075–L-081 01:12–01:19.
- **Canvas & layout:** Intent field `[304,160,880,72]`; six stacked sections beneath; Continue at P(1050,600); field may be stage-cropped without stage shadow inside UI.
- **Visual spec:** White 1px card, 6px input radius, 2px focus outline; 15px mono intent; six 40px white rows; warning triangle beside unverified branch.
- **Exact content:** `Create Agent`; `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`; `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`, `Unverified branch`, `Continue`.
- **States & variants to build:** Empty focused field, deterministic typing, populated definition, unverified branch, disabled Continue when intent absent; optional active generation only while running.
- **Interactions & hotspots:** Type into input; P(1050,600) opens SC18/ST06 only when valid; Tab traverses fields and sections.
- **Animations needed in-component:** Type-on 28–34 characters/sec with seeded timing; generated rows 150ms; arc only during actual generation and extinguishes thereafter; reduced motion shows final text.
- **Data bound:** playbook v1.0, intent, proposed fields, rule uncertainty.
- **Depends on:** SC15, SC18, CMP-04 Input, CMP-03 Button.
- **Build notes & pitfalls:** No model selector; inferred definition grants neither authority nor release. Film typing is deterministic, never network-driven.
- **Done when:** Exact intent can be typed; six sections visible; unverified branch flagged; blank intent blocks advance.
- **Effort:** M.

### SC18 — Scope, risk, autonomy and release gate
- **Purpose / what the viewer perceives:** Scope and consequential authority are explicit; Stage 3 remains pending until evidence and owner approval genuinely exist.
- **Priority:** P0 both pending and satisfied states, including example evidence drawer.
- **Appears in:** H-080–H-083 01:45–01:49, H-091 01:56–01:57; L-082–L-090 01:19–01:28, L-105–L-107 01:42–01:45.
- **Canvas & layout:** Scope `[264,112,480,560]`, risk/ladder/gates `[768,112,464,560]`; six rows 54px; gate 40px rows; drawer `[800,0,480,720]` when evidence opened.
- **Visual spec:** Neutral Stage 3 rail, outlined risk shields, 1px dividers; pending empty circles versus checked conditions; Tier 4 uses cross, never execution cyan.
- **Exact content:** `AP East`; `Gmail`, `NetSuite`, `Google Sheets`; `Supplier Invoice Reconciler`; `Tier 3 - Consequential`; `read · Tier 0`, `tag/stage · Tier 1/2`, `post/approve variance · Tier 3`, `Tier 4 Restricted`; ladder `0 Observe`, `1 Suggest`, `2 Guide`, `3 Supervised Assist`, `4 Scoped Autopilot`, `5 Self-Maintaining Autopilot`; gates `5/5 verified human examples`, `28/25 representative scenarios`, `6/5 edge/negative`, `Owner approval`; evidence `3 observed this week + 2 SME-verified archived cases`; `Run Supervised`, `v1.0 · Stage 3 Supervised Assist`, `Deploy`.
- **States & variants to build:** Before v0.2 pass, example evidence may be checked but scenario and owner rows are pending; after 28 correct intended outcomes and Marcus approval all gates checked, then deploy enabled. Tier 4 remains prohibited.
- **Interactions & hotspots:** P(1020,606) opens simulator; example count opens evidence drawer; owner approval is distinct from evaluation; Deploy only after all checks; disabled explains unmet gate.
- **Animations needed in-component:** 150ms focus/selection; gate checks appear only on actual state transition; no loop.
- **Data bound:** `gateExamples` 3+2, SIM-AP-RECON v0.2 22+6, owner Marcus, approved scope.
- **Depends on:** CMP-22 AutonomyLadder, CMP-23 GateChecklist, CMP-21 RiskTierChip, CMP-09 Drawer, SC19, SC20.
- **Build notes & pitfalls:** ST06 cannot display satisfied before ST09 plus owner approval. One granted job is not blanket approval of Tier 3 action.
- **Done when:** All six exact stages appear; 5/5 provenance opens; gate pending and satisfied differ correctly; Tier 4 barred; Deploy requires owner.
- **Effort:** L.

### SC19 — Flight Simulator suite and running stages
- **Purpose / what the viewer perceives:** A version-bound, sealed suite runs representative and safety scenarios before production authorization.
- **Priority:** P0 preview, v0.1 run and v0.2 rerun; P1 cancel state.
- **Appears in:** H-084 01:49–01:50, H-089 01:54–01:55; L-091–L-093 01:28–01:31, L-102 01:39–01:40.
- **Canvas & layout:** Header `[264,112,992,80]`; grid 4×7 in `[300,220,472,416]`; adjacent scenario detail panel; `Run scenarios` at upper right.
- **Visual spec:** 96×52px tiles, 8px gaps, 1px border, 4px radius; 8px execution bar and 24px running ring cyan only while active; labels remain foreground.
- **Exact content:** `Flight Simulator`; `SIM-AP-RECON`; `28 scenarios`; `v0.1`, `v0.2`; `Normal`, `Edge`, `Negative`; `Run scenarios`, `Cancel`; safe cases `Missing Purchase Order` twice, `Duplicate invoice`, `Over-threshold variance`, `ERP timeout`, `Unreadable PDF`.
- **Scenario roster:** SCN-001 exact invoice/PO match; SCN-002 Brightwater ordinary invoice; SCN-003 Copperline ordinary invoice; SCN-004 Northgate ordinary invoice; SCN-005 Orchard Lane ordinary invoice; SCN-006 Harlow ordinary invoice; SCN-007 Vantage ordinary invoice; SCN-008 Meadowbrook ordinary invoice; SCN-009 approved vendor and matching PO; SCN-010 lines in different order; SCN-011 multiple matching lines; SCN-012 zero variance/two decimals; SCN-013 case-insensitive PO prefix; SCN-014 approved invoice date; SCN-015 approved tax covered by PO; SCN-016 approved handling covered by terms; SCN-017 below-threshold variance; SCN-018 one cent below threshold; SCN-019 negative variance within threshold; SCN-020 already matched with evidence, no duplicate write; SCN-021 matching independent readback. All 21 are Passed in both versions. SCN-022 `variance_exactly_2.00pct` expects auto-accept and changes Failed to Passed. SCN-023 Ironbark missing PO, SCN-024 Sable missing PO, SCN-025 duplicate invoice, SCN-026 above-threshold variance requiring approval, SCN-027 ERP timeout held unknown, and SCN-028 unreadable PDF each retain Passed — Expected Safe Escalation.
- **States & variants to build:** Preview idle; v0.1 running; cancellation incomplete/not run; completed v0.1 to SC20; v0.2 rerun of same suite; completed v0.2. Tiles retain individual outcomes.
- **Interactions & hotspots:** P(1100,160) starts ST07; Cancel ends execution without inventing verdicts; selecting a tile opens SC20 replay once completed.
- **Animations needed in-component:** Active node 1800ms linear timeline-derived loop; staged tile updates deterministic; stop instantly extinguishes arc. Reduced motion static running label.
- **Data bound:** suite SIM-AP-RECON, 28 fixed SCN IDs, version and verdicts.
- **Depends on:** CMP-17 ScenarioGrid, CMP-20 JobProgress, CMP-03 Button, SC20.
- **Build notes & pitfalls:** A safe escalation is a pass, not a failure; no changing suite identity between versions.
- **Done when:** 28 tiles present; run binds to chosen version; cancel remains incomplete; arc disappears at stop.
- **Effort:** L.

### SC20 — Results, replay, fix and compare
- **Purpose / what the viewer perceives:** An exact-boundary failure is explained, corrected, and independently reevaluated without overwriting history.
- **Priority:** P0 failure, replay, compare and passing results.
- **Appears in:** H-085–H-088 01:50–01:54, H-090 01:55–01:56; L-094–L-101 01:31–01:39, L-103–L-104 01:40–01:42.
- **Canvas & layout:** Grid left `[264,200,472,416]`, results and 440px replay right; full-height overlay `[800,0,480,720]` for replay; comparison equal columns separated by 1px.
- **Visual spec:** Passed check green, safe bent arrow green, Failed red X-diamond, foreground labels; tile selected 2px outline; no cyan in finished states.
- **Exact content:** `v0.1`; `21 Passed`; `6 Passed — Expected Safe Escalation`; `1 Failed`; `variance_exactly_2.00pct`; `Expected: accept`; `Actual: escalate`; `> 2.00% requires approval`; `v0.2`; `22 Passed`; `6 Passed — Expected Safe Escalation`; `0 Failed`; `28/28 intended outcomes correct`; `Compare versions`; `Rerun`.
- **States & variants to build:** ST08 v0.1 finished; failed SCN-022 selected; replay open; corrected comparator proposed; side-by-side v0.1/v0.2; ST09 v0.2 passing; six individually listed expected safe escalations.
- **Interactions & hotspots:** P(500,292) opens failed replay; P(1050,590) fixes comparator and initiates rerun via SC19; compare shows original and new evaluation independently.
- **Animations needed in-component:** Drawer 150ms, comparison 150ms, no active arc after stop; reduced motion instant.
- **Data bound:** versions v0.1/v0.2, SCN-022, suite SCN-001–028, rule 009.
- **Depends on:** CMP-17 ScenarioGrid, CMP-09 Drawer, CMP-16 Diff, CMP-06 StatusBadge, SC19.
- **Build notes & pitfalls:** Exactly 2.00% auto-accepts; above 2.00% requires approval. Do not call 6 safe cases failures or rewrite v0.1.
- **Done when:** Initial totals sum 28; replay states expected and actual; compare aligns equality verdict; corrected totals sum 28; no cyan remains.
- **Effort:** L.

### SC21 — Jobs queue and scope confirmation
- **Purpose / what the viewer perceives:** An operator explicitly starts a fixed, authorized population under a released version, not blanket permission for all future actions.
- **Priority:** P0 queue, selection and preflight; P1 cancel/rejected preflight.
- **Appears in:** H-092 01:57–01:58; L-108–L-109 01:45–01:47.
- **Canvas & layout:** Queue table `[264,160,992,440]`; preflight beside selected row; centered confirmation max 512px over z40 scrim; action footer.
- **Visual spec:** White table with 32px rows, signal selection rail, 1px separators; dialog radius 8, shadow-lg, 24px padding.
- **Exact content:** `Jobs`; `JOB-0117`; `Supplier Invoice Reconciler v1.0`; `AP East`; `11 invoices`; `Confirm job scope`; `Permitted applications`; `Policy`; `Start job`; `Cancel`.
- **States & variants to build:** Eligible queue row; fixed selection of 11; preflight showing version, AP East, applications and policy; scope confirmation; blocked with reason if not authorized; started.
- **Interactions & hotspots:** P(1110,170) opens confirmation; P(780,520) starts ST10 only if scope and release authorized; Cancel/Escape preserves queue.
- **Animations needed in-component:** 150ms dialog fade; arc starts only after confirmed run, never on preflight.
- **Data bound:** JOB-0117, 11 invoice IDs, v1.0 release, AP East scope and action permissions.
- **Depends on:** CMP-07 Table, CMP-09 Dialog, CMP-03 Button, SC22.
- **Build notes & pitfalls:** Freeze population before launch. Approval to start job does not authorize consequential variance posting.
- **Done when:** Version and 11-case scope visible; confirmation precedes run; unauthorized start explains block; cancel starts nothing.
- **Effort:** M.

### SC22 — Eleven-case job and progress
- **Purpose / what the viewer perceives:** Each invoice progresses independently to verified, escalated, approval or unknown; a finished processing pass is not an all-success outcome.
- **Priority:** P0 running stages and finished; P1 canceled/incomplete.
- **Appears in:** H-093–H-095 01:58–02:01; L-110–L-114 01:47–01:52.
- **Canvas & layout:** Summary `[264,112,992,92]`; table `[264,220,992,452]`, header and 11 rows 32px; columns invoice 120, supplier 184, amount 100, PO 100, status 240, action 80.
- **Visual spec:** Tabular money right-aligned; 8px segmented progress with labeled counts; only active row/node arc cyan. Distinct check, arrow, approval and hatched square glyphs.
- **Exact content:** `JOB-0117`; `11 invoices`; rows: `INV-48210 | Brightwater Industrial | $6,240.00 | PO-1031 | Verified Complete`; `INV-48211 | Copperline Cables | $3,118.40 | PO-1032 | Verified Complete`; `INV-48212 | Northgate Pallets | $1,905.00 | PO-1034 | Verified Complete`; `INV-48213 | Orchard Lane Foods | $12,480.00 | PO-1036 | Verified Complete`; `INV-48214 | Harlow Tooling | $847.25 | PO-1037 | Verified Complete`; `INV-48215 | Ironbark Fasteners | $2,260.00 | — | Escalated: Missing Purchase Order`; `INV-48216 | Vantage Print | $529.90 | PO-1039 | Verified Complete`; `INV-48217 | Meadowbrook Office | $1,376.12 | PO-1040 | Verified Complete`; `INV-48218 | Sable & Co. Logistics | $4,415.00 | — | Escalated: Missing Purchase Order`; `INV-48219 | Brightwater Industrial | $18,420.00 | PO-1042 | Approval Required (Tier 3)`; `INV-48220 | Northgate Pallets | $2,732.50 | PO-1044 | Outcome Unknown`.
- **States & variants to build:** Pre-run queued; first active case; partial verified rows; two separate escalations; approval/unknown discovered; processing stopped with 7/2/1/1; post-approval independent verification 8/2/0/1. Incomplete rows remain distinct during run.
- **Interactions & hotspots:** P(1050,524) opens SC23; P(1050,556) opens SC24; row action accessible by keyboard; summary opens SC25.
- **Animations needed in-component:** Deterministic row reveal 60ms stagger capped 360ms; active ring 1800ms linear; all cyan extinguishes when execution stops; reduced motion static states.
- **Data bound:** `invoices` 11 rows; job version, progress and independent verification.
- **Depends on:** CMP-19 CaseTable, CMP-20 JobProgress, CMP-06 StatusBadge, SC23, SC24, SC25.
- **Build notes & pitfalls:** Preserve frozen record IDs and exact totals; no fabricated statuses during progress. Unknown is held, not retried.
- **Done when:** All 11 exact rows render; preapproval counts 7/2/1/1; postverification counts 8/2/0/1; active cyan disappears on stop.
- **Effort:** L.

### SC23 — Approval drawer
- **Purpose / what the viewer perceives:** Daniel sees exact financial change, supporting evidence and his scoped Tier 3 authority before deciding.
- **Priority:** P0 pending, approval and independent-verification boundary; P1 reject/request-changes.
- **Appears in:** H-098–H-100 02:03–02:06; L-114–L-118 01:51–01:56.
- **Canvas & layout:** Right drawer `[800,0,480,720]`, scrollable content, 64px sticky footer; before/after 2-column diff above action row; z50, scrim z40.
- **Visual spec:** White, hairline, shadow-lg, 8px nested cards, warning person/diamond; source icons FileText/ExternalLink 16px.
- **Exact content:** `INV-48219`; `Brightwater Industrial`; `Invoice $18,420.00`; `PO-1042 $17,980.00`; `Variance $440.00 / 2.45%`; `AP-RULE-009`; `Daniel Okafor · Tier 3`; `Before: Variance Hold`; `After: Matched - Variance Approved`; `Approve`, `Reject`, `Request Changes`; `Awaiting verification`.
- **States & variants to build:** Pending approval; evidence and authority expanded; approved but not yet independently verified; verified readback; rejected; changes requested. Decision alone does not move verified count.
- **Interactions & hotspots:** P(1100,665) Approve with valid delegation; evidence links open source; Reject and Request Changes distinct. Esc returns focus without decision.
- **Animations needed in-component:** Drawer 150ms, decision transition 150ms; no success arc; reduced motion instant.
- **Data bound:** INV-48219, PO-1042, AP-RULE-009, Daniel delegation and postcondition evidence.
- **Depends on:** CMP-09 Drawer, CMP-16 Diff, CMP-03 Button, SC22, SC25.
- **Build notes & pitfalls:** Correct 440/17980 = 2.45% rounded. Never merge approval with independently acquired readback.
- **Done when:** Exact values and diff shown; named approver present; each decision distinct; verified count changes only after readback.
- **Effort:** M.

### SC24 — Unknown outcome and evidence drawer
- **Purpose / what the viewer perceives:** An ERP timeout produces uncertainty, an explicit hold, and an investigation rather than an automatic retry.
- **Priority:** P0 unknown, held and verification-evidence variants.
- **Appears in:** H-097 02:02–02:03, H-101 02:06–02:07, H-137 02:42–02:43, H-140 02:45–02:46; L-119–L-121 01:56–01:59.
- **Canvas & layout:** Right drawer `[800,0,480,720]`, header and record facts, central hatched status panel, investigation action P(1060,585), sticky footer.
- **Visual spec:** Hatched neutral square and separate solid foreground labels; flat white evidence cards; no cyan, green success or Retry control.
- **Exact content:** `INV-48220`; `Northgate Pallets`; `$2,732.50`; `PO-1044`; `Outcome Unknown`; `ERP submit timed out`; `Held`; `Reconciliation required`; `Not resubmitted`; `Do not resubmit until reconciled`; `Held — check outcome before further action`; `Investigate`; `Business postcondition`.
- **States & variants to build:** Timed-out unknown; held; investigation opened with available evidence and explicit missing readback; evidence card beside business postcondition; no false verified outcome.
- **Interactions & hotspots:** P(1060,585) opens investigation; evidence links show permitted source; no enabled retry; Escape closes and restores focus.
- **Animations needed in-component:** 150ms drawer; hatch static except film sweep; no loop; reduced motion immediately displayed.
- **Data bound:** INV-48220, PO-1044, timeout custody and held status, independent evidence availability.
- **Depends on:** CMP-09 Drawer, CMP-06 StatusBadge, CMP-03 Button, SC22, SC25.
- **Build notes & pitfalls:** A timeout neither proves failure nor proves submission; keep submission custody unknown until reconciliation.
- **Done when:** Invoice facts and hold visible; missing evidence explicit; no retry present; unknown remains after other approval.
- **Effort:** M.

### SC25 — Job outcome summary
- **Purpose / what the viewer perceives:** A truthful point-in-time batch breakdown makes the unresolved case prominent, including after another case is approved.
- **Priority:** P0 both snapshots.
- **Appears in:** H-096 02:01–02:02, H-100 02:05–02:06, H-136 02:41–02:42; L-122–L-123 01:59–02:01.
- **Canvas & layout:** Four 232×160 cards at x264/512/760/1008 y160, 16px gaps; status and snapshot label above, action below.
- **Visual spec:** White 8px cards with 1px borders; 28px numerals, 12px mono status; unknown hatched glyph and panel, not text.
- **Exact content:** Before: `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`; after independent verification: `8 Verified Complete`, `2 Escalated`, `0 Approval Required`, `1 Outcome Unknown`; `Partially Complete`; `Before approval`, `Current snapshot`. H-096 requests `Completed with exceptions`; use `Partially Complete` for the held-unknown snapshot, as required by the more specific design specification §6.2.
- **States & variants to build:** Preapproval snapshot; approved awaiting readback retains preapproval classification until authoritative state supports moving it; postverification snapshot; unknown filter.
- **Interactions & hotspots:** P(1080,370) opens unknown-filtered SC24; click other categories filters SC22 by status.
- **Animations needed in-component:** Counts update 150ms opacity only on state change, no count-up; static in reduced motion.
- **Data bound:** JOB-0117 exact outcomes, approval event and independent readback.
- **Depends on:** CMP-06 StatusBadge, CMP-20 JobProgress, SC22–SC24.
- **Build notes & pitfalls:** Both snapshots sum to 11; a Job with unresolved unknown is not fully completed. Keep historical and current timestamps distinct without inventing clock times.
- **Done when:** Initial and final counts match; unknown is persistent; approval alone does not increment verified; each filter maps correctly.
- **Effort:** M.

### SC26 — Incident Center: containment and detail
- **Purpose / what the viewer perceives:** A supplier format change affects three cases, all paused before diagnosis or repair; observed facts and unconfirmed cause stay distinct.
- **Priority:** P0 light-to-dark containment, list and detail, three cases; P1 no-incident list.
- **Appears in:** H-104–H-106 02:09–02:12; L-127–L-131 02:04–02:09.
- **Canvas & layout:** List `[264,112,300,560]`; detail `[588,112,644,560]`; header, affected-case rows, expected/actual comparison, hypothesis and evidence action. Pre-wipe light shell shares identical geometry.
- **Visual spec:** Containment wipe changes light tokens to dark canvas `#0A0A0A`, surface `#141414`, border `#333333`, foreground `#F5F5F5`; warning stop-square, three paused glyphs; no arc. 1px dividers.
- **Exact content:** `Incident Center`; `INC-0042`; `Contained`; `3 affected cases paused`; `Kestrel Components`; `INV-48231`, `INV-48233`, `INV-48236`; `INV-48231 $4,213.50`; `PO-1051 $4,175.00`; `Handling fee $38.50`; `Expected: verifiable invoice total`; `Actual: cannot verify`; `Supplier document format change — unconfirmed`; `Teach Oryn What Changed`.
- **States & variants to build:** Light pre-containment; wipe to dark at containment; incident selected; detail list and single-case evidence; manual-resolution available; all three remain individually traceable.
- **Interactions & hotspots:** P(960,398) opens INV-48231 evidence; P(1090,600) opens SC27 only after manual resolution; list selection changes detail. No global stop of unrelated work.
- **Animations needed in-component:** One deterministic light-to-dark wipe at containment, film-timed; UI detail 150ms standard; reduced motion instantaneous theme swap. No toggle shown.
- **Data bound:** INC-0042, three case IDs, first amount and PO, hypothesis labeled unconfirmed.
- **Depends on:** SC12-FRAME, CMP-07 Table, CMP-09 Drawer, CMP-06 StatusBadge, SC27.
- **Build notes & pitfalls:** Do not invent amounts for INV-48233/48236. Containment precedes correction. Wipe is a cinematic transition, not settings interaction.
- **Done when:** Three exact IDs are paused; hypothesis clearly unconfirmed; first invoice/PO/fee reconcile; no cyan remains; unrelated cases are not implied paused.
- **Effort:** L.

### SC27 — Teach Oryn What Changed
- **Purpose / what the viewer perceives:** Elena supplies one specific correction after manually resolving an incident; Marcus bounds its applicability.
- **Priority:** P0 question, Yes, source and scope.
- **Appears in:** H-107–H-109 02:12–02:15; L-132–L-134 02:09–02:12.
- **Canvas & layout:** Centered 768px dark panel in shell; top case and human, middle question and answer, bottom source and save; 24px padding, 16px gaps.
- **Visual spec:** Dark surface `#141414`, border `#333333`, foreground `#F5F5F5`, radius 8; text 18/24 question, 14px mono source; BookOpen and Check 16px.
- **Exact content:** `Teach Oryn What Changed`; `Elena Ruiz`; `INV-48231`; `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?`; `Yes`; `Billed on top of subtotal; within approved terms`; `AP-RULE-017 Supplier handling fees`; `Kestrel Components layout v2 only`; `Save correction`; `Correction is evidence, not new policy`.
- **States & variants to build:** Manually completed case; unanswered; Yes selected; rule linked; Marcus scope reviewed; correction saved ST13. No changes to organizational policy.
- **Interactions & hotspots:** Select Yes, link rule, P(840,440) save; back preserves unsaved edits or offers discard confirmation; keyboard accessible.
- **Animations needed in-component:** 150ms selected/confirmation state; no execution loop; reduced motion immediate.
- **Data bound:** INV-48231, fee $38.50, Elena correction, AP-RULE-017, Kestrel layout v2 scope.
- **Depends on:** SC26, CMP-09 Dialog, CMP-04 Input, CMP-03 Button, SC28.
- **Build notes & pitfalls:** Distinguish Elena's interpretation from Marcus's bounded scope and Daniel-owned policy. Do not infer policy approval.
- **Done when:** Exact question and answer visible; rule linked; scope limited; correction saved only by explicit action.
- **Effort:** M.

### SC28 — Repair proposal and 34-scenario regression
- **Purpose / what the viewer perceives:** A narrow interpretation change is reviewed, then tested against original scenarios and nearby variants before release.
- **Priority:** P0 diff, running regression and completed results.
- **Appears in:** H-110–H-113 02:15–02:19; L-135–L-138 02:12–02:16.
- **Canvas & layout:** Diff `[264,112,480,520]`, test panel `[768,112,464,520]`; result strip and release control at lower edge. Side-by-side before/after rows 36px.
- **Visual spec:** Dark theme while incident context holds, white-on-dark text, 1px #333 rules, radius 8; running cyan bar only during execution; check/safe-stop/failure distinct.
- **Exact content:** `REP-0042-1`; `Interpret invoice totals`; `Kestrel Components layout v2 only`; `Correction is evidence, not new policy`; `Permissions unchanged`; `Policy unchanged`; `6 new regression cases`; `34 scenarios`; `28 Passed`; `6 Passed — Expected Safe Escalation`; `0 Failed`; `Run regression`; `Request release`.
- **Diff and added scenario rows:** Before `Do not include a separately positioned handling line without verified terms`; after `Include the handling line when approved Kestrel terms cover it`. SCN-029 original Kestrel layout v2: $4,175 subtotal + $38.50 handling = $4,213.50, terms cover fee; SCN-030 same handling after subtotal with different spacing; SCN-031 handling before total under permitted terms; SCN-032 zero handling under permitted terms; SCN-033 handling label capitalization differs under permitted terms; SCN-034 approved handling line with an additional separating rule above total. Each added scenario expects Passed. Base 28 are unchanged.
- **States & variants to build:** Bounded diff review; not-run with release disabled; ST14 regression running; finished 34-scenario pass; incomplete/failed blocks release.
- **Interactions & hotspots:** P(1080,570) starts regression; P(1100,625) requests release only after complete pass; open evidence for each case, cancel yields incomplete.
- **Animations needed in-component:** Active 1800ms timeline orbit and progress while running; deterministic tile update, stop immediately removes cyan; reduced motion static.
- **Data bound:** repair REP-0042-1, v1.1, original 28 plus six new cases (original failure + five variants), 28 ordinary passes and six safe passes.
- **Depends on:** CMP-16 Diff, CMP-17 ScenarioGrid, CMP-06 StatusBadge, CMP-03 Button, SC29.
- **Build notes & pitfalls:** Six new cases include original incident failure, not six in addition to it; total 34. Never present an incomplete evaluation as passing.
- **Done when:** Only specified step changes; scope and unchanged policy visible; test totals sum 34; release disabled while running; cyan gone when finished.
- **Effort:** L.

### SC29 — Limited release, watch, expansion and closure
- **Purpose / what the viewer perceives:** Marcus approves a narrow repair rollout, waits for three independently verified outcomes, then authorizes expansion and incident closure.
- **Priority:** P0 review, cohort, monitoring, expansion and closed state.
- **Appears in:** H-114–H-116 02:19–02:22, H-141 02:46–02:47; L-139–L-144 02:16–02:22.
- **Canvas & layout:** Cohort `[264,112,480,520]`, watch `[768,112,464,520]`; owner action and closure footer; three separate outcome rows.
- **Visual spec:** Flat white/light for H limited release; L closure may retain dark incident theme; neutral controls and success checks only for independently verified cases; 1px borders.
- **Exact content:** `Limited release`; `Kestrel Components invoices only`; `AP East only`; `v1.1`; `Marcus Webb`; `First 3/3 Verified Complete`; `Expand`; `Close incident`; `Repaired - Validated`; `Affected-case history`.
- **States & variants to build:** Owner review with diff and 34 passing tests; restricted cohort approved; watch 0/3 through 3/3 separate evidence rows; owner-authorized expansion; closed incident with retained case history.
- **Interactions & hotspots:** P(1080,510) expands only after 3/3 independent evidence and owner authorization; P(1090,630) closes only after expansion; clicking outcome opens evidence. Disabled actions explain unmet prerequisite.
- **Animations needed in-component:** 150ms decision/row transitions, no auto-count; ring-close belongs to stage verified cue, not generic product status.
- **Data bound:** v1.1 repair, suite, restricted scope, three independent outcomes, Marcus authorization, incident disposition.
- **Depends on:** SC28, CMP-16 Diff, CMP-06 StatusBadge, CMP-03 Button, SC26.
- **Build notes & pitfalls:** Do not invent case IDs or timestamps for watch outcomes. Expansion is not automatic. Closure does not erase incident records.
- **Done when:** Scope explicitly names supplier and team; three individual verified rows exist; expansion requires owner; closed label and history remain.
- **Effort:** L.

### SC30 — Version history, compare and restore
- **Purpose / what the viewer perceives:** Playbook and agent versions preserve distinct evaluation and release histories; restore affects future work only.
- **Priority:** P0 history, comparison and rollback affordance; P1 restore confirmation.
- **Appears in:** H-124 02:29–02:30; L-145–L-146 02:22–02:24.
- **Canvas & layout:** Version table/timeline `[264,160,992,400]`; compare two equal columns; restore action lower right, confirmation centered max 512px.
- **Visual spec:** 32px table rows or horizontal cards, warm hairlines, neutral status chips, GitCompareArrows and RotateCcw 16px.
- **Exact content:** `Version history`; `Playbook v1.0 · Approved for Guidance`; `Agent v0.1 · Candidate`; `Agent v0.2 · Candidate`; `Agent v1.0 · Released · Stage 3`; `Agent v1.1 · Repair`; `Compare`; `Restore previous approved version`; confirmation `Restore for future jobs only?`, `Prior business effects will not be undone.`, `Cancel`, `Restore`.
- **States & variants to build:** Timeline; v0.1/v0.2 comparison; v1.0/v1.1 diff; restore confirmation, cancel and authorized restore for future jobs.
- **Interactions & hotspots:** P(760,300) compare; P(1110,500) restore dialog; confirm only approved prior version and scope, Escape cancels.
- **Animations needed in-component:** 150ms compare swap/dialog fade; no loop.
- **Data bound:** `versions`, playbook v1.0, v0.1/v0.2 evaluations, v1.0 release, v1.1 repair.
- **Depends on:** CMP-07 Table, CMP-16 Diff, CMP-09 Dialog, CMP-03 Button.
- **Build notes & pitfalls:** Never suggest rollback reverses previously committed ERP transactions; failed v0.1 remains in history.
- **Done when:** Five version records distinguished; comparisons retain evidence; restore is future-only; cancel preserves current release.
- **Effort:** M.

### SC31 — Policy change and revalidation
- **Purpose / what the viewer perceives:** A changed threshold identifies affected downstream assets and requires revalidation rather than silent continuation.
- **Priority:** P0 policy diff and impact.
- **Appears in:** H-120–H-121 02:25–02:27; L-149–L-150 02:26–02:28.
- **Canvas & layout:** Main 992px content; before/after thresholds side by side, effective date beneath, impact rows then boundary-test action at P(1090,590).
- **Visual spec:** White card, 1px warm border, 16px mono threshold; warning triangles for affected categories, foreground labels.
- **Exact content:** `Invoice approval threshold`; `2.00% → 1.50%`; `effective Dec 1`; `1 playbook`; `1 agent`; `34 tests`; `Needs Revalidation`; `Review boundary tests`; `AP-RULE-009`.
- **States & variants to build:** Authorized change recorded; dependencies marked Needs Revalidation; proposed boundary tests; blocked release until required evaluation and approvals. Prior-policy continuation only with explicit bounded grant.
- **Interactions & hotspots:** P(1090,590) opens proposed boundary tests; dependency rows open affected playbook/agent; no auto-release.
- **Animations needed in-component:** 150ms selection; static warning state.
- **Data bound:** AP-RULE-009 new rule version, effective date, 1 playbook, 1 agent, 34 scenario suite.
- **Depends on:** CMP-16 Diff, CMP-06 StatusBadge, CMP-07 Table, SC15, SC20, SC30.
- **Build notes & pitfalls:** 34, not 33: repair adds six scenarios to 28. Old rule remains historical; do not invent retrospective outcomes.
- **Done when:** Both threshold values and effective date visible; three impact figures exact; Needs Revalidation shown; no automatic deployment.
- **Effort:** M.

### SC32 — Unsafe action block
- **Purpose / what the viewer perceives:** A draft 12% discount cannot be submitted until Daniel's Tier 3 authorization.
- **Priority:** P0 blocked panel and request action.
- **Appears in:** H-123 02:28–02:29; L-153–L-154 02:30–02:32.
- **Canvas & layout:** 768px card adjacent to Part C HubSpot deal pane; warning and approver above `Request approval` at P(910,540); z20 over context without covering amount.
- **Visual spec:** White 1px bordered card, 8px radius, 20px stop/shield glyph, foreground text; warning color on glyph only; no cyan or success check.
- **Exact content:** `12% discount`; `Requires Tier 3 approval - Daniel Okafor`; `Request approval`; `Action blocked until authorized`.
- **States & variants to build:** Draft blocked, request sent, awaiting approval, denied. No submission or financial effect before approval.
- **Interactions & hotspots:** P(910,540) sends request and changes to pending ST20; disabled submit explains authority gap; Enter activates focused request.
- **Animations needed in-component:** 150ms panel and label change; no loop.
- **Data bound:** draft discount 12%, Tier 3 policy, Daniel delegation and request status.
- **Depends on:** CMP-03 Button, CMP-06 StatusBadge, APP-HubSpot, SC35.
- **Build notes & pitfalls:** Do not imply requested approval is approved; underlying third-party deal is Part C.
- **Done when:** 12% visible; named approver and block reason present; request does not submit deal; no execution arc.
- **Effort:** S.

### SC33 — Command Center and 14-Day X-Ray
- **Purpose / what the viewer perceives:** Authorized operational snapshots and a privacy-preserving X-ray expose evidence quality and exceptions without fabricated productivity metrics.
- **Priority:** P0 Job snapshot, incident and 14-day frame.
- **Appears in:** H-125 02:30–02:31, H-132 02:37–02:38; L-155–L-156 02:32–02:34.
- **Canvas & layout:** Four white panels within `[264,112,992,560]`, 16px gutters; Job result cards aligned separately from incident panel; X-ray report replaces content inside same shell.
- **Visual spec:** 8px white cards, 1px warm rules, 20/28 section titles, 12/18 mono metrics; unknown hatch, contained warning glyph.
- **Exact content:** `Command Center`; `Verified outcomes`, `Exceptions`, `Incidents`, `Release state`; `JOB-0117`; snapshot `7 Verified Complete · 2 Escalated · 1 Approval Required · 1 Outcome Unknown`, later `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`; `1 contained incident`; `14-Day X-Ray`; `Scope`, `Evidence quality`, `Privacy`; `At least 5 participating enrolled employees required`.
- **States & variants to build:** Preapproval Job snapshot; postverification snapshot; one separate contained/repaired incident; X-ray scope/evidence-quality/privacy panel; eligibility unavailable below five enrolled participants.
- **Interactions & hotspots:** P(400,240) filters to Job; select X-ray tab; cards link to cases or incident only when authorized.
- **Animations needed in-component:** 150ms panel swap; no rolling numbers, timers or cyan.
- **Data bound:** JOB-0117 snapshot, INC-0042 separate population, 14-day scope, participation eligibility.
- **Depends on:** SC12-FRAME, CMP-06 StatusBadge, CMP-07 Table, SC25, SC26.
- **Build notes & pitfalls:** Do not combine period populations or invent employee counts, savings, ROI, success rates or rankings; five is an eligibility threshold, not a claimed actual count.
- **Done when:** Job count matches selected snapshot; incident separately labeled; X-ray has no fabricated metrics; privacy and scope visible.
- **Effort:** M.

### SC34 — Audit history and export confirmation
- **Purpose / what the viewer perceives:** Authorized reviewers can inspect immutable decisions and export a bounded audit pack without private raw media.
- **Priority:** P0 audit table and export surface; P1 confirmation and insufficient-authority state.
- **Appears in:** H-126 02:31–02:32; L-157 02:34–02:35.
- **Canvas & layout:** Header and export at `[1040,112,216,48]`; table `[264,176,992,440]`, 32px rows; export drawer `[800,0,480,720]`; confirmation centered 512px.
- **Visual spec:** White table, thin separators, right drawer shadow-lg, 16px FileClock and Download; dialog scrim 80% ink.
- **Exact content:** `Audit & Export`; `Immutable change history`; headers `Actor`, `Event`, `Object`, `Scope`, `Outcome`; rows `Marcus Webb | Owner review | PB-AP-RECON v1.0 | AP East | Approved for Guidance`; `Daniel Okafor | Approval | INV-48219 | Tier 3 | Approved`; `Marcus Webb | Limited release | Supplier Invoice Reconciler v1.1 | Kestrel Components · AP East | Released`; `Marcus Webb | Incident closure | INC-0042 | AP East | Repaired - Validated`; `Export audit pack`; `Export authorized records only?`; `Raw private media is not included.`; `Cancel`; `Export`.
- **States & variants to build:** History list; export drawer scope preview; confirmation; export complete; insufficient authority with reason and no export.
- **Interactions & hotspots:** P(1110,136) opens export; choose authorized scope; confirmation requires explicit Export; Escape cancels and returns focus.
- **Animations needed in-component:** Drawer and confirmation 150ms; no fake download-progress loop.
- **Data bound:** Approved audit event records, actor, object, outcome, permitted export scope.
- **Depends on:** CMP-07 Table, CMP-09 Drawer, CMP-09 Dialog, CMP-03 Button, SC23, SC29.
- **Build notes & pitfalls:** No fabricated event timestamps; export excludes raw private media and respects access. UI completion describes pack generation, not external delivery.
- **Done when:** Table has five distinct fields; decision and release records are separate; export scope visible; no raw media included; unauthorized export disabled with reason.
- **Effort:** M.

### SC35 — Notifications and one-at-a-time toast states
- **Purpose / what the viewer perceives:** A priority-ordered inbox presents an approval, contained incident and contextual reminder without treating dismissal as resolution.
- **Priority:** P0 notification center and three toast content variants; P1 filters and expanded item keyboard path.
- **Appears in:** H-127 02:32–02:33; L-158 02:35–02:36; SC04 reminder H-069, L-056.
- **Canvas & layout:** Full center filters `[264,112,220,560]`, cards `[508,112,724,560]`; bell drawer may descend from upper right; toast `[896,72,360,88]`, z60; one expanded card at a time.
- **Visual spec:** 360×92px notification cards, 12px padding, 8px radius, 16px type icon; toast shadow-md; warning/person, stop-square and clock shapes differentiate without color alone.
- **Exact content:** `Notifications`; `All`, `Approvals`, `Incidents`, `Reminders`; `Approval Required`, `INV-48219`, `Review approval`; `INC-0042 Contained`, `3 affected cases paused`, `View incident`; `Confirm Kestrel handling-fee terms in writing`, `Fri 12:00`, `View commitment`; `Dismiss`.
- **Additional notification variants:** `Repair Ready` links Marcus to REP-0042-1 only after regression passes; `Release Status` links Marcus to the v1.1 limited cohort only after authorization. These complete the fixture inbox; neither may appear before its triggering event.
- **States & variants to build:** Three list rows; one expanded; approval toast, incident toast, reminder toast, each separately queued; dismissed versus resolved; critical approval remains until acted on or explicitly dismissed.
- **Interactions & hotspots:** P(740,220) opens SC23; incident opens SC26; reminder opens SC11; filters restrict visible rows; dismissal hides notice but preserves underlying object.
- **Animations needed in-component:** Toast translateY −12→0 and opacity over 150ms, standard easing; deterministic priority queue; no auto-dismiss for critical action; reduced motion immediate.
- **Data bound:** ST24, INV-48219 approval, INC-0042, Priya's confirmed commitment.
- **Depends on:** CMP-35 NotificationCard, CMP-11 Toast, CMP-03 Button, SC11, SC23, SC26.
- **Build notes & pitfalls:** At most one toast surfaced at a time. SC04 HUD reminder is contextual and is not an additional simultaneous notification.
- **Done when:** Three exact message types are distinct; one toast shown; actions open the correct object; dismiss does not decide approval or close incident.
- **Effort:** M.

### SC36 — Application capability matrix and detail
- **Purpose / what the viewer perceives:** Application capability is explicitly bounded per operation; a brand mark is not evidence of support or authorization.
- **Priority:** P0 matrix, per-meeting condition and unavailable cells; P1 detail popover.
- **Appears in:** H-129–H-131 02:34–02:37, H-139 02:44–02:45; L-159–L-160 02:36–02:38.
- **Canvas & layout:** Seven application rows and five capability columns, cells at least 80px, within `[264,112,992,560]`; additional gray-only marks form a separate strip; detail popover 320px anchored to cell.
- **Visual spec:** White tiles, 1px hairlines, 12px mono labels; 16px small nominative marks; supported uses check plus `Available`, unsupported `— Unavailable`; no ambiguous grey-only state.
- **Exact content:** Column labels `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`. Rows: `Gmail` Available Observe/Guide/Assist, all other cells `— Unavailable`; `NetSuite` Available Observe/Guide/Run Supervised, remaining unavailable; `Google Sheets` Available Observe/Guide/Run Supervised, remaining unavailable; `Slack` Available Observe/Guide, remaining unavailable; `Zoom` `Observe by per-meeting opt-in`, Guide Available, remaining unavailable; `HubSpot` Available Observe/Guide/Assist, remaining unavailable; `Chrome` Available Observe/Guide, remaining unavailable. Separate gray-only marks: `Salesforce`, `Outlook`, `Excel`, `Teams`, `Meet`, `Edge` with no asserted capability. `Supported application validation`.
- **States & variants to build:** Default matrix; selected available cell and detail; unavailable cell with reason, not enabled; Zoom consent condition; cropped tiles view; gray-only marks separate from capability assertions.
- **Interactions & hotspots:** P(420,214) opens an available capability detail; unavailable cells expose explanatory text but cannot execute. Arrow and Tab navigation work, Escape closes popover.
- **Animations needed in-component:** Popover 150ms standard, no idle loop or cyan.
- **Data bound:** Seven-row capability matrix and exact per-app availability; Zoom per-meeting consent.
- **Depends on:** CMP-07 Table, CMP-10 Popover, CMP-10 Tooltip, Part C nominative marks.
- **Build notes & pitfalls:** Matrix conveys capability, not organization-specific permission or general guarantees. Grey-only marks do not inherit seven-row capabilities.
- **Done when:** Five exact headings and seven rows visible; all 35 intersections explicit; Zoom conditional; six extra marks have no implied availability.
- **Effort:** L.

## Checklist

| ID | Name | Priority | Effort | Depends on | Appears in (entry IDs, first and last) | Done [ ] |
|---|---|---|---|---|---|---|
| SC12-FRAME | Shared shell | P0 | M | CMP-11 CommandPalette, SC35 | H-056–H-132; L-035–L-160 | [ ] |
| SC01 | Desktop companion | P0 | M | CMP-10 Popover, SC03 | H-062; L-038–L-044 | [ ] |
| SC02 | Enrollment | P0 | L | CMP-08 Stepper, SC03 | H-055–H-059; L-035–L-036 | [ ] |
| SC03 | My Privacy | P0 | L | CMP-09 Dialog, SC01 | H-060–H-061; L-037–L-042 | [ ] |
| SC04 | HUD and guide | P0 | M | CMP-36 HUDCard, APP-NetSuite | H-069–H-122; L-056–L-152 | [ ] |
| SC11 | Meeting review | P0 | M | CMP-15 Timeline, APP-Zoom | H-067–H-068; L-053–L-055 | [ ] |
| SC12 | Home | P1 | S | SC12-FRAME | Not independently shown | [ ] |
| SC13 | Discovery inbox | P0 | M | CMP-07 Table, SC14 | H-070; L-058 | [ ] |
| SC14 | Candidate and evidence | P0 | L | CMP-09 Drawer, SC13 | H-071–H-074; L-059–L-073 | [ ] |
| SC15 | Playbook | P0 | L | SC14, CMP-06 StatusBadge | H-075–H-076; L-062–L-074 | [ ] |
| SC16 | Operations Map | P0 | L | CMP-41 GraphNode, CMP-07 Table | H-117–H-119; L-148 | [ ] |
| SC17 | Agent Factory | P0 | M | SC15, CMP-04 Input | H-077–H-079; L-075–L-081 | [ ] |
| SC18 | Scope and gates | P0 | L | CMP-23 GateChecklist, SC20 | H-080–H-091; L-082–L-107 | [ ] |
| SC19 | Flight Simulator | P0 | L | CMP-17 ScenarioGrid | H-084–H-089; L-091–L-102 | [ ] |
| SC20 | Evaluation results | P0 | L | SC19, CMP-16 Diff | H-085–H-090; L-094–L-104 | [ ] |
| SC21 | Queue and confirmation | P0 | M | CMP-09 Dialog, SC22 | H-092; L-108–L-109 | [ ] |
| SC22 | Job progress and cases | P0 | L | CMP-19 CaseTable, SC23 | H-093–H-095; L-110–L-114 | [ ] |
| SC23 | Approval drawer | P0 | M | CMP-09 Drawer, CMP-16 Diff | H-098–H-100; L-114–L-118 | [ ] |
| SC24 | Unknown evidence drawer | P0 | M | CMP-09 Drawer, SC22 | H-097–H-140; L-119–L-121 | [ ] |
| SC25 | Job summary | P0 | M | SC22–SC24 | H-096–H-136; L-122–L-123 | [ ] |
| SC26 | Incident Center | P0 | L | CMP-07 Table, SC27 | H-104–H-106; L-127–L-131 | [ ] |
| SC27 | Teach correction | P0 | M | SC26, CMP-09 Dialog | H-107–H-109; L-132–L-134 | [ ] |
| SC28 | Repair and regression | P0 | L | CMP-16 Diff, SC27 | H-110–H-113; L-135–L-138 | [ ] |
| SC29 | Release and closure | P0 | L | SC28, CMP-06 StatusBadge | H-114–H-141; L-139–L-144 | [ ] |
| SC30 | Version history | P0 | M | CMP-16 Diff, CMP-09 Dialog | H-124; L-145–L-146 | [ ] |
| SC31 | Policy revalidation | P0 | M | CMP-16 Diff, SC30 | H-120–H-121; L-149–L-150 | [ ] |
| SC32 | Unsafe action block | P0 | S | APP-HubSpot, SC35 | H-123; L-153–L-154 | [ ] |
| SC33 | Command Center and X-ray | P0 | M | SC25, SC26 | H-125–H-132; L-155–L-156 | [ ] |
| SC34 | Audit and export | P0 | M | CMP-09 Drawer, CMP-09 Dialog | H-126; L-157 | [ ] |
| SC35 | Notifications | P0 | M | CMP-11 Toast, SC23 | H-127; L-158 | [ ] |
| SC36 | Adapter matrix | P0 | L | CMP-07 Table, CMP-10 Popover | H-129–H-139; L-159–L-160 | [ ] |

## Coverage notes and source conflicts

- The shared contract explicitly fixes repair at 34 scenarios, 28 ordinary passes and six safe-escalation passes. The older story bible references 33 tests in its breadth section and 33-scenario regression in its launch outline; ignore those superseded totals. The design specification SC28 and SC31, H-112–H-113 and H-121 agree on 34.
- H-096 uses `Completed with exceptions`, but design specification §6.2 line 380 reserves that label until unresolved cases have terminal handling. Use `Partially Complete` for both shown snapshots because INV-48220 is still held; adjust the storyboard overlay.
- H-082 visually mentions checks before the evaluation finishes, whereas SC18 and L-105 require actual evidence. Render the observed-example check only, with evaluation and owner approval pending until their events; H-091 shows the satisfied gate.
- H-114 specifies a return to light after the contained dark incident; L-144 describes a dark closure. Treat light/dark as cut-specific render states, not a second user-operated theme flip.
- The source design specifies navigation dimensions but not an exhaustive nav label/icon inventory; SC12-FRAME resolves those labels to the named product screens for a consistent build. This is a design choice, not an asserted existing implementation.
- H-075 describes a success hue on `Approved for Guidance`, while design-language §3.4 specifies a neutral outlined shield/check. Use the canonical neutral badge and preserve the exact text.
- The design catalogue specifies 4×7 scenario tiles of 96×52 within 472×416, while 8px gaps imply a narrower grid than the containing region; center the 408×412 actual tile-and-gap grid in that allocated area rather than stretching tile sizes.


---

# Part B — Components, data, and state

This part specifies reusable product-layer building blocks, canonical fixture data, and the deterministic state/runtime contracts. Product screens belong to Part A; third-party views and film graphics belong to Part C. Build in this order: tokens and fonts → accessible primitives → status/evidence/data fixtures → shared domain composites → guarded reducer/selectors → film-time sampling → screen composition. A single reusable component can appear on many screens; coordinates below are representative authored locations, not absolute positioning requirements for every instance.

## Shared component contract

All coordinates use a 1280×720 authored canvas. Product shell content starts at x=240; the default content region is `[264,112,992,584]`. A component's own dimensions below are `[x,y,w,h]` in its example host; use normal layout within it. Product z-order: content 0, sticky headers 10, popovers/tooltips 20, HUD 30, backdrop 40, dialogs/drawers 50, toast 60. The film's cursor/captions are outside this part. Every component uses foreground text, warm 1px border, no hard stage shadow, 4px nested / 6px control / 8px card radii. Body is Space Grotesk 14/20 400; headers Space Grotesk 16/22 500, section 20/28 700; data IBM Plex Mono 12/18 500, micro minimum 11/16 500. Human explanation uses Crimson Text 16/24 400. Lucide icons are 14px rows, 16px controls, 20px notices, 1.75px stroke. Controls have 2px foreground focus outline, 2px offset, visible text names and a 44px hit target for icon-only buttons. Contrast and shape must carry meaning without color.

Unless a component overrides this contract, hover/focus is 150ms `cubic-bezier(.4,0,.2,1)`, no loop, no stagger; reduced motion switches immediately to the final static state. Film interpolation is frame-derived, never a CSS infinite animation. Hover and focus never change business state. Escape closes a focused floating surface and restores focus; Tab/Shift+Tab traverse controls. Screen-specific copy and exact enclosing coordinates bind from Part A and the fixture items below. No cyan outside active execution; no clocks, random values or network fetches in capture. `P0` means visible in either cut, including a reusable primitive embedded in another surface; `P1` means interactive completeness only.

## Foundation

### CMP-01 — Design tokens and global CSS
- **Purpose / what the viewer perceives:** One coherent neutral product system with truthful state signals in both themes.
- **Priority:** P0.
- **Appears in:** Hackathon H-055–H-132 (01:20–02:38); Launch L-035–L-160 (00:32–02:38).
- **Canvas & layout:** Root `[0,0,1280,720]`; product content is flat. Dot grid is stage-only, not a product-card texture.
- **Visual spec:** Light: background `#F6F6F3`, foreground `#0A0A0A`, surface `#FFFFFF`, surface-2 `#EFEFEB`, border `#DFDFD8`, muted `#666666`, trace `#77776E`, signal `#333333`. Dark: `#0A0A0A`, `#F5F5F5`, `#141414`, `#212121`, `#333333`, `#A3A3A3`, `#93938A`, `#B8B8B8`. Arc `#2FD8FF`, arc ink `#050505`, arc mark `#0B7D8E` on bone; use arc only for active execution. Success `#15803D`/dark `#79D69A`; warning `#DB7806`/`#F7BE78`; danger `#DC2828`/`#FF9191`. HSL counterparts and exact typography are in design spec §3.1–3.2. Radius 0/4/6/8; floating shadows sm `0 1px 2px -1px rgba(0,0,0,.08)`, md `0 4px 10px -2px rgba(0,0,0,.10)`, lg `0 10px 24px -6px rgba(0,0,0,.14)`; dark alphas .24/.28/.34.
- **Exact content:** CSS utilities: stage-only dot grid `radial-gradient(circle,rgba(10,10,10,.12) 1px,transparent 1px)` at `24px 24px`; unknown hatch `repeating-linear-gradient(45deg, …)` with 1px neutral strokes every 6px. Selection stays enabled and uses a legible neutral foreground/background pair; scrollbars hide visually while remaining scrollable. Focus ring is 2px solid foreground with 2px offset.
- **States & variants to build:** Light default; dark incident state ST12–ST14; screen-selected dark or light elsewhere as specified. Unknown hatch reverses luminance in dark. Theme switch suppresses color transitions.
- **Interactions & hotspots:** None directly; `:focus-visible` applies to every keyboard control. Respect reduced motion and `forced-colors`.
- **Animations needed in-component:** None; theme is set at an explicit film frame, not an uncontrolled transition.
- **Data bound:** Theme and running status from RT-01.
- **Depends on:** CMP-02.
- **Build notes & pitfalls:** Define semantic CSS custom properties and Tailwind 3.4 extension mappings; named bone/border/arc hex values take precedence over rounded HSL conversions. No copied competitor CSS or lime. Never hatch the text itself.
- **Done when:** Both themes preserve legible foreground; arc disappears on stop; hatch is independently identifiable; focus is visible; scroll remains possible.
- **Effort:** M.

### CMP-02 — Font loading and type scale
- **Purpose / what the viewer perceives:** Consistent product hierarchy and stable text layout in every capture.
- **Priority:** P0.
- **Appears in:** H-055–H-141 (01:20–02:47); L-035–L-160 (00:32–02:38).
- **Canvas & layout:** Global font metrics affect all `[0,0,1280,720]`; preserve 4/8/12/16/24/32/48/64 spacing rhythm.
- **Visual spec:** Self-host WOFF2 IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700, Crimson Text 400/600/700 (ten faces; 700 is a real face per decision 7); retain OFL notices. Product title 28/34, section 20/28, card 16/22, body 14/20, human prose 16/24, data 12/18, micro 11/16. Use tabular numbers for money and counters.
- **Exact content:** `font-display: swap` interactively; preload each actual face, then await `document.fonts.ready` and check faces before capture. Native fallback remains legible.
- **States & variants to build:** Loading, loaded, unavailable; unavailable font blocks capture with explicit diagnostic rather than shifting text mid-shot.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** None.
- **Data bound:** None.
- **Depends on:** CMP-01.
- **Build notes & pitfalls:** Avoid synthesized weights; capture must use exactly the bundled font bytes. Long labels wrap, or truncate with an accessible full value.
- **Done when:** All ten faces load; no UI font is below 11px; decimal columns align; no text shifts during frame seeking.
- **Effort:** S.

## Accessible primitives

### CMP-03 — Button
- **Purpose / what the viewer perceives:** Consistent primary and secondary actions with explicit authority and disabled explanations.
- **Priority:** P0.
- **Appears in:** H-058–H-123 (01:23–02:29); L-035–L-153 (00:32–02:31).
- **Canvas & layout:** Default 40px high, 16px horizontal padding; small 32/12, large 44/24, icon 40 with 44px hit area. Example `Approve` at `[1020,645,160,40]`.
- **Visual spec:** Mono 12/18 500; 6px radius; 16px icon; primary ink/bone, outline neutral, ghost transparent, danger icon plus text; no cyan fill.
- **Exact content:** `Accept and continue`, `Pause`, `Confirm`, `Publish`, `Run scenarios`, `Approve`, `Reject`, `Request Changes`, `Guide Me`, `Request approval`, `Export audit pack`.
- **States & variants to build:** primary/secondary/outline/ghost/danger/link; default/hover/focus/pressed/disabled/loading. Loading ring replaces icon without shifting width; running arc only when actually executing.
- **Interactions & hotspots:** Native button Enter/Space dispatches its caller's guarded action; disabled explanation remains accessible.
- **Animations needed in-component:** Shared 150ms transition; scripted 90ms press to .97 only for film click, reduced motion static.
- **Data bound:** RT-01 guards and contextual labels.
- **Depends on:** CMP-01–02, CMP-08.
- **Build notes & pitfalls:** CVA variants; no duplicate business logic in the button. Disabled action must name the missing prerequisite.
- **Done when:** All sizes align; keyboard works; disabled reason is reachable; loading never implies success.
- **Effort:** S.

### CMP-04 — Input and textarea
- **Purpose / what the viewer perceives:** Editable intent, search, deadlines and corrections with clear errors.
- **Priority:** P0.
- **Appears in:** H-067–H-079 (01:32–01:45); L-053–L-079 (00:50–01:17).
- **Canvas & layout:** Input 40px or dense 32px; textarea `[304,160,880,72]`; 12px inset, label gap 4px, hint gap 4px.
- **Visual spec:** White/dark surface, 1px border, 6px radius; mono 12/18, placeholder muted, 2px focus ring; textarea resizes only in interactive mode.
- **Exact content:** Intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`; deadline `Fri 17:00` → `Fri 12:00`; search placeholder `Type a command…`.
- **States & variants to build:** empty, focused, filled, readonly, invalid, disabled; error text linked with `aria-describedby`.
- **Interactions & hotspots:** Click or Tab focuses; type edits; Escape closes enclosing palette, not ordinary field; no submission before guard.
- **Animations needed in-component:** Border/focus 150ms; film typing is RT-03 sampled 28–34 chars/s with deterministic jitter.
- **Data bound:** DAT-04, DAT-08, RT-01.
- **Depends on:** CMP-01–02.
- **Build notes & pitfalls:** Preserve authored intent exactly; distinguish draft from confirmed commitment.
- **Done when:** Text fits without clipping; labels are associated; invalid state has text; film seek yields identical characters.
- **Effort:** S.

### CMP-05 — Select and tabs
- **Purpose / what the viewer perceives:** Labeled choices and fast navigation between related panels.
- **Priority:** P0.
- **Appears in:** H-056–H-060, H-080–H-082 (01:21–01:26, 01:45–01:48); L-035–L-037, L-082–L-089 (00:32–00:35, 01:19–01:27).
- **Canvas & layout:** Select 40px trigger with 32px menu rows and 16px chevron; tabs 40px bar with 24px gaps and 2px underline.
- **Visual spec:** 6px controls, 8px popover, md shadow, neutral selected indicator; text mono 12/18 and foreground.
- **Exact content:** Role choices `Employee`, `Workflow Owner`, `Approver`, `Admin`; app capability labels `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`.
- **States & variants to build:** Default, open, selected, focus, disabled, invalid; tabs underline or segmented. Role selection does not confer authority.
- **Interactions & hotspots:** Arrow keys, Home/End, Enter, typeahead, Escape; disabled choices expose reason. Radix Select groups options; TabsTrigger is inside TabsList.
- **Animations needed in-component:** 150ms opacity and background, no stagger or loop.
- **Data bound:** DAT-01, DAT-12, RT-02.
- **Depends on:** CMP-01–02, CMP-11.
- **Build notes & pitfalls:** Keep selected role and scoped delegation separate. Do not treat per-meeting opt-in as a blanket Zoom grant.
- **Done when:** Selection is keyboard-operable; labels survive dark theme; invalid/disabled explanations are visible; tab selection does not trigger execution.
- **Effort:** S.

### CMP-06 — Badge and status badge
- **Purpose / what the viewer perceives:** Plain metadata chips stay distinct from semantically meaningful status indicators.
- **Priority:** P0.
- **Appears in:** H-071–H-132 (01:36–02:38); L-058–L-160 (00:55–02:38).
- **Canvas & layout:** 24px high, horizontal padding 8px, glyph 12px, 4px gap; width fits exact label, no forced truncation on camera.
- **Visual spec:** Neutral or outline ordinary badge; status glyphs: `Approved for Guidance` outlined shield/check neutral; `Verified Complete` check-in-circle success; `Outcome Unknown` hatched square neutral; `Passed` check success; `Passed — Expected Safe Escalation` bent arrow-in-circle success; `Failed` X-in-diamond danger; `Needs Revalidation` triangle/exclamation warning; `Contained` square/stop warning; `Approval Required` diamond/person warning; `Escalated` arrow/person warning; `Held` pause bars in hatched square; `Running` node on ring cyan only during active execution. All label text foreground.
- **Exact content:** The twelve labels above exactly; also neutral textual `Suggested`, `Needs Review`, `Unverified`, `Not Run`, `Partially complete`, `Repaired - Validated` where needed.
- **States & variants to build:** All named statuses in light and dark; running → completed must remove cyan immediately; unknown retains both hatch and words.
- **Interactions & hotspots:** Noninteractive by default; if wrapped by a button, button owns semantics and focus.
- **Animations needed in-component:** Running node completes 1.8s linear orbit derived from RT-03 time; freeze neutral on stop, static under reduced motion. No other badge loops.
- **Data bound:** DAT-05–DAT-12, RT-01 selectors.
- **Depends on:** CMP-01–02.
- **Build notes & pitfalls:** Safe escalation is a passed expected outcome, not a failure; approved guidance is not agent deployment. Unknown never uses check or retry.
- **Done when:** Every state has distinct glyph and text; both themes work; unknown has hatch; running cyan is absent after stopping.
- **Effort:** M.

### CMP-07 — Dense table
- **Purpose / what the viewer perceives:** Stable, readable business records and audit rows.
- **Priority:** P0.
- **Appears in:** H-093–H-100, H-124–H-127 (01:58–02:06, 02:29–02:33); L-108–L-123, L-145–L-160 (01:45–02:01, 02:22–02:38).
- **Canvas & layout:** Header 32px, row 32px or comfortable 40px, cell horizontal padding 12px; example `[264,220,992,452]`; numeric cells right-aligned.
- **Visual spec:** Hairline separators, transparent rows, 2px inset signal rail on selected row; mono 12/18 tabular numbers and 14px icons.
- **Exact content:** Case columns `Invoice`, `Supplier`, `Amount`, `PO`, `Status`, `Action`; audit columns `Actor`, `Event`, `Object`, `Scope`, `Outcome`. Rows are DAT-02 and DAT-11.
- **States & variants to build:** Default, selected, hover, loading, empty, error, unauthorized; each empty/error includes a reason and recovery action.
- **Interactions & hotspots:** Header sort buttons expose direction; row click opens corresponding authorized detail; keyboard Tab/Enter; visible row details do not imply approval.
- **Animations needed in-component:** Row hover background ≤150ms; no layout animation, no loop.
- **Data bound:** DAT-02, DAT-11, RT-01.
- **Depends on:** CMP-01–03, CMP-06.
- **Build notes & pitfalls:** Use native table semantics, fixed widths and pinned filmed rows; virtualize only when not disturbing framing.
- **Done when:** Eleven rows display correct record identities; headers associate cells; amounts align; selection does not alter outcomes.
- **Effort:** M.

### CMP-08 — Orbit loader and product lifecycle stepper
- **Purpose / what the viewer perceives:** Product progress communicates current phase, without promising an outcome.
- **Priority:** P0.
- **Appears in:** H-084–H-090 (01:49–01:56); L-059–L-063, L-092–L-103 (00:56–01:01, 01:29–01:41).
- **Canvas & layout:** Loader 24×24; lifecycle nodes 18px with 1px edges, arranged horizontally, vertically, or in an orbit inside host.
- **Visual spec:** Three 1.5-unit concentric rings at radii 18/31/44 on a 100-unit viewBox; a 4-unit node on the middle ring; foreground and trace unless executing.
- **Exact content:** `Observe`, `Understand`, `Review`, `Publish`, `Compile`, `Simulate`, `Authorize`, `Execute`, `Verify`, `Diagnose`, `Correct`, `Repair`, `Re-evaluate`, `Release`.
- **States & variants to build:** Past, current idle, currently executing, future; only executing node cyan. Product ring is separate from Part C's stage graphic.
- **Interactions & hotspots:** Informational steps are not buttons; navigable steps expose labels and keyboard focus.
- **Animations needed in-component:** Running orbit 1.8s linear from film time; stop freezes neutral; reduced motion is static.
- **Data bound:** RT-01 state and RT-03 local frame.
- **Depends on:** CMP-01, CMP-06.
- **Build notes & pitfalls:** `Publish` is guidance; `Release` is a separate authorization. Never use orbit animation to indicate inferred success.
- **Done when:** All 14 labels exist; running is clearly marked; stopped is neutral; static mode remains comprehensible.
- **Effort:** M.

### CMP-09 — Drawer and dialog
- **Purpose / what the viewer perceives:** Focused review of evidence or a consequential decision without losing context.
- **Priority:** P0.
- **Appears in:** H-074, H-086, H-097–H-101 (01:39–01:40, 01:51–01:52, 02:02–02:07); L-095–L-099, L-115–L-120 (01:32–01:37, 01:52–01:58).
- **Canvas & layout:** Right drawer `[800,0,480,720]`, sticky 64px footer; dialog centered max 512px, 24px padding; backdrop z40, panel z50.
- **Visual spec:** 8px radius where applicable, 1px border, lg floating shadow, black 80% scrim; heading 18/24; 16px close icon.
- **Exact content:** `INV-48219`, `Approve`, `Reject`, `Request Changes`; unknown: `INV-48220`, `Outcome Unknown`, `ERP submit timed out`, `Held`, `Do not resubmit until reconciled`.
- **States & variants to build:** Approval/evidence drawer; confirm/destructive/information dialog; closed/open/focused/blocked. Unknown case never shows a retry.
- **Interactions & hotspots:** P(1100,665) approval subject to RT-02 authority; close/Escape returns focus; trap focus and contain overscroll.
- **Animations needed in-component:** 150ms opacity fade; optional drawer slide is driven by explicit frame; reduced motion opacity only or immediate.
- **Data bound:** DAT-02, DAT-10; RT-01/02.
- **Depends on:** CMP-03, CMP-06, CMP-18, CMP-31.
- **Build notes & pitfalls:** Use Radix Dialog title and accessible description; approval, submission, readback remain distinct events.
- **Done when:** Focus is trapped and restored; full diff and authority fit; unknown lacks retry; approval alone does not increment verified.
- **Effort:** M.

### CMP-10 — Popover and tooltip
- **Purpose / what the viewer perceives:** Small contextual choices and explanations adjacent to their trigger.
- **Priority:** P0.
- **Appears in:** H-060–H-062, H-083 (01:25–01:28, 01:48–01:49); L-037–L-038, L-086–L-089 (00:34–00:36, 01:23–01:27).
- **Canvas & layout:** Popover 320px wide, 12px padding, 8px anchor offset; tooltip fits content with 8px padding and avoids viewport clipping.
- **Visual spec:** Surface, 1px border, 8px popover radius/md shadow; tooltip ink fill, contrasting 11/16 mono, 4px radius.
- **Exact content:** `3 observed this week + 2 SME-verified archived cases`; `Pause observation`; `My Privacy`.
- **States & variants to build:** Closed/open/keyboard-focused/disabled; tooltip opens after 400ms or focus.
- **Interactions & hotspots:** Click trigger opens popover; Escape closes and restores focus. Tooltip is supplemental, not sole accessible name.
- **Animations needed in-component:** 150ms opacity, no scale loop.
- **Data bound:** DAT-04; RT-01 observation and gate selectors.
- **Depends on:** CMP-01–03.
- **Build notes & pitfalls:** Radix collision positioning; no popover may expose excluded private content.
- **Done when:** Anchors stay visible; Escape returns focus; tooltip has text equivalent; gate provenance totals five.
- **Effort:** S.

### CMP-11 — Toast and command palette
- **Purpose / what the viewer perceives:** One prioritized attention surface and a keyboard-accessible authorized search.
- **Priority:** P0; command palette opening is P1 clickable completeness.
- **Appears in:** H-127 (02:32–02:33); L-016, L-158 (00:13.50–00:14, 02:35–02:36).
- **Canvas & layout:** Toast `[896,72,360,88]`; palette centered `[320,120,640,480]`, 48px search row and 32px results.
- **Visual spec:** 8px radius, md/lg floating shadow, 1px border; icon 16px; foreground text with status glyph.
- **Exact content:** Toast `Submission timed out`; palette placeholder `Type a command…`, empty `No matching commands`.
- **States & variants to build:** Info/warning/danger/success; one toast visible, critical notice persists. Palette closed/open/results/empty/unauthorized filtered.
- **Interactions & hotspots:** `⌘K` opens; arrows navigate; Enter activates authorized result; Escape closes; toast action navigates without resolving object.
- **Animations needed in-component:** Toast enters y−12→0 over 150ms; reduced motion static. Palette 150ms fade.
- **Data bound:** DAT-10, DAT-13; RT-02 permissions.
- **Depends on:** CMP-03–04, CMP-06, CMP-09.
- **Build notes & pitfalls:** Radix Dialog + command list; prioritize one toast and queue others, never show raw private evidence in search.
- **Done when:** No toast stack appears; timeout is not a success; search honors permissions; keyboard closes and returns focus.
- **Effort:** M.

### CMP-12 — Breadcrumb, keycap, separator and avatar
- **Purpose / what the viewer perceives:** Compact navigation context, keyboard hints, structure and identity.
- **Priority:** P0; keycaps are P1 palette completeness.
- **Appears in:** H-055–H-132 (01:20–02:38); L-035–L-160 (00:32–02:38).
- **Canvas & layout:** Breadcrumb `[264,72,700,28]`; keycap height 22px and 6px horizontal padding; avatar 32px; separator 1px.
- **Visual spec:** Breadcrumb mono 12/18, slash separators; keycap 4px radius and 11/16 mono; avatar neutral circle with initials; separators hairline.
- **Exact content:** `Calder & Vance`; `Employee`; `Workflow Owner`; `Approver`; `Admin`; `⌘K`; `Esc`.
- **States & variants to build:** Current breadcrumb is `aria-current` and not self-linked; avatar has initials fallback; inactive separator is decorative.
- **Interactions & hotspots:** Ancestor breadcrumb navigates via Enter; keycaps are explanatory, not controls.
- **Animations needed in-component:** None beyond shared navigation hover.
- **Data bound:** DAT-01, RT-01/02.
- **Depends on:** CMP-01–02.
- **Build notes & pitfalls:** Breadcrumb must not become another role switch; include AvatarFallback and semantic `<kbd>`.
- **Done when:** Current page is announced; missing avatar image shows initials; separator stays 1px; keyboard hints are legible.
- **Effort:** S.

### CMP-13 — Switch and checkbox
- **Purpose / what the viewer perceives:** Deliberate consent and independent settings choices.
- **Priority:** P0.
- **Appears in:** H-057–H-060 (01:22–01:26); L-035–L-038 (00:32–00:36).
- **Canvas & layout:** 32px list rows, checkbox 16×16 inside ≥44px click region; switch 36×20 with separate label.
- **Visual spec:** Foreground check/toggle, neutral surface and hairline; focus outline 2px; no cyan as generic enabled fill.
- **Exact content:** `Work applications`, `Excluded windows`, `Visual observation`, `Organizational contribution`, `Pause observation`.
- **States & variants to build:** Unchecked, checked, disabled with mandatory-exclusion reason, focus; switches distinguish paused and permitted observation.
- **Interactions & hotspots:** Space toggles a permitted control; separate notice and scope selection precede consent; mandatory exclusions cannot be disabled.
- **Animations needed in-component:** Switch thumb transform 150ms; reduced motion immediate.
- **Data bound:** DAT-13, RT-01 consent fields.
- **Depends on:** CMP-01–02.
- **Build notes & pitfalls:** A capture category, sharing permission and meeting consent are distinct values.
- **Done when:** Unchecked enrollment cannot begin capture; mandatory exclusions remain enabled; each toggle has a label; pause is one action.
- **Effort:** S.

### CMP-14 — Progress, skeleton and scroll area
- **Purpose / what the viewer perceives:** Bounded progress, provisional loading, and usable overflow without layout movement.
- **Priority:** P0 for progress; skeleton and scroll area P1 completeness.
- **Appears in:** H-084, H-089, H-093, H-112 (01:49–01:50, 01:54–01:55, 01:58–01:59, 02:17–02:18); L-092–L-093, L-102, L-136–L-137 (01:29–01:31, 01:39–01:40, 02:13–02:15).
- **Canvas & layout:** Progress 8px high with 4px radius; skeleton takes final content geometry; scroll region fills its parent, e.g. drawer body `[800,72,480,584]`.
- **Visual spec:** Neutral track; arc cyan only during execution; skeleton surface-2; hidden scrollbar without hiding overflow.
- **Exact content:** `SIM-AP-RECON · 28 scenarios`, `Running`, `Not Run`; result totals are supplied by DAT-05.
- **States & variants to build:** Not started, executing, complete, cancelled/incomplete; unknown count stays distinct. Loading skeleton is neutral.
- **Interactions & hotspots:** Scroll with wheel, touch or keyboard; screen reader receives progress value and label. Cancelled rows remain `Not Run`.
- **Animations needed in-component:** Value is sampled from explicit timeline events, not wall-clock timers; skeleton is static in film and reduced motion.
- **Data bound:** DAT-05, RT-01, RT-03.
- **Depends on:** CMP-01, CMP-06.
- **Build notes & pitfalls:** A complete progress bar is not business verification. Contain overlay overscroll.
- **Done when:** Progress is repeatable on seek; cancellation never renders a pass; scrolling works with hidden bars; arc disappears on completion.
- **Effort:** S.

## Domain composites

### CMP-15 — Timeline
- **Purpose / what the viewer perceives:** Ordered observation, decision and release history with attributable evidence.
- **Priority:** P0.
- **Appears in:** H-124–H-126 (02:29–02:32); L-145, L-157 (02:22–02:23, 02:34–02:35).
- **Canvas & layout:** Example `[264,160,992,320]`; 2px vertical line, 8px nodes, 16px between events, or horizontal version row.
- **Visual spec:** Trace line, neutral nodes, mono 12/18 timestamp/actor, Space Grotesk body; selected node outlined.
- **Exact content:** Audit sequence A01–A15 in DAT-11; demonstration times only `Mon 09:14`, `Mon 10:02`, `Tue 13:40`.
- **States & variants to build:** Observation, decision, release, selected, no evidence; history is ordered but missing timestamps remain absent.
- **Interactions & hotspots:** Evidence link opens authorized evidence drawer; keyboard focus and Enter navigate.
- **Animations needed in-component:** Optional one-time reveal 150ms opacity; static for film unless keyed.
- **Data bound:** DAT-03, DAT-11.
- **Depends on:** CMP-06, CMP-12, CMP-18.
- **Build notes & pitfalls:** Never create timestamps or imply a submitted contribution is published.
- **Done when:** Events preserve order; actors and objects remain readable; missing time is not invented; links respect access.
- **Effort:** M.

### CMP-16 — Before/after diff
- **Purpose / what the viewer perceives:** Explicit proposal change and consequence before authorization.
- **Priority:** P0.
- **Appears in:** H-088, H-099, H-111, H-124 (01:53–01:54, 02:04–02:05, 02:16–02:17, 02:29–02:30); L-104, L-116–L-118, L-135, L-145 (01:41–01:42, 01:53–01:56, 02:12–02:13, 02:22–02:23).
- **Canvas & layout:** Two equal columns, 1px central divider, 36px aligned rows; example `[824,260,432,230]`.
- **Visual spec:** `Before`/`After` 11/16 mono; plus/minus glyphs with foreground text, not color alone; flat surface.
- **Exact content:** `Variance Hold` → `Matched - Variance Approved`; invoice `$18,420.00`, PO `$17,980.00`, `$440.00 / 2.45%`; repair before `Do not include a separately positioned handling line without verified terms`, after `Include the handling line when approved Kestrel terms cover it`.
- **States & variants to build:** Approval proposal, comparator fix, repair interpretation, version comparison; unchanged fields explicitly indicated.
- **Interactions & hotspots:** Source link opens CMP-18; buttons belong to parent approval and use RT-02 checks.
- **Animations needed in-component:** 150ms opacity on panel selection; no automatic count increment.
- **Data bound:** DAT-02, DAT-05, DAT-07, DAT-09.
- **Depends on:** CMP-06, CMP-18.
- **Build notes & pitfalls:** Original and corrected evaluation runs are immutable; policy and permissions are unchanged by repair.
- **Done when:** Before/after align; value and approval context are visible; plus/minus have labels; repair touches only one step.
- **Effort:** M.

### CMP-17 — Scenario grid and tile
- **Purpose / what the viewer perceives:** Every simulator result remains independently inspectable, including safe stops.
- **Priority:** P0.
- **Appears in:** H-084–H-090, H-112–H-113 (01:49–01:56, 02:17–02:19); L-091–L-104, L-136–L-138 (01:28–01:42, 02:13–02:16).
- **Canvas & layout:** Four columns × seven rows of 96×52px tiles, 8px gaps within `[264,208,472,416]`; repair suite uses separate six-row extension.
- **Visual spec:** 4px radius, 1px border, status glyph and short ID mono 11/16; selected tile 2px ink outline.
- **Exact content:** `SCN-001`–`SCN-028`; `SCN-022 variance_exactly_2.00pct`; verdicts and full scenarios DAT-05.
- **States & variants to build:** Not Run, running, passed, Passed — Expected Safe Escalation, failed, selected; v0.1 21/6/1, v0.2 22/6/0.
- **Interactions & hotspots:** Click or keyboard-select tile; SCN-022 opens replay showing `Expected: accept`, `Actual: escalate`.
- **Animations needed in-component:** Active indicator running only; 150ms selected outline, no stagger required.
- **Data bound:** DAT-05, RT-01.
- **Depends on:** CMP-06, CMP-14, CMP-16.
- **Build notes & pitfalls:** Six safe escalations count toward passing intended outcomes. Only SCN-022 changes between candidate runs.
- **Done when:** All 28 tiles have unique accessible names; v0.1 failed tile opens correct replay; v0.2 removes failure; no cyan remains on completion.
- **Effort:** L.

### CMP-18 — Evidence card and source thumbnail/chip
- **Purpose / what the viewer perceives:** A claim points to an authorized, identifiable source, not an asserted conclusion.
- **Priority:** P0.
- **Appears in:** H-072–H-076, H-097–H-100, H-109 (01:37–01:42, 02:02–02:06, 02:14–02:15); L-073–L-074, L-115–L-119, L-133–L-135 (01:10–01:12, 01:52–01:57, 02:10–02:13).
- **Canvas & layout:** Evidence card `[880,208,352,144]`, thumbnail 64×64 and 8px text gap; compact source chip height 24px.
- **Visual spec:** White or dark surface, 1px border, 4px nested radius; FileText/Link 14px, source ID mono, body in foreground.
- **Exact content:** `AP-RULE-009 Variance threshold`; `AP-RULE-017 Supplier handling fees`; `INV-48231`, `PO-1051`, `$4,213.50`, `$4,175.00`, `$38.50 handling line after subtotal`.
- **States & variants to build:** Available, selected, unverified hypothesis, restricted/unavailable, no source; redacted thumbnails never expose source pixels.
- **Interactions & hotspots:** Click source opens authorized detail; hover/focus reveals complete source title; inaccessible evidence shows reason.
- **Animations needed in-component:** 150ms border and opacity, no loops.
- **Data bound:** DAT-04, DAT-07, DAT-08.
- **Depends on:** CMP-03, CMP-06, CMP-09.
- **Build notes & pitfalls:** A reviewed contribution is distinct from a private original; the verification source must be independent readback.
- **Done when:** Every source identifies its object; uncertain facts are labeled; no excluded content appears; permission failure is explicit.
- **Effort:** M.

### CMP-19 — Case table and row
- **Purpose / what the viewer perceives:** Eleven distinct invoice cases and their actual state.
- **Priority:** P0.
- **Appears in:** H-092–H-097 (01:57–02:03); L-108–L-122 (01:45–02:00).
- **Canvas & layout:** `[264,220,992,452]`; columns nominal widths 120/184/100/100/240/80px, remaining space for gaps and responsive allocation; rows 32px.
- **Visual spec:** Dense CMP-07 with 12px status glyph, tabular amount, neutral selected rail; unknown hatch restricted to glyph.
- **Exact content:** All 11 rows and outcomes exactly as DAT-02; `INV-48219` approval, `INV-48220` unknown.
- **States & variants to build:** Queued/running/verified/escalated/approval/unknown/selected; pre-approval 7/2/1/1, after verification 8/2/0/1.
- **Interactions & hotspots:** P(1050,524) opens approval; P(1050,556) opens unknown evidence where these rows are framed; keyboard Enter opens selected row.
- **Animations needed in-component:** Row status updates only on explicit frame actions; running cyan immediately stops at pause.
- **Data bound:** DAT-02, RT-01 selectors.
- **Depends on:** CMP-06–07, CMP-09.
- **Build notes & pitfalls:** Keep original order stable for camera; absent PO is `—`, not fabricated. One case contributes to exactly one summary category.
- **Done when:** Eleven rows total; two missing POs are distinct; unknown is held; approval changes to verified only after readback.
- **Effort:** M.

### CMP-20 — Segmented job progress
- **Purpose / what the viewer perceives:** Job progress and outcome composition, without equating completion with correctness.
- **Priority:** P0.
- **Appears in:** H-093–H-100 (01:58–02:06); L-110–L-123 (01:47–02:01).
- **Canvas & layout:** `[264,160,992,44]`, 8px segmented bar with counts and legend below; segments proportional to 11 cases.
- **Visual spec:** Foreground/trace and patterned unknown segment, status glyphs and text. Arc is allowed only on active work, never for finished segments.
- **Exact content:** `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`; post-verification `8`, `2`, `0`, `1`; `Partially complete`.
- **States & variants to build:** Initial, running, paused, initial snapshot, verified-approval snapshot; totals remain 11.
- **Interactions & hotspots:** Legend selection filters table without mutating records; keyboard buttons show filter state.
- **Animations needed in-component:** Frame-sampled fill when running; 150ms opacity; static for reduced motion.
- **Data bound:** DAT-02, RT-01 derived summary.
- **Depends on:** CMP-06, CMP-14, CMP-19.
- **Build notes & pitfalls:** Unknown stays unresolved after Daniel's approval; never label all eleven successful.
- **Done when:** Segment counts total 11; unknown hatch remains visible; approval count updates after readback only; idle bar has no cyan.
- **Effort:** S.

### CMP-21 — Risk tier chip
- **Purpose / what the viewer perceives:** Risk is explicit per workflow and action.
- **Priority:** P0.
- **Appears in:** H-080 (01:45–01:46); L-083–L-084 (01:20–01:22).
- **Canvas & layout:** 24px outlined chip; example `[768,160,220,24]`.
- **Visual spec:** 12px outlined Shield, mono 12/18; no color-only meaning.
- **Exact content:** `Tier 0 Informational`, `Tier 1 Low-risk reversible`, `Tier 2 Controlled reversible`, `Tier 3 Consequential`, `Tier 4 Restricted`; read Tier 0, tag/stage Tier 1/2, post/approve variance Tier 3.
- **States & variants to build:** Five tiers, restricted blocked, selected workflow `Tier 3 - Consequential`.
- **Interactions & hotspots:** Optional chip opens tier explanation by click/Enter; no authority change.
- **Animations needed in-component:** 150ms border only; no loop.
- **Data bound:** DAT-04; RT-02.
- **Depends on:** CMP-06, CMP-10.
- **Build notes & pitfalls:** Tier 4 is prohibited from agent execution, not an ordinary approval route.
- **Done when:** All five labels are legible; action tiers differ; Tier 4 is blocked; chip never grants permission.
- **Effort:** S.

### CMP-22 — Autonomy ladder row
- **Purpose / what the viewer perceives:** Six distinct stages and the chosen, gated supervision level.
- **Priority:** P0.
- **Appears in:** H-081–H-082 (01:46–01:48); L-085–L-089 (01:22–01:27).
- **Canvas & layout:** Six 54px rows in `[768,240,464,324]`; dense filmed variant may show 32px rows.
- **Visual spec:** Number, label, concise description and gate state; selected Stage 3 has neutral 2px rail; lock icon 14px.
- **Exact content:** `0 Observe`, `1 Suggest`, `2 Guide`, `3 Supervised Assist`, `4 Scoped Autopilot`, `5 Self-Maintaining Autopilot`.
- **States & variants to build:** Available, selected, locked, focus; Stage 3 pending then satisfied; higher stages remain unselected.
- **Interactions & hotspots:** Click/Enter selects only an eligible stage; locked item explains unmet gate.
- **Animations needed in-component:** Selection rail 150ms opacity only.
- **Data bound:** DAT-04, RT-01 gate selector.
- **Depends on:** CMP-06, CMP-21, CMP-23.
- **Build notes & pitfalls:** Job initiation never approves every Tier 3 action.
- **Done when:** Six labels and ordering match; Stage 3 is visibly selected; locked stages explain why; no cyan indicates selection.
- **Effort:** S.

### CMP-23 — Gate checklist
- **Purpose / what the viewer perceives:** Evidence and authorization required to release Stage 3.
- **Priority:** P0.
- **Appears in:** H-082–H-083, H-091 (01:47–01:49, 01:56–01:57); L-086–L-087, L-105–L-107 (01:23–01:25, 01:42–01:45).
- **Canvas & layout:** `[768,240,464,200]`; four 40px rows; 24px icon area.
- **Visual spec:** Neutral pending circle; check only for satisfied condition; 1px row dividers; 12px mono count.
- **Exact content:** `5/5 verified human examples`, `3 observed this week + 2 SME-verified archived cases`, `28/25 representative scenarios`, `6/5 edge/negative`, `Owner approval`.
- **States & variants to build:** Before evaluation pending scenario and owner items; after v0.2 and Marcus approval all satisfied.
- **Interactions & hotspots:** Evidence counts open CMP-18; P(1020,606) simulator navigation where host supplies action.
- **Animations needed in-component:** Check appears 150ms opacity only after matching guard event.
- **Data bound:** DAT-03, DAT-05, RT-01.
- **Depends on:** CMP-06, CMP-18, CMP-22.
- **Build notes & pitfalls:** All 28 intended outcomes pass only after corrected evaluation; safe escalations are passing outcomes.
- **Done when:** Counts are sourced; pending state is not prechecked; owner is separate; release cannot bypass a failed row.
- **Effort:** M.

### CMP-24 — Demonstration card
- **Purpose / what the viewer perceives:** Three separately consented examples with provenance.
- **Priority:** P0.
- **Appears in:** H-070–H-073 (01:35–01:39); L-059–L-061, L-073 (00:56–00:59, 01:10–01:11).
- **Canvas & layout:** Three cards 292×120, 8px gaps; example x264/564/864 y176.
- **Visual spec:** 8px card radius, flat white, 1px border, 64px source thumbnail; mono identity and time.
- **Exact content:** D1 Priya Nair `Mon 09:14` `INV-48203` Brightwater Industrial; D2 Priya Nair `Mon 10:02` `INV-48204` Copperline Cables; D3 Jamal Carter `Tue 13:40` `INV-48207` Harlow Tooling.
- **States & variants to build:** Observed, reviewed contribution, selected, inaccessible source; no implied business verification.
- **Interactions & hotspots:** Click or Enter opens sanitized evidence; review control belongs to contribution owner.
- **Animations needed in-component:** Optional 60ms entrance stagger, capped 360ms, frame driven; reduced motion static.
- **Data bound:** DAT-03.
- **Depends on:** CMP-06, CMP-18.
- **Build notes & pitfalls:** Three demonstrations are not five verified examples; the gate adds two SME-verified archived cases.
- **Done when:** All three cards identify contributor/time/invoice; no raw capture leaks; distinction from verification is clear.
- **Effort:** S.

### CMP-25 — Candidate workflow card
- **Purpose / what the viewer perceives:** Suggested workflow with confidence and unresolved rule uncertainty.
- **Priority:** P0.
- **Appears in:** H-070–H-073 (01:35–01:39); L-058, L-073 (00:55–00:56, 01:10–01:11).
- **Canvas & layout:** `[264,160,992,120]` inbox row; detail heading and evidence column as host allows.
- **Visual spec:** White flat 8px card, 1px border, `Suggested` neutral badge, warning glyph; confidence labeled without a numeric claim.
- **Exact content:** `Match supplier invoice to purchase order and stage result in ERP`; `3 demonstrations`; `Needs Review`; `variance exception rule: unverified until SME review`.
- **States & variants to build:** Suggested, selected, contribution reviewed, owner approved, published.
- **Interactions & hotspots:** P(550,200) opens detail; owner review is separate from contributor consent.
- **Animations needed in-component:** 150ms selection, no inferred progress.
- **Data bound:** DAT-03–04, RT-01.
- **Depends on:** CMP-06, CMP-18, CMP-24.
- **Build notes & pitfalls:** Never show fabricated numerical confidence or imply inferred policy is approved.
- **Done when:** Three evidence cards remain reachable; confidence is labeled; unverified exception is visible; publish requires owner review.
- **Effort:** M.

### CMP-26 — Playbook step, rule and exception blocks
- **Purpose / what the viewer perceives:** Approved human guidance with exact steps, rule authority and known exceptions.
- **Priority:** P0.
- **Appears in:** H-074–H-076 (01:39–01:42); L-062, L-074 (00:59–01:00, 01:11–01:12).
- **Canvas & layout:** Steps in 608px column, rule/evidence in 360px column, 16px gap; rows min 40px.
- **Visual spec:** 4px inner radius, mono step IDs, 16/22 card headings, neutral shield/check for approved guidance.
- **Exact content:** Six `AP-STEP-01`–`06`, rules `AP-RULE-009` and `AP-RULE-017`, and five exceptions exactly in DAT-04.
- **States & variants to build:** Draft/suggested, evidence review, Approved for Guidance, Needs Revalidation.
- **Interactions & hotspots:** Click rule/evidence opens source; Agent Factory action opens agent draft, not production execution.
- **Animations needed in-component:** 150ms expand/collapse; reduced motion immediate.
- **Data bound:** DAT-04, DAT-08.
- **Depends on:** CMP-06, CMP-18, CMP-25.
- **Build notes & pitfalls:** Exact 2.00% is accepted; only values above require Tier 3 approval.
- **Done when:** Six steps have stable IDs; both rules have owners and sources; exceptions stay distinct; published guidance does not deploy agent.
- **Effort:** M.

### CMP-27 — Agent definition sections
- **Purpose / what the viewer perceives:** Generated candidate is inspectable and bounded.
- **Priority:** P0.
- **Appears in:** H-077–H-079 (01:42–01:45); L-075–L-081 (01:12–01:19).
- **Canvas & layout:** `[304,160,880,430]`; intent field at top, six 40px rows below, 1px separators.
- **Visual spec:** White 8px card; section heads Space Grotesk 16/22; identifiers mono; `Unverified branch` warning triangle.
- **Exact content:** Intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`; `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`, `Unverified branch`.
- **States & variants to build:** Empty intent, typing, generated candidate, unverified branch, reviewed draft; no released badge before authorization.
- **Interactions & hotspots:** Input accepts typing; P(1050,600) continues to scope only with intent; section evidence opens CMP-18.
- **Animations needed in-component:** Typing uses RT-03; generation may show frame-driven running icon, not unrelated cyan.
- **Data bound:** DAT-04, DAT-06.
- **Depends on:** CMP-04, CMP-06, CMP-18.
- **Build notes & pitfalls:** Outputs and stopping points remain reviewable; generated structure does not imply authority.
- **Done when:** All six sections appear; exact intent fits; uncertainty is visible; no deployed claim appears.
- **Effort:** M.

### CMP-28 — Scope and permissions list
- **Purpose / what the viewer perceives:** Precisely bounded applications, queue, allowed operations and stopping conditions.
- **Priority:** P0.
- **Appears in:** H-080–H-083 (01:45–01:49); L-082–L-089 (01:19–01:27).
- **Canvas & layout:** `[264,176,480,440]`; 40px rows grouped by team, applications, action and authority.
- **Visual spec:** 1px dividers; 14px icons, 12/18 mono value, neutral outlines for approved scope.
- **Exact content:** `AP East`; `Gmail`, `NetSuite`, `Google Sheets`; `Supplier Invoice Reconciler`; `Run Supervised`; `Tier 3 - Consequential`.
- **States & variants to build:** Draft, complete, missing permission, unsupported app, approved scope; unsupported says `Unavailable`.
- **Interactions & hotspots:** Each row can open capability detail; continue opens simulator only if prerequisites are met.
- **Animations needed in-component:** 150ms highlight; no animation on read-only rows.
- **Data bound:** DAT-06, DAT-12, RT-02.
- **Depends on:** CMP-05, CMP-21–23, CMP-39.
- **Build notes & pitfalls:** Capability is not permission. Tier 3 decision must have separate delegated human authority.
- **Done when:** Team and three apps are listed; unsupported actions say unavailable; Tier 3 is visible; no role switch broadens access.
- **Effort:** M.

### CMP-29 — Incident card
- **Purpose / what the viewer perceives:** An incident is contained before diagnosis or repair.
- **Priority:** P0.
- **Appears in:** H-104–H-106 (02:09–02:12); L-127–L-130 (02:04–02:08).
- **Canvas & layout:** Detail `[588,112,644,480]`; three compact case rows and separate evidence section.
- **Visual spec:** Dark surface `#141414`, border `#333`, pale text; stop-square warning glyph, no cyan while paused.
- **Exact content:** `INC-0042`, `Contained`, `3 affected cases paused`, `INV-48231`, `INV-48233`, `INV-48236`, `supplier document format change — unconfirmed`.
- **States & variants to build:** Incident opened/contained, hypothesis unconfirmed, manual resolution, repaired/closed; light and dark themes.
- **Interactions & hotspots:** P(960,398) opens case evidence; P(1090,600) teach after manual completion.
- **Animations needed in-component:** Incident status appears on explicit containment event; 150ms opacity; no pulsing alert.
- **Data bound:** DAT-07; RT-01.
- **Depends on:** CMP-06, CMP-18, CMP-30.
- **Build notes & pitfalls:** Do not assign a fabricated amount to INV-48233 or INV-48236; do not promote hypothesis to fact.
- **Done when:** All three cases remain individually identifiable; containment precedes repair; hypothesis says unconfirmed; no active cyan.
- **Effort:** M.

### CMP-30 — Expected versus actual panel
- **Purpose / what the viewer perceives:** Separate expected evidence from the observed failure.
- **Priority:** P0.
- **Appears in:** H-086, H-106 (01:51–01:52, 02:11–02:12); L-095–L-096, L-129–L-130 (01:32–01:34, 02:06–02:08).
- **Canvas & layout:** Two columns `[612,304,290,140]` and `[902,304,290,140]`; divider 1px.
- **Visual spec:** Labels mono 11/16; content 14/20; neutral expected and warning/failure actual with distinct glyph.
- **Exact content:** Scenario `Expected: accept`, `Actual: escalate`; incident `Expected: verifiable invoice total`, `Actual: cannot verify`; amounts `$4,213.50`, `$4,175.00`, fee `$38.50`.
- **States & variants to build:** Boundary replay, incident failure, source missing; actual failure is not a confirmed root cause.
- **Interactions & hotspots:** Source links open CMP-18, keyboard accessible.
- **Animations needed in-component:** 150ms opacity on selection.
- **Data bound:** DAT-05, DAT-07.
- **Depends on:** CMP-16, CMP-18.
- **Build notes & pitfalls:** `2.00%` is a policy boundary; compare cents with integer arithmetic, not rounded percentages.
- **Done when:** Expected and actual align; source facts remain separate from hypothesis; dark contrast holds.
- **Effort:** S.

### CMP-31 — Approval authority check
- **Purpose / what the viewer perceives:** Person, scope, proposed change and separate verification are all visible.
- **Priority:** P0.
- **Appears in:** H-098–H-100 (02:03–02:06); L-115–L-118 (01:52–01:56).
- **Canvas & layout:** Inside drawer `[824,440,432,128]`; identity first, delegation second, source third.
- **Visual spec:** ShieldCheck 16px; mono identity; warning glyph when unauthorized; hairline box.
- **Exact content:** `Daniel Okafor · Tier 3`; `AP-RULE-009`; `Approve`, `Reject`, `Request Changes`; `Variance Hold` → `Matched - Variance Approved`.
- **States & variants to build:** Valid delegation, missing/expired/wrong scope, decision made, readback pending, verified.
- **Interactions & hotspots:** Approval button dispatches only if current person has applicable Tier 3 delegation; separate event commits independent readback.
- **Animations needed in-component:** 150ms status transition only; no check until source verifies.
- **Data bound:** DAT-01–02, DAT-04; RT-02.
- **Depends on:** CMP-06, CMP-09, CMP-16, CMP-18.
- **Build notes & pitfalls:** Role selector cannot impersonate authorization; approval is not verified completion.
- **Done when:** Daniel and scope are visible; unauthorized button explains why; readback remains distinct; counts update only after verification.
- **Effort:** M.

### CMP-32 — Regression test list
- **Purpose / what the viewer perceives:** Repair is tested against both existing behavior and nearby variations.
- **Priority:** P0.
- **Appears in:** H-112–H-113 (02:17–02:19); L-136–L-138 (02:13–02:16).
- **Canvas & layout:** `[768,224,464,330]`, six 40px addition rows plus results footer.
- **Visual spec:** Dark incident variant, mono 12/18 IDs, status glyphs; active bar cyan only while testing.
- **Exact content:** Six `SCN-029`–`SCN-034` descriptions DAT-05; `6 new regression cases`; `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`.
- **States & variants to build:** Not Run, running, partial, complete passing, failed; every old scenario remains included.
- **Interactions & hotspots:** P(1080,570) runs suite; release remains disabled until every outcome meets expected result.
- **Animations needed in-component:** Frame-derived progress; 150ms result reveal; reduced motion static.
- **Data bound:** DAT-05, DAT-07; RT-01.
- **Depends on:** CMP-06, CMP-14, CMP-17.
- **Build notes & pitfalls:** Suite totals 34 = original 28 + six; original failure plus five variants.
- **Done when:** Six new rows are distinct; suite total is 34; 28/6/0 is displayed; incomplete blocks release.
- **Effort:** M.

### CMP-33 — Rollout cohort card
- **Purpose / what the viewer perceives:** Narrow release, observation, authorization and expansion are independent milestones.
- **Priority:** P0.
- **Appears in:** H-114–H-116, H-141 (02:19–02:22, 02:46–02:47); L-139–L-144 (02:16–02:22).
- **Canvas & layout:** `[264,160,480,360]`, adjacent watch panel `[768,160,464,360]`.
- **Visual spec:** Flat 8px card; list rows 40px; neutral scope chips, verified check glyphs; light and dark variants.
- **Exact content:** `Kestrel Components invoices only`, `AP East only`, `First 3/3 Verified Complete`, `Repaired - Validated`.
- **States & variants to build:** Awaiting owner, limited release, 0/3 to 3/3 verified, expansion authorized, incident closed; pause on unknown or regression.
- **Interactions & hotspots:** P(1080,510) expand only after three independent verifications and owner authority; P(1090,630) close after expansion.
- **Animations needed in-component:** Explicit frame-based row changes, 150ms opacity; no autonomous counting.
- **Data bound:** DAT-07, DAT-09, RT-01/02.
- **Depends on:** CMP-06, CMP-18, CMP-23.
- **Build notes & pitfalls:** The three watched outcomes are a separate cohort, not JOB-0117 additions.
- **Done when:** Supplier and team scopes are visible; 3/3 has individual evidence; expansion needs owner; incident retains history.
- **Effort:** M.

### CMP-34 — Version row and compare
- **Purpose / what the viewer perceives:** Immutable history, differences, and a bounded restore option.
- **Priority:** P0.
- **Appears in:** H-088, H-124 (01:53–01:54, 02:29–02:30); L-104, L-145 (01:41–01:42, 02:22–02:23).
- **Canvas & layout:** `[264,160,992,320]`; 40px version rows or horizontal cards; comparison occupies two equal columns.
- **Visual spec:** 1px separators, mono version IDs, kind and status; neutral selection rail.
- **Exact content:** `Playbook v1.0`; agent `v0.1`, `v0.2`, `v1.0`, `v1.1`; `Compare`; `Restore previous approved version`.
- **States & variants to build:** Candidate, failed evaluation, passed evaluation, released, repaired, selected, restore blocked.
- **Interactions & hotspots:** P(760,300) compare; P(1110,500) restore only with authorization, for future jobs.
- **Animations needed in-component:** 150ms selection; compare content swap is deterministic.
- **Data bound:** DAT-06, DAT-09.
- **Depends on:** CMP-06–07, CMP-16.
- **Build notes & pitfalls:** Restoring a version never undoes historical business actions.
- **Done when:** Both v1.0 objects retain their kinds; failed v0.1 remains historical; restore scope is explicit.
- **Effort:** M.

### CMP-35 — Notification card
- **Purpose / what the viewer perceives:** Actionable items, one attention item at a time.
- **Priority:** P0.
- **Appears in:** H-127 (02:32–02:33); L-158 (02:35–02:36).
- **Canvas & layout:** 360×92px, 12px padding, 16px type icon, title/source/action in three rows.
- **Visual spec:** 8px radius, 1px border, restrained floating md shadow when overlaid.
- **Exact content:** `Approval Required`, `INC-0042 Contained`, `Confirm Kestrel handling-fee terms in writing`, `Repair Ready`, `Release Status`.
- **States & variants to build:** Approval, incident, reminder, repair, release; unread/read, expanded/collapsed, dismissed.
- **Interactions & hotspots:** P(740,220) opens approval in host; dismiss removes notification only, not underlying task.
- **Animations needed in-component:** 150ms opacity, one surfaced toast at a time.
- **Data bound:** DAT-10, RT-01/02.
- **Depends on:** CMP-03, CMP-06, CMP-11.
- **Build notes & pitfalls:** Filter by recipient and lifecycle; N-04 appears only after regression, N-05 only after release.
- **Done when:** Three primary rows point to correct objects; dismissal does not resolve; no stacking; permissions hold.
- **Effort:** S.

### CMP-36 — HUD contextual card
- **Purpose / what the viewer perceives:** One relevant peer fix, reminder or guided step beside current work.
- **Priority:** P0.
- **Appears in:** H-069, H-122 (01:34–01:35, 02:27–02:28); L-056, L-151–L-152 (00:53–00:54, 02:28–02:30).
- **Canvas & layout:** `[900,148,320,144]`, 12px padding, z30; never cover source form field.
- **Visual spec:** White/dark floating card, 8px radius, md shadow, 14px mono title, 16px icons.
- **Exact content:** `Known fix from AP East: Vendor tax ID format`; `Guide Me`; `Confirm Kestrel handling-fee terms in writing · Fri 12:00`; dismiss control accessible as `Dismiss`.
- **States & variants to build:** peerFix, commitment, guide; only one shown; dismissed does not resolve work.
- **Interactions & hotspots:** P(1095,257) opens guide; dismiss via click or Escape when focused; reminder only on relevant vendor context.
- **Animations needed in-component:** 150ms opacity/translation from explicit event; reduced motion immediate.
- **Data bound:** DAT-08, DAT-10, RT-01.
- **Depends on:** CMP-03, CMP-18.
- **Build notes & pitfalls:** Peer guidance is published sanitized knowledge, not a colleague's private recording.
- **Done when:** Card does not cover critical fields; one card at a time; reminder matches vendor; dismissal is not completion.
- **Effort:** M.

### CMP-37 — Role and organization selector
- **Purpose / what the viewer perceives:** Current organization and role viewpoint with accurate access boundaries.
- **Priority:** P0.
- **Appears in:** H-056–H-057, H-098 (01:21–01:23, 02:03–02:04); L-035, L-115 (00:32–00:33, 01:52–01:53).
- **Canvas & layout:** Sidebar top `[16,16,208,48]`, anchored menu 208–320px wide.
- **Visual spec:** Avatar initials, mono 12/18 org, chevron 16px; selected row check.
- **Exact content:** `Calder & Vance`; `Employee`, `Workflow Owner`, `Approver`, `Admin`; people are DAT-01.
- **States & variants to build:** Menu closed/open; role switched among granted identities; explicit unauthorized or unavailable role.
- **Interactions & hotspots:** P(135,54) opens selector; arrow and Enter choose a preconfigured identity; RT-02 independently verifies delegation.
- **Animations needed in-component:** 150ms menu opacity; no role-driven automatic business action.
- **Data bound:** DAT-01, RT-02.
- **Depends on:** CMP-05, CMP-10, CMP-12.
- **Build notes & pitfalls:** Admin does not grant private evidence or financial approval. Preserve explicit restrictions.
- **Done when:** Current org and role are visible; available identities have real grants; Daniel's authority is not granted by display label.
- **Effort:** M.

### CMP-38 — Search, top bar and sidebar nav item
- **Purpose / what the viewer perceives:** Stable shared application navigation without changing the filmed shell geometry.
- **Priority:** P0.
- **Appears in:** H-055–H-132 (01:20–02:38); L-035–L-160 (00:32–02:38).
- **Canvas & layout:** Sidebar `[0,0,240,720]`; top bar `[240,0,1040,56]`; nav rows 32px; search P(620,28), bell P(1200,28).
- **Visual spec:** 1px warm divider, flat surface, 14px Lucide icons; active nav has 2px neutral inset rail; 12/18 mono.
- **Exact content:** `Home`, `Workflow Discovery`, `Playbooks`, `Operations Map`, `Agent Factory`, `Flight Simulator`, `Jobs`, `Incident Center`, `Versions`, `Command Center`, `Audit & export`, `Notifications`, `My Privacy`; search hint `⌘K`.
- **States & variants to build:** Active/inactive/hover/focus, notification present, search open, access restricted.
- **Interactions & hotspots:** P(620,28) opens CMP-11; P(1200,28) opens notification list; nav selection changes view, not domain history.
- **Animations needed in-component:** 150ms background; no shell resizing during film.
- **Data bound:** RT-01 view selector, RT-02 access, DAT-10.
- **Depends on:** CMP-03, CMP-11–12, CMP-35, CMP-37.
- **Build notes & pitfalls:** Search only authorized objects. Select a role before rendering permitted navigation.
- **Done when:** Shell stays fixed; selected item has text and rail; search and bell work by keyboard; unauthorized destination is not exposed.
- **Effort:** M.

### CMP-39 — Capability matrix cell
- **Purpose / what the viewer perceives:** Supported and unsupported application actions are unmistakable.
- **Priority:** P0.
- **Appears in:** H-129–H-131, H-139 (02:34–02:37, 02:44–02:45); L-159–L-161 (02:36–02:39).
- **Canvas & layout:** Five capability columns, 80px cells, seven application rows; minimum height 40px.
- **Visual spec:** Mono 11/16, check or dash glyph plus text; neutral surface, warm border; Zoom annotation wraps.
- **Exact content:** `Available`; `— Unavailable`; `Observe by per-meeting opt-in`; full matrix DAT-12.
- **States & variants to build:** Available, unavailable, conditional per-meeting opt-in, selected detail.
- **Interactions & hotspots:** Available cell P(420,214) opens detail; unavailable cells are not enabled and explain why.
- **Animations needed in-component:** 150ms selection border.
- **Data bound:** DAT-12.
- **Depends on:** CMP-06–07, CMP-10.
- **Build notes & pitfalls:** Gray-only Salesforce/Outlook/Excel/Teams/Meet/Edge marks are not availability claims.
- **Done when:** All 35 demonstrated intersections have explicit text; Zoom condition is visible; capability never grants authority.
- **Effort:** S.

### CMP-40 — Metric card
- **Purpose / what the viewer perceives:** Truthful snapshot of outcomes, incidents or release without fabricated business impact.
- **Priority:** P0.
- **Appears in:** H-096, H-100, H-125, H-132, H-136 (02:01–02:02, 02:05–02:06, 02:30–02:31, 02:37–02:39, 02:41–02:42); L-122–L-123, L-155–L-156 (01:59–02:01, 02:32–02:34).
- **Canvas & layout:** Four cards `[264,160,232,160]`, `[512,160,232,160]`, `[760,160,232,160]`, `[1008,160,232,160]`.
- **Visual spec:** Flat 8px card, 1px border, number Space Grotesk 28/34 bold, mono label, status glyph.
- **Exact content:** 7/2/1/1 pre-approval and 8/2/0/1 after verification; `1 contained incident` belongs to a separate population.
- **States & variants to build:** Before approval, decision/readback pending, after verification; incident contained/repaired.
- **Interactions & hotspots:** Click/Enter filters its named category; P(1080,370) can open unknown list.
- **Animations needed in-component:** Counters switch on explicit events, never count randomly; 150ms opacity optional.
- **Data bound:** DAT-02, DAT-07, DAT-09, RT-01 selectors.
- **Depends on:** CMP-06, CMP-19.
- **Build notes & pitfalls:** No fabricated ROI, time saved or per-employee productivity metric; distinguish 14-day scope from single-job snapshot.
- **Done when:** Total remains 11; unknown remains separate; 3/3 cohort does not change job totals; no invented statistic.
- **Effort:** S.

### CMP-41 — React Flow graph node and edge
- **Purpose / what the viewer perceives:** Inspectable operational dependencies between workflow, rules, agent and incident.
- **Priority:** P0.
- **Appears in:** H-117–H-119 (02:22–02:25); L-148 (02:25–02:26).
- **Canvas & layout:** Canvas `[264,112,992,560]`; nodes 188×64px, handles 8px; layout workflow near (340,260), rules near (620,170)/(620,350), agent near (880,260), incident near (1080,400).
- **Visual spec:** 6px node radius, 1px border; edge 1.5px trace with arrow; candidate dashed 5/3, approved solid; selected edge 2px signal, selected node 2px foreground.
- **Exact content:** `Supplier invoice vs purchase order reconciliation`, `AP-RULE-009`, `AP-RULE-017`, `Supplier Invoice Reconciler`, `INC-0042`.
- **States & variants to build:** Workflow/rule/agent/incident; candidate/approved/selected; selected agent highlights its rules and incident only.
- **Interactions & hotspots:** P(974,292) selects agent; P(1190,136) equivalent list view. Keyboard traversal and textual dependency list mirror graph.
- **Animations needed in-component:** 150ms edge emphasis; graph geometry is frozen during camera movement.
- **Data bound:** DAT-04, DAT-06–07.
- **Depends on:** CMP-06, CMP-18.
- **Build notes & pitfalls:** Use `@xyflow/react`; avoid autoplay or moving layout; selected dependency never uses cyan.
- **Done when:** Four types render distinctly; candidate is dashed; selection highlights right links; list view has equivalent names.
- **Effort:** L.

### CMP-42 — Commitment card and transcript line
- **Purpose / what the viewer perceives:** Meeting statements support a proposed obligation that the person reviews and confirms.
- **Priority:** P0.
- **Appears in:** H-065–H-069 (01:30–01:35); L-050–L-056 (00:47–00:54).
- **Canvas & layout:** Transcript `[264,160,560,360]`, commitment `[848,160,384,400]`; each line contains speaker, timestamp and quotation.
- **Visual spec:** Crimson Text 16/24 quote, speaker/time mono 11/16, white card, 1px border, 8px radius.
- **Exact content:** Dana: `From the next cycle we're adding a handling line to every invoice.` Priya: `Send me the new layout; I'll confirm the terms in writing by Friday.` Card `Confirm Kestrel handling-fee terms in writing`, `Priya Nair`, `Fri 17:00` → `Fri 12:00`, `00:14:32`, `subject to company approval`, `Confirm`.
- **States & variants to build:** Meeting consent absent, suggested, editable, confirmed, context reminder; unknown speaker remains unknown.
- **Interactions & hotspots:** P(1050,342) edits due time; P(1090,562) confirms; source link opens authorized transcript.
- **Animations needed in-component:** Deadline text changes on explicit edit; 150ms confirmation swap; no auto-confirm.
- **Data bound:** DAT-08; RT-01.
- **Depends on:** CMP-03–04, CMP-06, CMP-18, CMP-36.
- **Build notes & pitfalls:** Confirmed Commitment is not company policy or another person's acceptance; meeting consent is per session.
- **Done when:** Both exact quotes render; deadline edit persists; qualifier survives confirmation; source timestamp remains visible.
- **Effort:** M.

### CMP-43 — Redaction/masking field
- **Purpose / what the viewer perceives:** Sensitive values are obscured before storage.
- **Priority:** P0.
- **Appears in:** H-061 (01:26–01:27); L-040–L-043 (00:37–00:41).
- **Canvas & layout:** Three 40px rows in a 320–480px panel, label left and 160×24px masked value right.
- **Visual spec:** `BANK ACCT`, `TAX ID`, `CARD` mono 14/20; neutral diagonal 1px/6px hatch inside bordered bar; text stays outside hatch.
- **Exact content:** `BANK ACCT`, `TAX ID`, `CARD`; no underlying invented values.
- **States & variants to build:** Always-masked static, hatch sweep presentation, mandatory exclusion; light/dark.
- **Interactions & hotspots:** No reveal control for protected fictional fields; privacy controls live in CMP-13.
- **Animations needed in-component:** Optional 500ms hatch sweep from already masked to masked, driven by film; reduced motion static.
- **Data bound:** DAT-13 privacy copy, RT-01 consent.
- **Depends on:** CMP-01, CMP-13.
- **Build notes & pitfalls:** Never render unmasked sensitive values even transiently; hatch does not imply an unknown outcome unless labeled.
- **Done when:** Three labels readable; no raw value in DOM; mandatory state cannot be disabled; reduced-motion view stays masked.
- **Effort:** S.

### CMP-44 — Source-line citation
- **Purpose / what the viewer perceives:** Source attribution remains visually separate from product claims.
- **Priority:** P0.
- **Appears in:** H-018–H-020, H-025 (00:34–00:40, 00:48–00:50); L-018 (00:15–00:16) where a source is presented by host.
- **Canvas & layout:** One or two lines near host footer; min 11px authored, max width bounded by card.
- **Visual spec:** IBM Plex Mono 11/16 500, foreground or contrast-safe muted, no under-11 microtext.
- **Exact content:** `Ardent Partners · Payables Place · 2026`; source URL and other source wording in DAT-13.
- **States & variants to build:** Compact citation, full accessible source, link focus; no date fabrication.
- **Interactions & hotspots:** Optional link opens source only in interactive mode; film capture uses fixed static text.
- **Animations needed in-component:** None.
- **Data bound:** DAT-13.
- **Depends on:** CMP-02.
- **Build notes & pitfalls:** Gartner wording requires verification before publishing; cite age of McKinsey 2012 finding.
- **Done when:** Citation is legible; claim and source are distinct; exact year remains visible; no unsupported claim is attached.
- **Effort:** S.

## Canonical fixture modules

Each DAT item is a typed, immutable local module, not a rendered screen. Its visual contract is the consuming component's; all fixture strings shown below are exact UI copy where rendered. All fixture changes go through the reducer as distinct state snapshots rather than modifying fixture constants. Monetary values are integer cents. A `null` means not known, never zero.

### DAT-01 — People, organizations and suppliers
- **Purpose / what the viewer perceives:** Consistent names, responsibilities and customer world across every surface.
- **Priority:** P0.
- **Appears in:** H-056–H-127 (01:21–02:33); L-035–L-158 (00:32–02:36).
- **Canvas & layout:** No independent canvas; names populate CMP-12, CMP-24, CMP-31, CMP-37 and rows in their hosts.
- **Visual spec:** Person names Space Grotesk 14/20; role and identifiers mono 12/18; no invented photographs.
- **Exact content:**

| ID | Name | Title | Role |
|---|---|---|---|
| priya | Priya Nair | AP Specialist | Employee |
| jamal | Jamal Carter | AP Specialist | Employee |
| marcus | Marcus Webb | AP Manager | Workflow Owner |
| elena | Elena Ruiz | Senior Accountant | SME |
| daniel | Daniel Okafor | Controller | Approver |
| tomas | Tomas Reyes | IT/Security Admin | Admin |
| dana | Dana Whitfield | Kestrel Components | Supplier representative |

Organization `Calder & Vance Supply Co.`; selector `Calder & Vance`; team `AP East`. Suppliers in fixed order: `Brightwater Industrial`, `Copperline Cables`, `Northgate Pallets`, `Orchard Lane Foods`, `Harlow Tooling`, `Ironbark Fasteners`, `Vantage Print`, `Meadowbrook Office`, `Sable & Co. Logistics`, `Kestrel Components`.
- **States & variants to build:** Current actor and role are separate from authority; Dana is external, not an internal role.
- **Interactions & hotspots:** Selector P(135,54) uses RT-02; no direct fixture mutations.
- **Animations needed in-component:** None.
- **Data bound:** Fixture itself; cross-reference by stable ID.
- **Depends on:** RT-02.
- **Build notes & pitfalls:** Names cannot be swapped or borrowed from reference material.
- **Done when:** Seven people and ten suppliers are present; all role and company names match; external representative cannot approve.
- **Effort:** S.

### DAT-02 — Eleven invoice cases and job snapshots
- **Purpose / what the viewer perceives:** The same exact invoices persist from job run through summary, approval and evidence.
- **Priority:** P0.
- **Appears in:** H-092–H-101, H-132, H-136–H-137 (01:57–02:07, 02:37–02:39, 02:41–02:43); L-108–L-123 (01:45–02:01).
- **Canvas & layout:** Rows render in CMP-19; four counts render CMP-20/CMP-40.
- **Visual spec:** Mono 12/18; amounts tabular and right aligned; status glyphs from CMP-06.
- **Exact content:** `JOB-0117`, `Supplier Invoice Reconciler v1.0`, `AP East`, 11 invoices:

| Invoice | Supplier | Amount cents | PO | PO cents | Initial outcome |
|---|---|---:|---|---:|---|
| INV-48210 | Brightwater Industrial | 624000 | PO-1031 | — | Verified Complete |
| INV-48211 | Copperline Cables | 311840 | PO-1032 | — | Verified Complete |
| INV-48212 | Northgate Pallets | 190500 | PO-1034 | — | Verified Complete |
| INV-48213 | Orchard Lane Foods | 1248000 | PO-1036 | — | Verified Complete |
| INV-48214 | Harlow Tooling | 84725 | PO-1037 | — | Verified Complete |
| INV-48215 | Ironbark Fasteners | 226000 | null | — | Escalated: Missing Purchase Order |
| INV-48216 | Vantage Print | 52990 | PO-1039 | — | Verified Complete |
| INV-48217 | Meadowbrook Office | 137612 | PO-1040 | — | Verified Complete |
| INV-48218 | Sable & Co. Logistics | 441500 | null | — | Escalated: Missing Purchase Order |
| INV-48219 | Brightwater Industrial | 1842000 | PO-1042 | 1798000 | Approval Required (Tier 3) |
| INV-48220 | Northgate Pallets | 273250 | PO-1044 | — | Outcome Unknown |

`INV-48219`: variance 44000 cents, display `$440.00 / 2.45%`; `Variance Hold` → `Matched - Variance Approved`. `INV-48220`: `ERP submit timed out`, `Held`, `Do not resubmit until reconciled`. Before decision counts `{verified:7, escalated:2, approval:1, unknown:1}`; after independent verification `{verified:8, escalated:2, approval:0, unknown:1}`.
- **States & variants to build:** Queued, running, initial outcomes, approved/readback pending, verified; unknown stays held.
- **Interactions & hotspots:** Approval P(1100,665), unknown P(1050,556); reducer owns changes.
- **Animations needed in-component:** None; selectors derive all visible totals.
- **Data bound:** DAT-01 and RT-01/02.
- **Depends on:** DAT-01, CMP-19–20.
- **Build notes & pitfalls:** Compare 2% using integer cross multiplication; display rounded 2.45% only. `null` PO renders `—`; do not infer absent PO amounts.
- **Done when:** Eleven unique rows match table; both snapshots sum to 11; approval does not imply readback; no automatic retry exists.
- **Effort:** M.

### DAT-03 — Demonstrations and gate examples
- **Purpose / what the viewer perceives:** Provenance for the candidate and the five-example release gate.
- **Priority:** P0.
- **Appears in:** H-064, H-070–H-073, H-083 (01:29–01:30, 01:35–01:39, 01:48–01:49); L-047–L-049, L-059–L-061, L-073 (00:44–00:47, 00:56–00:59, 01:10–01:11).
- **Canvas & layout:** CMP-24 three 292×120 cards; CMP-23 evidence expansion.
- **Visual spec:** IDs/times mono 12/18; sanitized source thumbnails only.
- **Exact content:** `D1 | Priya Nair | Mon 09:14 | INV-48203 | Brightwater Industrial`; `D2 | Priya Nair | Mon 10:02 | INV-48204 | Copperline Cables`; `D3 | Jamal Carter | Tue 13:40 | INV-48207 | Harlow Tooling`. Gate `{observed:3, archivedSmeVerified:2, required:5}`, rendered `3 observed this week + 2 SME-verified archived cases`, `5/5 verified human examples`.
- **States & variants to build:** Observed, consented/sanitized contribution, reviewed, five-example gate met.
- **Interactions & hotspots:** Click each card opens permitted evidence, not raw media.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01, DAT-04.
- **Depends on:** CMP-18, CMP-23–24.
- **Build notes & pitfalls:** Preserve each person's contribution decision; do not invent archived case identities.
- **Done when:** Three examples match names and times; gate counts five without adding unshown IDs; no private evidence leaks.
- **Effort:** S.

### DAT-04 — Candidate, playbook, rules and scope
- **Purpose / what the viewer perceives:** Human-reviewed workflow, exact business rules, and explicit agent boundaries.
- **Priority:** P0.
- **Appears in:** H-071–H-083 (01:36–01:49); L-073–L-089 (01:10–01:27).
- **Canvas & layout:** CMP-25–28; 608px procedure and 360px evidence/rule columns.
- **Visual spec:** Text and status per CMP-06, section headers 16/22, data mono 12/18.
- **Exact content:** Candidate `Match supplier invoice to purchase order and stage result in ERP`; uncertainty `variance exception rule: unverified until SME review`. Playbook `{id:'PB-AP-RECON', title:'Supplier invoice vs purchase order reconciliation', version:'1.0', status:'Approved for Guidance', owner:'Marcus Webb'}`. Steps:
  1. `AP-STEP-01` `Receive invoice and identify supplier`
  2. `AP-STEP-02` `Locate purchase order and verify identity`
  3. `AP-STEP-03` `Interpret invoice totals`
  4. `AP-STEP-04` `Compare totals against approved variance rule`
  5. `AP-STEP-05` `Stage ERP result or escalate`
  6. `AP-STEP-06` `Verify authoritative business outcome`

Rules: `AP-RULE-009 | Variance threshold | Daniel Okafor | variance > 2.00% of PO requires Tier 3 approval; <= 2.00% auto-accepts within match`; `AP-RULE-017 | Supplier handling fees | Daniel Okafor | Use approved supplier terms; interpretation alone does not change policy`. Exceptions: `Missing Purchase Order`, `Duplicate invoice`, `Approval Required`, `Outcome Unknown`, `Unreadable PDF`. Scope: `AP East`, selected invoice queue, Gmail/NetSuite/Google Sheets, read Tier 0, tag/stage Tier 1/2, post/approve variance Tier 3.
- **States & variants to build:** Candidate unverified, contribution reviewed, playbook published, policy Needs Revalidation.
- **Interactions & hotspots:** Owner review gates publish; source click opens rule; agent creation is separate.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01, DAT-03, DAT-06.
- **Depends on:** CMP-18, CMP-25–28.
- **Build notes & pitfalls:** Preserve owner, source and approved scope. Policy change in DAT-09 is separate from handling-fee interpretation.
- **Done when:** All six steps and two rules render; equality is auto-accepted; candidate and published state differ; scope does not imply permission.
- **Effort:** M.

### DAT-05 — Simulator scenarios and regression suite
- **Purpose / what the viewer perceives:** Stable, inspectable test cases with expected outcomes and independent version verdicts.
- **Priority:** P0.
- **Appears in:** H-084–H-090, H-112–H-113 (01:49–01:56, 02:17–02:19); L-091–L-104, L-136–L-138 (01:28–01:42, 02:13–02:16).
- **Canvas & layout:** CMP-17 four-by-seven base grid; CMP-32 six regression rows.
- **Visual spec:** CMP-06 verdict glyphs; full name available to accessible label and replay.
- **Exact content:** The following are complete fixture rows. Every row marked `P/P` means `Passed` in both v0.1 and v0.2; `S/S` means `Passed — Expected Safe Escalation` in both. SCN-022 alone changes `Failed` to `Passed`.

| ID | Input and expected business result | v0.1/v0.2 |
|---|---|---|
| SCN-001 | Exact invoice/PO match; stage and verify | P/P |
| SCN-002 | Brightwater ordinary invoice; match | P/P |
| SCN-003 | Copperline ordinary invoice; match | P/P |
| SCN-004 | Northgate ordinary invoice; match | P/P |
| SCN-005 | Orchard Lane ordinary invoice; match | P/P |
| SCN-006 | Harlow ordinary invoice; match | P/P |
| SCN-007 | Vantage ordinary invoice; match | P/P |
| SCN-008 | Meadowbrook ordinary invoice; match | P/P |
| SCN-009 | Approved vendor and matching PO reference; match | P/P |
| SCN-010 | Invoice lines in different order; verify total | P/P |
| SCN-011 | Invoice has multiple matching lines; verify total | P/P |
| SCN-012 | Zero variance, two-decimal formatting; match | P/P |
| SCN-013 | Case-insensitive PO prefix; identify approved record | P/P |
| SCN-014 | Approved invoice date; match | P/P |
| SCN-015 | Existing tax amount covered by PO; match | P/P |
| SCN-016 | Approved handling line covered by terms; match | P/P |
| SCN-017 | Variance below threshold; accept within match | P/P |
| SCN-018 | Variance one cent below threshold; accept within match | P/P |
| SCN-019 | Negative variance within threshold; accept within match | P/P |
| SCN-020 | Already matched record with evidence; avoid duplicate write | P/P |
| SCN-021 | Verification readback matches staged values; verified complete | P/P |
| SCN-022 `variance_exactly_2.00pct` | Exact 2.00%; auto-accept within match | Failed/Passed |
| SCN-023 | Missing PO, Ironbark; escalate | S/S |
| SCN-024 | Missing PO, Sable; escalate | S/S |
| SCN-025 | Duplicate invoice; stop and escalate | S/S |
| SCN-026 | Variance above 2.00%; request Tier 3 approval | S/S |
| SCN-027 | ERP submit timeout; hold Outcome Unknown, do not resubmit | S/S |
| SCN-028 | Unreadable PDF; stop and escalate | S/S |

`SIM-AP-RECON`: v0.1 `{passed:21,safe:6,failed:1}`; v0.2 `{passed:22,safe:6,failed:0}`. Replay SCN-022 `Expected: accept`, `Actual: escalate`; corrected comparison `> 2.00% requires approval`. Extend without replacing those rows:

| ID | Regression input and expected v1.1 outcome |
|---|---|
| SCN-029 | Kestrel layout v2, $4,175 subtotal + $38.50 handling = $4,213.50, PO terms cover fee — Passed |
| SCN-030 | Kestrel layout v2, same handling line appears after subtotal with different spacing — Passed |
| SCN-031 | Kestrel layout v2, handling line before total, permitted terms — Passed |
| SCN-032 | Kestrel layout v2, zero handling amount under permitted terms — Passed |
| SCN-033 | Kestrel layout v2, handling label capitalization differs, permitted terms — Passed |
| SCN-034 | Kestrel layout v2, approved handling line uses an additional separating rule above the total — Passed |

`SIM-AP-RECON-34` = all 28 base rows + six additions; v1.1 `{passed:28,safe:6,failed:0}`.
- **States & variants to build:** Not Run, running, completed by immutable version, canceled/incomplete. Never turn an unfinished scenario into a pass.
- **Interactions & hotspots:** SCN-022 tile opens replay; run/re-run use guarded events.
- **Animations needed in-component:** No fixture animation; runtime drives active state.
- **Data bound:** DAT-04, DAT-06–07.
- **Depends on:** CMP-17, CMP-30, CMP-32.
- **Build notes & pitfalls:** SCN-023–028 are six edge/negative cases; all six safe escalations count as passing intended outcomes. Original failure plus five nearby variants makes six added cases.
- **Done when:** IDs are unique; 28 base rows and six additions exist; 21/6/1 → 22/6/0 → 28/6/0; historical v0.1 remains failed.
- **Effort:** L.

### DAT-06 — Agent versions
- **Purpose / what the viewer perceives:** A fixed candidate, evaluated revisions and released version rather than a mutable agent.
- **Priority:** P0.
- **Appears in:** H-077–H-093, H-111–H-116, H-124 (01:42–01:59, 02:16–02:22, 02:29–02:30); L-075–L-109, L-135–L-145 (01:12–01:47, 02:12–02:23).
- **Canvas & layout:** CMP-27 definition, CMP-34 version list and CMP-16 diff.
- **Visual spec:** Mono 12/18 IDs, neutral status badges and evidence-backed verdict glyphs.
- **Exact content:** `Supplier Invoice Reconciler`; intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` Rows: `agent v0.1 | candidate | SIM-AP-RECON | 21 Passed | 6 Passed — Expected Safe Escalation | 1 Failed`; `agent v0.2 | candidate | SIM-AP-RECON | 22 Passed | 6 safe | 0 Failed`; `agent v1.0 | released | Stage 3 Supervised Assist | AP East`; `agent v1.1 | repair candidate | SIM-AP-RECON-34 | 28 Passed | 6 safe | 0 Failed`; `playbook v1.0 | Approved for Guidance`.
- **States & variants to build:** Candidate, evaluated, approved/released, repair candidate, limited release, expanded.
- **Interactions & hotspots:** Compare/restore actions are controlled by RT-01/02.
- **Animations needed in-component:** None.
- **Data bound:** DAT-04–05, DAT-07.
- **Depends on:** CMP-27, CMP-34.
- **Build notes & pitfalls:** Agent v1.0 and playbook v1.0 are separate objects; evaluation results never mutate.
- **Done when:** Five rows and kinds are distinct; suite association matches each version; only released v1.0 starts JOB-0117.
- **Effort:** S.

### DAT-07 — Incident, correction, repair and rollout
- **Purpose / what the viewer perceives:** A specific format change is contained, corrected, tested and cautiously released.
- **Priority:** P0.
- **Appears in:** H-102–H-116 (02:07–02:22); L-124–L-144 (02:01–02:22).
- **Canvas & layout:** CMP-29–33.
- **Visual spec:** Status badges and dark theme per CMP-01/06; source evidence is individually linked.
- **Exact content:** `INC-0042`; agent v1.0; `Required amount could not be verified on 3 Kestrel invoices`; affected `INV-48231`, `INV-48233`, `INV-48236`; `Contained`; hypothesis `supplier document format change`, status `unconfirmed`. Evidence `E-0042-01 | INV-48231 | Invoice $4,213.50`; `E-0042-02 | PO-1051 | PO $4,175.00`; `E-0042-03 | INV-48231 | $38.50 handling line after subtotal`; `E-0042-04 | AP-RULE-017 | Approved terms cover handling fee`. Elena manually completes INV-48231, answers `Yes; billed on top of subtotal and within approved terms` to `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?`. `REP-0042-1`, from v1.0 to v1.1, `Kestrel Components layout v2 only`, step `Interpret invoice totals`; before `Do not include a separately positioned handling line without verified terms`; after `Include the handling line when approved Kestrel terms cover it`; `permissionsChanged:false`, `policyChanged:false`, `scenariosAdded:6`. Release `Kestrel Components invoices / AP East`; first `3/3 Verified Complete`; owner Marcus; stop on regression or unknown; disposition `Repaired - Validated`.
- **States & variants to build:** Contained, manual correction, scope validated, regression pending/running/passed, limited release, expansion, closed.
- **Interactions & hotspots:** P(960,398) evidence; P(840,440) save correction; P(1080,570) evaluate; P(1080,510) expand when authorized.
- **Animations needed in-component:** None in fixture; state changes at explicit frames.
- **Data bound:** DAT-01, DAT-04–06, DAT-09.
- **Depends on:** CMP-18, CMP-29–33.
- **Build notes & pitfalls:** INV-48233 and INV-48236 amounts are unknown. SME answer does not create policy or require invented Daniel approval.
- **Done when:** Three cases are held first; $38.50 difference matches evidence; only interpretation changes; release requires 34 passing intended outcomes and owner.
- **Effort:** M.

### DAT-08 — Meeting commitment and source evidence
- **Purpose / what the viewer perceives:** A meeting proposal becomes a reviewed commitment with a source and qualifier.
- **Priority:** P0.
- **Appears in:** H-065–H-069, H-109 (01:30–01:35, 02:14–02:15); L-050–L-056, L-133 (00:47–00:54, 02:10–02:11).
- **Canvas & layout:** CMP-42 transcript and card; CMP-36 contextual reminder.
- **Visual spec:** Quotes Crimson Text 16/24; source timestamps mono 12/18.
- **Exact content:** `{title:'Confirm Kestrel handling-fee terms in writing', owner:'Priya Nair', source:'Zoom 00:14:32', originalDue:'Fri 17:00', confirmedDue:'Fri 12:00', qualifier:'subject to company approval', consent:'per-meeting opt-in'}`. Dana and Priya quotations are verbatim in CMP-42.
- **States & variants to build:** Consent absent, proposed, edited, confirmed, reminder; no invented cross-meeting identity.
- **Interactions & hotspots:** Edit deadline P(1050,342); confirm P(1090,562); reminder shown only in Kestrel vendor context.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01, DAT-07.
- **Depends on:** CMP-18, CMP-36, CMP-42.
- **Build notes & pitfalls:** Recording indicator requires separate meeting consent; confirmation is not a policy change.
- **Done when:** Timestamp, both due times and qualifier agree; no recording before consent; reminder references confirmed deadline.
- **Effort:** S.

### DAT-09 — Versions, analytics and policy impact
- **Purpose / what the viewer perceives:** Honest version history and separately scoped operational views.
- **Priority:** P0.
- **Appears in:** H-120–H-125, H-132 (02:25–02:31, 02:37–02:38); L-145–L-150, L-155–L-156 (02:22–02:28, 02:32–02:34).
- **Canvas & layout:** CMP-34 timeline, CMP-40 cards, CMP-16 policy diff.
- **Visual spec:** Mono numeric values, explicit `Needs Revalidation` warning.
- **Exact content:** Version rows DAT-06. Policy `Invoice approval threshold 2.00% → 1.50%, effective Dec 1`; impact `1 playbook`, `1 agent`, `34 tests`, `Needs Revalidation`; propose boundary tests. Job snapshot DAT-02; incident `1 contained incident` in separate population; release `v1.1 limited cohort` then `Repaired - Validated`.
- **States & variants to build:** Before policy change, impact marked, proposed tests; X-ray scope/evidence-quality, no fabricated numerical aggregates.
- **Interactions & hotspots:** Review boundary tests; compare and authorized restore affect future work only.
- **Animations needed in-component:** None.
- **Data bound:** DAT-02, DAT-05–07.
- **Depends on:** CMP-16, CMP-34, CMP-40.
- **Build notes & pitfalls:** X-ray pilot eligibility requires at least five enrolled participants; do not infer such participation. No invented time saved.
- **Done when:** 34 tests match regression suite; policy date is present; job and incident populations are distinct.
- **Effort:** S.

### DAT-10 — Notifications
- **Purpose / what the viewer perceives:** A recipient-specific queue of actionable but non-resolving notices.
- **Priority:** P0.
- **Appears in:** H-069, H-127 (01:34–01:35, 02:32–02:33); L-056, L-158 (00:53–00:54, 02:35–02:36).
- **Canvas & layout:** CMP-35 cards, one CMP-11 toast at a time.
- **Visual spec:** Text and distinct kind glyph; no raw private media.
- **Exact content:** `N-01 | Daniel | Approval Required | INV-48219`; `N-02 | Marcus | INC-0042 Contained | three Kestrel cases paused`; `N-03 | Priya | Confirm Kestrel handling-fee terms in writing | Fri 12:00 | NetSuite vendor record`; `N-04 | Marcus | Repair Ready | REP-0042-1`; `N-05 | Marcus | Release Status | v1.1 limited cohort`.
- **States & variants to build:** Eligible by lifecycle and recipient, unread/read, dismissed; N-04 after pass, N-05 after authorization.
- **Interactions & hotspots:** Open follows linked object and checks scope; dismiss changes notice only.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01–02, DAT-07–08, RT-01.
- **Depends on:** CMP-11, CMP-35–36.
- **Build notes & pitfalls:** Never stack attention toasts or treat notification delivery as completion.
- **Done when:** Five rows are correct; visibility follows state; recipients see only authorized data.
- **Effort:** S.

### DAT-11 — Audit history
- **Purpose / what the viewer perceives:** Ordered, attributable history without invented timestamps.
- **Priority:** P0.
- **Appears in:** H-126 (02:31–02:32); L-157 (02:34–02:35).
- **Canvas & layout:** CMP-07 dense audit table, CMP-15 event timeline.
- **Visual spec:** Mono event identifiers; actor, event, object, scope and outcome each get their own column.
- **Exact content:** `A01 Priya consent`; `A02 Priya and Jamal approve their respective sanitized Demonstrations`; `A03 Marcus publishes PB-AP-RECON v1.0`; `A04 Marcus approves release v1.0 within AP East`; `A05 authorized operator starts JOB-0117`; `A06 Daniel approves INV-48219`; `A07 independent readback verifies that case`; `A08 Marcus contains INC-0042`; `A09 Elena records correction`; `A10 Marcus validates Kestrel-only scope`; `A11 regression evaluation completes`; `A12 Marcus authorizes limited release`; `A13 three cohort outcomes verified`; `A14 Marcus expands and closes`; `A15 authorized user exports audit pack`.
- **States & variants to build:** Ordered immutable facts up to current snapshot; future rows absent until their event.
- **Interactions & hotspots:** P(1110,136) opens export confirmation with scope; unauthorized action provides reason.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01–02, DAT-04–07.
- **Depends on:** CMP-07, CMP-09, CMP-15.
- **Build notes & pitfalls:** Store `{id,actor,action,object,scope,outcome,order}`. If actor/time is unspecified, keep it unspecified; do not invent.
- **Done when:** Fifteen ordered event definitions exist; export excludes raw media; earlier views cannot show future events.
- **Effort:** M.

### DAT-12 — Application adapters and capability matrix
- **Purpose / what the viewer perceives:** Exact supported features and honest unavailable intersections.
- **Priority:** P0.
- **Appears in:** H-129–H-131, H-139 (02:34–02:37, 02:44–02:45); L-159–L-161 (02:36–02:39).
- **Canvas & layout:** CMP-39 five columns × seven rows.
- **Visual spec:** Every absent capability shows `— Unavailable`; conditional Zoom cell is explicit text.
- **Exact content:** Columns `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`. Rows (`A`=Available, `U`=Unavailable):

| App | Observe | Guide | Assist | Run Supervised | Run Autonomously |
|---|---|---|---|---|---|
| Gmail | A | A | A | U | U |
| NetSuite | A | A | U | A | U |
| Google Sheets | A | A | U | A | U |
| Slack | A | A | U | U | U |
| Zoom | A, per-meeting opt-in | A | U | U | U |
| HubSpot | A | A | A | U | U |
| Chrome | A | A | U | U | U |

Other gray-mark-only tiles: `Salesforce`, `Outlook`, `Excel`, `Teams`, `Meet`, `Edge`; no support status implied.
- **States & variants to build:** Available, unavailable, conditional opt-in.
- **Interactions & hotspots:** Available cell opens details; unavailable cell explains no action.
- **Animations needed in-component:** None.
- **Data bound:** RT-02 authority remains separate.
- **Depends on:** CMP-39.
- **Build notes & pitfalls:** Do not infer authorization from a capability. Only original simplified UIs and small nominative marks are permitted.
- **Done when:** 35 cells are explicit; Zoom condition is present; gray-only tiles have no capability claim.
- **Effort:** S.

### DAT-13 — Copy strings and sourced facts
- **Purpose / what the viewer perceives:** Stable product copy and accurately attributed external context.
- **Priority:** P0.
- **Appears in:** H-018–H-020, H-025, H-057–H-061, H-123 (00:34–00:40, 00:48–00:50, 01:22–01:27, 02:28–02:29); L-035–L-043, L-153 (00:32–00:41, 02:30–02:31).
- **Canvas & layout:** CMP-13 consent rows, CMP-43 masking, CMP-44 source line.
- **Visual spec:** Mono 12/18 labels, minimum 11/16 citation; foreground on surface.
- **Exact content:** `Your work, your choice`; `Accept and continue`; `Work applications`; `Excluded windows`; `Excluded apps, windows and URLs`; `Local retention: 7 days`; `Delete local history`; `Pause observation`; `BANK ACCT`, `TAX ID`, `CARD`; `Requires Tier 3 approval - Daniel Okafor`; `Request approval`. External facts: `Ardent Partners · Payables Place · 2026`; `$9.90 / invoice`; `11.6 days`; source `https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/`. Gartner `over 40% of agentic AI projects forecast canceled by end of 2027` (2025; verify wording before publication). McKinsey Global Institute 2012: `about 19% of interaction workers' workweek spent searching for and gathering information`.
- **States & variants to build:** Notice, accepted, exclusions, pause, blocked action; authoritative and suggested labels distinct.
- **Interactions & hotspots:** Consent choices are independent; blocked 12% discount allows request, not execution.
- **Animations needed in-component:** None.
- **Data bound:** RT-01/02 and script-specific captions.
- **Depends on:** CMP-13, CMP-43–44.
- **Build notes & pitfalls:** Do not invent metrics or real IBM Bob findings; no claim of live production. Avoid on-screen prototype disclosure.
- **Done when:** Copy matches exact punctuation; source years appear; no unsupported statistics; exclusions cannot be disabled.
- **Effort:** S.

## State and deterministic runtime

### RT-01 — ST01–ST24 reducer, guards and selectors
- **Purpose / what the viewer perceives:** Every component agrees on one coherent lifecycle, and visible progress follows explicit decisions.
- **Priority:** P0.
- **Appears in:** H-057–H-132 (01:22–02:38); L-035–L-160 (00:32–02:38).
- **Canvas & layout:** No visual box; binds each component within its host at the documented authored coordinates.
- **Visual spec:** State determines CMP-06 status and CMP-01 theme; execution flags alone turn on arc cyan.
- **Exact content:** State IDs, actions, guards and view bindings:

| State | View binding | Action → next state | Guard/effect |
|---|---|---|---|
| ST01 enrollment | SC02/03 | `CONSENT` → ST02 | notice accepted, relevant capture category selected; only permitted observation |
| ST02 observation | SC01/05–09 | `REVIEW_MEETING` → ST03 | per-meeting notice and consent |
| ST03 meeting_review | SC11 | `CONFIRM_COMMITMENT` → ST04 | Priya reviews and confirms Fri 12:00; preserve source and qualifier |
| ST04 candidate_review | SC13/14 | `PUBLISH` → ST05 | contributor review and authorized owner approval |
| ST05 playbook_published | SC15 | `CREATE_AGENT` → ST06 | owner creates v0.1 candidate; not deployed |
| ST06 agent_draft | SC17/18 | `RUN_SIMULATION` → ST07 | sealed 28-case suite, candidate pinned |
| ST07 simulation_running | SC19 | `COMPLETE_SIMULATION` → ST08 or ST09 | v0.1 21/6/1 → ST08; v0.2 22/6/0 → ST09; canceled stays incomplete |
| ST08 simulation_failed | SC20 | `FIX_AND_RUN` → ST07 | create v0.2, correct equality comparator, preserve old evaluation |
| ST09 simulation_passed | SC20/18 | `RELEASE_AND_START` → ST10 | 5/5 examples, ≥25 correct scenarios including ≥5 edge/negative, owner approval, scope confirmation and action authorization; v1.0 |
| ST10 job_running | SC21/22 | `PAUSE_FOR_APPROVAL` → ST11 | fixed case events produce 7/2/1/1; unknown held |
| ST11 approval_required | SC23–25 | `APPROVE`, `VERIFY_READBACK`, then next-cycle incident → ST12 | Daniel's valid Tier 3 delegation; separate readback changes 7/2/1/1 to 8/2/0/1; unknown remains held |
| ST12 incident_open | SC26 | `TEACH` → ST13 | contain and pause three cases before Elena manually completes INV-48231 |
| ST13 correction_captured | SC27 | `PROPOSE_REPAIR` → ST14 | Marcus validates Kestrel layout v2 scope; no policy/permission change |
| ST14 repair_testing | SC28 | `LIMITED_RELEASE` → ST15 | 34 completed scenarios, 28/6/0 and owner authorization |
| ST15 limited_release | SC29 | `EXPAND_AND_CLOSE` → ST16 | 3/3 independently verified plus owner approval; expansion then incident closure |
| ST16 rollout_expanded_closed | SC29 | `OPEN_MONTAGE` → ST17 | retain history and `Repaired - Validated` |
| ST17 ops_map | SC16 | `NEXT` → ST18 | presentation navigation only |
| ST18 peer_guidance | SC04 | `NEXT` → ST19 | published peer guidance, no private evidence |
| ST19 policy_revalidation | SC31 | `NEXT` → ST20 | 1 playbook, 1 agent, 34 tests marked |
| ST20 unsafe_blocked | SC10/32 | `NEXT` → ST21 | 12% discount remains blocked pending Tier 3 |
| ST21 versions | SC30 | `NEXT` → ST22 | historical versions remain immutable |
| ST22 command_center | SC33 | `NEXT` → ST23 | scope and source populations remain separate |
| ST23 audit_export | SC34 | `NEXT` → ST24 | export requires authorized scope |
| ST24 notifications | SC35 | `RESET` → ST01 | earlier views may be navigated without rewriting history |

- **States & variants to build:** Keep `domainPhase` separate from `route`, `actor`, `theme`, `running`, `selectedCase`, `selectedScenario`, `consent`, `evaluations`, `jobCases`, `approval`, `readback`, `incident`, `repair`, `release`, `notifications`, `audit`. Substates permit approved-but-not-verified and incomplete evaluation without pretending a new ST exists.
- **Interactions & hotspots:** All CMP actions dispatch typed actions through this same reducer; failed guards retain state and give an explicit reason.
- **Animations needed in-component:** None; RT-03 samples event-local visual progress.
- **Data bound:** DAT-01–13.
- **Depends on:** RT-02, RT-03.
- **Build notes & pitfalls:** Selectors derive `jobCounts`, `gateSatisfied`, `suiteVerdicts`, `isRunning`, `currentRole`, `visibleNotifications`, `accessibleEvidence` and audit slice. Do not store duplicate counters. Direct deep links reconstruct prerequisites rather than silently bypassing guards.
- **Done when:** Every ST has named entry and exit; approval and readback are separate; mixed counts stay consistent; seeking backward restores exact earlier state; guard failures are explained.
- **Effort:** XL.

### RT-02 — Role and permission switching
- **Purpose / what the viewer perceives:** The selected viewpoint is not an authorization bypass.
- **Priority:** P0.
- **Appears in:** H-056–H-057, H-074–H-075, H-098–H-100, H-110–H-116 (01:21–01:23, 01:39–01:41, 02:03–02:06, 02:15–02:22); L-035–L-036, L-115–L-118, L-139–L-144 (00:32–00:34, 01:52–01:56, 02:16–02:22).
- **Canvas & layout:** No independent surface; CMP-37 selector and authorization explanations in CMP-31.
- **Visual spec:** Use named role chips and text explanations; no green check without valid scope.
- **Exact content:** `Employee`, `Workflow Owner`, `Approver`, `Admin`; `Daniel Okafor · Tier 3`; `Requires Tier 3 approval - Daniel Okafor`; `Correction is evidence, not new policy`.
- **States & variants to build:** Priya employee, Jamal employee, Marcus owner, Elena SME, Daniel delegated approver, Tomas admin; authorization absent/wrong scope/valid. Access = union of granted roles minus explicit restrictions.
- **Interactions & hotspots:** P(135,54) changes demo viewpoint to an assigned identity; approve checks actor, delegation, action, tier, object, scope and current policy. Admin cannot access raw employee evidence or approve finance by default.
- **Animations needed in-component:** None.
- **Data bound:** DAT-01, DAT-04, DAT-07, DAT-12.
- **Depends on:** CMP-31, CMP-37, RT-01.
- **Build notes & pitfalls:** Per-meeting consent, cloud inference authorization, contribution sharing, workflow publication, release and action approval are separate grants. An SME can correct an example without changing policy.
- **Done when:** Unauthorized actor cannot approve; role switch does not create delegation; private raw capture stays local; all blocked actions explain the specific guard.
- **Effort:** M.

### RT-03 — Deterministic film runtime scaffold
- **Purpose / what the viewer perceives:** Identical component state and animation at every frame, forward, backward or rendered independently.
- **Priority:** P0.
- **Appears in:** H-001–H-154 (00:00–03:00); L-001–L-176 (00:00–03:00); this item specifies only component-facing runtime, not Part C's visual overlays.
- **Canvas & layout:** Fixed authored viewport 1280×720, DPR 2 capture, 60fps, 10800 frames; components use local frames and never viewport-dependent random placement.
- **Visual spec:** Product UI transition 150ms `cubic-bezier(.4,0,.2,1)`; optional reveal 500–900ms `cubic-bezier(.16,1,.3,1)`, stagger 60ms capped at 360ms; reduced motion yields static readable states.
- **Exact content:** Typed interface:

```ts
type Event =
  | { frame: number; seq: number; type: 'action'; action: Action }
  | { frame: number; seq: number; type: 'camera'; from: [number, number, number]; to: [number, number, number]; duration: number; easing: 'reveal' }
  | { frame: number; seq: number; type: 'cursor'; from: [number, number]; c1: [number, number]; c2: [number, number]; to: [number, number]; duration: number; click: boolean }
  | { frame: number; seq: number; type: 'type'; target: string; text: string; charsPerSecond: number; seed: number }
  | { frame: number; seq: number; type: 'overlay'; id: string; visible: boolean };
type Timeline = { fps: 60; durationFrames: 10800; seed: number; events: readonly Event[] };
type FilmClock = { frame: number; seconds: number; reducedMotion: boolean };
type SampledMotion = { progress: number; active: boolean; complete: boolean };
```

`resolveFrame(timeline,frame)` sorts events by `(frame,seq)`, reduces all actions up to that frame from immutable initial state, then derives view and active interpolations. Sample a clamped local-frame fraction; type at 28–34 characters/second with a stateless hash of `(seed,target,charIndex)` and bounded monotonic jitter. Expose `useFilmClock()` and `sampleMotion(startFrame,durationFrames,easing)` as pure reads. Capture waits for bundled fonts and decoded assets before the clock starts.
- **States & variants to build:** Interactive mode dispatches same actions; film mode is time→state only; reduced motion static; running orbit is phase `(frame-startFrame)/108 mod 1` and freezes neutral when stopped.
- **Interactions & hotspots:** Components receive props and dispatch callbacks, never read cursor state; queries `/app?screen=SC22&state=ST10`, `/film/hackathon?frame=0`, `/film/launch?frame=0` validate allowed IDs and combinations.
- **Animations needed in-component:** Only properties named by component; use transforms/opacity, avoid layout animation, timers, random, network, wall clock and uncontrolled CSS infinite keyframes.
- **Data bound:** DAT-01–13, RT-01.
- **Depends on:** CMP-01–02, RT-01.
- **Build notes & pitfalls:** Fix locale `en-US`, timezone `America/New_York`, viewport and font bytes. Type events must not reorder characters. Reconstruct state from scratch, never depend on the prior captured frame. Camera/cursor event schemas are shared interfaces; implementation of their visuals is Part C.
- **Done when:** Frame 720 resolves identically after any seek; same-frame event order is stable; typed text is repeatable; no cyan remains when execution ends; reduced-motion output preserves all labels.
- **Effort:** L.

## Checklist

| ID | Name | Priority | Effort | Depends on | Appears in (entry IDs, first and last) | Done [ ] |
|---|---|---|---|---|---|---|
| CMP-01 | Tokens and global CSS | P0 | M | CMP-02 | H-055–H-132; L-035–L-160 | [ ] |
| CMP-02 | Font loading and type scale | P0 | S | CMP-01 | H-055–H-141; L-035–L-160 | [ ] |
| CMP-03 | Button | P0 | S | CMP-01–02, CMP-08 | H-058–H-123; L-035–L-153 | [ ] |
| CMP-04 | Input and textarea | P0 | S | CMP-01–02 | H-067–H-079; L-053–L-079 | [ ] |
| CMP-05 | Select and tabs | P0 | S | CMP-01–02, CMP-11 | H-056–H-082; L-035–L-089 | [ ] |
| CMP-06 | Badge and status badge | P0 | M | CMP-01–02 | H-071–H-132; L-058–L-160 | [ ] |
| CMP-07 | Dense table | P0 | M | CMP-01–03, CMP-06 | H-093–H-127; L-108–L-160 | [ ] |
| CMP-08 | Lifecycle stepper and loader | P0 | M | CMP-01, CMP-06 | H-084–H-090; L-059–L-103 | [ ] |
| CMP-09 | Drawer and dialog | P0 | M | CMP-03, CMP-06, CMP-18, CMP-31 | H-074–H-101; L-095–L-120 | [ ] |
| CMP-10 | Popover and tooltip | P0 | S | CMP-01–03 | H-060–H-083; L-037–L-089 | [ ] |
| CMP-11 | Toast and command palette | P0 | M | CMP-03–04, CMP-06, CMP-09 | H-127; L-016–L-158 | [ ] |
| CMP-12 | Breadcrumb, keycap, separator, avatar | P0 | S | CMP-01–02 | H-055–H-132; L-035–L-160 | [ ] |
| CMP-13 | Switch and checkbox | P0 | S | CMP-01–02 | H-057–H-060; L-035–L-038 | [ ] |
| CMP-14 | Progress, skeleton, scroll area | P0 | S | CMP-01, CMP-06 | H-084–H-112; L-092–L-137 | [ ] |
| CMP-15 | Timeline | P0 | M | CMP-06, CMP-12, CMP-18 | H-124–H-126; L-145–L-157 | [ ] |
| CMP-16 | Before/after diff | P0 | M | CMP-06, CMP-18 | H-088–H-124; L-104–L-145 | [ ] |
| CMP-17 | Scenario grid and tile | P0 | L | CMP-06, CMP-14, CMP-16 | H-084–H-113; L-091–L-138 | [ ] |
| CMP-18 | Evidence card and source chip | P0 | M | CMP-03, CMP-06, CMP-09 | H-072–H-109; L-073–L-135 | [ ] |
| CMP-19 | Case table and row | P0 | M | CMP-06–07, CMP-09 | H-092–H-097; L-108–L-122 | [ ] |
| CMP-20 | Segmented job progress | P0 | S | CMP-06, CMP-14, CMP-19 | H-093–H-100; L-110–L-123 | [ ] |
| CMP-21 | Risk tier chip | P0 | S | CMP-06, CMP-10 | H-080; L-083–L-084 | [ ] |
| CMP-22 | Autonomy ladder row | P0 | S | CMP-06, CMP-21, CMP-23 | H-081–H-082; L-085–L-089 | [ ] |
| CMP-23 | Gate checklist | P0 | M | CMP-06, CMP-18, CMP-22 | H-082–H-091; L-086–L-107 | [ ] |
| CMP-24 | Demonstration card | P0 | S | CMP-06, CMP-18 | H-070–H-073; L-059–L-073 | [ ] |
| CMP-25 | Candidate workflow card | P0 | M | CMP-06, CMP-18, CMP-24 | H-070–H-073; L-058–L-073 | [ ] |
| CMP-26 | Playbook step, rule, exception | P0 | M | CMP-06, CMP-18, CMP-25 | H-074–H-076; L-062–L-074 | [ ] |
| CMP-27 | Agent definition | P0 | M | CMP-04, CMP-06, CMP-18 | H-077–H-079; L-075–L-081 | [ ] |
| CMP-28 | Scope and permissions list | P0 | M | CMP-05, CMP-21–23, CMP-39 | H-080–H-083; L-082–L-089 | [ ] |
| CMP-29 | Incident card | P0 | M | CMP-06, CMP-18, CMP-30 | H-104–H-106; L-127–L-130 | [ ] |
| CMP-30 | Expected versus actual | P0 | S | CMP-16, CMP-18 | H-086–H-106; L-095–L-130 | [ ] |
| CMP-31 | Approval authority check | P0 | M | CMP-06, CMP-09, CMP-16, CMP-18 | H-098–H-100; L-115–L-118 | [ ] |
| CMP-32 | Regression test list | P0 | M | CMP-06, CMP-14, CMP-17 | H-112–H-113; L-136–L-138 | [ ] |
| CMP-33 | Rollout cohort card | P0 | M | CMP-06, CMP-18, CMP-23 | H-114–H-141; L-139–L-144 | [ ] |
| CMP-34 | Version row and compare | P0 | M | CMP-06–07, CMP-16 | H-088–H-124; L-104–L-145 | [ ] |
| CMP-35 | Notification card | P0 | S | CMP-03, CMP-06, CMP-11 | H-127; L-158 | [ ] |
| CMP-36 | HUD contextual card | P0 | M | CMP-03, CMP-18 | H-069–H-122; L-056–L-152 | [ ] |
| CMP-37 | Role/org selector | P0 | M | CMP-05, CMP-10, CMP-12 | H-056–H-098; L-035–L-115 | [ ] |
| CMP-38 | Search, top bar, nav | P0 | M | CMP-03, CMP-11–12, CMP-35, CMP-37 | H-055–H-132; L-035–L-160 | [ ] |
| CMP-39 | Capability matrix cell | P0 | S | CMP-06–07, CMP-10 | H-129–H-139; L-159–L-161 | [ ] |
| CMP-40 | Metric card | P0 | S | CMP-06, CMP-19 | H-096–H-136; L-122–L-156 | [ ] |
| CMP-41 | React Flow node and edge | P0 | L | CMP-06, CMP-18 | H-117–H-119; L-148 | [ ] |
| CMP-42 | Commitment and transcript | P0 | M | CMP-03–04, CMP-06, CMP-18, CMP-36 | H-065–H-069; L-050–L-056 | [ ] |
| CMP-43 | Redaction/masking field | P0 | S | CMP-01, CMP-13 | H-061; L-040–L-043 | [ ] |
| CMP-44 | Source-line citation | P0 | S | CMP-02 | H-018–H-025; L-018 | [ ] |
| DAT-01 | People and suppliers | P0 | S | RT-02 | H-056–H-127; L-035–L-158 | [x] |
| DAT-02 | Invoices and snapshots | P0 | M | DAT-01, CMP-19–20 | H-092–H-137; L-108–L-123 | [x] |
| DAT-03 | Demonstrations and gate examples | P0 | S | CMP-18, CMP-23–24 | H-064–H-083; L-047–L-073 | [x] |
| DAT-04 | Candidate and playbook | P0 | M | CMP-18, CMP-25–28 | H-071–H-083; L-073–L-089 | [x] |
| DAT-05 | Simulator and regression | P0 | L | CMP-17, CMP-30, CMP-32 | H-084–H-113; L-091–L-138 | [x] |
| DAT-06 | Agent versions | P0 | S | CMP-27, CMP-34 | H-077–H-124; L-075–L-145 | [x] |
| DAT-07 | Incident, repair and rollout | P0 | M | CMP-18, CMP-29–33 | H-102–H-116; L-124–L-144 | [x] |
| DAT-08 | Meeting commitment | P0 | S | CMP-18, CMP-36, CMP-42 | H-065–H-109; L-050–L-133 | [x] |
| DAT-09 | Versions, analytics, policy | P0 | S | CMP-16, CMP-34, CMP-40 | H-120–H-132; L-145–L-156 | [x] |
| DAT-10 | Notifications | P0 | S | CMP-11, CMP-35–36 | H-069–H-127; L-056–L-158 | [x] |
| DAT-11 | Audit history | P0 | M | CMP-07, CMP-09, CMP-15 | H-126; L-157 | [x] |
| DAT-12 | Adapter capability matrix | P0 | S | CMP-39 | H-129–H-139; L-159–L-161 | [x] |
| DAT-13 | Copy strings and sources | P0 | S | CMP-13, CMP-43–44 | H-018–H-123; L-035–L-153 | [x] |
| RT-01 | ST01–ST24 reducer | P0 | XL | RT-02–03 | H-057–H-132; L-035–L-160 | [ ] |
| RT-02 | Role and permissions | P0 | M | CMP-31, CMP-37, RT-01 | H-056–H-116; L-035–L-144 | [ ] |
| RT-03 | Deterministic film scaffold | P0 | L | CMP-01–02, RT-01 | H-001–H-154; L-001–L-176 | [ ] |

## Coverage notes and source conflicts

- Shared contract `local://oryn-story-bible.md:63–65` still says five added repair cases, 33 total, and 27/6/0. Assignment explicitly supersedes it: six new cases, 34 total and 28/6/0. Design spec `oryn-demo-design-and-build.md:329–340`, H-112–H-113 and L-136–L-138 agree with the assignment. Policy impact uses 34 tests accordingly.
- H-096 says `Completed with exceptions` while INV-48220 is unresolved. Design spec `:380` reserves that wording for fully resolved or explicitly handed-off terminal handling; use `Partially complete` for the shown snapshot.
- H-082 displays checks before the simulator has passed. Show pending scenario/owner checks until H-091; L-105 explicitly shows the later satisfied gate.
- H-075 describes `Approved for Guidance` as success-hued, while design spec `:99` specifies neutral shield/check. Use neutral as component canonical.
- H-114 returns release to light; L-144 describes closure on dark. Build both theme variants; each cut selects its scripted theme without a user-visible toggle.
- `oryn-demo-design-and-build.md:149` specifies 96×52 tiles with 8px gaps within 472×416; the tiles themselves occupy 408×412. Center them inside that host rather than stretching them.
- Source timings attached to shared shell/foundations are coverage windows; a screen may be cropped so its chrome is outside the shot. Each component entry identifies specific uses.
- Some exact labels and row details are not defined by source. This part specifies deterministic wording for controls only where necessary; unspecified invoice amounts, audit timestamps and external evidence are deliberately not invented.


---

# Part C — Third-party environments and film-stage inventory

This part specifies the original application skins, desktop surroundings, montage fragments, stage graphics, transitions, and film-preview overlays. Part A owns Oryn product screens; Part B owns reusable product controls, data and reducer states. Reuse their SC/ST/fixture IDs rather than rebuilding those surfaces here. Every rectangle is `[x,y,width,height]` in a 1280×720 authored frame; crop and transform the same underlying surfaces, not their data.

## Shared build contract

- **Skin interior:** white `#FFFFFF` and bone `#F6F6F3`, ink `#0A0A0A`, surface-2 `#EFEFEB`, hairline `#DFDFD8`, trace `#77776E`, signal `#333`; 1px rules; structural radius 0, nested 4px, control 6px, floating card 8px. No stage shadow inside a product or app view. Product floating surfaces use soft `md` shadow `0 4px 10px -2px rgba(0,0,0,.10)`; dialogs use `lg`. Status glyphs: green check for verified, amber triangle for escalation, diamond/person for approval, neutral 45° hatch for unknown, explicit text with each. Cyan `#2FD8FF` only while an operation is executing, never for a static capture indicator, logo, success, or button.
- **Type and icons:** Space Grotesk 400/500/700 for UI, IBM Plex Mono 400/500/600 for data, labels and captions, Crimson Text for human prose. Skin body 14/20, data 12/18, minimum microcopy 11/16, tabular numerals; icons Lucide 14px rows, 16px controls, 20px notices at 1.75px stroke. Product interactions take 150ms `cubic-bezier(.4,0,.2,1)`; film reveals 500–900ms and camera 600–1100ms `cubic-bezier(.16,1,.3,1)`.
- **Interactive conventions:** named targets have at least 44px hit zones, 2px ink focus with 2px offset, Tab/Shift-Tab navigation, Enter/Space activation, Escape dismissal and focus return. Film cursor is a separate overlay; OS/app interactions dispatch Part B's existing reducer actions. A disabled action explains its guard. Static stage art has no tab stops.
- **Film:** 60fps, 10800 frames, frame-index-derived state, transforms, cursor and text; no timers, network, random values or unbounded CSS loops. Capture DPR 2 and deliver 1920×1080. Readbacks, decisions and fixture counts come from shared data; no extra fake authority or invented business amounts. Third-party marks are small nominative identifiers from official, rights-reviewed sources; create every surrounding layout independently. Screenpipe's code, assets and copy are excluded.

## Third-party application views

### APP-01 — SC05 Gmail inbox and message
- **Purpose / what the viewer perceives:** Priya receives supplier invoices and opens the relevant message; the same record survives the cut into its document and ERP.
- **Priority:** P0, both cuts.
- **Appears in:** H-014–H-015 00:26–00:30; H-063 01:28–01:29; H-102–H-103 02:07–02:09; L-009–L-010 00:10–00:11; L-019–L-021 00:16–00:19; L-046–L-047 00:43–00:45.
- **Canvas & layout:** Chrome APP-11 outside; application top search `[0,76,1280,56]`, left rail `[0,132,184,514]`, inbox `[184,132,480,514]`, open-message pane `[184,132,536,514]`; APP-02 occupies right side when open. Rows 48px with 16px padding. Attachment at `[680,250,160,72]` in split composition, recrop for each shot.
- **Visual spec:** Shared skin contract; small official Gmail mark, 1px dividers, 14/20 headings and 12/18 mono IDs; Mail, Search, Paperclip, ArrowLeft icons 16px. No copied Gmail DOM or screenshots.
- **Exact content:** Navigation `Inbox`, `Sent`, `Drafts`; sender `Brightwater Industrial`; recipient `Calder & Vance Supply Co.`; attachment `INV-48219`, `PO-1042`, `$18,420.00`. D1 uses `Priya Nair · Mon 09:14`, `INV-48203`; H-014/015 uses `INV-48210`, `PO-1031`. Incident message uses `Kestrel Components`, `INV-48231` and `$38.50`. Do not manufacture invoice totals for D1 or missing incident amounts.
- **States & variants to build:** Inbox list; Brightwater INV-48219 selected; D1 INV-48203 selected; H2 INV-48210 selected; Kestrel message and PDF selected. Selection changes record identity and evidence together, never one field alone. ST02 is observed human work; incident document appears before ST12.
- **Interactions & hotspots:** Inbox row `[200,160,460,48]` opens corresponding message; attachment hotspot near `(745,286)` opens APP-02; Back returns to list. Tab follows navigation, rows and attachment in visual order.
- **Animations needed in-component:** Message selection and split-pane reveal 150ms UI easing, no loop; reduced motion swaps immediately. Camera crop is FRT-04, not a nested animated layout.
- **Data bound:** Part B invoices, demonstrations D1, incident INC-0042; current fixture ID selects all labels.
- **Depends on:** APP-02, APP-12, APP-13; Part B fixture selectors and ST02/ST12.
- **Build notes & pitfalls:** The problem montage and observed demonstration use different invoice IDs. Keep URL fictional; status indicator is visible but is not cyan just because observation is enabled.
- **Done when:** Inbox opens a matching message; attachment and document use identical ID; all three story contexts show correct supplier; no private account identifier appears.
- **Effort:** L.

### APP-02 — SC05 invoice PDF and document variants
- **Purpose / what the viewer perceives:** The original source document is readable, including the Brightwater amount and the later Kestrel layout change.
- **Priority:** P0.
- **Appears in:** H-014–H-015 00:26–00:30; H-023 00:44–00:46; H-063 01:28–01:29; H-102–H-103 02:07–02:09; L-008–L-010 00:08.50–00:11; L-046–L-047 00:43–00:45; L-125–L-126 02:02–02:04.
- **Canvas & layout:** Viewer `[720,132,560,514]`, 40px toolbar, white page `[780,188,440,420]`, 32px inset; document header top, 1px rule, identification grid, item/subtotal area and bottom total. Kestrel comparison uses overlapping paper sheets at `[300,155,330,440]` and `[600,130,360,460]`.
- **Visual spec:** Bone viewer gutter, white page, 1px warm edge, flat interior, document labels 12/18 mono, total 20/28 Space Grotesk 700; FileText and Download 16px. Stage wrapper alone may add 2px outline and hard offset.
- **Exact content:** Brightwater `Brightwater Industrial`, `INV-48219`, `PO-1042`, `Invoice total`, `$18,420.00`. Kestrel `Kestrel Components`, `INV-48231`, `PO-1051`, `Subtotal $4,175.00`, `Handling fee $38.50`, `Total $4,213.50`; PO comparison `$4,175.00`. D1 and INV-48210 use their IDs and known suppliers only. Avoid invented item lines, taxes, addresses or dates.
- **States & variants to build:** Brightwater hero PDF; D1/INV-48210 context documents; Kestrel v1 versus v2 overlapping paper; v2 fee line after subtotal highlighted with ink 1px rectangle. The fee's existence is observed; cause remains unconfirmed.
- **Interactions & hotspots:** Attachment `(745,286)` opens viewer; select invoice text near `(830,390)` to show selection; viewer close returns to APP-01. No download operation is required in film.
- **Animations needed in-component:** PDF enters 150ms; two Kestrel sheets cross-slide 600ms, rectangle draws 300ms; no looping. Reduced motion uses static end frames.
- **Data bound:** invoice INV-48219 and incident evidence E-0042-01–04; D1 and INV-48210.
- **Depends on:** APP-01 and APP-03, STG-01, FRT-04.
- **Build notes & pitfalls:** Use selectable HTML/SVG, not a real vendor PDF or screenshot. Render 2.45% only from the separate PO comparison; do not place the full variance as a supplier claim.
- **Done when:** Both Brightwater identifiers and total read in the crop; Kestrel arithmetic sums correctly; v2 fee follows subtotal; unspecified case values remain absent.
- **Effort:** M.

### APP-03 — SC06 NetSuite vendor bill and PO match
- **Purpose / what the viewer perceives:** An ERP match preserves invoice and purchase-order values, and holds a consequential discrepancy for review.
- **Priority:** P0.
- **Appears in:** H-015 00:28–00:30; H-021–H-022 00:40–00:44; H-064 01:29–01:30; L-011 00:11–00:11.50; L-048 00:45–00:46; L-115–L-118 01:52–01:56.
- **Canvas & layout:** 48px application header below browser; section rail `[0,124,200,522]`; bill `[240,152,464,420]`, PO `[728,152,456,420]`; 16px grid, 40px fields; action row at `[900,576,284,48]`.
- **Visual spec:** Original neutral ERP form; small NetSuite mark, 1px hairlines, squared sections; 14/20 sans labels, 12/18 mono values; FileText, Link, TriangleAlert and ShieldCheck 16px. `Variance Hold` uses warning shape and text, no full cyan field.
- **Exact content:** `Vendor Bill`, `Brightwater Industrial`, `INV-48219`, `PO-1042`, `Invoice total $18,420.00`, `PO total $17,980.00`, `Variance $440.00`, `2.45%`, `Variance Hold`, `Match purchase order`, `Stage`; after authorized approval and independent readback `Matched - Variance Approved`. H2 alternate `INV-48210`, `PO-1031`, `$6,240.00`; D1 alternate `INV-48203` with no invented PO.
- **States & variants to build:** Open bill, linked PO, preapproval variance hold, approval decision pending readback, verified readback. A completed click never auto-applies the verified state. ST02 uses human form; ST11 uses approved action plus later verification.
- **Interactions & hotspots:** PO `(820,374)` opens PO panel; Stage `(1060,598)` routes to SC23 approval when over 2%; selecting readback shows approved status only after Part B verification event. Focus outlines and disabled guard copy remain visible.
- **Animations needed in-component:** Tab/field selection and panel update 150ms; no looping; reduced motion immediate.
- **Data bound:** INV-48219, PO-1042, AP-RULE-009, JOB-0117 snapshots; D1, INV-48210.
- **Depends on:** APP-12, APP-02, SC23 and Part B ST02/ST11.
- **Build notes & pitfalls:** The exact comparison is `(18420−17980)/17980`, displayed 2.45%; use integer cents. At exactly 2.00% the policy auto-accepts within match; this case exceeds it.
- **Done when:** Both totals and variance are readable simultaneously; preapproval says Variance Hold; approval alone does not show verified; readback displays correct match status.
- **Effort:** L.

### APP-04 — SC06 Kestrel vendor record and contextual reminder
- **Purpose / what the viewer perceives:** The confirmed commitment resurfaces only in the supplier's relevant ERP context.
- **Priority:** P0.
- **Appears in:** H-069 01:34–01:35; L-056 00:53–00:54.
- **Canvas & layout:** NetSuite shell as APP-03; vendor card `[240,152,920,420]`, identity heading `[272,180,600,40]`; SC04 reminder `[900,148,320,144]` or lower-right alternate `[900,430,320,144]`, clear of record fields and subtitles.
- **Visual spec:** Flat white record and warm rules; floating SC04 card uses 8px radius, 1px border and shadow-md. Building2, Bell and ExternalLink 16px; no stage offset on HUD.
- **Exact content:** `Vendor`, `Kestrel Components`, `Confirm Kestrel handling-fee terms in writing`, `Priya Nair`, `Fri 12:00`, `subject to company approval`; source `Zoom · 00:14:32` when source is expanded. Do not show original Fri 17:00 as current.
- **States & variants to build:** No reminder before explicit commitment confirmation; one reminder after ST03 when Kestrel record is opened; dismissed and reopened context variants for clickable completeness, without declaring commitment complete.
- **Interactions & hotspots:** Vendor row `(500,300)` opens record; reminder action and dismiss at SC04 targets from Part A/B. Dismiss hides this card only; source opens permitted review, not another employee's raw recording.
- **Animations needed in-component:** HUD slides 10–20px and fades in 150–500ms per cut, no loop; reduce to immediate.
- **Data bound:** commitment fixture, Priya, Kestrel; N-03.
- **Depends on:** APP-03, SC04, SC11, ST03.
- **Build notes & pitfalls:** Per-meeting consent and Priya's edit precede confirmation. Never imply company approval from confirmed personal commitment.
- **Done when:** Correct supplier triggers one reminder; exact deadline is Fri 12:00; unrelated vendor has no reminder; record remains usable behind HUD.
- **Effort:** M.

### APP-05 — SC06 Kestrel manual completion, ERP validation and timeout
- **Purpose / what the viewer perceives:** Three distinct ERP conditions support correction, peer guidance, and safe uncertainty without conflating them.
- **Priority:** P0 for manual resolution, validation and timeout; additional error recovery is P1 clickable completeness.
- **Appears in:** H-021–H-022 00:40–00:44; H-097–H-101 02:02–02:07; H-107 02:12–02:13; L-016 00:13.50–00:14; L-119–L-120 01:56–01:58; L-131 02:08–02:09; L-151–L-152 02:28–02:30.
- **Canvas & layout:** Reuse APP-03; manual Kestrel case `[240,152,920,420]`; validation banner `[260,170,850,64]` beside tax ID field; timeout banner `[850,150,360,88]`, with underlying INV-48220 form still visible.
- **Visual spec:** 1px warm form rules; amber TriangleAlert 20px and label for validation; neutral hatch/outlined square for uncertain submission; `lg` shadow only for floating banner. Body 14/20, identifiers 12/18 mono.
- **Exact content:** Manual: `Elena Ruiz`, `INV-48231`, `Kestrel Components`, `PO-1051`, `$4,213.50`, `$4,175.00`, `$38.50`, `Teach Oryn What Changed`. Peer: `Vendor tax ID format`, `Known fix from AP East: Vendor tax ID format`, `Guide Me`. Timeout: `INV-48220`, `Northgate Pallets`, `$2,732.50`, `PO-1044`, `Submission timed out`, `Outcome Unknown`, `Held`, `Do not resubmit until reconciled`.
- **States & variants to build:** Manually completed case links to ST13; Jamal's tax-format validation error invokes single SC04 guidance in ST18; submission timeout stays ST11 held and cannot trigger a retry. H2 wrong-result visualization is STG-07, not a real claim about these records.
- **Interactions & hotspots:** Manual case `[260,180,850,370]` retains editable form, teach `(1090,600)` opens SC27 after manual completion. Peer HUD `(1095,257)` opens guidance. Timeout offers `Reconcile` / investigate only; no enabled resubmit.
- **Animations needed in-component:** Error/toast enter from y−12 over 150ms; guidance 150ms; static hatched hold; reduced motion immediate.
- **Data bound:** INC-0042, E-0042-01–04, INV-48220, N-03, published peer fix.
- **Depends on:** APP-03, SC04, SC24, SC27; ST11/ST13/ST18.
- **Build notes & pitfalls:** Do not invent a tax ID or error code; a known fix is published team guidance, not a replay of Jamal's private screen. Manual correction does not change policy.
- **Done when:** Three conditions have separate record contexts; timeout has no retry; Elena's case retains correct amounts; one unobtrusive peer HUD leaves underlying fields accessible.
- **Effort:** L.

### APP-06 — SC07 Google Sheets AP Exceptions Tracker
- **Purpose / what the viewer perceives:** A recognizable spreadsheet tracks invoice exceptions across tools without treating the sheet as independent outcome verification.
- **Priority:** P0.
- **Appears in:** H-015–H-016 00:28–00:32; H-064 01:29–01:30; L-012 00:11.50–00:12; L-019 00:16–00:17; L-049 00:46–00:47.
- **Canvas & layout:** menu `[0,76,1280,40]`, formula bar `[0,116,1280,32]`, column header `[0,148,1280,36]`, 28px grid rows beginning y184; frozen row numbers 40px. Use columns `Invoice` 170, `Supplier` 220, `Issue` 250, `Owner` 160, `State` 200.
- **Visual spec:** shared flat white/bone skin; tiny official Google Sheets mark, 1px hairlines, 12/18 mono values, 14/20 heading; selected cell neutral ink 2px inset; Table2 and Search 16px.
- **Exact content:** Title `AP Exceptions Tracker`; headers `Invoice`, `Supplier`, `Issue`, `Owner`, `State`. Rows: `INV-48215 | Ironbark Fasteners | Missing Purchase Order | AP East | Escalated`; `INV-48218 | Sable & Co. Logistics | Missing Purchase Order | AP East | Escalated`; `INV-48219 | Brightwater Industrial | Variance above 2.00% | Daniel Okafor | Approval Required`; `INV-48220 | Northgate Pallets | ERP submit timed out | AP East | Outcome Unknown`. Context rows `INV-48203 | Brightwater Industrial` and `INV-48210 | Brightwater Industrial` show no invented issue, owner, or outcome: use em dash.
- **States & variants to build:** D1 human row selection ST02; H2 INV-48210 crop; launch chaos INV-48219 crop; missing-PO exception rows ST11; offline or unknown retains last visible state without implying verification.
- **Interactions & hotspots:** Cell near `(485,180)` selects its actual row in the crop; row ID opens linked Case where authorized; arrows move cell focus, Enter opens, Tab moves across cells.
- **Animations needed in-component:** Selected outline 150ms; camera cut/pan external; no loop; reduced motion immediate.
- **Data bound:** D1, INV-48210, INV-48215, INV-48218, INV-48219, INV-48220, shared JOB-0117 snapshot.
- **Depends on:** APP-12 and Part B invoice selectors.
- **Build notes & pitfalls:** Rows above define all shown values; owner `AP East` denotes team, not a fabricated individual. A tracker row is a handoff, not a readback.
- **Done when:** All six rows render; two missing POs remain separate; selection follows focused cell; unknown remains hatched and labeled.
- **Effort:** M.

### APP-07 — SC08 Slack workspace and escalation channel
- **Purpose / what the viewer perceives:** Separate team handoffs show work crossing into chat, with a coherent original workspace shell.
- **Priority:** P0.
- **Appears in:** H-016 00:30–00:32; H-025 00:48–00:50; L-013 00:12–00:12.50; L-019–L-020 00:16–00:18.
- **Canvas & layout:** workspace rail `[0,76,220,570]`, channel header `[220,76,1060,56]`, message column `[220,132,1060,450]`, composer `[240,582,1000,64]`. Message rows start y150 and y220.
- **Visual spec:** Ink workspace rail, white message surface, 1px borders, 12/18 mono channel and timestamps, 14/20 body. Small official Slack mark only. Hash, MessageSquare, Paperclip, Smile and Send icons 16px; soft focus outline.
- **Exact content:** Workspace `Calder & Vance`, `#ap-escalations`, `Missing purchase order: INV-48215`, `Missing purchase order: INV-48218`; hero reference `INV-48219` as a separate message with no invented approval. Composer placeholder `Message #ap-escalations`. No named sender or timestamp unless source fixture provides one.
- **States & variants to build:** Channel with two separate missing-PO handoffs; 48219 crop for L-013; selected case link; empty composer. No additional named channel is required by the current scripts.
- **Interactions & hotspots:** Link around `(400,185)` opens matching Case; composer accepts focus but send requires authorization. Enter opens focused case; Shift+Enter can insert a line into editable composer.
- **Animations needed in-component:** L-013 message edge translates 40px over 300ms, no repeated ping; other row transitions 150ms. Reduced motion immediately shows message.
- **Data bound:** INV-48215, INV-48218, INV-48219 and their current snapshot labels.
- **Depends on:** APP-12, Part B case links.
- **Build notes & pitfalls:** Slack message is evidence of handoff only, never outcome verification. Avoid inventing personal chat, timestamps or third-party assets.
- **Done when:** Channel and all three IDs are legible; two missing-PO messages are distinct; clicking correct link opens correct case; no message implies approval.
- **Effort:** M.

### APP-08 — SC09 Zoom meeting and per-meeting consent
- **Purpose / what the viewer perceives:** Priya permits this specific meeting before capture, then hears Dana's supplier change and responds.
- **Priority:** P0.
- **Appears in:** H-065–H-066 01:30–01:32; L-015 00:13–00:13.50; L-050–L-052 00:47–00:50.
- **Canvas & layout:** 48px top bar; meeting grid `[200,128,880,464]`, two named tiles side by side within a 2×2-capable grid; consent `[200,60,880,56]`; controls `[200,592,880,64]`; quote panel can replace right tile in close crop.
- **Visual spec:** Dark-neutral tile backgrounds with original generic non-identifying avatars or initials; white 12/18 mono labels in ink strips, 1px separators; small official Zoom mark. Mic, Video, Users, CircleStop 16px. Recording indicator uses an explicit word and distinct dot, not arc cyan.
- **Exact content:** `Priya Nair`, `Dana Whitfield`, `Meeting notice and consent`, `Meeting capture: consent required`, `Start for this meeting`, `Recording`, `End meeting`; Dana: `From the next cycle we're adding a handling line to every invoice.` Priya: `Send me the new layout; I'll confirm the terms in writing by Friday.` Source `00:14:32`. Ended copy `Meeting ended`.
- **States & variants to build:** L-015 neutral call crop without invented recording indicator; pending meeting notice; accepted this meeting with visible recording indicator; Dana quote; Priya quote; ended without recording indicator. Capture must not start on general enrollment or after a generic screen resume.
- **Interactions & hotspots:** Consent action `(980,88)` starts only after explicit notice and participant-policy conditions; End meeting in lower control rail stops meeting capture; click quote opens SC11 review only when appropriate. Tab/Enter work; Escape dismisses nonessential popovers.
- **Animations needed in-component:** Banner resolves 150ms; quote enters 500ms and reply types 900ms; waveform only during authorized active call and frame-derived; reduced motion shows static lines.
- **Data bound:** Priya, Dana, meeting session, commitment source time and consent state.
- **Depends on:** APP-12, SC11, ST02→ST03, FRT-03.
- **Build notes & pitfalls:** No second synthetic voice, no biometric portraits or fabricated participant images. Consent is meeting-specific; quote and later confirmation do not constitute company approval.
- **Done when:** No indicator before consent; only named participants visible; both quotations match exactly; ended state removes recording indicator.
- **Effort:** L.

### APP-09 — SC10 HubSpot deal and blocked discount draft
- **Purpose / what the viewer perceives:** A draft customer-facing discount is stopped at an explicit human approval boundary.
- **Priority:** P0.
- **Appears in:** L-153–L-154 02:30–02:32; breadth montage H-124–H-130 02:29–02:36.
- **Canvas & layout:** top navigation `[0,76,1280,56]`, left rail `[0,132,220,514]`, deal panel `[240,152,720,410]`, approval card `[840,340,360,200]`. Reserve separate actions for request and blocked submission.
- **Visual spec:** White surface, 1px warm rules, 8px card, 6px fields; 20/28 heading, 14/20 field labels, 16px mono amount; small official HubSpot mark; ShieldAlert and Lock 16px.
- **Exact content:** `Deal`, `Discount draft`, `12% discount`, `Requires Tier 3 approval - Daniel Okafor`, `Request approval`, `Submit` with disabled reason. No invented deal name, customer, price or outcome.
- **States & variants to build:** Draft 12%; blocked ST20; request sent while submission remains blocked; authorized approval is not depicted and must not be fabricated.
- **Interactions & hotspots:** Draft input `[410,280,240,40]`; blocked Submit `(1000,512)` explains requirement; `Request approval` `(910,540)` records request without approval or external send. Keyboard focus reaches explanation and action.
- **Animations needed in-component:** Alert and blocked state 150ms; request response 150ms; no ongoing animation; reduced motion immediate.
- **Data bound:** ST20 quote draft, Daniel's Tier 3 authority.
- **Depends on:** APP-12, SC32, Part B reducer.
- **Build notes & pitfalls:** No conversion from 12% to fabricated money. Agent drafts; it does not commit an external action.
- **Done when:** 12% and approver are visible; Submit remains blocked; requesting does not create approval; no unrelated deal data appears.
- **Effort:** M.

### APP-10 — Application logo tile set and adapter montage
- **Purpose / what the viewer perceives:** Nominative tiles locate the apps in Oryn's ecosystem without suggesting unsupported capabilities.
- **Priority:** P0.
- **Appears in:** L-159–L-165 02:36–02:43; H breadth montage H-124–H-132 02:29–02:38.
- **Canvas & layout:** 13 tiles in a 7+6 grid, each `[x,y,140,72]`, 12px gaps; mark 24px, name below or alongside at 12/18 mono. Matrix itself remains SC36, owned by Part A.
- **Visual spec:** Bone background, white or surface-2 tiles, 1px warm border, 4px radius; all extra tiles monochrome grey. No colorful integration badge, shadows or active cyan.
- **Exact content:** Demonstrated matrix rows `Gmail`, `NetSuite`, `Google Sheets`, `Slack`, `Zoom`, `HubSpot`, `Chrome`. Additional grey-only marks `Salesforce`, `Outlook`, `Excel`, `Teams`, `Meet`, `Edge`. SC36 headings `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`; unavailable intersections explicitly `— Unavailable`; Zoom observation `per-meeting opt-in`.
- **States & variants to build:** Full 13-tile montage; seven matrix row marks; grey-only six-mark strip; keyboard focus on an actual SC36 available-cell detail, no action on decorative marks.
- **Interactions & hotspots:** Tile itself is decorative; matrix controls come from SC36, e.g. `(420,214)` opens capability detail. Do not make unsupported marks act as available links.
- **Animations needed in-component:** Tiles scale toward center over 700ms during L-165, labels fade before overlap; no independent loop. Reduced motion replaces with static ink node.
- **Data bound:** Part B adapter capability matrix, not inferred from tile presence.
- **Depends on:** SC36, STG-01, FX-03.
- **Build notes & pitfalls:** Obtain each official mark with URL and rights ledger, use small nominative mark and no endorsement; if clearance is absent use plain text label instead of copied art. Additional six do not acquire feature rows or implied availability.
- **Done when:** All 13 names appear; six extras are grey-only; every unavailable matrix cell says so; Zoom has per-meeting qualifier.
- **Effort:** M.

### APP-11 — Chrome frame and tabs
- **Purpose / what the viewer perceives:** Distinct application views occupy one plausible, nonfunctional browser environment.
- **Priority:** P0.
- **Appears in:** H-014–H-016 00:26–00:32; H-063–H-069 01:28–01:35; L-009–L-013 00:10–00:12.50; L-047–L-056 00:44–00:54; L-151–L-154 02:28–02:32.
- **Canvas & layout:** Browser chrome 48px below 28px menu bar `[0,28,1280,48]`; tabs 24px high, 160–190px wide; navigation icons left, address field `[240,52,700,24]`; content begins y76. A titlebar may be used only for standalone OS windows, not stacked as an extra 38px above this fixed browser bar.
- **Visual spec:** Neutral surface-2, white active tab, warm hairline, 6px address radius; 12/18 sans tab title and mono address; ArrowLeft, ArrowRight, RotateCw, LockKeyhole 16px. Small official Chrome identifier.
- **Exact content:** Tabs `Gmail`, `NetSuite`, `AP Exceptions Tracker`, `Slack`, `Zoom`, `HubSpot`; fictional URL examples `mail.example`, `erp.example`, `sheets.example`, `chat.example`, `meeting.example`, `crm.example`. Do not show actual account addresses.
- **States & variants to build:** Each named active tab, normal and selected; app-specific crop hides irrelevant browser edges when storyboard demands; hover/focus visible.
- **Interactions & hotspots:** Clicking tab centers around x80, 240, 400, 560, 720, 880 selects matching APP view without external navigation. Back returns prior internal skin if history exists; disabled otherwise.
- **Animations needed in-component:** Tab background change 150ms; no loading spinner without real scripted operation; reduced motion instant.
- **Data bound:** selected app key and historical view stack in presentation state, not real browser network state.
- **Depends on:** APP-01–09 and APP-12.
- **Build notes & pitfalls:** Original browser-like layout only; never embed live websites or reproduce their DOM. Use a single owner for app selection to avoid changing invoice data on tab switch.
- **Done when:** All six tabs select matching views; URLs remain fictional; active tab clear in grayscale; no network occurs.
- **Effort:** M.

### APP-12 — macOS desktop, status bar, Dock and window chrome
- **Purpose / what the viewer perceives:** Oryn sits visibly alongside ordinary work and offers immediate observation control.
- **Priority:** P0.
- **Appears in:** H-062 01:27–01:28; L-038–L-039 00:35–00:37; OS surroundings of APP-01–09.
- **Canvas & layout:** Wallpaper `[0,28,1280,692]`; menu bar `[0,0,1280,28]`; centered Dock `[360,646,560,64]`; standalone window title bar 38px, traffic circles centered x20/40/60; companion menu `[950,28,310,232]`.
- **Visual spec:** Original restrained bone-to-warm-grey wallpaper with abstract non-licensed shapes, translucent neutral menu and Dock; generic original 36px app icons, not Apple icon copies. Menu text 12/18 sans, system glyphs 14px. Popover white, 8px radius, hairline, shadow-md.
- **Exact content:** `Oryn`, `Observation active`, `Paused`, `Pause observation`, `Resume`, `My Privacy`; H-062 alternate `Capture active`, `Pause`. Independent `Screen` and `Meeting` labels when expanded. No invented account name, clock or system alerts.
- **States & variants to build:** Desktop idle; companion open active; paused by user; explicitly resumed screen observation; meeting capture active only with APP-08 consent; notification banner view using APP-13.
- **Interactions & hotspots:** Status icon `(1100,14)` opens menu; `(1100,112)` pauses screen observation; `(1100,160)` opens SC03; Resume requires deliberate click. Meeting stream is separately controlled; user pause never silently resumes.
- **Animations needed in-component:** Popover fade/translate 150ms; Dock static; reduced motion immediate. Capture indicator remains neutral, never looping cyan.
- **Data bound:** Part B observation category consent and pause state, independent meeting authorization.
- **Depends on:** SC01, SC03, APP-08, APP-11, APP-13.
- **Build notes & pitfalls:** This is an original OS-like illustration, not a macOS screenshot. Retain visible Oryn status even with an app in foreground. Generic screen resume must not resume meeting capture.
- **Done when:** Menu opens at correct edge; pause and resume reflect state; one click accesses My Privacy; meeting status is independent.
- **Effort:** L.

### APP-13 — OS notification banners
- **Purpose / what the viewer perceives:** A temporary desktop notification introduces an actionable event without being mistaken for resolution.
- **Priority:** P0 for timed-out montage toast; other notifications P1 clickable completeness.
- **Appears in:** L-016 00:13.50–00:14; L-158 02:35–02:36 uses SC35, not a second OS banner.
- **Canvas & layout:** Banner `[872,90,360,88]`, safe 16px edge, title line plus explanation and optional action; above app content but below film cursor/captions.
- **Visual spec:** white floating surface, 8px radius, border hairline, shadow-md, 20px TriangleAlert, 14/20 title and 12/18 secondary; neutral hatch only in unknown swatch.
- **Exact content:** `Submission timed out`, `Outcome Unknown`, `Held`; optional action `Review`. Do not show a successful completion banner.
- **States & variants to build:** timeout visible; dismissed; selected Review opens SC24. Additional approval and reminder notifications reuse existing N-01/N-03 rather than new fabricated messages.
- **Interactions & hotspots:** Banner click opens relevant authorized case; close icon in `[1190,98,32,32]` dismisses only notification, not the underlying hold; keyboard activation and focus return.
- **Animations needed in-component:** y−12→0 and opacity over 150ms, once; no timer-based disappearance in film. Reduced motion instant.
- **Data bound:** INV-48220 timeout, N-01/N-03 when enabled.
- **Depends on:** APP-12, SC24, Part B notification state.
- **Build notes & pitfalls:** This is an OS-layer banner, not product toast duplication. Keep one expanded banner; clicking does not retry or verify.
- **Done when:** Timeout is explicit; unknown remains held after dismiss; Review opens correct case; text is readable in 0.5-second montage crop.
- **Effort:** S.

## Montage surfaces and stage compositions

### STG-01 — Dotted stage, stage card and registration marks
- **Purpose / what the viewer perceives:** One cinematic world holds every inset application and diagram while retaining a distinct flat product interior.
- **Priority:** P0.
- **Appears in:** H-006–H-013 00:10–00:26; H-016–H-055 00:30–01:21; L-019–L-034 00:16–00:32; L-044–L-045 00:41–00:43; L-147 02:24–02:25; L-171–L-176 02:52–03:00.
- **Canvas & layout:** Full `[0,0,1280,720]`, nominal card `[48,40,1184,640]`, 12px registration arms 8px outside corners. Keep action in `[64,36,1152,648]`, titles in `[128,72,1024,576]`; captions sit above all cards.
- **Visual spec:** Bone `#F6F6F3` with 1px `rgba(10,10,10,.12)` dots every 24px; cards white, 2px ink outline, 8px radius, hard shadow `6px 6px 0 #0A0A0A`. Stage cards only; nested product remains 1px and flat. Crop marks 1px ink. Stage type 48/52 mono 600, eyebrow 14/20 tracking .12em.
- **Exact content:** No default text; content belongs to individual stage compositions. Crop marks contain no labels, registration numbers or fake branding.
- **States & variants to build:** Empty bone field, card frame, multiframe collage, near-black collage (STG-10); offscreen extension supports camera panning without exposing viewport edges.
- **Interactions & hotspots:** No film interaction; click-through stage wrappers; clickable content receives pointer and keyboard normally.
- **Animations needed in-component:** Stage elements enter via opacity/transform 500–900ms, stagger 60ms capped 360ms. Static background has no movement; reduced motion fixes end pose.
- **Data bound:** stage scene and frame index; no business fixture.
- **Depends on:** FRT-04 camera, FRT-06 subtitles.
- **Build notes & pitfalls:** Establish world-space separate from UI content; no cyan dots, gradients, isometric geometry or hard offsets inside products.
- **Done when:** Grid remains 24px in world space; only stage cards cast hard offset; crop marks do not overlap data; no seams appear during pan.
- **Effort:** M.

### STG-02 — SC37 orbit identity and agent chips
- **Purpose / what the viewer perceives:** Five bounded examples compress into the original Oryn open-ring identity and return as an end card.
- **Priority:** P0.
- **Appears in:** H-006–H-011 00:10–00:22; L-023–L-034 00:20–00:32; L-165–L-166 02:42–02:44; L-171–L-176 02:52–03:00.
- **Canvas & layout:** Ring around `(640,330)` on reveal; end-card mark around `(480,285)` with wordmark right; five chips surround center at y180–440, roughly 220×48 each; line below y350; URL pill `[300,470,680,52]`.
- **Visual spec:** Original vector concentric radii 18/31/44 per 100 units, 1.5-unit strokes and 4-unit node; wordmark Space Grotesk 700, −.04em, `O` open 32° near one o'clock, 0.11em stroke. Stage chips white, 2px ink and 6px hard offset, IBM Plex Mono 13/18.
- **Exact content:** `Supplier Invoice Reconciler`, `Order Status Sync`, `Support Exception Triage`, `Policy Watcher`, `Peer Fix Guide`, `Governed agent`, `Test`, `Supervise`, `Improve`, `Oryn`, `Introducing Oryn`, `Verified`, `IBM AI Builders Challenge, North America`, `AI for Business`.
- **States & variants to build:** Ink node; ring assembly; one through five chips; compression; open wordmark; verified-only brief closed O; reopen; static end identity. In H-007 conceptual closure conflicts with verification-only rule; see coverage notes.
- **Interactions & hotspots:** No interactive hotspot; SC37 is a presentation surface. Any clickable end URL belongs to STG-15.
- **Animations needed in-component:** Rings scale .65→1 over 700ms stagger 60ms; chips enter 500–700ms then converge to .12 over 800ms; letters slide 20px in 500–650ms; ring-close 400ms and hold 400ms only at explicit verified beat. No continuous idle animation; reduced motion static open mark.
- **Data bound:** five fixed display names and event frame; verification state controls closure.
- **Depends on:** STG-01, FX-03, FX-05, STG-15.
- **Build notes & pitfalls:** No customer logos or traction. Traveling node remains ink unless an actual execution is active; mark is not a status badge.
- **Done when:** All five chip labels appear; mark is original open O; ring closes only at a verified beat; nonrunning identity has no cyan.
- **Effort:** L.

### STG-03 — Fourteen-node lifecycle ring
- **Purpose / what the viewer perceives:** A legible closed loop distinguishes understanding, human authorization, independent verification, correction and scoped release.
- **Priority:** P0.
- **Appears in:** H-027–H-036 00:52–01:02; L-059–L-072 00:56–01:10; L-165 02:42–02:43.
- **Canvas & layout:** Center `(640,330)`, ring radius 230px, 14 nodes evenly spaced clockwise, labels around perimeter with outside padding and no intersections; overlay variant `[930,100,260,260]` accompanies product frames. Gate icons and miniature cards sit outside ring when needed.
- **Visual spec:** 2px ink circle, 18px neutral nodes, IBM Plex Mono 14/20 labels, white 2px stage cards with 6px offset. Ink remains default; arc `#2FD8FF` only current executing node, never all prior nodes.
- **Exact content:** `CLOSED LIFECYCLE`; clockwise `Observe`, `Understand`, `Review`, `Publish`, `Compile`, `Simulate`, `Authorize`, `Execute`, `Verify`, `Diagnose`, `Correct`, `Repair`, `Re-evaluate`, `Release`; microcards `Suggested`, `Owner approval`, `Independent readback`, `Human correction`, `Bounded change`, `Regression suite`.
- **States & variants to build:** Neutral overview with ink moving node H-027–036; sequential action-specific highlights L-059–072; final neutral ring after Release; accessible ordered text list for clickable build.
- **Interactions & hotspots:** Film diagram itself is decorative; if exposed interactively each node is a 44px focusable region selecting its explanatory label without triggering a workflow transition.
- **Animations needed in-component:** Ring draws 700–800ms; node phase advances 700ms per named operation and immediately neutralizes prior node; 60ms stagger for supporting cards; no idle cyan loop. Reduced motion displays neutral ordered list with current label.
- **Data bound:** event frame, current named operation, executing boolean; Part B state remains authoritative.
- **Depends on:** STG-01, STG-02, FRT-04.
- **Build notes & pitfalls:** Do not accumulate cyan as completed-state history. Explain that overview is illustrative and does not release an agent. Verify remains a separate readback.
- **Done when:** All fourteen labels appear in exact order; at most one node is cyan; cyan extinguishes at stop; review/authorize and execute/verify stay distinct.
- **Effort:** L.

### STG-04 — Live-action typography and presenter lower-third
- **Purpose / what the viewer perceives:** Harikeshav's face anchors both films while typography carries the hook and close without covering him.
- **Priority:** P0.
- **Appears in:** H-001–H-005 00:00–00:10; H-143–H-149 02:48–02:55; L-001–L-008 00:00–00:10; L-167–L-170 02:44–02:52.
- **Canvas & layout:** Real live footage `[0,0,1280,720]`, face in x700–1100, overlay type `[80,150,540,300]`, lower-third `[64,506,506,84]` hackathon / `[84,516,506,84]` launch. Caption z80 below safe content.
- **Visual spec:** White IBM Plex Mono 44–48/52 weight 400→700, subtle ink translucent backing, stage lower-third white, 2px ink, 6px offset. Name Space Grotesk 22/26 700; school 14/20 mono; no borrowed third-party lower-third art.
- **Exact content:** Hackathon `What if`, `LEARN`, `PROVE`, `RECOVER WHEN REALITY CHANGES?`, `Harikeshav Rameshkumar`, `The Ohio State University`; launch `What if your workflows`, `could learn`, `from your people,`, `prove their results,`, `recover from change?`; closing text follows exact corresponding script entries and never invents credits.
- **States & variants to build:** Locked wide hook, tight hook crop, lower-third name then school, closing three successive phrases, cleared ending. A 2D scale/crop is not simulated camera depth.
- **Interactions & hotspots:** None; footage is authentic and pointer hidden.
- **Animations needed in-component:** Type-on 28–34 chars/s with fixed jitter, word weight change 150ms, line rise 12px/500ms, lower-third slide 20px/500ms, school fade 300ms; reduced motion full phrase immediately.
- **Data bound:** Real approved H1-A/H1-B/H5-A/L1-A/L1-B/L12-A footage and captions; never fabricated face or voice.
- **Depends on:** STG-01, FRT-06, STG-16.
- **Build notes & pitfalls:** 700 mono requires an actual licensed face; do not synthesize missing weight. Name and school remain outside mouth, hands and subtitle strip.
- **Done when:** Face unobscured; hook words match cut; lower-third spells name/school correctly; footage and VO are presenter's own.
- **Effort:** M.

### STG-05 — Kinetic type, typewriter and scramble
- **Purpose / what the viewer perceives:** Short phrases emphasize causality and uncertainty; type remains readable and deterministic.
- **Priority:** P0 for type-on and weight swap; P1 for scramble/asterisk variant because neither current storyboard requires it.
- **Appears in:** H-001–H-003 00:00–00:06; H-012–H-013 00:22–00:26; L-001–L-007 00:00–00:08.50; L-099 01:36–01:37; L-121 01:58–01:59.
- **Canvas & layout:** Typical text block `[80,150,560,320]`; large statement `[100,160,720,180]`; align to 4px grid and preserve caption region.
- **Visual spec:** IBM Plex Mono 48/52 or emphasis 56/60, weight 400/600 or actual 700 if loaded, −.025em; ink on bone or white over dark-backed footage. No cyan as emphasis.
- **Exact content:** `Clicks complete ≠ verified outcome`, `Business result?`, `STOPPING CAN BE CORRECT`, `UNKNOWN ≠ COMPLETE`; hook phrases as STG-04. P1 mask test resolves `BANK ACCT` → `*********`, `TAX ID` → `******`, `CARD` → `****` without exposing original values.
- **States & variants to build:** Stacked lines, typewriter, selected-word weight swap, question mark scale, static full text, optional deterministic asterisk scramble; partial text indexed by frame.
- **Interactions & hotspots:** None in finished film; preview keyboard controls belong to FRT-05.
- **Animations needed in-component:** 28–34 chars/s; weight change 150ms; line reveal 500ms with 60–120ms stagger; scramble 300ms deterministic fixed character indices, no loop. Reduced motion shows final phrase without scramble.
- **Data bound:** timeline text segments and seed; privacy labels only, never actual confidential values.
- **Depends on:** STG-01, FRT-03, FRT-06.
- **Build notes & pitfalls:** Asterisks are an optional requested variant, not a claim of an onscreen current-script beat. Use real font weights and stable text width.
- **Done when:** Seeking yields identical partial text; full phrases match scripts; no underlying secret is ever rendered; reduced-motion final state remains legible.
- **Effort:** M.

### STG-06 — External problem-stat and affected-role cards
- **Purpose / what the viewer perceives:** Sourced invoice-processing context and named affected roles establish stakes without attributing market numbers to Oryn.
- **Priority:** P0.
- **Appears in:** H-017–H-020 00:32–00:40; H-025–H-026 00:48–00:52; H-133–H-138 02:38–02:44.
- **Canvas & layout:** Role cards `[180,220,300,160]`, `[810,220,300,160]`; statistic card `[280,180,720,330]`, two equal columns for cost/time; source line inset 24px at bottom.
- **Visual spec:** White stage cards 2px ink and 6px hard shadow, 8px radius; stat Space Grotesk 56–64/1.1 700, role names 24/30, source IBM Plex Mono 11/16; warning glyph outlined 16px.
- **Exact content:** `Priya Nair · AP Specialist`, `Marcus Webb · AP Manager`, `$9.90 / invoice`, `11.6 days`, `Average processing cost and time per invoice`, `Ardent Partners · Payables Place · 2026`, `Why?`, `Investigation required`. Conditional source lines: `Gartner, 2025: over 40% of agentic AI projects forecast canceled by end of 2027`; `McKinsey Global Institute, 2012: about 19% of interaction workers' workweek spent searching for and gathering information`.
- **States & variants to build:** Cost alone; cost and time; two roles with exception slips; unresolved question; 2025/2012 citations only where verified and readable; sources remain external.
- **Interactions & hotspots:** Static presentation; no click.
- **Animations needed in-component:** Number scale .95→1 500ms; second column fade 500ms; cards rise 10px with 80ms stagger; reduced motion immediate.
- **Data bound:** Sourced Ardent 2026-10-22 statistics and citation; separate Gartner/McKinsey provenance. No private operational metrics.
- **Depends on:** STG-01, STG-07.
- **Build notes & pitfalls:** Ardent source `https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/`. Gartner wording must be checked against primary source or omitted before publication; McKinsey must name interaction workers and 2012. No percentages saved or invented ROI.
- **Done when:** Cost and duration are legible with source; roles correctly named; source year visible; claims do not imply Oryn measured these results.
- **Effort:** M.

### STG-07 — Failure-mode and supplier-format-change diagrams
- **Purpose / what the viewer perceives:** Click completion, business mismatch and new document format are separate evidence states, not successful automation.
- **Priority:** P0.
- **Appears in:** H-012–H-013 00:22–00:26; H-021–H-024 00:40–00:48; L-016–L-018 00:13.50–00:16; L-022 00:19–00:20.
- **Canvas & layout:** Two panels `[130,180,430,320]` and `[720,180,430,320]`; connector `[570,300,140,4]`; warning label between panels. Kestrel documents use APP-02 overlap.
- **Visual spec:** White stage outlines 2px and offset 6px, internal fields flat; 20px check only beside click, 20px outlined TriangleAlert beside mismatch, neutral 45° hatch for unknown; 18/24 mono label.
- **Exact content:** `Clicks complete`, `Click completed`, `Amount mismatch`, `Business result: mismatch`, `Business outcome: unverified`, `Result not verified`, `Unverified`, `Kestrel Components`, `Handling fee $38.50`. Do not invent the two mismatch amounts.
- **States & variants to build:** Completed action / empty evidence; mismatch with broken connector; old versus new supplier layout; failed dashed connector / unverified outcome; neutral unknown hatch.
- **Interactions & hotspots:** Film cursor presses form action near `(848,390)` in L-017; demonstration must not set independent verification state. Diagram itself noninteractive.
- **Animations needed in-component:** Check draws 450ms, subsequent empty frame +300ms; connector draws 500ms; Kestrel pages cross-slide 600ms, path stops after 600ms. Reduced motion static distinction.
- **Data bound:** Kestrel document fixture; comparison illustration has no fabricated monetary source values.
- **Depends on:** APP-02, APP-03, FRT-01, STG-01.
- **Build notes & pitfalls:** A warning after clicks is not a verified error code; preserve difference between mismatch and unknown. Do not retain cyan on stopped path.
- **Done when:** Click check is physically separate from result; mismatch and unverified use correct labels; fee sits after subtotal; path remains neutral when stopped.
- **Effort:** M.

### STG-08 — Local privacy, governed-cloud AI and architecture diagram
- **Purpose / what the viewer perceives:** Local evidence custody and authorized transient cloud inference are separate from reviewed organizational sharing.
- **Priority:** P0.
- **Appears in:** H-037–H-047 01:02–01:13; L-042–L-045 00:39–00:43.
- **Canvas & layout:** Device `[120,180,370,300]`; purpose gate `[510,270,180,100]`; gateway `[710,190,220,100]`; cloud `[960,190,200,100]`; human review `[990,430,210,100]`; thin connectors and distinct blocked branch.
- **Visual spec:** Stage-card white/ink/2px/6px offset, 14/20 mono labels, 20/28 Space Grotesk review heading, 12/18 route note; LockKeyhole, Cloud, ShieldCheck, UserRoundCheck 20px; no certification seals.
- **Exact content:** `LOCAL: private evidence · exclusions · masking`, `capture · deterministic validation · encrypted storage`, `Purpose authorization`, `Oryn-managed LiteLLM gateway`, `Approved cloud model`, `US processing · zero content retention after processing · no training`, `Workflow discovery`, `Agent-definition generation`, `Scenario generation`, `Verification assistance`, `Repair proposals`, `Suggested`, `Human review and authority`, `Private evidence · device`, `Authorized cloud inference · transient`, `Reviewed contribution`.
- **States & variants to build:** Local only; blocked unauthorized branch; permitted gateway route; five AI-use cards; independent human review gate; simplified private-vs-reviewed contribution pair.
- **Interactions & hotspots:** Diagram is noninteractive; viewer perceives authorization gate opening only as narration reaches permitted route.
- **Animations needed in-component:** Device expands 500ms; arrows draw 500–700ms; cards fan 500ms, stagger 60ms; note fades 350ms; reduced motion final static diagram.
- **Data bound:** Purpose authorization and AI-use labels from PRODUCT sections 3/25; no real private material.
- **Depends on:** STG-01, STG-11.
- **Build notes & pitfalls:** Local evidence does not mean local inference. The reviewed contribution is a distinct authorized artifact. Model output cannot approve itself, verify by itself, or publish policy.
- **Done when:** Device and cloud are visibly distinct; unauthorized path stops; cloud route conditions legible; human gate follows proposed output.
- **Effort:** L.

### STG-09 — Real IBM Bob screen-capture frame
- **Purpose / what the viewer perceives:** Actual development and review evidence appears in its original editor context, with no invented response.
- **Priority:** P0, hackathon.
- **Appears in:** H-048–H-055 01:13–01:21.
- **Canvas & layout:** Real 16:9 recording inside `[48,40,1184,570]` outer stage frame; main Bob panel and source file fit center two-thirds; crop to `(640,300)` while preserving authentic context; caption below.
- **Visual spec:** Bone dotted stage, 2px ink stage frame and 6px offset; actual editor retains captured colors, text, and native cursor. No artificial highlighted findings.
- **Exact content:** Production slots `[BOB_CAPTURE: real recorded IBM Bob workspace]`, `[BOB_BUILD: real capture of Bob used during development]`, `[BOB_REVIEW_REQUEST: real prompt and project file under review]`, `[BOB_REVIEW_RESULT: actual Bob response]`, `[BOB_OUTCOME: actual resulting edit, test or decision]`; metadata `[BOB_SESSION_DATE]`, `[BOB_TASK]`, `[BOB_REVIEW_SCOPE]`, `[BOB_FINDING]`, `[BOB_ACTION]` are populated from actual session and not burned on screen unless accurate.
- **States & variants to build:** Real workspace, actual build prompt, actual review request, actual response, actual outcome, frame shrink into SC02. Slot labels are editing guides and must disappear when footage is supplied.
- **Interactions & hotspots:** Recorded cursor only; preview seek controls belong to FRT-05. Never overlay a synthetic click on real evidence.
- **Animations needed in-component:** Camera 1→1.05 700ms, pan to prompt 600ms, push 1.05→1.18 700ms, shrink 1→.65 700ms. Reduced motion holds real recording crop.
- **Data bound:** User's real Bob session footage, approved redaction, actual task and outcome.
- **Depends on:** STG-01, FRT-04, FRT-06.
- **Build notes & pitfalls:** Record real work in demo worktree, remove secrets and private identifiers using opaque redaction or reshoot; inspect frames and audio. Do not fabricate code-review findings, a successful test, or an outcome.
- **Done when:** Five slots resolve to genuine relevant footage; prompt/result/outcome readable; original cursor preserved; secrets removed irreversibly.
- **Effort:** M, excluding capture.

### STG-10 — Dark knowledge collage and source-evidence ribbons
- **Purpose / what the viewer perceives:** Relevant published rules, confirmed commitments, peer guidance and incident evidence form an operational knowledge picture, not private surveillance.
- **Priority:** P0.
- **Appears in:** L-057 00:54–00:55; L-059–L-061 00:56–00:59; L-147 02:24–02:25; H-070–H-076 01:35–01:42.
- **Canvas & layout:** Dark collage background `[0,0,1280,720]`; cards `[120,130,250,120]`, `[420,220,260,120]`, `[720,120,250,120]`, `[930,350,250,120]`; source thumbnails `[160,180,230,115]`, `[160,310,230,115]`, `[160,440,230,115]` for D1–D3.
- **Visual spec:** Near-black `#0A0A0A` field, white and grey cards with 2px edges and stage hard offsets; labels 12/18 mono, evidence connectors 1px trace; 14/20 heading. No 3D rotation or bright cyan.
- **Exact content:** `AP-RULE-009`, `Confirm Kestrel handling-fee terms in writing`, `Known fix from AP East: Vendor tax ID format`, `INC-0042`, `Evidence`, `Candidate workflow`; D1 `Priya Nair · Mon 09:14 · INV-48203 · Brightwater Industrial`, D2 `Priya Nair · Mon 10:02 · INV-48204 · Copperline Cables`, D3 `Jamal Carter · Tue 13:40 · INV-48207 · Harlow Tooling`.
- **States & variants to build:** Three source ribbons converge on empty candidate outline while meeting commitment stays separate; three demonstration thumbnails align; later four-card dark collage with same source labels.
- **Interactions & hotspots:** In SC14 thumbnail hovers point to authorized sanitized contributions; stage collage itself is static. No click opens raw private history.
- **Animations needed in-component:** Ribbons draw 700ms; cards rise 500ms with 100ms stagger; collage drift 30px over 700ms, no loop. Reduced motion static.
- **Data bound:** D1–D3, AP-RULE-009, commitment, INC-0042 and published peer fix.
- **Depends on:** SC14, APP-01–08, STG-01.
- **Build notes & pitfalls:** Use redacted reviewed thumbnails, not user screenshot textures. One demonstration is not itself a verified outcome or approved policy.
- **Done when:** Four different knowledge types readable; all three demonstrations retain person/time/ID; commitment not merged into candidate; no raw screen exposed.
- **Effort:** M.

### STG-11 — Privacy masking sweep and removed-field card
- **Purpose / what the viewer perceives:** Protected field values are never rendered, even during the masking animation, before local storage.
- **Priority:** P0 for hatching; P1 for explicit `REMOVED` text not specified in the current storyboard.
- **Appears in:** H-061 01:26–01:27; L-040–L-042 00:37–00:40.
- **Canvas & layout:** Business panel `[260,160,760,340]`; three rows y220, 300, 380, labels x310 and mask regions `[520,y,380,38]`; storage boundary at x970.
- **Visual spec:** White flat panel, 1px border; 14/20 IBM Plex Mono labels; diagonal 45° 1px ink/trace hatch at 6px spacing on surface-2; `REMOVED` small 12/18 label if used; 20px LockKeyhole at boundary.
- **Exact content:** `BANK ACCT`, `TAX ID`, `CARD`, `Masked on device`, `REMOVED`; no digits, actual field values, names or secrets.
- **States & variants to build:** Empty placeholder fields, already opaque field backgrounds, hatch sweep, final `Masked on device`; optional `REMOVED` label and storage-boundary diagram. A visual sweep never reveals a preexisting value.
- **Interactions & hotspots:** None; underlying SC03 controls remain separate.
- **Animations needed in-component:** Three bars sweep 300–400ms left to right, stagger 70–120ms; reveal hatch over already-masked opaque field; reduced motion shows complete mask.
- **Data bound:** Fixed field categories only, ST01 privacy state.
- **Depends on:** SC03, STG-08, FX-04.
- **Build notes & pitfalls:** Do not create real or fabricated sensitive data beneath a removable CSS mask. `REMOVED` may annotate a redacted placeholder, not claim universal deletion.
- **Done when:** No value exists beneath any mask; three labels readable; hatch precedes storage boundary; user can pause separately.
- **Effort:** S.

### STG-12 — Calendar, ticket, toolbar and error-dialog montage crops
- **Purpose / what the viewer perceives:** Quick glimpses of work fragments make the chaos montage dense without implying extra integrations or facts.
- **Priority:** P0 calendar; P1 original ticket, chat toolbar and error-dialog crops for requested montage completeness, since current scripts do not identify separate beats for them.
- **Appears in:** Calendar L-014 00:12.50–00:13; chat toolbar as part of L-013 00:12–00:12.50; error/timeout L-016 00:13.50–00:14; H-016 00:30–00:32; no separate ticket entry.
- **Canvas & layout:** Calendar crop `[220,120,840,440]` with neutral rows, event `[500,250,320,70]`; chat toolbar `[300,450,680,56]`; error `[780,140,360,150]`; optional ticket `[180,170,420,270]`.
- **Visual spec:** White flat interiors, 1px warm rules, 4/6px inner radii; IBM Plex Mono 12/18, Space Grotesk 14/20. CalendarDays, Paperclip, MessageSquare, TriangleAlert 16px; stage frame only if separately floating.
- **Exact content:** Calendar `Kestrel review`, no dates; toolbar `#ap-escalations`, `Message #ap-escalations`; dialog `Submission timed out`, `Outcome Unknown`, `Held`; ticket `Exception`, `Missing Purchase Order`, `INV-48215`, `AP East`. These labels are the complete optional ticket copy; no fictional ticket ID, assignee or timestamp.
- **States & variants to build:** Calendar crop; Slack composer crop; timeout toast/dialog; optional exception slip; all can be cropped from larger static surfaces.
- **Interactions & hotspots:** Calendar and ticket are film-only; toolbar uses APP-07 input; error Review routes SC24 rather than resubmit.
- **Animations needed in-component:** Calendar push 1→1.1 over 500ms, toast enters 150ms, strip transitions 500ms; no loop. Reduced motion fixed crops.
- **Data bound:** Kestrel context, INV-48215, INV-48220, AP East.
- **Depends on:** APP-07, APP-13, STG-01.
- **Build notes & pitfalls:** A ticket is an optional graphic, not evidence that an external ticketing product is supported. No calendar date is established.
- **Done when:** Kestrel label visible; calendar has no invented date; timeout remains unknown; optional ticket names only known facts.
- **Effort:** M.

### STG-13 — User-supplied memory montage textures
- **Purpose / what the viewer perceives:** A faint, non-identifying memory of permitted work sits behind a fictional foreground, not as an evidence source.
- **Priority:** P0 slot 1; P1 slots 2–3 capture-plan completeness.
- **Appears in:** L-044 00:41–00:42; no storyboard entry currently places screenshots 2–3.
- **Canvas & layout:** Background texture `[48,40,1184,570]`, scaled and cropped behind foreground invoice `[310,130,650,390]`. The user supplies high-resolution static source; preserve original aspect, crop without stretching.
- **Visual spec:** Pre-sanitized bitmap dimmed to 15–25% opacity and pre-blurred; original data removed irreversibly before ingestion, not merely hidden with CSS. Fictional foreground stays sharp, with 2px outer stage frame and 6px offset.
- **Exact content:** Editing slots `[USER SCREENSHOT 1: approved work-app overview, redacted]`, `[USER SCREENSHOT 2: approved spreadsheet or workflow artifact, redacted]`, `[USER SCREENSHOT 3: approved business communication texture, redacted]`; visible foreground `Permitted work`. Slot labels disappear in final render.
- **States & variants to build:** Slot 1 placed, sanitized and cropped; optional slots 2/3 ready as static backgrounds; missing asset blocks that shot rather than presenting a counterfeit.
- **Interactions & hotspots:** None; these bitmaps are not clickable and do not open evidence.
- **Animations needed in-component:** Background translates 40px left over 900ms; no live filter animation; reduced motion static.
- **Data bound:** Three user-provided authorized screenshots, consent and redaction ledger.
- **Depends on:** APP-02, STG-01.
- **Build notes & pitfalls:** User must remove names, addresses, account IDs, secrets, customer content and recognizable confidential details, using opaque destructive redaction. Blur/dimming is only secondary. Never depict these textures as actual customer evidence or an external session.
- **Done when:** Slot 1 is truly user supplied; original private content cannot be recovered; no readable sensitive text remains; slots 2–3 are marked optional and never mistaken for captured evidence.
- **Effort:** M, excluding sourcing.

### STG-14 — Typed agent-intent pill
- **Purpose / what the viewer perceives:** A concrete intent grows into a reviewable agent candidate, without suggesting a model selector or automatic deployment.
- **Priority:** P0.
- **Appears in:** H-077–H-079 01:42–01:45; L-075–L-079 01:12–01:17.
- **Canvas & layout:** Stage pill `[230,310,820,72]`, 24px padding, caret at first baseline, send control at right; faded playbook thumbnail behind. Product SC17 field is separate 1px interior.
- **Visual spec:** White 2px ink outline and 6px stage shadow, 8px radius, 16/24 mono ink, 16px ArrowUp send icon; no accent fill.
- **Exact content:** `Create Agent`; `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`; resulting headings `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`, `Unverified branch`.
- **States & variants to build:** Empty, focused, partial, full intent, submitted, candidate card; no model selector.
- **Interactions & hotspots:** Focus `(410,350)`; send `(1010,346)` transitions to ST06 candidate, not released agent; Tab/Enter follow SC17.
- **Animations needed in-component:** Pill grows 320→820px over 700ms; type 30–32 chars/s with pre-roll where H-078 requires it; candidate expands 700ms, rows stagger 60–80ms; reduced motion static full text.
- **Data bound:** playbook PB-AP-RECON, agent candidate v0.1, ST06.
- **Depends on:** SC17, STG-01, FRT-03, FX-03.
- **Build notes & pitfalls:** Type duration must respect actual 81-character string and scripted preroll; don't imply immediate authorization.
- **Done when:** Exact sentence appears; no model picker; cursor ends at text; generated branch remains unverified.
- **Effort:** M.

### STG-15 — End card, GitHub URL and impact/next-step cards
- **Purpose / what the viewer perceives:** Film closes with attainable product direction and a memorable project address, without invented impact claims.
- **Priority:** P0.
- **Appears in:** H-133–H-154 02:38–03:00; L-171–L-176 02:52–03:00.
- **Canvas & layout:** Impact cards `[150,170,460,300]` and `[670,170,460,300]`; end mark around `(480,285)`, credit at y370, URL pill `[300,470,680,52]`; subtitle below.
- **Visual spec:** STG-01 bone dot grid and stage cards; Space Grotesk 700 wordmark; 15/20 mono credit and URL; 2px ink pill border, 6px offset; Link 16px optional.
- **Exact content:** `Oryn`, `IBM AI Builders Challenge · AI for Business`, `https://github.com/Harikeshav-R/Oryn`; impact `Fewer repeated investigations`, `Clearer, verifiable decisions`; next steps `Application-specific validation`, `Evidence-backed verification`, `Controlled releases`, `Optional on-device inference` (future). Final script's wording governs exact timed captions.
- **States & variants to build:** Impact, next steps, on-camera close, brand-only, credit, URL typing, complete address and final hold.
- **Interactions & hotspots:** In clickable build URL pill opens exact address only after an explicit user action; film never navigates. Focus 2px ink; Enter activates.
- **Animations needed in-component:** Pill grows 500–700ms, URL types 28–34 chars/s with preroll or revised dwell, caret stops at last character; final holds through 03:00. Reduced motion full URL.
- **Data bound:** static approved credit and project URL; no metrics.
- **Depends on:** STG-02, STG-04, FRT-03, FRT-06.
- **Build notes & pitfalls:** Script's L-173–174 allots about two seconds to a 38-character address and an entrance: use pre-existing prefix/preroll, not an impossible typing rate. No logos, traction or ROI.
- **Done when:** Full URL readable at final frame; credit exact; future inference not presented as v1.0; no unsupported claims.
- **Effort:** M.

### STG-16 — Shoot-day framing and graphics
- **Purpose / what the viewer perceives:** Consistent live-action takes allow hook, close, and pickups to fit the same typographic frame.
- **Priority:** P0 for H1/H5/L1/L12 takes; P1 for slate and optional b-roll overlays, which do not appear in the finished cut.
- **Appears in:** H-001–H-005 00:00–00:10; H-143–H-149 02:48–02:55; L-001–L-007 00:00–00:08.50; L-167–L-170 02:44–02:52.
- **Canvas & layout:** 16:9 subject right `[700,80,400,500]`, clear left third `[80,110,520,360]`; slate outside usable take. 4K source cropped to 1280×720 composition.
- **Visual spec:** Bright neutral room, diffuse 45° key, soft background at 1–2m separation; no artificial portrait cutout; neutral wardrobe, no large marks. Overlay is STG-04, not part of footage.
- **Exact content:** Slate metadata `H1-A`, `H1-B`, `H5-A`, `L1-A`, `L1-B`, `L12-A`, take number; spoken lines exactly as corresponding script. Slate is removed from final film.
- **States & variants to build:** Medium wide, tighter matching eyeline, close; three takes plus slower and more energetic backup; 10s empty room and 30s room tone.
- **Interactions & hotspots:** None. Camera and microphone start, clap once for sync, record real take, stop; no app interaction.
- **Animations needed in-component:** No artificial animated head or background; FRT-04 may crop 1→1.06 over 500–900ms; reduced motion locked.
- **Data bound:** User-recorded footage, 48kHz/24-bit voice, source take metadata.
- **Depends on:** STG-04, FRT-06.
- **Build notes & pitfalls:** Tripod eye-level, lock white balance/exposure, clean lens; avoid third parties or personal documents. Preserve raw media and capture real narration.
- **Done when:** Face and left overlay space are clear; matching hook/close light; audio intelligible; slate never appears in final cut.
- **Effort:** M, excluding shoot.

## Film transitions and runtime overlays

### FX-01 — SC26 light-to-dark containment wipe
- **Purpose / what the viewer perceives:** Containment changes the visual atmosphere at the exact incident boundary, without suggesting a user clicked a theme toggle.
- **Priority:** P0.
- **Appears in:** H-104 02:09–02:10; L-127 02:04–02:05.
- **Canvas & layout:** Full frame `[0,0,1280,720]`, moving vertical wipe from x0 to x1280, captions above wipe; incident product content remains aligned.
- **Visual spec:** Ink wipe; destination background `#0A0A0A`, surface `#141414`, surface-2 `#212121`, border `#333`, foreground `#F5F5F5`; warning stop icon and `Contained` label.
- **Exact content:** `INC-0042`, `Contained`, `3 cases paused`, `INV-48231`, `INV-48233`, `INV-48236`.
- **States & variants to build:** Light pre-containment; wipe in progress; dark contained; no switch UI. Other dark stage collage is a separate composition, not another product-theme toggle.
- **Interactions & hotspots:** No pointer or click. ST12 dispatch happens at containment boundary, not after repair.
- **Animations needed in-component:** 24 frames/400ms at 60fps left-to-right; change theme beneath opaque leading edge. Reduced motion instantly presents contained dark frame.
- **Data bound:** ST12 incident fixture and exact frame.
- **Depends on:** SC26, FRT-04.
- **Build notes & pitfalls:** Only one light-to-dark product flip per cut; containment precedes repair. No arc cyan after execution stops.
- **Done when:** Wipe has no exposed mixed-theme seam; all three cases paused; no toggle click; title stays readable.
- **Effort:** M.

### FX-02 — Hard cuts, graphic slices and zoom-through
- **Purpose / what the viewer perceives:** Rhythmic cuts make cross-application work feel fast while retaining exact record continuity.
- **Priority:** P0.
- **Appears in:** H-013–H-016 00:24–00:32; H-026–H-027 00:50–00:53; L-008–L-024 00:08.50–00:22; L-034 00:31–00:32; L-046 00:43–00:44.
- **Canvas & layout:** Full-frame clip masks; zoom origin `(850,350)` for L-008; camera scale 1→1.5 or up to 1.8, 2D only. Slices use 3 horizontal strips 80–180px high.
- **Visual spec:** Crisp ink edges, bone in gaps; no 3D perspective, blur, cyan or transition overlays covering key labels.
- **Exact content:** Inherited from source and destination; preserve `INV-48219`, `PO-1042`, `AP Exceptions Tracker` when specified.
- **States & variants to build:** Instant beat cut; same-record match cut; opposing horizontal strips; 300–900ms zoom through card edge into next scene.
- **Interactions & hotspots:** None; cursor from preceding scene disappears when next beat specifies none.
- **Animations needed in-component:** Hard cut 0ms; strips translate opposing directions 500ms; zoom 600–900ms reveal curve. Reduced motion replaces movement with hard cut.
- **Data bound:** Ordered clip IDs and frame offsets, same invoice fixture for match cuts.
- **Depends on:** STG-01, APP-01–07, FRT-04.
- **Build notes & pitfalls:** Preload next scene; never accidentally duplicate a previous state at cut boundary. Crop masks are not product borders.
- **Done when:** No blank frame; identity survives match cut; captions remain above scene; no unintended 3D motion.
- **Effort:** M.

### FX-03 — Card growth and shape morph
- **Purpose / what the viewer perceives:** Small evidence or intent becomes a larger artifact and chips resolve into the brand mark.
- **Priority:** P0.
- **Appears in:** H-007–H-010 00:12–00:20; L-029–L-031 00:26–00:29; L-053 00:50–00:51; L-079 01:16–01:17; L-165 02:42–02:43.
- **Canvas & layout:** Source and destination retain world coordinates; converge at `(640,330)`; clip paths stay inside stage frame, never deform product text.
- **Visual spec:** Ink outline and white fill interpolate only as stage layers; content fades before overlap; no cyan.
- **Exact content:** `Supplier Invoice Reconciler`, remaining four STG-02 chips; `Oryn`; `Confirmed Commitment`; intent text from STG-14.
- **States & variants to build:** Five-chip convergence; message-to-review card; intent-to-candidate; logo-grid-to-node.
- **Interactions & hotspots:** Morph is presentation only; underlying actual click dispatch remains a separately timed event.
- **Animations needed in-component:** 500–800ms translation/scale, 60–120ms stagger; ease `(.16,1,.3,1)`; reduced motion replaces with direct destination.
- **Data bound:** scene frame and respective fixture identifiers.
- **Depends on:** STG-02, STG-10, STG-14.
- **Build notes & pitfalls:** Do not morph live text into unreadable shapes; fade old labels first and reveal real destination text afterward.
- **Done when:** Record/intent stays semantically consistent; no clipped names; destination state exists independently; no cyan on idle mark.
- **Effort:** M.

### FX-04 — Hatch sweep, privacy redaction and uncertainty
- **Purpose / what the viewer perceives:** Masked private fields and unknown outcomes use a recognizable texture but remain different semantic conditions.
- **Priority:** P0.
- **Appears in:** H-038 01:03–01:04; H-061 01:26–01:27; L-022 00:19–00:20; L-041 00:38–00:39.
- **Canvas & layout:** Clip hatch to target region; mask field `[520,y,380,38]` or unknown status `[760,340,200,40]`; leave label outside pattern.
- **Visual spec:** 45° neutral 1px strokes, 6px pitch over surface-2, high-contrast text, no animation of the underlying sensitive value.
- **Exact content:** Privacy `BANK ACCT`, `TAX ID`, `CARD`, `Masked on device`; outcome `Unverified` or `Outcome Unknown`, `Held`.
- **States & variants to build:** Fully opaque empty field before sweep; partial hatch; finished privacy mask; unknown case hatch, dark mode hatch.
- **Interactions & hotspots:** None; case links remain separately accessible outside the hatch.
- **Animations needed in-component:** 300–500ms wipe, 70–120ms row stagger; static after entry. Reduced motion complete hatch.
- **Data bound:** privacy field categories; unknown case INV-48220.
- **Depends on:** STG-11, SC24.
- **Build notes & pitfalls:** Identical texture does not mean privacy redaction equals business uncertainty; accompany with specific wording. No recoverable private value underneath.
- **Done when:** Field values never appear; unknown label readable; hatch clips correctly; dark version remains visible.
- **Effort:** S.

### FX-05 — Verified ring-close and glitch
- **Purpose / what the viewer perceives:** The ring briefly closes at a verified milestone; glitch marks failure, not a success cue.
- **Priority:** P0 ring-close and glitch-short; P1 text scramble variant.
- **Appears in:** L-032–L-033 00:29–00:31; L-142 02:19–02:20; H-021–H-024 00:40–00:48; H-090 01:55–01:56.
- **Canvas & layout:** O gap on STG-02 at 1 o'clock; glitch localized to affected card or line, never full-frame captions.
- **Visual spec:** 0.11em ink arc completing O, no cyan; glitch uses brief ink/trace displacement and opacity, no color-channel flash.
- **Exact content:** `Verified` only alongside an explicit verification event; glitch preserves labels `Business result: mismatch`, `Result not verified`; optional asterisks from STG-05.
- **States & variants to build:** Open default; verified closure; 400ms hold and reopening; localized failed-state glitch; idle static.
- **Interactions & hotspots:** None; animation begins only from scripted verification or failure event.
- **Animations needed in-component:** Close 400ms, hold 400ms, reopen 300–400ms; glitch 100ms with seeded 2–4px slices once. Reduced motion static textual state and open mark.
- **Data bound:** verification event, failure event, timeline frame.
- **Depends on:** STG-02, STG-05, Part B verification.
- **Build notes & pitfalls:** L-032 calls its seal conceptual; see coverage notes: gate actual closure on a visibly verified example, not a bare identity reveal.
- **Done when:** No closure on submission alone; no repeated glitch loop; all text remains legible; reduced motion conveys same status.
- **Effort:** S.

### FRT-01 — Film cursor, click ring and hover highlight
- **Purpose / what the viewer perceives:** A consistent, readable pointer demonstrates deliberate actions instead of teleporting between controls.
- **Priority:** P0.
- **Appears in:** H-014–H-015 00:26–00:30; H-057–H-130 01:22–02:36; L-017 00:14–00:15; L-035–L-164 00:32–02:42 wherever entries specify a cursor.
- **Canvas & layout:** 20×24px arrow with hotspot at upper-left tip; overlay z70 above app and below captions; per-shot paths use script coordinates.
- **Visual spec:** Black arrow with 1px white outline; neutral 2px hover outline; ink-alpha expanding ring and click press scale .97. Pointer never uses cyan.
- **Exact content:** None; target labels belong to underlying screen.
- **States & variants to build:** Hidden, travel, hover, press, click ripple, resting; authentic Bob cursor bypasses overlay.
- **Interactions & hotspots:** Film events drive actual underlying click targets; interactive build uses native pointer instead. Target activation must match visible contact and reducer event.
- **Animations needed in-component:** Cubic Bézier travel 350–900ms with 1–3% overshoot; press 90ms, ring expansion/fade 260ms, hover 150ms. Reduced motion snap pointer or hide decorative pointer.
- **Data bound:** per-shot cursor events, coordinates and frame index.
- **Depends on:** FRT-04, Part B actions, APP and SC targets.
- **Build notes & pitfalls:** Explicitly hide fake cursor during real Bob footage and live-action shots; don't let a halo cover essential values.
- **Done when:** Tip lands inside target; click and reducer action coincide; ring is ink; seeking reproduces path.
- **Effort:** M.

### FRT-02 — Selection and hover overlays
- **Purpose / what the viewer perceives:** Neutral emphasis directs attention to a cell, field or source without suggesting execution or authority.
- **Priority:** P0.
- **Appears in:** L-010 00:10.50–00:11; L-012 00:11.50–00:12; L-049 00:46–00:47; L-054 00:51–00:52; H-083 01:48–01:49.
- **Canvas & layout:** Fit target rectangle with 2px inset outline; optional 2px offset outer focus ring; z20–30 under cursor, avoid captions.
- **Visual spec:** Ink/signal `#333`, transparent fill, no cyan, 4–6px radius matching target; text remains unchanged and fully visible.
- **Exact content:** Inherited target values, including `$18,420.00`, `INV-48219`, `Fri 17:00` and `Fri 12:00`.
- **States & variants to build:** hover, focus, selected spreadsheet cell, inactive; distinguish hover from an actual click.
- **Interactions & hotspots:** Target originates in APP-02, APP-06 or SC11; focus via keyboard uses same visible outline but does not itself mutate data.
- **Animations needed in-component:** Opacity/border change 150ms; no pulsing or loop; reduced motion instant.
- **Data bound:** target element bounding box, selected case/field.
- **Depends on:** FRT-01, APP-02, APP-06, SC11.
- **Build notes & pitfalls:** Transform with camera world coordinates so highlight cannot drift from its control. Do not steal clicks.
- **Done when:** Outline tracks target through pan; value is never occluded; focus visible without color; selected state matches reducer.
- **Effort:** S.

### FRT-03 — Typing caret and deterministic text reveal
- **Purpose / what the viewer perceives:** Typed intent, date edit and URL appear to be entered at a consistent human-readable speed.
- **Priority:** P0.
- **Appears in:** H-068 01:33–01:34; H-078 01:43–01:44; L-052 00:49–00:50; L-054 00:51–00:52; L-076–L-078 01:13–01:16; L-173–L-174 02:54–02:56.
- **Canvas & layout:** 1–2px caret at current baseline and text advance inside focused input; clip to pill or field rectangle.
- **Visual spec:** Ink caret, 16/24 IBM Plex Mono for prompts and URL; 14/20 for deadline; no cyan.
- **Exact content:** `Fri 17:00` → `Fri 12:00`; `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`; `https://github.com/Harikeshav-R/Oryn`.
- **States & variants to build:** empty, focused, partial typing, select/replacement, final caret, hidden. Transcript text types only as shot specifies.
- **Interactions & hotspots:** Focus input before typing; user-editable interactive mode uses native selection and key handling. Film uses timeline events, not dispatched keystrokes to real websites.
- **Animations needed in-component:** 28–34 characters/s, bounded deterministic per-character jitter; caret visibility derived from frame, never a wall-clock blink; reduced motion full text.
- **Data bound:** immutable target text, seed, frame, selected substring, ST03/ST06.
- **Depends on:** STG-14, STG-15, SC11.
- **Build notes & pitfalls:** Pre-roll long strings rather than accelerate beyond specified rate; exact casing and punctuation matter.
- **Done when:** Same frame always shows same prefix; deadline changes only after edit; full URL correct; no synthetic typing in Bob footage.
- **Effort:** M.

### FRT-04 — Infinite-canvas camera and safe-area guides
- **Purpose / what the viewer perceives:** A 2D camera moves between related product cards without cropping names, captions or critical controls.
- **Priority:** P0 camera; P1 guide overlay for editor.
- **Appears in:** H-003–H-055 00:04–01:21; L-008–L-176 00:08.50–03:00 where motion is specified.
- **Canvas & layout:** World-space camera viewport `[0,0,1280,720]`; action-safe `[64,36,1152,648]`; title-safe `[128,72,1024,576]`; editor guides sit outside final export.
- **Visual spec:** In preview, 1px dashed neutral guide outlines and 11/16 mono labels `ACTION SAFE`, `TITLE SAFE`; guides not included in delivered video. Product and stage colors remain unchanged.
- **Exact content:** Editor only `ACTION SAFE`, `TITLE SAFE`, optional `1280 × 720`, `60 fps`; no guide labels in capture.
- **States & variants to build:** Static, pan, zoom 1.0–1.8, crop focus; guides on/off; reduced motion static composition.
- **Interactions & hotspots:** Preview toggles guides with a button outside capture; keyboard access and focus labels required. Camera follows scripted world position, never actual scroll.
- **Animations needed in-component:** 600–1100ms reveal easing; scale/translate only; reduced motion immediate. No looping or spring drift.
- **Data bound:** timeline camera events and viewport dimensions.
- **Depends on:** STG-01, FRT-05, FRT-06.
- **Build notes & pitfalls:** Caption layer stays viewport-fixed; camera does not move subtitle or resize product component internals. Preserve at least 11px authored text after crop.
- **Done when:** Random frame seeks reproduce camera transform; title/captions remain legible; guides excluded from export; no movement reveals an unrendered edge.
- **Effort:** L.

### FRT-05 — Timeline preview player and scrubber
- **Purpose / what the viewer perceives:** Builder can inspect either cut at an exact frame without relying on real time or recording prior frames.
- **Priority:** P1: preview/capture tooling only; never appears in either delivered cut.
- **Appears in:** No H/L entry; supports H-001–H-154 and L-001–L-176, 00:00–03:00.
- **Canvas & layout:** Separate editor below a scaled 16:9 player; toolbar `[0,0,1280,48]`, viewport `[160,64,960,540]`, timeline `[80,620,1120,72]`; export clean viewport only.
- **Visual spec:** Bone panel, 1px hairlines, 6px buttons, 12/18 mono frame readout, 16px Play, Pause, SkipBack, SkipForward icons; visible focus.
- **Exact content:** `Hackathon`, `Launch`, `Play`, `Pause`, `Frame`, `00:00.00 / 03:00.00`, `Safe areas`, `Capture frame`; frame range `0–10799`.
- **States & variants to build:** paused, playing preview, dragged scrubber, exact frame, selected cut, safe guides on/off; preview play may advance frame by explicit user-controlled animation clock, while exported frame is pure.
- **Interactions & hotspots:** Slider `[160,642,900,24]` maps to integer frames; arrow keys step one frame, Shift+arrows jump one second, Home/End select endpoints; space toggles play; cut selector resets or retains explicit frame.
- **Animations needed in-component:** UI feedback 150ms; no autonomous stage motion when paused; reduced motion does not disable frame stepping.
- **Data bound:** cut timeline, 60fps, 10800 frames, `resolveFrame(frame)`.
- **Depends on:** FRT-04, FRT-06, Part B reducer.
- **Build notes & pitfalls:** Screenshot/capture excludes editor and guides; reset/replay from immutable initial state for random access. No timers/random/network in rendered frame function.
- **Done when:** First and last frame selectable; seeking backward resets state; slider keyboard works; captured frame has no preview chrome.
- **Effort:** L.

### FRT-06 — Subtitle strip and accessible caption system
- **Purpose / what the viewer perceives:** Spoken narration is transcribed on a stable high-contrast strip independent of stage motion.
- **Priority:** P0.
- **Appears in:** H-001–H-154 and L-001–L-176 00:00–03:00; silent entries retain blank strip.
- **Canvas & layout:** Use `[128,630,1024,58]` as design-spec baseline, with max two centered lines and 8px vertical/12px horizontal padding; reposition per shot before it covers essential UI. Strip remains viewport-fixed at z80.
- **Visual spec:** Ink `#0A0A0A`, bone text IBM Plex Mono 600, 13–15/20 authored; 1.5× delivery yields 19.5–22.5px. No shadow, cyan or animated karaoke emphasis.
- **Exact content:** The current entry's verbatim VO, per the scripts' caption indices; silence is empty, not `—`. Example H-001 `What if your workflows`; L-001 `What if`; no fabricated offscreen speech.
- **States & variants to build:** one line, two lines, blank, shot-specific safe reposition; editable SRT/VTT sidecars synchronized with approved narration.
- **Interactions & hotspots:** No interactive hotspot in rendered film. In preview, caption toggle does not alter timeline content; export always follows approved setting.
- **Animations needed in-component:** Hard text replacement on cue boundaries, no type-on; reduced motion identical. Cue durations must support reading and not flash.
- **Data bound:** final transcript, timecodes, speaker and meaningful sound descriptions where required.
- **Depends on:** FRT-04, FRT-05.
- **Build notes & pitfalls:** Launch script specifies a conflicting larger/lower strip: see coverage notes. At most about 42 characters per sidecar line; avoid covering approval amounts or eyes.
- **Done when:** All spoken words match audio; silence has blank strip; no subtitle covers important evidence; UTF-8 SRT/VTT align to final cut.
- **Effort:** L.

## Checklist

The first and last cited entries delimit uses; see each item for disjoint intervals. `P1` denotes optional clickable/build completeness, not an additional required film shot.

| ID | Name | Priority | Effort | Depends on | Appears in (entry IDs, first and last) | Done [ ] |
|---|---|---|---|---|---|---|
| APP-01 | Gmail inbox and message | P0 | L | APP-02, APP-11, APP-12 | H-014–H-103; L-009–L-047 | [ ] |
| APP-02 | Invoice PDF variants | P0 | M | APP-01, APP-03 | H-014–H-103; L-008–L-126 | [ ] |
| APP-03 | NetSuite bill and PO | P0 | L | APP-02, SC23 | H-015–H-064; L-011–L-118 | [ ] |
| APP-04 | Kestrel vendor reminder | P0 | M | APP-03, SC04, SC11 | H-069; L-056 | [ ] |
| APP-05 | Manual case, ERP error, timeout | P0/P1 | L | APP-03, SC04, SC24, SC27 | H-021–H-107; L-016–L-152 | [ ] |
| APP-06 | AP Exceptions Tracker | P0 | M | APP-11, invoice fixtures | H-015–H-064; L-012–L-049 | [ ] |
| APP-07 | Slack escalation workspace | P0 | M | APP-11, case links | H-016–H-025; L-013–L-020 | [ ] |
| APP-08 | Zoom meeting and consent | P0 | L | SC11, ST02/ST03 | H-065–H-066; L-015–L-052 | [ ] |
| APP-09 | HubSpot blocked discount | P0 | M | SC32, ST20 | H-124–H-130; L-153–L-154 | [ ] |
| APP-10 | Adapter mark tiles | P0 | M | SC36, STG-01, FX-03 | H-124–H-132; L-159–L-165 | [ ] |
| APP-11 | Chrome tabs and address | P0 | M | APP-01–09, APP-12 | H-014–H-069; L-009–L-154 | [ ] |
| APP-12 | Desktop, menu and Dock | P0 | L | SC01, SC03, APP-13 | H-062; L-038–L-039 | [ ] |
| APP-13 | OS notification banner | P0/P1 | S | APP-12, SC24 | L-016 | [ ] |
| STG-01 | Stage canvas and frames | P0 | M | FRT-04, FRT-06 | H-006–H-055; L-019–L-176 | [ ] |
| STG-02 | SC37 brand and agent chips | P0 | L | STG-01, FX-03, FX-05 | H-006–H-011; L-023–L-176 | [ ] |
| STG-03 | Fourteen-node lifecycle | P0 | L | STG-01, STG-02 | H-027–H-036; L-059–L-165 | [ ] |
| STG-04 | Live-action type and lower third | P0 | M | STG-16, FRT-06 | H-001–H-149; L-001–L-170 | [ ] |
| STG-05 | Kinetic type and scramble | P0/P1 | M | STG-01, FRT-03 | H-001–H-013; L-001–L-121 | [ ] |
| STG-06 | Problem stats and role cards | P0 | M | STG-01, STG-07 | H-017–H-138 | [ ] |
| STG-07 | Failure visualizations | P0 | M | APP-02, APP-03, FRT-01 | H-012–H-024; L-016–L-022 | [ ] |
| STG-08 | Local and cloud architecture | P0 | L | STG-01, STG-11 | H-037–H-047; L-042–L-045 | [ ] |
| STG-09 | Real IBM Bob frame | P0 | M | STG-01, FRT-04 | H-048–H-055 | [ ] |
| STG-10 | Knowledge collage and evidence | P0 | M | SC14, APP-01–08 | H-070–H-076; L-057–L-147 | [ ] |
| STG-11 | Privacy masking card | P0/P1 | S | SC03, FX-04 | H-061; L-040–L-042 | [ ] |
| STG-12 | Calendar and montage fragments | P0/P1 | M | APP-07, APP-13 | H-016; L-013–L-016 | [ ] |
| STG-13 | Authorized screenshot textures | P0/P1 | M | APP-02, STG-01 | L-044 | [ ] |
| STG-14 | Typed intent pill | P0 | M | SC17, FRT-03 | H-077–H-079; L-075–L-079 | [ ] |
| STG-15 | End card and next steps | P0 | M | STG-02, FRT-03 | H-133–H-154; L-171–L-176 | [ ] |
| STG-16 | Shoot framing and slate | P0/P1 | M | STG-04, FRT-06 | H-001–H-149; L-001–L-170 | [ ] |
| FX-01 | Incident dark flip | P0 | M | SC26, FRT-04 | H-104; L-127 | [ ] |
| FX-02 | Cuts, slices, zoom-through | P0 | M | STG-01, FRT-04 | H-013–H-027; L-008–L-046 | [ ] |
| FX-03 | Card growth and morph | P0 | M | STG-02, STG-14 | H-007–H-010; L-029–L-165 | [ ] |
| FX-04 | Hatch sweep | P0 | S | STG-11, SC24 | H-038–H-061; L-022–L-041 | [ ] |
| FX-05 | Ring-close and glitch | P0/P1 | S | STG-02, verification | H-021–H-090; L-032–L-142 | [ ] |
| FRT-01 | Cursor and click ring | P0 | M | FRT-04, actions | H-014–H-130; L-017–L-164 | [ ] |
| FRT-02 | Hover and selection | P0 | S | FRT-01, APP-06 | H-083; L-010–L-054 | [ ] |
| FRT-03 | Typing caret | P0 | M | STG-14, STG-15, SC11 | H-068–H-078; L-052–L-174 | [ ] |
| FRT-04 | Camera and safe guides | P0/P1 | L | STG-01, FRT-05 | H-003–H-055; L-008–L-176 | [ ] |
| FRT-05 | Timeline preview | P1 | L | FRT-04, reducer | No cut; H-001–H-154, L-001–L-176 preview | [ ] |
| FRT-06 | Subtitle and captions | P0 | L | FRT-04, FRT-05 | H-001–H-154; L-001–L-176 | [ ] |

## Coverage notes and source conflicts

- `oryn-demo-design-and-build.md:120,730` specifies subtitle y630–688 and 13–15px; `launch-video-script.md:45` specifies y658–705 and 20px, outside the design's title-safe range. Use the design baseline above and reframe shots; reconcile final edit deliberately.
- `hackathon-video-script.md:111–117` closes the mark on the challenge reveal without an actual verified event; `launch-video-script.md:334–341` labels its reveal a conceptual `Verified` seal. `oryn-demo-design-and-build.md:118` and the story bible require closure only on verified. Keep the early mark open or pair the closure with real verified evidence; L-142 supplies an actual 3/3 readback.
- `hackathon-video-script.md:917–923` labels the unresolved pre-approval Job `Completed with exceptions`; `oryn-demo-design-and-build.md:380` requires `Partially Complete` until unresolved cases have terminal handling. Use `Partially complete`.
- `oryn-demo-design-and-build.md:212` and launch L-150 specify 34 impacted tests; story bible line 65 says 33, but its repair suite is explicitly 34 (28 original plus six). Use 34 consistently after repair.
- `launch-video-script.md:390–406` implies observation status itself uses cyan and an arc hum. The color contract limits cyan to active execution. Show a neutral capture indicator, preserve separate meeting and screen statuses, and omit an execution hum for passive observation.
- `oryn-demo-design-and-build.md:581` requests three user-supplied textures; only launch L-044 shows slot 1. Slots 2–3 are optional unless an edit explicitly places them. All three require irreversible redaction and source approval.
- L-032's closure length (300ms) conflicts with design's 400ms close/400ms hold. Use 400ms at a valid verification beat, not a launch-only aesthetic closure. L-173–174's URL typing window requires preroll at the prescribed 28–34 characters/s.
- Gmail, ERP, Sheets and Slack scripts do not fix every row's message text or sender. This inventory pins only known fixture facts and uses em dashes for unknown values; do not fill gaps with invented records. Exact SC04/SC11 button copy is owned by Parts A/B.
- Source lines in H-025 are small and crowded. Gartner forecast wording needs primary-source verification before use; omit that line if it cannot be verified. McKinsey is a 2012 interaction-worker study, not an Oryn measurement.
- The source design specifies IBM Plex Mono 400/500/600 but hook shots request 700. Acquire an actual 700 face with license or use available 600 consistently; do not synthesize weight.


---

# Part D — Exhaustive storyboard coverage and gap audit

## Scope and reading key

Every H-001–H-154 and L-001–L-176 storyboard interval is listed once, including inherited continuous-shot visuals, SCREEN/TEXT/MOTION and transitions. Time is film time. Inventory IDs reference the three parts; `SC` is Part A, `CMP` and data/runtime contracts are Part B, `APP`, `STG`, `FX` and film runtime are Part C. Where an RT number is ambiguous, Part B FRT-01 means product reducer; Part C FRT-01 means film cursor. `P` denotes SC12-FRAME + CMP-01/02 product shell/tokens; `S` denotes STG-01 stage. Every row also inherits Part C FRT-06 subtitle strip, FRT-04 camera and FX-02 appropriate cuts; silent subtitle strips remain present and blank. Exact per-entry caption strings, camera durations, cursor paths, and motion offsets remain authoritative in the scripts except where the contradictions section directs a revision. Gap IDs identify additions or explicit reconciliation, not proof the contradictory storyboard already meets the contract. GAP-STG-L-01 applies globally to every launch row even when not repeated in its last column. 

## Coverage matrix

| Entry ID | Timestamp | Visuals shown | Inventory IDs that cover them | GAP? |
|---|---|---|---|---|
| H-001 | 00:00–00:02 | Presenter wide, What if types, hard cut, subtitle | STG-04, STG-05, STG-16 | GAP-CMP-H-font |
| H-002 | 00:02–00:04 | Same portrait; LEARN/PROVE stacked and revealed | STG-04, STG-05, STG-16 | GAP-CMP-H-font |
| H-003 | 00:04–00:06 | Matched tighter portrait, RECOVER question rises, 1→1.06 | STG-04, STG-05, STG-16 | GAP-CMP-H-font |
| H-004 | 00:06–00:08 | Close portrait; name lower third slides | STG-04, STG-16 | GAP-STG-H-lowerthird |
| H-005 | 00:08–00:10 | Close portrait and name hold; school fades | STG-04, STG-16 | GAP-STG-H-lowerthird |
| H-006 | 00:10–00:12 | S; three orbit rings and dark traveling node assemble | STG-02 | GAP-STG-H-orbit |
| H-007 | 00:12–00:14 | S; orbit morphs to Oryn and challenge credit; O closes | STG-02, FX-03 | GAP-STG-H-close |
| H-008 | 00:14–00:16 | S; open mark, challenge credit, AI for Business, 1→1.04 | STG-02 | — |
| H-009 | 00:16–00:18 | S; five named agent chips enter, zoom through O | STG-02, FX-03 | — |
| H-010 | 00:18–00:20 | S; chips converge into Governed agent with node/test grid | STG-02, FX-03 | GAP-STG-H-chipdetail |
| H-011 | 00:20–00:22 | S; Test/Supervise/Improve expand from center | STG-02 | GAP-STG-H-threecards |
| H-012 | 00:22–00:24 | S; click check, empty evidence frame, inequality | STG-05, STG-07 | — |
| H-013 | 00:24–00:26 | S; Business result? card, scale and invoice zoom-through | STG-05, STG-07 | — |
| H-014 | 00:26–00:28 | Gmail, Brightwater/Calder, INV-48210 attachment, PDF push | APP-01, APP-02, APP-11, FRT-01 | — |
| H-015 | 00:28–00:30 | INV-48210 PDF, NetSuite PO-1031, tracker sliver; opposing windows | APP-01, APP-02, APP-03, APP-06, FRT-01 | — |
| H-016 | 00:30–00:32 | S; INV-48210 sheet and #ap-escalations in floating frames, pan | APP-06, APP-07, FRT-01 | — |
| H-017 | 00:32–00:34 | S; Priya and Marcus role cards and exception slips | STG-06 | — |
| H-018 | 00:34–00:36 | S; $9.90/invoice and Ardent 2026 source | STG-06 | — |
| H-019 | 00:36–00:38 | S; cost card broadens to $9.90 and 11.6 days | STG-06 | — |
| H-020 | 00:38–00:40 | S; two-column cost/time card and source hold | STG-06 | — |
| H-021 | 00:40–00:42 | NetSuite click checks, mismatched bill amount and warning | APP-03, STG-07, FRT-01, FX-05 | GAP-STG-H-mismatch |
| H-022 | 00:42–00:44 | Invoice/ERP mismatch panels, broken line and camera push | APP-02, APP-03, STG-07 | GAP-STG-H-mismatch |
| H-023 | 00:44–00:46 | S; Kestrel v1/v2 sheets, $38.50 handling fee, paper wipe | APP-02, STG-07 | GAP-STG-H-paperwipe |
| H-024 | 00:46–00:48 | S; document recedes, broken dashed automation path; Result not verified | STG-07, APP-02 | — |
| H-025 | 00:48–00:50 | S; Gmail/NetSuite/Slack crops, Why? and Gartner/McKinsey sources | APP-01, APP-03, APP-07, STG-06 | GAP-STG-H-sources |
| H-026 | 00:50–00:52 | S; Priya role and unresolved exception, app crops fade, zoom out | STG-06, APP-01, APP-03, APP-07 | — |
| H-027 | 00:52–00:53 | S; CLOSED LIFECYCLE, ring draw, dark node, zoom-through | STG-03 | GAP-STG-H-orbit |
| H-028 | 00:53–00:54 | S; continuing lifecycle, consent desktop card, Observe, node advances | STG-03 | GAP-STG-H-lifecycle |
| H-029 | 00:54–00:55 | S; continuing ring, source/evidence cards, Understand connector | STG-03 | GAP-STG-H-lifecycle |
| H-030 | 00:55–00:56 | S; continuing ring, Suggested reviewer card, Review/Publish | STG-03 | GAP-STG-H-lifecycle |
| H-031 | 00:56–00:57 | S; continuing ring, definition sheet/test grid, Compile/Simulate | STG-03 | GAP-STG-H-lifecycle |
| H-032 | 00:57–00:58 | S; continuing ring, approval gate and execution card | STG-03 | GAP-STG-H-lifecycle |
| H-033 | 00:58–00:59 | S; continuing ring, independent evidence and incident triangle | STG-03 | GAP-STG-H-lifecycle |
| H-034 | 00:59–01:00 | S; continuing ring, human correction and bounded repair cards | STG-03 | GAP-STG-H-lifecycle |
| H-035 | 01:00–01:01 | S; continuing ring, test grid/release gate, dark node | STG-03 | GAP-STG-H-lifecycle |
| H-036 | 01:01–01:02 | S; full fourteen-node lifecycle around open O, pullback | STG-03, STG-02 | GAP-STG-H-lifecycle |
| H-037 | 01:02–01:03 | S; local private evidence/exclusions/masking device card | STG-08 | — |
| H-038 | 01:03–01:04 | S; device rows and protected-field hatch sweep | STG-08, STG-11, FX-04 | — |
| H-039 | 01:04–01:05 | S; continuing device, purpose gate and blocked arrow | STG-08 | — |
| H-040 | 01:05–01:06 | S; continuing authorized path to LiteLLM and approved model | STG-08 | — |
| H-041 | 01:06–01:07 | S; architecture holds, US/zero-retention/no-training note | STG-08 | — |
| H-042 | 01:07–01:08 | S; architecture holds, five AI cards fan, discovery foreground | STG-08 | — |
| H-043 | 01:08–01:09 | S; same architecture, agent-definition card and suggested connector | STG-08 | GAP-STG-H-ai-detail |
| H-044 | 01:09–01:10 | S; same architecture, scenario card and independent test oracle | STG-08 | GAP-STG-H-ai-detail |
| H-045 | 01:10–01:11 | S; verification-assistance card points to independent evidence | STG-08 | GAP-STG-H-ai-detail |
| H-046 | 01:11–01:12 | S; repair-proposal card before human gate | STG-08 | — |
| H-047 | 01:12–01:13 | S; human review/authority gate, Suggested output | STG-08 | — |
| H-048 | 01:13–01:14 | S; real Bob workspace and recorded cursor, camera push | STG-09 | — |
| H-049 | 01:14–01:15 | S; real Bob build prompt, recorded pointer and camera pan | STG-09 | — |
| H-050 | 01:15–01:16 | S; real Bob review request and file, 1.05→1.18 | STG-09 | — |
| H-051 | 01:16–01:17 | S; real Bob response and editor context | STG-09 | — |
| H-052 | 01:17–01:18 | S; same Bob response and cursor, 1.18→1.22 | STG-09 | — |
| H-053 | 01:18–01:19 | S; real Bob resulting edit/test/decision | STG-09 | — |
| H-054 | 01:19–01:20 | S; Bob outcome holds, caption clears | STG-09 | — |
| H-055 | 01:20–01:21 | S; Bob frame shrinks, SC02 exposed behind, Oryn | STG-09, SC02 | GAP-STG-H-handoff |
| H-056 | 01:21–01:22 | P; enrollment fills frame, Calder & Vance/Employee, zoom-through | SC02, CMP-05, FRT-01 | — |
| H-057 | 01:22–01:23 | P; Priya enrollment notice, Review notice opens | SC02, CMP-13, FRT-01 | GAP-SC-H-notice |
| H-058 | 01:23–01:24 | P; expanded notice, Accept and continue | SC02, CMP-03, FRT-01 | — |
| H-059 | 01:24–01:25 | P; approved work-app and excluded-window checkbox lists | SC02, CMP-13, FRT-01 | — |
| H-060 | 01:25–01:26 | P; My Privacy exclusions, retention, delete, pause | SC03, FRT-01 | — |
| H-061 | 01:26–01:27 | P; BANK ACCT/TAX ID/CARD pre-masked hatch sweep | SC03, STG-11, FX-04 | — |
| H-062 | 01:27–01:28 | macOS tray popover Capture active/Pause over desktop | SC01, APP-12, FRT-01 | — |
| H-063 | 01:28–01:29 | Priya Gmail D1 INV-48203 and PDF, capture indicator | APP-01, APP-02, APP-11, APP-12, FRT-01 | — |
| H-064 | 01:29–01:30 | D1 NetSuite form with Sheets crop and provenance label | APP-03, APP-06, FRT-01 | GAP-STG-H-d1overlay |
| H-065 | 01:30–01:31 | Zoom Dana/Priya, meeting-specific consent banner, indicator after consent | APP-08, FRT-01 | — |
| H-066 | 01:31–01:32 | Consented Zoom holds, Dana quote and call waveform | APP-08 | — |
| H-067 | 01:32–01:33 | P; suggested commitment, Priya, source, caveat | SC11, CMP-04, FRT-01 | — |
| H-068 | 01:33–01:34 | P; same commitment; Fri 17→12 edit and explicit confirmation | SC11, CMP-04, CMP-03, FRT-01, FRT-03 | — |
| H-069 | 01:34–01:35 | Kestrel vendor NetSuite record and confirmed reminder | APP-04, SC04, FRT-01 | — |
| H-070 | 01:35–01:36 | P; D1/D2/D3 discovery rows align | SC13, CMP-07, FRT-01 | — |
| H-071 | 01:36–01:37 | P; candidate detail, Suggested/confidence, three source cards | SC14, CMP-06, FRT-01 | — |
| H-072 | 01:37–01:38 | P; continuing candidate, unverified variance warning and sources | SC14, CMP-18, FRT-01 | — |
| H-073 | 01:38–01:39 | P; candidate cards persist while Marcus/Workflow Owner selected | SC14, SC12-FRAME, CMP-05, FRT-01 | GAP-SC-H-role |
| H-074 | 01:39–01:40 | P; AP-RULE-009 evidence drawer, exact 2% boundary | SC14, CMP-09, CMP-18, FRT-01 | — |
| H-075 | 01:40–01:41 | P; v1.0 playbook publishes, Approved for Guidance badge | SC15, CMP-06, FRT-01 | GAP-SC-H-guidance |
| H-076 | 01:41–01:42 | P; same playbook, Steps/Decisions/Exceptions/Evidence, linked demos | SC15, CMP-18, FRT-01 | — |
| H-077 | 01:42–01:43 | P; zoom-through to empty focused Create Agent field | SC17, CMP-04, FRT-01 | — |
| H-078 | 01:43–01:44 | P; continuing intent field, exact text and deterministic caret | SC17, CMP-04, FRT-01, FRT-03 | GAP-STG-H-intent |
| H-079 | 01:44–01:45 | P; six generated rows, stopping points and unverified branch | SC17, CMP-06, FRT-01 | — |
| H-080 | 01:45–01:46 | P; scope and Tier 3 panel, per-action risk levels | SC18, FRT-01 | — |
| H-081 | 01:46–01:47 | P; six-stage autonomy ladder, Stage 3 neutral selection | SC18, FRT-01 | — |
| H-082 | 01:47–01:48 | P; 5/5, 28, 6, owner gate rows | SC18 | GAP-SC-H-gate |
| H-083 | 01:48–01:49 | P; gate holds; example evidence 3 observed + 2 archived | SC18, CMP-10, FRT-01, FRT-02 | — |
| H-084 | 01:49–01:50 | P; v0.1, 28-scenario running cyan bar and click | SC19, CMP-14, CMP-17, FRT-01 | — |
| H-085 | 01:50–01:51 | P; stopped v0.1 21 pass/6 safe/1 failed | SC20, CMP-17, CMP-06, FRT-01 | — |
| H-086 | 01:51–01:52 | P; failure replay exactly 2%, expected accept/actual escalate | SC20, CMP-09, CMP-17, FRT-01 | — |
| H-087 | 01:52–01:53 | P; failed replay behind AP-RULE-009 source drawer | SC20, SC14, CMP-18, CMP-09, FRT-01 | GAP-SC-H-rule-replay |
| H-088 | 01:53–01:54 | P; v0.1/v0.2 diff and corrected >2% comparator | SC20, CMP-16, FRT-01 | — |
| H-089 | 01:54–01:55 | P; v0.2 rerun, six named safe scenarios and running indicator | SC19, CMP-14, FRT-01 | — |
| H-090 | 01:55–01:56 | P; stopped 22 pass/6 safe/0 fail, 28/28 correct | SC20, CMP-06 | — |
| H-091 | 01:56–01:57 | P; satisfied example/test/owner gates; v1.0 Stage 3 deploy | SC18, FRT-01 | — |
| H-092 | 01:57–01:58 | P; JOB-0117, 11 invoices, v1.0/AP East; start and cyan | SC21, CMP-09, FRT-01 | GAP-SC-H-preflight |
| H-093 | 01:58–01:59 | P; live job table first INV-48210/$6240/PO-1031 | SC22, CMP-07, CMP-14, FRT-01 | — |
| H-094 | 01:59–02:00 | P; same table, seven verified checks; exceptions distinct | SC22, CMP-06, FRT-01 | — |
| H-095 | 02:00–02:01 | P; separate INV-48215/48218 missing-PO escalations | SC22, CMP-06, FRT-01 | GAP-SC-H-escalation |
| H-096 | 02:01–02:02 | P; 7/2/1/1 outcome summary, job stops | SC25, CMP-06 | GAP-SC-H-summary |
| H-097 | 02:02–02:03 | P; INV-48220 timeout/unknown/held evidence drawer | SC24, CMP-09, FRT-01 | — |
| H-098 | 02:03–02:04 | P; INV-48219 approval drawer, amounts and Tier 3 | SC23, CMP-09, CMP-16, FRT-01 | — |
| H-099 | 02:04–02:05 | P; same approval drawer, before/after, Daniel and evidence | SC23, CMP-16, FRT-01 | GAP-SC-H-approve |
| H-100 | 02:05–02:06 | P; post-readback 8/2/0/1 summary | SC25, CMP-06 | GAP-SC-H-approve |
| H-101 | 02:06–02:07 | P; INV-48220 held/reconciliation/no retry | SC24, CMP-09, FRT-01 | — |
| H-102 | 02:07–02:08 | Gmail Kestrel v2 PDF, outlined $38.50 handling line | APP-01, APP-02, FRT-01 | — |
| H-103 | 02:08–02:09 | Same PDF; INV-48231 $4213.50, PO-1051 $4175, fee | APP-02, APP-03, FRT-01 | GAP-STG-H-kestrel-po |
| H-104 | 02:09–02:10 | P; Incident Center INC-0042 wipes light to dark | SC26, FX-01 | — |
| H-105 | 02:10–02:11 | P dark; contained three individually paused case IDs | SC26, CMP-06, FRT-01 | — |
| H-106 | 02:11–02:12 | P dark; expected/actual and unconfirmed format-change hypothesis | SC26, FRT-01 | — |
| H-107 | 02:12–02:13 | P dark; Elena manual completion then Teach control | SC27, SC26, APP-05, FRT-01 | GAP-SC-H-manual |
| H-108 | 02:13–02:14 | P dark; fee/PO-terms question and Yes | SC27, CMP-04, FRT-01 | — |
| H-109 | 02:14–02:15 | P dark; answer, AP-RULE-017 evidence, Marcus scope | SC27, CMP-18, FRT-01 | — |
| H-110 | 02:15–02:16 | P dark; Kestrel layout v2 scope, correction not policy | SC28, FRT-01 | — |
| H-111 | 02:16–02:17 | P dark; REP-0042-1 before/after for Interpret invoice totals | SC28, CMP-16, FRT-01 | — |
| H-112 | 02:17–02:18 | P dark; six added cases, 34 total, active regression cyan | SC28, CMP-14, CMP-17, FRT-01 | — |
| H-113 | 02:18–02:19 | P dark; v1.1 28 pass/6 safe/0 fail, cyan stops | SC28, CMP-06 | — |
| H-114 | 02:19–02:20 | P light; authorized Kestrel/AP East limited release | SC29, FRT-01 | — |
| H-115 | 02:20–02:21 | P light; same cohort, three separate verified outcomes | SC29, CMP-06, FRT-01 | — |
| H-116 | 02:21–02:22 | P light; owner expands, closes Repaired - Validated | SC29, FRT-01 | — |
| H-117 | 02:22–02:23 | P; Operations Map workflow, rule, agent, incident and selected edges | SC16, FRT-01 | — |
| H-118 | 02:23–02:24 | P; same selected graph, neutral edge emphasis and pan | SC16, FRT-01 | — |
| H-119 | 02:24–02:25 | P; same graph, rule/incident evidence detail overlay | SC16, CMP-09, FRT-01 | — |
| H-120 | 02:25–02:26 | P; threshold 2→1.5%, Dec 1 change card | SC31, CMP-16, FRT-01 | — |
| H-121 | 02:26–02:27 | P; same policy change, 1 playbook/1 agent/34 tests revalidation | SC31, CMP-06, FRT-01 | — |
| H-122 | 02:27–02:28 | Jamal NetSuite form, one peer-fix HUD and Guide Me | APP-05, SC04, FRT-01 | — |
| H-123 | 02:28–02:29 | HubSpot 12% draft, Tier 3 blocked panel and request | APP-09, SC32, FRT-01 | — |
| H-124 | 02:29–02:30 | P; five version records, horizontal timeline, diff/rollback | SC30, CMP-15, CMP-16, FRT-01 | — |
| H-125 | 02:30–02:31 | P; command center outcomes/exceptions/incidents/release | SC33, FRT-01 | — |
| H-126 | 02:31–02:32 | P; immutable audit rows and export drawer | SC34, CMP-09, CMP-07, FRT-01 | — |
| H-127 | 02:32–02:33 | P; approval/incident/reminder notifications, one toast | SC35, CMP-11, FRT-01 | — |
| H-128 | 02:33–02:34 | S; two real redacted work screenshot textures behind Reviewed evidence cards | STG-13 | GAP-STG-H-memory |
| H-129 | 02:34–02:35 | P; seven app tiles and explicit capability availability | SC36, APP-10 | — |
| H-130 | 02:35–02:36 | P; same matrix Gmail/NetSuite/Sheets/Slack capabilities | SC36, APP-10, FRT-01 | — |
| H-131 | 02:36–02:37 | P; same matrix scrolls Zoom conditional, HubSpot, Chrome | SC36, APP-10 | — |
| H-132 | 02:37–02:38 | P; post-approval 8/2/0/1 and separate repaired incident | SC33, SC25 | — |
| H-133 | 02:38–02:39 | S; Knowledge stays attached to evidence stage card | STG-15 | GAP-STG-H-impact |
| H-134 | 02:39–02:40 | S; three evidence cards converge on reviewed procedure | STG-15 | GAP-STG-H-impact |
| H-135 | 02:40–02:41 | S; Evidence → Decision, human approval glyph | STG-15 | GAP-STG-H-impact |
| H-136 | 02:41–02:42 | P; post-approval four status tiles, unknown hatch | SC25, CMP-06 | — |
| H-137 | 02:42–02:43 | P; unknown/held evidence drawer and push | SC24, CMP-09 | GAP-SC-H-hatch |
| H-138 | 02:43–02:44 | S; 19.9% manual exception statistic and Ardent source | STG-06 | GAP-STG-H-stat |
| H-139 | 02:44–02:45 | P; Supported application validation and unavailable cell | SC36, APP-10, FRT-01 | — |
| H-140 | 02:45–02:46 | P; independently sourced evidence and Business postcondition connector | SC24, CMP-18, FRT-01 | GAP-SC-H-postcondition |
| H-141 | 02:46–02:47 | P; limited cohort, owner approval, monitoring | SC29 | — |
| H-142 | 02:47–02:48 | S; architecture device/cloud plus detached future local-inference card | STG-08, STG-15 | GAP-STG-H-future |
| H-143 | 02:48–02:49 | S; same device, authorization gate/cloud and future card; v1.0 label | STG-08, STG-15 | GAP-STG-H-future |
| H-144 | 02:49–02:50 | Presenter close, bright room and clear left third | STG-04, STG-16 | — |
| H-145 | 02:50–02:51 | Same presenter; OPERATIONAL KNOWLEDGE types on | STG-04, STG-05, STG-16 | GAP-STG-H-closecopy |
| H-146 | 02:51–02:52 | Same presenter; OPERATIONAL KNOWLEDGE plus CAN IMPROVE | STG-04, STG-16 | GAP-STG-H-closecopy, GAP-CMP-H-font |
| H-147 | 02:52–02:53 | Same presenter; three-line stack adds HUMAN CONTROL | STG-04, STG-16 | GAP-STG-H-closecopy |
| H-148 | 02:53–02:54 | S; centered open Oryn wordmark and crop marks | STG-02, STG-15 | — |
| H-149 | 02:54–02:55 | S; wordmark holds, 2px shadowed URL pill grows, caret | STG-02, STG-15, FRT-03 | — |
| H-150 | 02:55–02:56 | S; same mark/pill, types https://github.com/ | STG-02, STG-15, FRT-03 | GAP-STG-H-url |
| H-151 | 02:56–02:57 | S; same mark/pill, extends prefix through Harikeshav-R/ | STG-02, STG-15, FRT-03 | GAP-STG-H-url |
| H-152 | 02:57–02:58 | S; same mark/pill, complete URL and caret | STG-02, STG-15, FRT-03 | GAP-STG-H-url |
| H-153 | 02:58–02:59 | S; complete mark/URL and North America challenge credit | STG-02, STG-15 | GAP-STG-H-credit |
| H-154 | 02:59–03:00 | S; final mark, full URL and challenge credit hold, no caret | STG-02, STG-15, FRT-03 | GAP-STG-H-credit |
| L-001 | 00:00.00–00:01.00 | Presenter, table/laptop, typed What if, locked cut | STG-04, STG-05, STG-16 | GAP-CMP-L-01 |
| L-002 | 00:01.00–00:02.00 | Same presenter, question expands, workflows bold | STG-04, STG-05, STG-16 | GAP-CMP-L-01 |
| L-003 | 00:02.00–00:03.00 | Tight presenter crop, could learn, beat cut | STG-04, STG-05, STG-16 | GAP-CMP-L-01 |
| L-004 | 00:03.00–00:04.00 | Continued tight shot, people phrase and presenter lower-third | STG-04, STG-05, STG-16 | GAP-CMP-L-01, GAP-STG-L-02 |
| L-005 | 00:04.00–00:05.00 | Closer presenter, prove phrase and weight swap | STG-04, STG-05, STG-16 | GAP-CMP-L-01 |
| L-006 | 00:05.00–00:07.00 | Presenter, two-line recover question | STG-04, STG-05, STG-16 | — |
| L-007 | 00:07.00–00:08.50 | Same presenter, question hold, punctuation pulse | STG-04, STG-05, STG-16 | — |
| L-008 | 00:08.50–00:10.00 | Question-to-invoice corner, INV-48219 zoom-through | STG-04, APP-02, FX-02 | — |
| L-009 | 00:10.00–00:10.50 | Brightwater Gmail attachment, left pan | APP-01 | — |
| L-010 | 00:10.50–00:11.00 | PDF amount/PO crop, outlined amount | APP-02, FRT-02 | — |
| L-011 | 00:11.00–00:11.50 | ERP invoice/PO columns, pan | APP-03 | — |
| L-012 | 00:11.50–00:12.00 | Tracker INV-48219 row and outlined cell | APP-06, FRT-02 | — |
| L-013 | 00:12.00–00:12.50 | Slack channel and INV-48219 message | APP-07 | — |
| L-014 | 00:12.50–00:13.00 | Undated Kestrel review calendar push | STG-12 | — |
| L-015 | 00:13.00–00:13.50 | Priya/Dana Zoom grid, lateral crop | APP-08 | — |
| L-016 | 00:13.50–00:14.00 | ERP timeout toast, warning and timed entry | APP-05, APP-13 | — |
| L-017 | 00:14.00–00:15.00 | ERP form, oversized pointer and action-only check | APP-03, STG-07, FRT-01 | GAP-STG-L-03 |
| L-018 | 00:15.00–00:16.00 | Form to unverified outcome panel, hatch/divider | APP-03, STG-07, FX-04 | — |
| L-019 | 00:16.00–00:17.00 | Gmail/ERP/Sheets overlapping stage triptych | APP-01, APP-03, APP-06, STG-01 | — |
| L-020 | 00:17.00–00:18.00 | Triptych slices into email/ERP/Slack strips | APP-01, APP-03, APP-07, STG-01, FX-02 | — |
| L-021 | 00:18.00–00:19.00 | Centered invoice card, app edges, pullback | APP-02, APP-01, APP-03, STG-01 | — |
| L-022 | 00:19.00–00:20.00 | Invoice status Unverified and hatch sweep | APP-02, STG-07, FX-04 | — |
| L-023 | 00:20.00–00:21.00 | Invoice collapses to ink node on dots | APP-02, STG-01, STG-02, FX-03 | — |
| L-024 | 00:21.00–00:22.00 | Ink node, corner marks, two tracing rings | STG-01, STG-02 | GAP-STG-L-04 |
| L-025 | 00:22.00–00:23.00 | Three open orbit rings trace and camera pushes | STG-01, STG-02 | GAP-STG-L-04 |
| L-026 | 00:23.00–00:24.00 | Ring plus Supplier Invoice Reconciler chip | STG-01, STG-02 | — |
| L-027 | 00:24.00–00:25.00 | Existing chip/ring plus Order Status Sync and Support Exception Triage | STG-01, STG-02 | — |
| L-028 | 00:25.00–00:26.00 | Existing three chips/ring plus Policy Watcher and Peer Fix Guide | STG-01, STG-02 | — |
| L-029 | 00:26.00–00:27.00 | Five chips compress into orbit mark | STG-01, STG-02, FX-03 | — |
| L-030 | 00:27.00–00:28.00 | Open ink ring and travelling neutral node | STG-01, STG-02 | GAP-STG-L-05 |
| L-031 | 00:28.00–00:29.00 | Open ring persists, Oryn letters assemble | STG-01, STG-02 | — |
| L-032 | 00:29.00–00:30.00 | Wordmark, conceptual Verified, 300ms closure | STG-01, STG-02, FX-05 | GAP-STG-L-06 |
| L-033 | 00:30.00–00:31.00 | Verified clears, O reopens | STG-01, STG-02, FX-05 | GAP-STG-L-06 |
| L-034 | 00:31.00–00:32.00 | Open O zooms into enrollment card edge | STG-02, SC02, STG-01, FX-02 | — |
| L-035 | 00:32.00–00:33.00 | Enrollment notice, organization, unchecked consent | SC02, CMP-13 | GAP-SC-L-01 |
| L-036 | 00:33.00–00:34.00 | Separate observation/contribution controls | SC02, CMP-13 | GAP-SC-L-01 |
| L-037 | 00:34.00–00:35.00 | My Privacy app/window/URL exclusions | SC03 | — |
| L-038 | 00:35.00–00:36.00 | Companion menu active to paused | SC01, APP-12 | GAP-STG-L-07 |
| L-039 | 00:36.00–00:37.00 | Same menu explicit resume to active | SC01, APP-12 | — |
| L-040 | 00:37.00–00:38.00 | Empty BANK ACCT/TAX ID/CARD rows, zoom | SC03, STG-11, CMP-43 | — |
| L-041 | 00:38.00–00:39.00 | Same rows, staged hatch and storage boundary | SC03, STG-11, FX-04 | — |
| L-042 | 00:39.00–00:40.00 | Device evidence versus transient cloud and reviewed contribution | STG-08 | — |
| L-043 | 00:40.00–00:41.00 | My Privacy retention/delete with device icon | SC03, STG-08 | — |
| L-044 | 00:41.00–00:42.00 | Sanitized user screenshot texture and foreground invoice | STG-13, APP-02, STG-01 | — |
| L-045 | 00:42.00–00:43.00 | Personal evidence and reviewed contribution split | STG-08, STG-01 | — |
| L-046 | 00:43.00–00:44.00 | D1 invoice grows from contribution card into Gmail | APP-02, STG-08, FX-02 | — |
| L-047 | 00:44.00–00:45.00 | Priya D1 Gmail and PDF, INV-48203 | APP-01, APP-02 | — |
| L-048 | 00:45.00–00:46.00 | D1 NetSuite bill/PO panels, right pan | APP-03 | — |
| L-049 | 00:46.00–00:47.00 | D1 Sheets tracker row, selected cell | APP-06, FRT-02 | — |
| L-050 | 00:47.00–00:48.00 | Zoom consent then recording indicator | APP-08 | — |
| L-051 | 00:48.00–00:49.00 | Dana quote and 00:14:32 beside meeting tile | APP-08 | — |
| L-052 | 00:49.00–00:50.00 | Dana quote persists, Priya reply types | APP-08, FRT-03 | GAP-STG-L-08 |
| L-053 | 00:50.00–00:51.00 | Meeting tile becomes suggested commitment, Fri 17:00 | APP-08, SC11, CMP-42, FX-03 | — |
| L-054 | 00:51.00–00:52.00 | Same review, deadline edited Fri 17 to 12 | SC11, CMP-04, FRT-02, FRT-03 | — |
| L-055 | 00:52.00–00:53.00 | Same review, explicit confirmation and caveat | SC11, CMP-42 | — |
| L-056 | 00:53.00–00:54.00 | Kestrel vendor record and contextual reminder | APP-04, SC04, CMP-36 | — |
| L-057 | 00:54.00–00:55.00 | Three app evidence ribbons, empty candidate, separate commitment | STG-10, APP-01, APP-03, APP-06 | — |
| L-058 | 00:55.00–00:56.00 | Discovery candidate Needs Review in stage window | SC13, CMP-25, STG-01 | — |
| L-059 | 00:56.00–00:57.00 | D1 evidence, Observe lifecycle node | SC14, CMP-24, STG-03, STG-10 | — |
| L-060 | 00:57.00–00:58.00 | D1 persists, D2 arrives, Understand node | SC14, CMP-24, STG-03, STG-10 | — |
| L-061 | 00:58.00–00:59.00 | D1/D2 persist, D3 joins, Review node | SC14, CMP-24, STG-03, STG-10 | — |
| L-062 | 00:59.00–01:00.00 | Marcus playbook preview, Publish node/action | SC15, STG-03 | GAP-SC-L-02 |
| L-063 | 01:00.00–01:01.00 | Compile node, assembling candidate definition card | STG-03, CMP-27 | GAP-STG-L-09 |
| L-064 | 01:01.00–01:02.00 | Simulate node, mini scenario cards/test frame | STG-03, CMP-17 | GAP-STG-L-09 |
| L-065 | 01:02.00–01:03.00 | Authorize node, person approval barrier | STG-03 | GAP-STG-L-09 |
| L-066 | 01:03.00–01:04.00 | Execute node, scoped work item to ERP outline | STG-03 | GAP-STG-L-09 |
| L-067 | 01:04.00–01:05.00 | Verify node, separate independent readback | STG-03 | GAP-STG-L-09 |
| L-068 | 01:05.00–01:06.00 | Diagnose node, hatched unconfirmed cause | STG-03, FX-04 | GAP-STG-L-09 |
| L-069 | 01:06.00–01:07.00 | Correct node, human annotation card | STG-03 | GAP-STG-L-09 |
| L-070 | 01:07.00–01:08.00 | Repair node, one bounded outlined step | STG-03 | GAP-STG-L-09 |
| L-071 | 01:08.00–01:09.00 | Re-evaluate node, complete regression frame | STG-03, CMP-32 | GAP-STG-L-09 |
| L-072 | 01:09.00–01:10.00 | Release node, narrow cohort and approval mark | STG-03, CMP-33 | GAP-STG-L-09 |
| L-073 | 01:10.00–01:11.00 | Three demonstrations, candidate, medium confidence and uncertainty | SC14, CMP-24, CMP-25 | GAP-SC-L-03 |
| L-074 | 01:11.00–01:12.00 | Published playbook and explicit AP-RULE-009 boundary | SC15, SC14, CMP-26 | — |
| L-075 | 01:12.00–01:13.00 | Empty Create Agent stage pill over playbook | SC17, STG-14 | — |
| L-076 | 01:13.00–01:14.00 | Same pill, first intent prefix and caret | STG-14, FRT-03 | — |
| L-077 | 01:14.00–01:15.00 | Same pill widened, second intent prefix | STG-14, FRT-03 | — |
| L-078 | 01:15.00–01:16.00 | Same pill completed and submitted | STG-14, FRT-03 | — |
| L-079 | 01:16.00–01:17.00 | Pill grows to six-section agent definition; running glyph | SC17, CMP-27, STG-14, FX-03 | — |
| L-080 | 01:17.00–01:18.00 | v0.1 candidate, unverified variance branch | SC17, CMP-27 | — |
| L-081 | 01:18.00–01:19.00 | Same candidate, Elena and AP-RULE-009 evidence drawer | SC17, SC14, CMP-18 | GAP-SC-L-04 |
| L-082 | 01:19.00–01:20.00 | AP East scope, three apps, selected queue | SC18, CMP-28 | GAP-SC-L-05 |
| L-083 | 01:20.00–01:21.00 | Risk tiers and action authority rise in sequence | SC18, CMP-21 | — |
| L-084 | 01:21.00–01:22.00 | Continued risk ladder, Tier 4 prohibited | SC18, CMP-21 | — |
| L-085 | 01:22.00–01:23.00 | Six-row autonomy ladder, neutral Stage 3 | SC18, CMP-22 | — |
| L-086 | 01:23.00–01:24.00 | Five verified examples and 3+2 provenance | SC18, CMP-23 | — |
| L-087 | 01:24.00–01:25.00 | Same gate, 25/5 minimums, 28/6 suite, pending | SC18, CMP-23 | — |
| L-088 | 01:25.00–01:26.00 | Same gate, owner approval pending | SC18, CMP-23 | — |
| L-089 | 01:26.00–01:27.00 | NetSuite supervised capability and separate Tier 3 approval | SC18, CMP-28, CMP-39 | — |
| L-090 | 01:27.00–01:28.00 | v0.1 candidate and simulator stage frames align | SC17, SC19, STG-01 | GAP-STG-L-10 |
| L-091 | 01:28.00–01:29.00 | Simulator suite 28, categories and Run Evaluation | SC19, CMP-17 | GAP-SC-L-06 |
| L-092 | 01:29.00–01:30.00 | Same suite v0.1 running, cyan progress | SC19, CMP-14 | — |
| L-093 | 01:30.00–01:31.00 | Scrolling 28 scenario rows, active row cyan | SC19, CMP-17 | GAP-SC-L-07 |
| L-094 | 01:31.00–01:32.00 | v0.1 results 21/6/1, cyan stops | SC20, CMP-17 | — |
| L-095 | 01:32.00–01:33.00 | Failed equality scenario enlarged | SC20, CMP-17 | — |
| L-096 | 01:33.00–01:34.00 | Replay exact-2% expected/actual columns | SC20, CMP-30 | — |
| L-097 | 01:34.00–01:35.00 | Replay and AP-RULE-009 source threshold | SC20, SC14, CMP-18 | — |
| L-098 | 01:35.00–01:36.00 | Missing PO safe-escalation pass row | SC20, CMP-17 | — |
| L-099 | 01:36.00–01:37.00 | Simulator card plus STOPPING CAN BE CORRECT type | SC20, STG-05, STG-01 | — |
| L-100 | 01:37.00–01:38.00 | Six separate expected-safe-escalation scenarios | SC20, CMP-17 | — |
| L-101 | 01:38.00–01:39.00 | v0.1/v0.2 operator comparison | SC20, CMP-16 | — |
| L-102 | 01:39.00–01:40.00 | Same suite v0.2 running progress | SC19, CMP-14 | — |
| L-103 | 01:40.00–01:41.00 | Corrected 22/6/0 and 28/28 | SC20, CMP-17 | — |
| L-104 | 01:41.00–01:42.00 | Side-by-side versions and changed equality verdict | SC20, CMP-16, CMP-34 | — |
| L-105 | 01:42.00–01:43.00 | Stage 3 example/scenario checks, owner still separate | SC18, CMP-23 | — |
| L-106 | 01:43.00–01:44.00 | Same gate, Marcus authorizes scoped release | SC18, CMP-23 | — |
| L-107 | 01:44.00–01:45.00 | Released v1.0, Stage 3, AP East | SC18, CMP-28 | — |
| L-108 | 01:45.00–01:46.00 | JOB-0117 fixed 11 selected invoices, growing card | SC21, SC22, CMP-19, FX-03 | GAP-SC-L-08 |
| L-109 | 01:46.00–01:47.00 | Preflight scope/version and start | SC21 | — |
| L-110 | 01:47.00–01:48.00 | First two independently verified invoice rows | SC22, CMP-19 | — |
| L-111 | 01:48.00–01:49.00 | Next three verified rows, fixed Job header | SC22, CMP-19 | — |
| L-112 | 01:49.00–01:50.00 | Two distinct missing-PO escalations | SC22, CMP-19 | — |
| L-113 | 01:50.00–01:51.00 | Final two ordinary verified cases | SC22, CMP-19 | — |
| L-114 | 01:51.00–01:52.00 | Brightwater variance row opens approval drawer | SC22, SC23, CMP-09 | — |
| L-115 | 01:52.00–01:53.00 | Continued approval, Daniel authority and invoice/PO sources | SC23, CMP-18, CMP-31 | — |
| L-116 | 01:53.00–01:54.00 | Continued approval, before/after status and amounts | SC23, CMP-16 | — |
| L-117 | 01:54.00–01:55.00 | Continued drawer, approval pending verification | SC23, CMP-31 | — |
| L-118 | 01:55.00–01:56.00 | Independent ERP readback, Verified Complete | APP-03, SC23 | — |
| L-119 | 01:56.00–01:57.00 | INV-48220 unknown drawer, hatched timeout | SC24, FX-04 | — |
| L-120 | 01:57.00–01:58.00 | Same unknown drawer, held, unavailable resubmit tooltip | SC24, CMP-10 | GAP-SC-L-09 |
| L-121 | 01:58.00–01:59.00 | Hatched case and UNKNOWN ≠ COMPLETE stage headline | SC24, STG-05, STG-01 | — |
| L-122 | 01:59.00–02:00.00 | Before-approval 7/2/1/1 snapshot | SC25, CMP-40 | — |
| L-123 | 02:00.00–02:01.00 | After verification 8/2/0/1 counter change | SC25, CMP-40 | GAP-SC-L-10 |
| L-124 | 02:01.00–02:02.00 | Continued summary, JOB-0117 11 cases, partial | SC25, CMP-20 | — |
| L-125 | 02:02.00–02:03.00 | Kestrel fee-after-subtotal invoice crosses summary | APP-02, SC25, STG-01 | — |
| L-126 | 02:03.00–02:04.00 | Three Kestrel case cards, verification unavailable, wipe begins | SC26, CMP-29, FX-01 | GAP-STG-L-11 |
| L-127 | 02:04.00–02:05.00 | Dark containment wipe, INC-0042, three paused | SC26, FX-01 | GAP-STG-L-11 |
| L-128 | 02:05.00–02:06.00 | Same dark incident, three individually paused rows | SC26, CMP-29 | — |
| L-129 | 02:06.00–02:07.00 | Invoice/PO/fee expected-versus-actual comparison | SC26, CMP-30 | — |
| L-130 | 02:07.00–02:08.00 | Same incident, separate unconfirmed hypothesis | SC26, CMP-29, CMP-30 | — |
| L-131 | 02:08.00–02:09.00 | Elena manual completion and Teach action | APP-05, SC26 | — |
| L-132 | 02:09.00–02:10.00 | Dark teaching question dialog expands | SC27, FX-03 | — |
| L-133 | 02:10.00–02:11.00 | Same dialog, yes answer and AP-RULE-017 link | SC27, CMP-18 | — |
| L-134 | 02:11.00–02:12.00 | Marcus validates layout-v2 scope; not new policy | SC27 | — |
| L-135 | 02:12.00–02:13.00 | REP-0042-1 single-step diff, unchanged policy | SC28, CMP-16 | — |
| L-136 | 02:13.00–02:14.00 | Six added regression cards and 34 total | SC28, CMP-32 | GAP-SC-L-11 |
| L-137 | 02:14.00–02:15.00 | v1.1 34-scenario regression running | SC28, CMP-14, CMP-32 | — |
| L-138 | 02:15.00–02:16.00 | Regression result 28/6/0, cyan off | SC28, CMP-32 | — |
| L-139 | 02:16.00–02:17.00 | Marcus limited release, diff and passing suite | SC29, CMP-33 | — |
| L-140 | 02:17.00–02:18.00 | Same release, Kestrel/AP East/Stage 3 boundary | SC29, CMP-33 | — |
| L-141 | 02:18.00–02:19.00 | Three separate cohort cases undergoing readback | SC29, CMP-33 | — |
| L-142 | 02:19.00–02:20.00 | Same cohort 3/3 verified; stage ring closes | SC29, CMP-33, STG-02, FX-05 | GAP-STG-L-12 |
| L-143 | 02:20.00–02:21.00 | Same evidence, explicit Marcus expansion | SC29, CMP-33 | — |
| L-144 | 02:21.00–02:22.00 | Incident closed Repaired - Validated, history | SC29, SC26 | — |
| L-145 | 02:22.00–02:23.00 | Horizontal five-version history, compare/restore | SC30, CMP-34, CMP-15 | — |
| L-146 | 02:23.00–02:24.00 | Continued version timeline, restore future-only tooltip | SC30, CMP-10 | GAP-SC-L-12 |
| L-147 | 02:24.00–02:25.00 | Dark four-card knowledge collage | STG-10, STG-01 | — |
| L-148 | 02:25.00–02:26.00 | Operations Map selected dependencies via collage zoom | SC16, CMP-41, STG-10, FX-02 | — |
| L-149 | 02:26.00–02:27.00 | Policy 2.00% to 1.50%, Dec 1 | SC31, CMP-16 | — |
| L-150 | 02:27.00–02:28.00 | Same policy, 1 playbook/1 agent/34 tests revalidation | SC31 | GAP-SC-L-13 |
| L-151 | 02:28.00–02:29.00 | Jamal ERP validation and one peer-fix HUD | APP-05, SC04, CMP-36 | — |
| L-152 | 02:29.00–02:30.00 | Same ERP and HUD, first guide instruction | APP-05, SC04, CMP-36 | GAP-SC-L-14 |
| L-153 | 02:30.00–02:31.00 | HubSpot 12% discount blocked, Daniel approval | APP-09, SC32 | — |
| L-154 | 02:31.00–02:32.00 | Same blocked draft, request approval hover | APP-09, SC32 | — |
| L-155 | 02:32.00–02:33.00 | Command Center 8/2/1, closed incident, expanded v1.1 | SC33, CMP-40 | GAP-SC-L-15 |
| L-156 | 02:33.00–02:34.00 | X-ray scope, evidence quality, privacy limitations | SC33 | — |
| L-157 | 02:34.00–02:35.00 | Audit history and authorized export drawer | SC34, CMP-07, CMP-09 | GAP-SC-L-16 |
| L-158 | 02:35.00–02:36.00 | Bell drawer, approval/incident/reminder, one expanded | SC35, CMP-35 | — |
| L-159 | 02:36.00–02:37.00 | Thirteen app marks in four-column grey tile grid | APP-10, SC36 | GAP-STG-L-13 |
| L-160 | 02:37.00–02:38.00 | Capability matrix five headers, explicit unavailable | SC36, CMP-39 | — |
| L-161 | 02:38.00–02:39.00 | Gmail/NetSuite capability rows, other cells unavailable | SC36, CMP-39 | — |
| L-162 | 02:39.00–02:40.00 | Sheets/Slack rows, other cells unavailable | SC36, CMP-39 | — |
| L-163 | 02:40.00–02:41.00 | Zoom conditional observation and Guide | SC36, CMP-39 | — |
| L-164 | 02:41.00–02:42.00 | HubSpot/Chrome rows, other cells unavailable | SC36, CMP-39 | — |
| L-165 | 02:42.00–02:43.00 | Logo grid collapses to node and neutral lifecycle | APP-10, STG-03, FX-03 | — |
| L-166 | 02:43.00–02:44.00 | Ring zoom-through to opening live-action workspace | STG-02, STG-04, STG-16, FX-02 | — |
| L-167 | 02:44.00–02:46.00 | Presenter close, workflows that learn type | STG-04, STG-05, STG-16 | — |
| L-168 | 02:46.00–02:48.00 | Same presenter, first line rises; agents that prove | STG-04, STG-05, STG-16 | GAP-CMP-L-01 |
| L-169 | 02:48.00–02:50.00 | Same presenter, operations that recover | STG-04, STG-05, STG-16 | — |
| L-170 | 02:50.00–02:52.00 | Same presenter, type clears, final spoken name | STG-04, STG-16 | — |
| L-171 | 02:52.00–02:53.00 | Open orbit, Oryn wordmark, dotted end card | STG-01, STG-02, STG-15 | — |
| L-172 | 02:53.00–02:54.00 | Same card, challenge credit fades in | STG-02, STG-15 | — |
| L-173 | 02:54.00–02:55.00 | Same card/credit, growing URL pill and partial URL | STG-15, FRT-03 | GAP-STG-L-14 |
| L-174 | 02:55.00–02:56.00 | Same card, full URL and stopped caret | STG-15, FRT-03 | GAP-STG-L-14 |
| L-175 | 02:56.00–02:58.00 | Complete mark, credit and URL hold | STG-01, STG-02, STG-15 | — |
| L-176 | 02:58.00–03:00.00 | Same final frame, blank subtitle, no black slate | STG-01, STG-02, STG-15 | — |

## Full gap item specifications

# Hackathon coverage gap specifications

All coordinates use the 1280×720 authored canvas. Product interiors inherit Part A's flat 1px surfaces, semantic status and keyboard contracts; stage cards inherit STG-01's bone `#F6F6F3`, 24px dot grid, 2px ink outline and 6px hard shadow. FRT-06 captions remain separate and unobstructed. These are scoped additions or explicit storyboard corrections, not claims that the existing inventory already contains the missing visual. Timings are film-time deterministic; reduced motion presents the final state. References are to `hackathon-video-script.md` (script), `oryn-demo-design-and-build.md` (design), and `_parts/part-{a-product-screens,b-components,c-mocks-and-stage}.md` (Parts A/B/C).

### GAP-CMP-H-font — Authentic mono bold face
- **Purpose / what the viewer perceives:** Bold kinetic emphasis matches the photographed hook and closing without a synthetic font weight.
- **Priority:** P0; production capture prerequisite.
- **Appears in:** H-002–003 00:02–00:06; H-146 02:51–02:52.
- **Canvas & layout:** STG-04's left text region `[80,150,540,300]`; retain face and caption clearance.
- **Visual spec:** Actual IBM Plex Mono 700 WOFF2 alongside CMP-02's 400/500/600, with OFL notice; `font-synthesis: none`. H-002 white emphasis; H-003 white 44px; H-146 white bold.
- **Exact content:** `LEARN`, `PROVE`, `RECOVER` in `RECOVER WHEN REALITY CHANGES?`, `CAN IMPROVE`.
- **States & variants to build:** Loaded authentic 700; missing font blocks final capture with diagnostic, not a simulated bold face.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** None in font loader; STG-04 owns the 150ms weight and timed reveals.
- **Data bound:** Licensed font asset and font-readiness state.
- **Depends on:** CMP-02, STG-04, STG-05.
- **Build notes & pitfalls:** Acquire and self-host the genuine licensed face; preload and await font readiness. References: script:66–77,1370; Part B:29–41; design:15–19,58–60; Part C:716. This resolves a missing asset, not a new type style.
- **Done when:** Actual 700 loads in capture and no synthetic bold or layout shift occurs.
- **Effort:** S.

### GAP-STG-H-lowerthird — Hackathon presenter identification
- **Purpose / what the viewer perceives:** Presenter name lands first and school follows without covering his face or subtitles.
- **Priority:** P0.
- **Appears in:** H-004–005 00:06–00:10.
- **Canvas & layout:** Hackathon cut `[64,506,506,84]`, plus 6px shadow; face at frame-right and caption strip clear. Use this cut-specific position rather than design's conflicting y548.
- **Visual spec:** White stage card, 2px ink border, 6px hard shadow; name 22px Space Grotesk 700, school 14px IBM Plex Mono.
- **Exact content:** `Harikeshav Rameshkumar`; `The Ohio State University`.
- **States & variants to build:** Name only; name plus school.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Slide right 20px over 500ms; school fades in 300ms at H-005.
- **Data bound:** Approved real presenter footage and fixed identity text.
- **Depends on:** STG-04, STG-16, FRT-06.
- **Build notes & pitfalls:** Check actual footage hands and title-safe caption strip. Script:83–98; design:120; Part C:276. This is a cut-specific coordinate resolution.
- **Done when:** Name and school are legible, positioned as specified, and do not cover face, hands or captions.
- **Effort:** S.

### GAP-STG-H-orbit — Neutral orbit node placement
- **Purpose / what the viewer perceives:** A dark traveling node ties the introduction and lifecycle to the same identity without implying execution.
- **Priority:** P0.
- **Appears in:** H-006 00:10–00:12; H-027 00:52–00:53.
- **Canvas & layout:** Three concentric rings centered `(640,330)`; node centered on the middle ring, not the storyboard's outer ring. H-027 retains the 230px lifecycle ring from STG-03 and overlays the middle identity ring distinctly.
- **Visual spec:** 2px ink strokes, single dark ink node; dotted bone backdrop, no cyan.
- **Exact content:** `CLOSED LIFECYCLE` in tracked 16px IBM Plex Mono at H-027.
- **States & variants to build:** Identity ring assembly; idle lifecycle introduction with revealed stroke and dark node.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** H-006 rings scale .65→1 over 700ms with 60ms stagger, node follows clockwise; H-027 draws 700ms and node follows then holds.
- **Data bound:** Timeline only; no running state.
- **Depends on:** STG-02, STG-03, STG-01, FRT-04.
- **Build notes & pitfalls:** Revise the storyboard's outer-ring instruction to the design's middle-ring identity motif; do not confuse middle-ring node with a lifecycle execution status. Script:101–108,294–301; design:116; Part C:245,260–265.
- **Done when:** Both shots show one dark middle-ring node, with no idle cyan.
- **Effort:** S.

### GAP-STG-H-close — Conceptual wordmark remains open
- **Purpose / what the viewer perceives:** The challenge introduction reveals Oryn without falsely claiming verified evidence.
- **Priority:** P0.
- **Appears in:** H-007 00:12–00:14, continuing H-008.
- **Canvas & layout:** Centered wordmark around `(640,330)`; 14px credit below; subtitles separate.
- **Visual spec:** Original open O with 32° gap, Space Grotesk 700 wordmark about 80px high, ink on bone; no cyan.
- **Exact content:** `Oryn`; `IBM AI Builders Challenge, North America`; H-008 adds `AI for Business`.
- **States & variants to build:** Open identity reveal and open hold; no verification closure in this shot.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Letters move inward 12px over 650ms; keep ring gap open throughout.
- **Data bound:** Fixed identity and challenge credit; no verified event.
- **Depends on:** STG-02, FX-03, FRT-06.
- **Build notes & pitfalls:** Revise script's conceptual ring closure and ring-close SFX; only a separately evidenced verification beat can close O. Script:110–117; design:118; Part C:247–253,707–708.
- **Done when:** Challenge reveal shows no closed ring or unearned verification cue.
- **Effort:** S.

### GAP-STG-H-chipdetail — Governed-agent convergence
- **Purpose / what the viewer perceives:** Five examples become one governed-agent concept with a visible test grid and idle node.
- **Priority:** P0.
- **Appears in:** H-010 00:18–00:20.
- **Canvas & layout:** Center one card at `(640,330)`; place miniature test grid and dark node to its right, outside card text and caption safe area.
- **Visual spec:** White card, 2px ink border, 6px hard shadow; miniature grid ink on white; node solid dark ink.
- **Exact content:** `Governed agent`; incoming chips `Supplier Invoice Reconciler`, `Order Status Sync`, `Support Exception Triage`, `Policy Watcher`, `Peer Fix Guide`.
- **States & variants to build:** Five incoming chips; one settled card and frame-right grid/node.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Converge over 700ms; settle with 2% overshoot; dark node remains still.
- **Data bound:** Fixed five names, timeline frame.
- **Depends on:** STG-02, STG-01.
- **Build notes & pitfalls:** H-specific 700ms timing overrides generic 800ms STG-02 convergence. Do not use cyan for a nonrunning diagram. Script:137–144; Part C:240–253.
- **Done when:** Five readable chips converge into one legible card with grid and dark idle node.
- **Effort:** S.

### GAP-STG-H-threecards — Test, supervise, improve
- **Purpose / what the viewer perceives:** Three distinct, equally weighted governance actions expand from the center.
- **Priority:** P0.
- **Appears in:** H-011 00:20–00:22.
- **Canvas & layout:** Three equal cards spanning x190–1090 and y280–430, evenly spaced.
- **Visual spec:** White, 2px ink, 6px stage shadow, Space Grotesk 28px headings.
- **Exact content:** `Test`, `Supervise`, `Improve`, in that left-to-right order.
- **States & variants to build:** Center-origin entry and three-card settled layout.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Expand from center for 500ms each, staggered 90ms.
- **Data bound:** Fixed labels, timeline frame.
- **Depends on:** STG-02, STG-01.
- **Build notes & pitfalls:** Separate cards are missing from the generic word list; do not substitute three lines inside a single card. Script:146–153; Part C:240–253.
- **Done when:** All three equal cards and their labels are visible in the authored region.
- **Effort:** S.

### GAP-STG-H-mismatch — Safe abstract mismatch illustration
- **Purpose / what the viewer perceives:** Completed clicks do not prove the destination matches the source, without attributing invented amounts or actions to a real invoice.
- **Priority:** P0.
- **Appears in:** H-021–022 00:40–00:44.
- **Canvas & layout:** Left invoice `[130,180,430,320]`, right ERP `[720,180,430,320]`, broken connector `[570,300,140,4]`; keep subtitle separate.
- **Visual spec:** White 2px/6px stage panels, flat internal 1px fields; completed-click checks separate from outlined mismatch warning; no numeric values, cyan or success stamp.
- **Exact content:** `Clicks complete`; `Amount mismatch`; `Business result: mismatch`; add `Illustrative comparison` to distinguish from case records.
- **States & variants to build:** Abstract source/destination fields with contrasting nonnumeric field marks; completed action checks; broken connection and mismatch warning.
- **Interactions & hotspots:** No Submit or actual record action; remove the scripted Submit click and associated click sound, since no authorized matching fixture exists.
- **Animations needed in-component:** Checks appear 100ms apart; broken connector draws 500ms; camera pushes 1→1.1.
- **Data bound:** Non-record illustration only; no invoice identifiers or values.
- **Depends on:** STG-07, FRT-04, FRT-06.
- **Build notes & pitfalls:** Script:238–253 asks numeric mismatch and Submit; Part C:324–330 forbids inventing amounts and APP-03's normal fixture is not this mismatch. Revise H-021/022 visual and any VO claiming an actual posted wrong result to an illustrative conditional; never falsify INV-48210 or INV-48219.
- **Done when:** Viewer sees a clear abstract mismatch and click/result separation without fabricated transactions or amounts.
- **Effort:** M.

### GAP-STG-H-paperwipe — Supplier document transition
- **Purpose / what the viewer perceives:** One supplier page physically wipes to a revised layout with its new fee visible.
- **Priority:** P0.
- **Appears in:** H-023 00:44–00:46.
- **Canvas & layout:** APP-02 Kestrel v1 behind v2, overlapping within center stage; fee rectangle remains inside visible v2 paper.
- **Visual spec:** Flat paper-white 2D shapes, 1px ink fee rectangle, 14px mono label, bone dotted surroundings.
- **Exact content:** `Kestrel Components`; `Handling fee $38.50`.
- **States & variants to build:** v1 leading edge; crossing paper edge; settled v2 with highlighted handling line.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Cross-slide pages 600ms while a 2D paper-edge mask wipes across; hold fee label afterward.
- **Data bound:** APP-02 authored Kestrel v1/v2 document fixture.
- **Depends on:** APP-02, STG-07, FX-02.
- **Build notes & pitfalls:** Existing cross-slide is not itself the paper wipe; no simulated 3D curl or cyan. Script:256–263; Part C:39,498–507.
- **Done when:** Wipe resolves to v2 and the exact fee remains readable throughout its hold.
- **Effort:** S.

### GAP-STG-H-sources — Safely sourced problem context
- **Purpose / what the viewer perceives:** External research context is clearly attributed and separated from Oryn's performance.
- **Priority:** P0; publishing gate on source verification.
- **Appears in:** H-025 00:48–00:50.
- **Canvas & layout:** Gmail, NetSuite and Slack crops surround centered `Why?` card; two 11/16 mono lines fit above caption strip with sufficient contrast.
- **Visual spec:** White 2px/6px stage card; ink text on bone, no overlays over sources.
- **Exact content:** `Why?`; `McKinsey Global Institute, 2012: about 19% of interaction workers' workweek spent searching for and gathering information`. The requested second line is `Gartner, 2025: over 40% of agentic AI projects forecast canceled by end of 2027`.
- **States & variants to build:** Verified Gartner primary-source variant with both lines; safe default omits Gartner line and revises storyboard until verified.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** App crops drift outward 30px over 700ms; attribution remains readable.
- **Data bound:** Published external research citations, not Oryn data.
- **Depends on:** STG-06, APP-01, APP-03, APP-07, FRT-06.
- **Build notes & pitfalls:** Do not present unverified Gartner wording as fact; remove the line and revise script if primary source cannot be checked. McKinsey applies to 2012 interaction workers. Script:275; Part C:310–316,715.
- **Done when:** Every displayed source is verified, scoped correctly and readable; unverified forecast is absent.
- **Effort:** M.

### GAP-STG-H-lifecycle — Authored fourteen-step lifecycle
- **Purpose / what the viewer perceives:** A continuous sequence connects consent, evidence, human authority, execution, independent verification and bounded release.
- **Priority:** P0.
- **Appears in:** H-028–036 00:53–01:02.
- **Canvas & layout:** `(640,330)` center, radius 230px, 14 evenly spaced nodes and outer labels; preserve previously shown labels, keep cards outside ring where possible and caption strip clear. Source and evidence cards sit around x375/x530; execution card near `(935,330)`.
- **Visual spec:** Ink circle 2px, neutral 18px nodes, 14/20 mono labels; white stage microcards with 2px border and 6px shadow; open central O.
- **Exact content:** `Observe`, `Understand`, `Review · Publish`, `Compile · Simulate`, `Authorize · Execute`, `Verify · Diagnose`, `Correct · Repair`, `Re-evaluate · Release`; card labels `Suggested`, `Owner approval`, `Independent readback`, `Human correction`, `Bounded change`, `Regression suite`.
- **States & variants to build:** H-028 desktop/consent; H-029 source and evidence; H-030 suggested reviewer; H-031 definition sheet and test grid; H-032 approval gate before execution; H-033 independent evidence and incident triangle; H-034 human correction and bounded repair; H-035 test grid and release gate; H-036 full fourteen labels with release-to-observe link.
- **Interactions & hotspots:** Film is decorative; optional interactive nodes use STG-03's 44px targets without triggering workflow transitions.
- **Animations needed in-component:** H-028 label +100ms, node +40°; H-029 connector 500ms; H-030 card 400ms; H-031 two nodes 150ms apart; H-032 gate 350ms; H-033 frames 500ms; H-034 connector 500ms and cards slide 8px; H-035 node 500ms; H-036 camera 1.2→1 over 700ms. Advance idle node clockwise between entries without equating equal 40° illustrative movement with the exact fourteen-node spacing.
- **Data bound:** Fixed ordered labels and timeline; no actual release or running event.
- **Depends on:** STG-03, STG-02, STG-01, FRT-04.
- **Build notes & pitfalls:** Keep earlier labels readable; do not conflate owner authorization with execution or output with independent readback. Node stays dark, not cyan. Script:303–382; Part C:256–269.
- **Done when:** Every shot's microcards and all fourteen ordered labels are visible in the final neutral loop.
- **Effort:** L.

### GAP-STG-H-ai-detail — Independent AI assistance boundaries
- **Purpose / what the viewer perceives:** Generated definitions, scenarios and verification assistance are suggestions, not independent authority or evidence.
- **Priority:** P0.
- **Appears in:** H-043–045 01:08–01:11.
- **Canvas & layout:** Retain STG-08 device `[120,180,370,300]`, gate `[510,270,180,100]`, gateway `[710,190,220,100]`, cloud `[960,190,200,100]`; fan cards around cloud, with separate oracle and evidence boxes outside model output.
- **Visual spec:** White 2px/6px cards, 14px ink mono; thin dashed suggested connector, separate outlined oracle, dotted evidence connector and outlined document glyph.
- **Exact content:** `Agent-definition generation`; `Suggested`; `Scenario generation`; `Verification assistance`; `Independent evidence`; existing route labels and authorization conditions.
- **States & variants to build:** Definition with suggested line; scenarios plus independent test oracle; assistance plus independently sourced evidence box.
- **Interactions & hotspots:** None; human gate remains distinct.
- **Animations needed in-component:** Definition scales .95→1 over 400ms; oracle outline draws 350ms; evidence dotted connector draws 450ms.
- **Data bound:** Fixed conceptual architecture and AI-use labels, not model decisions.
- **Depends on:** STG-08, STG-01.
- **Build notes & pitfalls:** Preserve existing authorized route and blocked branch; don't put check stamp on model output or imply oracle was generated by the model. Script:438–463; Part C:340–348.
- **Done when:** Each of the three cues is visible in its own entry and independent boundaries remain legible.
- **Effort:** M.

### GAP-STG-H-handoff — Bob to enrollment
- **Purpose / what the viewer perceives:** Authentic recorded development footage recedes into Oryn's product demonstration.
- **Priority:** P0.
- **Appears in:** H-055 01:20–01:21.
- **Canvas & layout:** STG-09 real capture shrinks toward frame-right over SC02; overlay `Oryn` on exposed upper-left bone area, away from footage and subtitles.
- **Visual spec:** 2D ink Space Grotesk 700 wordmark, original open O; existing 2px/6px capture frame and flat SC02 interior.
- **Exact content:** `Oryn`.
- **States & variants to build:** Full Bob frame; shrinking frame with visible Oryn and enrollment behind; SC02 takeover.
- **Interactions & hotspots:** Use recorded Bob cursor only; no synthetic pointer within recording.
- **Animations needed in-component:** Shrink existing footage frame as STG-09 directs; overlay fades with transition.
- **Data bound:** Authorized unaltered Bob recording and SC02 fixture.
- **Depends on:** STG-09, SC02, STG-02, FRT-04.
- **Build notes & pitfalls:** Wordmark is separate overlay, never fabricate Bob content. Script H-055; Part C:355–361.
- **Done when:** Oryn is legible while authentic capture shrinks and enrollment emerges.
- **Effort:** S.

### GAP-SC-H-notice — Explicit notice disclosure
- **Purpose / what the viewer perceives:** Priya opens and reviews the notice before accepting it, with capture and sharing still separate.
- **Priority:** P0.
- **Appears in:** H-057–058 01:22–01:24.
- **Canvas & layout:** Within SC02 centered `[320,100,640,520]`, disclosure row beneath notice heading; expanded details remain above footer and do not cover continue control.
- **Visual spec:** Flat white card, 1px hairline, 6px disclosure control, neutral chevron and visible 2px keyboard focus.
- **Exact content:** `Review notice`; `Your work, your choice`; `Priya Nair`; `Accept and continue`; notice explains durable private evidence stays on device, authorized inference is transient and sharing requires separate review.
- **States & variants to build:** Collapsed; expanded; accepted only by explicit action; declined keeps observation off.
- **Interactions & hotspots:** Keyboard-accessible disclosure with `aria-expanded`; activation expands, then separate acceptance proceeds. Do not auto-check consent.
- **Animations needed in-component:** Notice expands over 150ms, reduced motion instant.
- **Data bound:** Priya's notice acceptance and separate capture/sharing choices.
- **Depends on:** SC02, CMP-03, CMP-13, FRT-01.
- **Build notes & pitfalls:** A visual expansion is missing in SC02; disclosure is not consent. Script H-057–058; Part A:47–55.
- **Done when:** `Review notice` opens readable content and acceptance remains a separate explicit action.
- **Effort:** S.

### GAP-STG-H-d1overlay — Demonstration provenance overlay
- **Purpose / what the viewer perceives:** The first demonstration's NetSuite and tracker views are one attributable observed sequence.
- **Priority:** P0.
- **Appears in:** H-064 01:29–01:30.
- **Canvas & layout:** NetSuite form left/center, narrow Sheets tracker crop on right; 12px mono overlay above crops, outside their data and subtitle regions.
- **Visual spec:** Neutral ink provenance label on light backing; flat real mock-app interiors, stage framing only around crops.
- **Exact content:** `Demonstration D1 · Priya · Mon 09:14`.
- **States & variants to build:** NetSuite-only leading crop; side-by-side NetSuite/Sheets with provenance label.
- **Interactions & hotspots:** None beyond underlying recorded demonstration.
- **Animations needed in-component:** Camera pans 100px over 600ms, keeping overlay synchronized.
- **Data bound:** D1 Priya fixture and APP-03/APP-06 data; no invented purchase order.
- **Depends on:** APP-03, APP-06, FRT-01, FRT-04.
- **Build notes & pitfalls:** Label is a stage overlay, not app-native content. Script:629–635; Part C:49–56,97–104.
- **Done when:** Exact provenance and both synchronized surfaces are visible without invented fields.
- **Effort:** S.

### GAP-SC-H-role — Authorized Marcus selector
- **Purpose / what the viewer perceives:** Marcus reviews the candidate as Workflow Owner, without implying a role upgrade.
- **Priority:** P0.
- **Appears in:** H-073 01:38–01:39.
- **Canvas & layout:** Keep canonical sidebar selector at P(135,54); do not add conflicting top-right selector at `(1090,65)`. Candidate and sources remain visible in the crop.
- **Visual spec:** Existing flat shell selector, neutral selected state, 1px border and visible focus.
- **Exact content:** `Marcus Webb · Workflow Owner`; organization `Calder & Vance`.
- **States & variants to build:** Selector closed with full identity; open authorized role choices; Marcus selected.
- **Interactions & hotspots:** Activate canonical selector at P(135,54), choose the existing authorized Marcus role; Escape restores focus.
- **Animations needed in-component:** Popover 150ms; selected view changes immediately.
- **Data bound:** People and authorized role assignments.
- **Depends on:** SC12-FRAME, SC14, CMP-05, FRT-01.
- **Build notes & pitfalls:** Revise H-073's top-right location and cursor path, not the actual authority. Script H-073; Part A:15–19.
- **Done when:** Full Marcus identity is visible at the existing selector, with candidate detail intact.
- **Effort:** S.

### GAP-SC-H-guidance — Neutral guidance publication
- **Purpose / what the viewer perceives:** A reviewed playbook is published for guidance, not deployed as an agent.
- **Priority:** P0.
- **Appears in:** H-075 01:40–01:41.
- **Canvas & layout:** SC15 playbook header and adjacent badge within product content `[264,112,992,584]`.
- **Visual spec:** Neutral outlined shield/check, 1px product treatment; no success hue or stage shadow.
- **Exact content:** `v1.0`; `Approved for Guidance`.
- **States & variants to build:** Prior to publication; published guidance badge.
- **Interactions & hotspots:** Publication follows authorized owner action; badge is not an action.
- **Animations needed in-component:** Badge appears on actual publication state, standard 150ms transition.
- **Data bound:** Playbook version and owner publication event, not deployment state.
- **Depends on:** SC15, CMP-06, FRT-01.
- **Build notes & pitfalls:** Revise script's success color to neutral per Part A:160 and design:99; guidance publication confers no agent execution authority.
- **Done when:** Neutral badge appears only after publication and does not imply deployment.
- **Effort:** S.

### GAP-SC-H-gate — Pending release-gate checklist
- **Purpose / what the viewer perceives:** Examples are evidenced, while scenario and owner gates are pending until their actual later events.
- **Priority:** P0.
- **Appears in:** H-082–083 01:47–01:49 and H-091 01:56–01:57.
- **Canvas & layout:** SC18 right gate panel `[768,112,464,560]`, four 40px rows; evidence drawer `[800,0,480,720]`.
- **Visual spec:** Checked example row; empty neutral circles for unfulfilled scenario, edge/negative and owner requirements; later evidenced checks only.
- **Exact content:** `5/5 verified human examples`; `28/25 representative scenarios`; `6/5 edge/negative`; `Owner approval`; `3 observed this week + 2 SME-verified archived cases`.
- **States & variants to build:** H-082 evidence checked and remaining gates pending; H-083 provenance drawer; H-091 all checked after v0.2 evaluation and Marcus approval.
- **Interactions & hotspots:** Example count opens its evidence; owner approval is separate from test completion; Deploy disabled before all requirements are fulfilled.
- **Animations needed in-component:** 150ms focus and state transition; no pre-emptive check animation.
- **Data bound:** `gateExamples`, v0.2 test outcomes and Marcus approval.
- **Depends on:** SC18, CMP-10, SC19, SC20, FRT-01.
- **Build notes & pitfalls:** Revise four-check implication at script:791–798; numbers are requirements, not proof of completion. Part A:209–215.
- **Done when:** Only supported gates are checked at each time and deployment remains blocked until genuine approval.
- **Effort:** S.

### GAP-STG-H-intent — Fixed-height intent typing
- **Purpose / what the viewer perceives:** A precise agent request is typed into the existing flat product field.
- **Priority:** P0.
- **Appears in:** H-077–078 01:42–01:44.
- **Canvas & layout:** SC17 intent textarea retains CMP-04 fixed geometry and product alignment; line-wrap inside the field instead of increasing its height.
- **Visual spec:** Flat white textarea, 1px warm border, neutral focus; deterministic visible caret.
- **Exact content:** `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`
- **States & variants to build:** Empty focused field; partially typed wrapped text; complete intent.
- **Interactions & hotspots:** Field receives keyboard focus and text; blank submission remains blocked.
- **Animations needed in-component:** Type at 32 characters per second for approximately 2.6 seconds after the empty focused field is shown; extend or resequence H-077–078 to accommodate it. No field resize.
- **Data bound:** SC17 fixed intent string, timeline character index.
- **Depends on:** SC17, CMP-04, FRT-03.
- **Build notes & pitfalls:** Revise storyboard's field-growth instruction to fixed-height wrapping, consistent with CMP-04; STG-14 stage pill is not the product field. The original two-second combined window cannot show the empty field and complete 81-character typing at 32 characters/s; extend the sequence rather than fake pre-roll. Script H-077–078; Part B:68; Part C:436–443.
- **Done when:** Full exact intent follows a genuinely empty field at the stated typing rate without changing product geometry.
- **Effort:** S.

### GAP-SC-H-rule-replay — Failed replay with source overlay
- **Purpose / what the viewer perceives:** Source policy explains why the exact 2% simulation result is wrong while the failed replay remains visible.
- **Priority:** P0.
- **Appears in:** H-087 01:52–01:53.
- **Canvas & layout:** SC20 selected failure/replay remains visible on left; authorized AP-RULE-009 source drawer `[800,0,480,720]` overlays right at z50.
- **Visual spec:** Flat white drawer, 1px border, shadow-lg; failure red X-diamond; source text foreground, no running cyan.
- **Exact content:** `AP-RULE-009`; `variance_exactly_2.00pct`; `Expected: accept`; `Actual: escalate`; `> 2.00% requires approval`.
- **States & variants to build:** Failed replay selected; source drawer open atop it; drawer closed returns to same failure.
- **Interactions & hotspots:** Source evidence link opens authorized drawer; Escape closes and restores focus.
- **Animations needed in-component:** Drawer enters 150ms; replay remains static underneath.
- **Data bound:** SCN-022 v0.1 recorded outcome and AP-RULE-009 authorized source.
- **Depends on:** SC20, SC14, CMP-09, CMP-18, FRT-01.
- **Build notes & pitfalls:** Exactly 2.00% is accepted; only greater than 2.00% needs approval. Preserve v0.1 failure; no manufactured success. Script H-087; Part A:240–248.
- **Done when:** Correct rule and both expected/actual results are visible simultaneously.
- **Effort:** S.

### GAP-SC-H-preflight — Explicit job scope and start
- **Purpose / what the viewer perceives:** Operator confirms a fixed job scope before starting the authorized run.
- **Priority:** P0.
- **Appears in:** H-092 and, if required for legibility, extended/resequenced H-093 01:57 onward.
- **Canvas & layout:** SC21 queue `[264,160,992,440]`; confirmation dialog centered, max width 512px, z40 scrim; second action in footer.
- **Visual spec:** Flat white table and 8px dialog, 1px separators, 24px padding, shadow-lg; cyan only after Start.
- **Exact content:** `JOB-0117`; `Supplier Invoice Reconciler v1.0`; `AP East`; `11 invoices`; `Confirm job scope`; `Permitted applications`; `Policy`; `Start job`; `Cancel`.
- **States & variants to build:** Queue; selected fixed 11; preflight showing version, apps and policy; confirmed start; blocked unauthorized.
- **Interactions & hotspots:** P(1110,170) opens confirmation; distinct P(780,520) `Start job` starts only after authorization. Cancel/Escape does not start.
- **Animations needed in-component:** Dialog 150ms; active cyan only after confirmed Start.
- **Data bound:** JOB-0117 frozen population, v1.0 release, AP East, permitted apps and policy.
- **Depends on:** SC21, SC22, CMP-03, FRT-01.
- **Build notes & pitfalls:** Revise one-click H-092 choreography; extend or move transition if both actions cannot be read in one second. Approval for job is not approval of Tier 3 variance. Script H-092; Part A:256–265.
- **Done when:** Both explicit actions and scope are visible before any running indicator.
- **Effort:** M.

### GAP-SC-H-escalation — Distinct missing-PO outcomes
- **Purpose / what the viewer perceives:** Two different invoices are escalated separately for missing purchase orders.
- **Priority:** P0.
- **Appears in:** H-095 02:00–02:01.
- **Canvas & layout:** SC22 11-row table `[264,220,992,452]`, individual rows for each case.
- **Visual spec:** Warning arrow/person glyph with foreground `Escalated` text; no warning triangle, which belongs to `Needs Revalidation`.
- **Exact content:** `INV-48215 · Escalated: Missing Purchase Order`; `INV-48218 · Escalated: Missing Purchase Order`.
- **States & variants to build:** Incomplete rows; two independently escalated rows.
- **Interactions & hotspots:** Each row opens its own case, preserving ID and reason.
- **Animations needed in-component:** Deterministic row reveal, 60ms stagger within SC22.
- **Data bound:** JOB-0117 invoice rows and separate escalation events.
- **Depends on:** SC22, CMP-06, FRT-01.
- **Build notes & pitfalls:** Revise script:908–914 triangles to canonical arrow/person; Part A:9, Part B:100. No shared aggregated incident.
- **Done when:** Both IDs and their separate missing-PO escalation statuses are readable with correct glyphs.
- **Effort:** S.

### GAP-SC-H-summary — Honest partially complete batch
- **Purpose / what the viewer perceives:** The stopped job has exceptions and one unresolved held outcome, not a fully completed result.
- **Priority:** P0.
- **Appears in:** H-096 02:01–02:02.
- **Canvas & layout:** SC25 four 232×160 cards at x264/512/760/1008, y160.
- **Visual spec:** 1px bordered white product cards, 28px numerals, 12px mono labels; hatch confined to unknown glyph or background, not text.
- **Exact content:** `Partially Complete`; `7 Verified Complete`; `2 Escalated`; `1 Approval Required`; `1 Outcome Unknown`.
- **States & variants to build:** Stopped preapproval 7/2/1/1 snapshot; later verified 8/2/0/1 is separate.
- **Interactions & hotspots:** Status cards filter corresponding SC22 cases; unknown opens SC24.
- **Animations needed in-component:** Counts appear 150ms only on genuine state change; stop extinguishes cyan.
- **Data bound:** Eleven job outcomes and held unknown.
- **Depends on:** SC25, SC22, CMP-06, FRT-01.
- **Build notes & pitfalls:** Revise `Completed with exceptions` in script:917–923 to canonical `Partially Complete`; design:206,380; Part A:322.
- **Done when:** Summary totals 11 and its label does not imply unresolved case completed.
- **Effort:** S.

### GAP-SC-H-approve — Approval followed by readback
- **Purpose / what the viewer perceives:** Daniel's approval and independent proof of the resulting business state are distinct events.
- **Priority:** P0.
- **Appears in:** H-099–100 02:04–02:06; extend or resequence if needed.
- **Canvas & layout:** SC23 drawer `[800,0,480,720]`, sticky action footer; follow with SC25 four-card summary.
- **Visual spec:** Neutral product drawer with warning person/diamond, before/after 1px diff; no green verification until authoritative readback.
- **Exact content:** `INV-48219`; `Daniel Okafor · Tier 3`; `Before: Variance Hold`; `After: Matched - Variance Approved`; `Approve`; `Awaiting verification`; then `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`.
- **States & variants to build:** Pending approval; explicit approved/awaiting verification; independently verified readback; updated 8/2/0/1 summary.
- **Interactions & hotspots:** Authorized explicit `Approve` click P(1100,665), then a separate permitted source readback event; only then update count.
- **Animations needed in-component:** 150ms decision transition; count changes 150ms after evidence; no count-up or premature cyan.
- **Data bound:** Daniel's delegation, INV-48219 approval event, authoritative separate readback and JOB-0117 snapshot.
- **Depends on:** SC23, SC25, CMP-16, FRT-01.
- **Build notes & pitfalls:** Script:944–960 currently has only a cursor approach then a verified count. Revise choreography and duration; approval alone does not prove posting. Part A:290–297.
- **Done when:** Click, waiting state and independently sourced result are separately visible before verified count rises.
- **Effort:** M.

### GAP-STG-H-kestrel-po — Linked purchase order comparison
- **Purpose / what the viewer perceives:** Invoice total differs from linked PO by a visible handling fee without invented purchase-order detail.
- **Priority:** P0.
- **Appears in:** H-103 02:08–02:09.
- **Canvas & layout:** Kestrel v2 PDF on left; small adjacent PO card at right without covering fee line or subtitles.
- **Visual spec:** White card, 2px ink frame and 6px stage shadow outside the PDF; outlined fee line, no cyan.
- **Exact content:** `INV-48231`; `$4,213.50`; `PO-1051`; `$4,175.00`; `Handling fee $38.50`.
- **States & variants to build:** PDF fee highlighted; linked PO comparison card visible beside it.
- **Interactions & hotspots:** None; card is illustrative overlay linked to existing fixture.
- **Animations needed in-component:** Card appears with H-103 comparison reveal; preserve fee outline.
- **Data bound:** APP-02 Kestrel invoice and its stated PO-1051 amount.
- **Depends on:** APP-02, APP-03, FRT-01.
- **Build notes & pitfalls:** APP-03 Brightwater PO is not Kestrel's PO; show only supplied Kestrel fields and amounts. Script H-103; Part C:34–37.
- **Done when:** All three amounts and PO identity are simultaneously legible with no invented fields.
- **Effort:** S.

### GAP-SC-H-manual — Attributable completed case before Teach
- **Purpose / what the viewer perceives:** Elena already completed a case manually before contributing a correction.
- **Priority:** P0.
- **Appears in:** H-107 02:12–02:13.
- **Canvas & layout:** SC27/APP-05 case panel with attributable completion state visible above the `Teach` control, then transition into teaching.
- **Visual spec:** Dark incident product theme, flat 1px panels; neutral completed-state text with source link, not an approval badge.
- **Exact content:** `Elena`; `Teach`; use the existing APP-05 case identifier and recorded manual completion evidence verbatim.
- **States & variants to build:** Previously manually completed, attributable case with evidence; Teach open. Completion occurred before shot and is not represented as an onscreen action.
- **Interactions & hotspots:** Open or display the authorized completion evidence, then click `Teach`; no invented approval.
- **Animations needed in-component:** Standard 150ms product transition.
- **Data bound:** APP-05 recorded Elena manual-completion event and case evidence.
- **Depends on:** APP-05, SC26, SC27, FRT-01.
- **Build notes & pitfalls:** If fixture lacks attributable event evidence, production must supply it before claiming manual completion; do not synthesize an event or approver. Script H-107; Part C:82–89; Part A:355–356.
- **Done when:** Completion is visibly attributable to Elena before Teach and no false approval is implied.
- **Effort:** M.

### GAP-STG-H-memory — Two separate authorized texture slots
- **Purpose / what the viewer perceives:** Real redacted work textures frame fictional reviewed-evidence cards without being represented as their proof.
- **Priority:** P0, both authorized textures required for this shot.
- **Appears in:** H-128 02:33–02:34.
- **Canvas & layout:** Two distinct stage frames behind foreground cards, staggered left/right within title-safe area; crop screenshots to preserve separation from captions.
- **Visual spec:** 2px ink outlines, 6px stage shadows, bone field; foreground cards are separately authored white cards, not screenshot overlays masquerading as evidence.
- **Exact content:** `Reviewed evidence` on each fictional foreground card; no assertions about the textures' contents.
- **States & variants to build:** Two separately supplied irreversibly redacted authorized textures plus independent fictional cards; missing either asset blocks this shot.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Texture frames drift 20px over 600ms; reduced motion holds still.
- **Data bound:** Two approved real screenshot assets, irreversibly redacted before import; separate fictional display cards.
- **Depends on:** STG-13, STG-01, FRT-06.
- **Build notes & pitfalls:** H-128 overrides optional slot 2: both are required. Never treat screenshots as proof or reveal source text beneath masks. Script H-128; Part C:419–429.
- **Done when:** Two authorized redacted textures are visibly distinct from the fictional reviewed-evidence cards.
- **Effort:** M.

### GAP-STG-H-impact — Evidence-centered impact composition
- **Purpose / what the viewer perceives:** Evidence remains attached to reviewed knowledge and human decisions, without numerical outcome claims.
- **Priority:** P0.
- **Appears in:** H-133–135 02:38–02:41.
- **Canvas & layout:** H-133 centered card; H-134 three small evidence cards at left converge on one reviewed procedure card right; H-135 two labels over human approval glyph.
- **Visual spec:** White 2px outlined cards with 6px shadow, 24px Space Grotesk title, 16px IBM Plex Mono decision labels, thin ink connectors.
- **Exact content:** `Knowledge stays attached to evidence`; `Fewer repeated investigations`; `Evidence → Decision`.
- **States & variants to build:** Headline; three-to-one evidence graph; evidence-to-decision plus outlined human approval glyph.
- **Interactions & hotspots:** None; human glyph indicates authority, not an automatic approval.
- **Animations needed in-component:** Heading rises 10px over 500ms; three links draw 500ms; decision labels reveal 300ms.
- **Data bound:** Fixed editorial copy and illustrative cards, not a measured performance claim.
- **Depends on:** STG-15, STG-01, FRT-06.
- **Build notes & pitfalls:** Script:1252–1277; Part C:452–455. No quantified outcome or fabricated source identifiers.
- **Done when:** Three distinct compositions appear in sequence with readable evidence and human authority.
- **Effort:** M.

### GAP-SC-H-hatch — Unknown status text remains solid
- **Purpose / what the viewer perceives:** Unknown and held remain legible as separate unresolved statuses.
- **Priority:** P0.
- **Appears in:** H-137 02:42–02:43.
- **Canvas & layout:** SC24 right drawer `[800,0,480,720]`; crop unrelated navigation while preserving status and evidence link.
- **Visual spec:** 45° neutral 1px hatch at 6px spacing clipped to status glyph or separate background panel; solid foreground text outside hatch.
- **Exact content:** `Outcome Unknown · Held`; evidence link and missing-readback state.
- **States & variants to build:** Unknown plus held, with evidence link and no retry.
- **Interactions & hotspots:** Evidence link opens permitted source; no resubmit action.
- **Animations needed in-component:** Camera 1→1.12 over 600ms; hatch remains static.
- **Data bound:** INV-48220 timeout, custody and hold.
- **Depends on:** SC24, CMP-06, CMP-09.
- **Build notes & pitfalls:** Revise script:1289, which places hatch behind status text; Part A:305 and design:112 forbid this. Do not imply successful readback.
- **Done when:** Full status text is solid and readable, hatch is confined to glyph or separate panel.
- **Effort:** S.

### GAP-STG-H-stat — Manual exception context
- **Purpose / what the viewer perceives:** A sourced industry statistic establishes context, not a measured Oryn result.
- **Priority:** P0.
- **Appears in:** H-138 02:43–02:44.
- **Canvas & layout:** Center white statistic card `[280,180,720,330]`, source inset 24px at bottom.
- **Visual spec:** 32px Space Grotesk headline, 11/16 IBM Plex Mono citation, 2px ink border and 6px shadow.
- **Exact content:** `19.9% of invoices require manual exception handling`; `Ardent Partners · Payables Place · 2026`.
- **States & variants to build:** Entering card; held sourced statistic.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Scale .96→1 over 500ms.
- **Data bound:** Story bible:131 Ardent 2026 statistic and source; external to Oryn.
- **Depends on:** STG-06, STG-01.
- **Build notes & pitfalls:** Script:1297–1304; Part C:310–317. Verify the cited source supports exact wording before publication; never describe it as an Oryn result.
- **Done when:** Exact statistic and source are simultaneously readable and attribution is explicit.
- **Effort:** S.

### GAP-SC-H-postcondition — Independent evidence connector
- **Purpose / what the viewer perceives:** Verification compares a business postcondition with evidence from an independent authorized source, without resolving an unknown case by assertion.
- **Priority:** P0.
- **Appears in:** H-140 02:45–02:46.
- **Canvas & layout:** Two flat product cards side by side inside SC24 content, one source card and one `Business postcondition` card, thin connector between; preserve held-case status.
- **Visual spec:** White panels, 1px warm borders, 8px radius, outlined document glyph, thin ink connector; no green success or cyan.
- **Exact content:** `Business postcondition`; `Evidence`; `INV-48220`; `Outcome Unknown`; `Held`; `ERP submit timed out`; `Reconciliation required`; `Independent readback unavailable`.
- **States & variants to build:** Evidence source identified as NetSuite ERP timeout record, with explicit missing authoritative readback; separate postcondition card remains unverified.
- **Interactions & hotspots:** Cursor follows authorized source link; no retry or verified action.
- **Animations needed in-component:** Connector draws 500ms; reduced motion static.
- **Data bound:** Authorized NetSuite timeout evidence for INV-48220 and missing independent outcome readback; source identity is distinct from agent output.
- **Depends on:** SC24, CMP-18, CMP-09, FRT-01.
- **Build notes & pitfalls:** Timeout record evidences timeout, not whether submission succeeded. If independent authoritative outcome is unavailable, retain unknown and do not draw the connector as proof of fulfillment. Script:1315–1321; Part A:306–307.
- **Done when:** Source and postcondition are distinct, connector is visible, and no verified readback is implied.
- **Effort:** M.

### GAP-STG-H-future — Future inference is not current route
- **Purpose / what the viewer perceives:** Current authorized cloud inference differs from a detached future on-device inference direction.
- **Priority:** P0.
- **Appears in:** H-142–143 02:47–02:49.
- **Canvas & layout:** STG-08 local device `[120,180,370,300]`, authorization gate `[510,270,180,100]`, LiteLLM gateway `[710,190,220,100]`, cloud `[960,190,200,100]`; detached future card below current route without connector.
- **Visual spec:** White 2px/6px current cards; future card dashed ink outline, no cyan; 14px mono route label.
- **Exact content:** `Optional on-device inference`; `Later: optional on-device inference`; `v1.0: cloud inference via LiteLLM`; `Purpose authorization`.
- **States & variants to build:** Present authorized cloud path; future dashed card detached; both held with version label.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Future card enters 500ms; holds without link to local device.
- **Data bound:** Current architecture and explicitly future capability, not a functioning local model.
- **Depends on:** STG-08, STG-15, STG-01.
- **Build notes & pitfalls:** No fallback arrow or inference that local model ships in v1.0. Script:1333–1348; story bible:20; Part C:339–345,454.
- **Done when:** Gate and cloud route remain visible, future card is detached, and exact v1.0 label is legible.
- **Effort:** S.

### GAP-STG-H-closecopy — Presenter closing stack
- **Purpose / what the viewer perceives:** The founder's final message builds three lines while his face and hands stay visible.
- **Priority:** P0.
- **Appears in:** H-145–147 02:50–02:53.
- **Canvas & layout:** Real close take B occupies full frame; left-aligned text at `(80,160)` within left third, face frame-right, separate subtitle strip.
- **Visual spec:** White 44px IBM Plex Mono with restrained translucent dark backing; `CAN IMPROVE` actual licensed 700.
- **Exact content:** `OPERATIONAL KNOWLEDGE`; `CAN IMPROVE`; `HUMAN CONTROL`.
- **States & variants to build:** First phrase over two lines; first plus second; all three retained.
- **Interactions & hotspots:** None; no synthetic presenter or cursor.
- **Animations needed in-component:** First phrase types 700ms; second reveals 500ms; third reveals 450ms; hold prior text throughout.
- **Data bound:** Approved real closing footage, fixed text and timeline.
- **Depends on:** STG-04, STG-16, GAP-CMP-H-font, FRT-06.
- **Build notes & pitfalls:** Script:1360–1385; Part C:278–281. H-145 is explicitly 700ms, not generic 28–34 chars/s; no weight synthesis.
- **Done when:** Exact three strings accumulate at specified cues without obstructing face, hands or captions.
- **Effort:** S.

### GAP-STG-H-url — Deterministic end-card address
- **Purpose / what the viewer perceives:** A real GitHub address types into a white pill and resolves exactly at the authored cue boundaries.
- **Priority:** P0.
- **Appears in:** H-149–152 02:54–02:58.
- **Canvas & layout:** STG-15 white stage URL field `[300,470,680,52]`; keep wordmark above and sufficient horizontal padding. Use this canonical field position rather than the contradictory script caret y410.
- **Visual spec:** 18px IBM Plex Mono ink, 2px border, 6px shadow, deterministic caret.
- **Exact content:** H-149 empty; H-150 `https://github.com/`; H-151 `https://github.com/Harikeshav-R/`; H-152 `https://github.com/Harikeshav-R/Oryn`.
- **States & variants to build:** Empty with caret; prefix; owner path; full address with caret; final no caret at H-154.
- **Interactions & hotspots:** Film caret only; if exported as link, target the exact displayed HTTPS address.
- **Animations needed in-component:** H-149 pill expands 180→620px over 500ms and caret fades at 400ms. H-150 type 19 characters at 32/s then pause approximately 406ms; H-151 type remaining 13 at 32/s then pause approximately 594ms; H-152 type final four characters at 32/s, complete by +400ms. Seek computes text directly from cue time.
- **Data bound:** Fixed URL and timeline; no pre-roll into initially empty field.
- **Depends on:** STG-15, STG-02, FRT-03.
- **Build notes & pitfalls:** Prefix lengths are 19 and 32; full URL has 36 characters, so final segment is four, not five. Timed holds reconcile the cue text with typing speed. Script:1396–1429; Part C:457,603.
- **Done when:** Each exact prefix appears at its cue boundary, complete URL by H-152 +400ms, no typing before H-150.
- **Effort:** S.

### GAP-STG-H-credit — Full challenge credit below URL
- **Purpose / what the viewer perceives:** Final identity credits the precise challenge and track without competing with the project address.
- **Priority:** P0.
- **Appears in:** H-153–154 02:58–03:00.
- **Canvas & layout:** Center full credit beneath canonical URL pill `[300,470,680,52]`, baseline around y558 and within title-safe area; wordmark remains above.
- **Visual spec:** 13px IBM Plex Mono ink on dotted bone; URL retains 2px border and 6px shadow; no badge or traction line.
- **Exact content:** `IBM AI Builders Challenge, North America · AI for Business`; `Oryn`; `https://github.com/Harikeshav-R/Oryn`.
- **States & variants to build:** Full address with fading credit; final static stack with no caret or subtitle.
- **Interactions & hotspots:** No film hotspot; optional URL link follows STG-15.
- **Animations needed in-component:** Credit fades over 400ms in H-153; H-154 holds still, caret disappears.
- **Data bound:** Fixed exact credit and URL.
- **Depends on:** STG-15, STG-02, GAP-STG-H-url, FRT-03.
- **Build notes & pitfalls:** H-specific full credit below pill replaces shortened generic credit above it; avoid duplicate credit. Script:1432–1447; Part C:452–454.
- **Done when:** Full credit is legible below URL in title-safe final frame, with no caret or subtitle.
- **Effort:** S.


All coordinates are authored 1280×720, origin top-left. These entries add launch-specific variants to the referenced inventories; they do not replace unrelated hackathon variants. P0 denotes required film coverage. Stage-only 2px outlines and 6px ink offsets do not enter product interiors. Script revisions identified below are required editorial changes, not already-existing visuals.

### GAP-STG-L-01 — Launch caption strip
- **Purpose / what the viewer perceives:** A consistent, readable transcript remains visible even during silent shots.
- **Priority:** P0.
- **Appears in:** Every L-001–L-176, 00:00–03:00.
- **Canvas & layout:** Fixed rectangle x128–1152, y630–688, 1024×58px, above every stage, product, footage and wipe layer; center text within safe inset.
- **Visual spec:** Ink #0A0A0A strip; bone #F6F6F3 IBM Plex Mono 600, 13–15px authored / 20px line height; no shadow, cyan or karaoke emphasis.
- **Exact content:** Launch caption appendix is cue authority; e.g. L-001 `What if`, L-017 `click is not`, L-127 `When a supplier`. Silence is blank, never an em dash.
- **States & variants to build:** One-line and two-line verbatim cue; persistent blank strip for silence.
- **Interactions & hotspots:** None in film; accessible sidecar captions reflect the same approved narration.
- **Animations needed in-component:** Hard cue replacement at authored boundaries, no type-on; strip never moves or fades.
- **Data bound:** Launch transcript, appendix cue and frame time; no invented speech.
- **Depends on:** FRT-06, FRT-04 and actual narration.
- **Build notes & pitfalls:** Revise launch script line 45 to match FRT-06 and design §3.2/3.5 lines 74,120. Reframe underlying content rather than cover evidence. Sidecar line breaks must remain readable.
- **Done when:** Exact fixed strip survives all 176 entries, each caption matches voice and silent entries are blank.
- **Effort:** M.

### GAP-CMP-L-01 — Actual IBM Plex Mono bold face
- **Purpose / what the viewer perceives:** Hook and closing emphasis changes genuine font weight without shape distortion.
- **Priority:** P0.
- **Appears in:** L-002–L-005 00:01–00:05 and L-168 02:46–02:48.
- **Canvas & layout:** STG-04 type at x85, y150, face clear in x700–1100; existing closing layout retained.
- **Visual spec:** Licensed IBM Plex Mono 700 WOFF2, 48px hook, true 400→700 swap; no synthesized bold.
- **Exact content:** Emphasized `workflows`, `learn`, `prove`, and closing `agents that prove` per launch script.
- **States & variants to build:** Regular 400 and loaded actual bold 700; fallback must fail capture rather than synthesize.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** 150ms weight swap where specified; deterministic frame rendering.
- **Data bound:** Local licensed font asset and font readiness.
- **Depends on:** CMP-02, STG-04, capture renderer.
- **Build notes & pitfalls:** Add 700 to packaged 400/500/600 faces; await font loading before capture. Launch lines 61–75, 87–94, L-168; Part B 29–42; Part C 272–285.
- **Done when:** Every bold beat uses the actual loaded face on first captured frame.
- **Effort:** S.

### GAP-STG-L-02 — Launch presenter lower-third
- **Purpose / what the viewer perceives:** Presenter identity appears as a clear, stage-styled credit.
- **Priority:** P0.
- **Appears in:** L-004 00:03–00:04.
- **Canvas & layout:** White card [84,516,506,84], name above affiliation, 6px black offset; avoid face and caption strip.
- **Visual spec:** 2px ink outline; name IBM Plex Mono 700 18/24px, affiliation IBM Plex Mono 400 14/20px; ink text.
- **Exact content:** `Harikeshav Rameshkumar`; `The Ohio State University`; surrounding `from your people,` remains separate.
- **States & variants to build:** Offscreen, entering, fully visible; launch typography separate from hackathon Space Grotesk variant.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Slide 20px into position over 500ms; affiliation fades 300ms.
- **Data bound:** Approved presenter identity and authentic footage.
- **Depends on:** STG-04, STG-16, FRT-06, GAP-CMP-L-01.
- **Build notes & pitfalls:** Launch lines 78–85 override Part C 272–285 name font; retain exact x/y and 6px shadow.
- **Done when:** Both exact lines are legible, mono, and entrance fits the 500ms beat.
- **Effort:** S.

### GAP-STG-L-03 — Oversized demonstration cursor
- **Purpose / what the viewer perceives:** The action click is easy to follow but does not imply business verification.
- **Priority:** P0.
- **Appears in:** L-017 00:14–00:15.
- **Canvas & layout:** Stage-only 40×48px arrow, 2× ordinary FRT-01 size, upper-left tip hotspot; travel (980,390)→(848,390), z70 under caption.
- **Visual spec:** Ink arrow, 2px white outline, neutral ink-alpha click ring; not cyan.
- **Exact content:** Adjacent action-only `Click completed`; business-outcome area remains empty.
- **States & variants to build:** Travel, press, ring, action check; hide after cut. Ordinary cursor stays 20×24px.
- **Interactions & hotspots:** Tip lands on cropped form action; clicked action and visible contact coincide.
- **Animations needed in-component:** 350ms cubic travel with 1–3% overshoot; 90ms press and 260ms click ring.
- **Data bound:** L-017 frame and cursor path; no business verification event.
- **Depends on:** FRT-01, APP-03, STG-07.
- **Build notes & pitfalls:** Launch lines 197–204 and Part C 562–575; check must remain physically separate from outcome.
- **Done when:** Enlarged tip contacts target and only action is checked.
- **Effort:** S.

### GAP-STG-L-04 — Progressive orbit traces
- **Purpose / what the viewer perceives:** Two strokes begin around a node and resolve into three open identity rings.
- **Priority:** P0.
- **Appears in:** L-024–L-025 00:21–00:23.
- **Canvas & layout:** Center (640,330), rings scaled from STG-02 radii 18/31/44 per 100 identity units; northeast gap centered near one o'clock, 32°; corner registration marks and 24px stage dots.
- **Visual spec:** Bone ground, 2px ink strokes, ink node; gap remains visibly open.
- **Exact content:** No visible text; blank captions in both beats.
- **States & variants to build:** Central node, two partial traces, three traced open rings; carry prior path progress over the cut boundary.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** Two circles start in L-024 over 800ms; L-025 completes a three-ring composition with 800ms path traces, starts staggered 100ms, preserving seeded continuity; camera 1→1.08.
- **Data bound:** Absolute frame, ring index and deterministic path progress.
- **Depends on:** STG-01, STG-02, FRT-04.
- **Build notes & pitfalls:** Path drawing is not STG-02's 60ms staggered scale reveal; do not restart already drawn strokes. Launch lines 260–278; Part C 240–253.
- **Done when:** Three 2px rings resolve with northeast gap and no discontinuous reset.
- **Effort:** M.

### GAP-STG-L-05 — Neutral identity node travel
- **Purpose / what the viewer perceives:** A single deliberate node movement gives the open mark life without suggesting execution.
- **Priority:** P0.
- **Appears in:** L-030 00:27–00:28.
- **Canvas & layout:** Open ink ring centered (640,330); 4-unit identity node follows its existing path without crossing the 32° gap.
- **Visual spec:** Ink node and ring on bone; no cyan, glow or badge.
- **Exact content:** Caption `Introducing`; no extra identity status.
- **States & variants to build:** Start, 60° travel, end hold; no idle loop.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** One 60° path movement over 800ms, sampled from absolute frame.
- **Data bound:** Frame and fixed path segment.
- **Depends on:** STG-02, FRT-04.
- **Build notes & pitfalls:** L-030 versus Part C 245–253: discrete motion does not create continuous idle animation.
- **Done when:** Node travels exactly once in ink and gap never closes.
- **Effort:** S.

### GAP-STG-L-06 — Safe early identity reveal
- **Purpose / what the viewer perceives:** Oryn identity resolves without implying an unobserved verification event.
- **Priority:** P0 editorial correction.
- **Appears in:** L-032–L-033 00:29–00:31.
- **Canvas & layout:** Existing centered Oryn wordmark on bone dot grid; O retains its northeast opening.
- **Visual spec:** Ink open ring and Space Grotesk 700 wordmark; no seal, cyan, closed ring or false success cue.
- **Exact content:** `Oryn`; blank caption in both silent entries. Remove original conceptual `Verified` label.
- **States & variants to build:** Static open identity hold across both shots; open O continues into L-034 enrollment edge.
- **Interactions & hotspots:** None.
- **Animations needed in-component:** No closure, reopen or ring-close sound; preserve continuous hold.
- **Data bound:** Identity only; no verification event exists here.
- **Depends on:** STG-02, FX-05, launch edit and sound cue list.
- **Build notes & pitfalls:** Required script revision: replace L-032/033 conceptual seal/300ms close/reopen and remove ring-close SFX. Actual closure remains restricted to independent readback at L-142. Launch L-032/033, Part C 246–253, 546–559, design 116–118, story bible §1.1.
- **Done when:** Early identity stays open without `Verified` and does not imply proof.
- **Effort:** S.

### GAP-SC-L-01 — Enrollment exact labels
- **Purpose / what the viewer perceives:** Priya accepts an organization notice and chooses observation independently from sharing.
- **Priority:** P0.
- **Appears in:** L-035–L-036 00:32–00:34.
- **Canvas & layout:** SC02 card [320,100,640,520], launch crop x350–930; separate 40px control rows and footer.
- **Visual spec:** White card, 1px warm rules, 8px radius, 16px checkboxes and distinct labels.
- **Exact content:** `Organization notice`, `I understand`, `Permitted work observation`, `Visual observation`, `Organizational contribution`, `Accept and continue`; identity `Priya Nair`, `Calder & Vance`.
- **States & variants to build:** Notice unchecked and accepted; independent capture and sharing rows; declined/off.
- **Interactions & hotspots:** Checkbox toggles via its label; continue requires notice acceptance; no observation before acceptance or independently permitted capture.
- **Animations needed in-component:** 150ms standard step swap; no auto-advance.
- **Data bound:** Notice consent, capture permission, contribution choice and work scope.
- **Depends on:** SC02, CMP-13, SC01.
- **Build notes & pitfalls:** Launch L-035/036, Part A 43–56. Consent is not contribution or meeting consent; choices remain independent.
- **Done when:** Exact labels appear and no capture starts on unchecked or declined notice.
- **Effort:** S.

### GAP-SC-L-02 — Guidance publication label
- **Purpose / what the viewer perceives:** Marcus publishes a reviewed playbook for humans, not an agent deployment.
- **Priority:** P0.
- **Appears in:** L-062 00:59–01:00.
- **Canvas & layout:** SC15 main procedure [264,112,608,560], owner/evidence rail [896,112,360,560]; action in footer.
- **Visual spec:** Flat white cards, warm 1px dividers, neutral outlined guidance state.
- **Exact content:** Heading `Publish for Guidance`; `Owner: Marcus Webb`; separate action `Publish`; postpublication `Approved for Guidance`.
- **States & variants to build:** Review pending, owner-approved prepublication, published guidance.
- **Interactions & hotspots:** Publish is disabled until owner review; activating it publishes guidance only.
- **Animations needed in-component:** 150ms standard state swap; no deployment animation.
- **Data bound:** PB-AP-RECON v1.0, Marcus owner review and publication event.
- **Depends on:** SC14, SC15, CMP-26.
- **Build notes & pitfalls:** L-062 and Part A 155–168; `Publish for Guidance` is heading/state, not an alias for agent release.
- **Done when:** Exact phrase and separate Publish action precede guidance-only published status.
- **Effort:** S.

### GAP-SC-L-03 — Candidate confidence category
- **Purpose / what the viewer perceives:** Three examples support a medium-confidence candidate whose exception remains uncertain.
- **Priority:** P0.
- **Appears in:** L-073 01:10–01:11.
- **Canvas & layout:** SC14 three 292×120 demonstration cards on left; evidence rail [880,112,352,480], confidence beside candidate title.
- **Visual spec:** Neutral categorical label and warning triangle, flat white cards with warm rules.
- **Exact content:** `Confidence: Medium`; `Variance exception rule: unverified until SME review`; sanitized D1–D3 source cards per SC13.
- **States & variants to build:** Medium confidence with unresolved branch; evidence selected; later SME-reviewed state remains separate.
- **Interactions & hotspots:** Evidence control opens authorized source drawer; confidence does not confer approval.
- **Animations needed in-component:** 150ms standard reveal; no animated percentage.
- **Data bound:** Three consented sanitized demonstrations, categorical candidate confidence and SME review status.
- **Depends on:** SC13, SC14, CMP-24, CMP-25.
- **Build notes & pitfalls:** L-073; Part A 139–151; Part B 401–414. Never fabricate a numeric score.
- **Done when:** Exact Medium category, all three sources and unresolved exception coexist.
- **Effort:** S.

### GAP-SC-L-04 — Agent draft policy evidence drawer
- **Purpose / what the viewer perceives:** Elena reviews source policy beside the still-unverified v0.1 agent branch.
- **Priority:** P0.
- **Appears in:** L-080–L-081 01:17–01:19.
- **Canvas & layout:** SC17 six-section draft at [304,160,880,72] and below; anchored SC14 evidence drawer [800,0,480,720], retaining visible draft/version context.
- **Visual spec:** White 1px product surfaces, warning triangle on unverified branch, z50 drawer with scrim.
- **Exact content:** `v0.1`, `Elena`, `AP-RULE-009`, `variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept`, `Unverified branch`.
- **States & variants to build:** Draft with uncertainty; evidence drawer open and closed; no simulated or released state.
- **Interactions & hotspots:** Evidence link opens authorized policy source; Escape closes and restores focus.
- **Animations needed in-component:** Drawer slide/opacity 150ms.
- **Data bound:** v0.1 draft, Elena attribution, AP-RULE-009 source and authority.
- **Depends on:** SC17, SC14, CMP-18, SC19.
- **Build notes & pitfalls:** L-080/081 and Part A 139–149,187–199. Evidence inspection does not clear simulator or grant authority.
- **Done when:** Elena, both threshold relations and candidate uncertainty remain readable together.
- **Effort:** M.

### GAP-SC-L-05 — Selected invoice queue boundary
- **Purpose / what the viewer perceives:** Agent scope names the selected invoice queue in addition to region and applications.
- **Priority:** P0.
- **Appears in:** L-082 01:19–01:20.
- **Canvas & layout:** SC18 scope panel [264,112,480,560]; separate outlined 40px queue row beneath application rows.
- **Visual spec:** Neutral 1px ink outline, white product surface, mono label; no execution cyan.
- **Exact content:** `Selected invoice queue`, `AP East`, `Gmail`, `NetSuite`, `Google Sheets`.
- **States & variants to build:** Queue selected, scope review, unauthorized/disabled if required scope missing.
- **Interactions & hotspots:** Row identifies selected scope; opening queue selection must not grant job or Tier 3 approval.
- **Animations needed in-component:** 150ms selection only.
- **Data bound:** Selected queue object and authorized scope; no invented queue ID.
- **Depends on:** SC18, CMP-28, SC21.
- **Build notes & pitfalls:** L-082; Part A 203–215; Part B 449–461.
- **Done when:** Queue has its own visible box and stays distinct from app and authority settings.
- **Effort:** S.

### GAP-SC-L-06 — Simulator launch action copy
- **Purpose / what the viewer perceives:** Evaluation is an explicit, guarded simulator action.
- **Priority:** P0.
- **Appears in:** L-091 01:28–01:29.
- **Canvas & layout:** SC19 header [264,112,992,80], action upper right at P(1100,160).
- **Visual spec:** Existing product button treatment and disabled state; no cyan until actual run.
- **Exact content:** `Run Evaluation`; `Flight Simulator`; `SIM-AP-RECON`; `28 scenarios`; `v0.1`.
- **States & variants to build:** Launch filmed label, disabled when suite cannot run, running and complete; existing `Run scenarios` remains other variant.
- **Interactions & hotspots:** Launch label invokes the same guarded evaluation action, not a separate workflow.
- **Animations needed in-component:** 150ms button state; running indication starts only on execution.
- **Data bound:** Selected sealed suite, version and run eligibility.
- **Depends on:** SC19, CMP-17, CMP-14.
- **Build notes & pitfalls:** L-091 versus Part A 219–229; exact filmed copy resolves wording without changing semantics.
- **Done when:** `Run Evaluation` starts only the authorized v0.1 suite.
- **Effort:** S.

### GAP-SC-L-07 — Simulator scenario row stream
- **Purpose / what the viewer perceives:** The same sealed suite progresses through individual scenarios without premature verdicts.
- **Priority:** P0.
- **Appears in:** L-093 01:30–01:31.
- **Canvas & layout:** Bounded viewport in SC19 grid area [300,220,472,416]; stacked readable rows, clipped inside panel; adjacent detail remains visible.
- **Visual spec:** White rows, warm 1px separators; only currently executing row indicator cyan, others neutral.
- **Exact content:** `28 scenarios`; SCN-001–SCN-028 exact labels and fixtures from SC19; `v0.1`.
- **States & variants to build:** Idle, frame-indexed scrolling stream, one running row, completed and canceled/incomplete; existing 4×7 layout remains available.
- **Interactions & hotspots:** Completed scenario may open replay; cancellation never assigns unrun verdicts.
- **Animations needed in-component:** Translate stream 120px over 900ms, clipped; cyan moves only with actual running row and stops at completion.
- **Data bound:** Same 28 scenario IDs, execution order and recorded outcomes as CMP-17.
- **Depends on:** SC19, CMP-17, CMP-14, FRT-04.
- **Build notes & pitfalls:** L-093; Part A 219–229; Part B 273–285. Stream is a film layout, not a second data set.
- **Done when:** All rows derive from the sealed suite and no unrun row shows a result.
- **Effort:** M.

### GAP-SC-L-08 — Fixed eleven-invoice selection
- **Purpose / what the viewer perceives:** A fixed population is explicitly selected before preflight and job execution.
- **Priority:** P0.
- **Appears in:** L-108–L-109 01:45–01:47.
- **Canvas & layout:** Expand SC21 queue table [264,160,992,440] into eleven 32px selected rows, with count and footer action; preflight dialog centered max 512px.
- **Visual spec:** White rows, 1px separators, neutral selection marks, 12/18 mono IDs.
- **Exact content:** `JOB-0117`, `11 invoices`, `Confirm 11 invoices`; rows `INV-48210`, `INV-48211`, `INV-48212`, `INV-48213`, `INV-48214`, `INV-48215`, `INV-48216`, `INV-48217`, `INV-48218`, `INV-48219`, `INV-48220`; `Confirm job scope`, `Start job`.
- **States & variants to build:** Eleven selected, selection confirmed, scope preflight, blocked, started, canceled.
- **Interactions & hotspots:** Confirm fixes the 11 IDs; Start requires released v1.0/AP East and authorized scope; cancel preserves queue.
- **Animations needed in-component:** 150ms preflight dialog fade; running arc only after start.
- **Data bound:** Exact DAT-02 records including suppliers, amounts and POs; JOB-0117 released v1.0.
- **Depends on:** SC21, SC22, DAT-02, CMP-19.
- **Build notes & pitfalls:** L-108; Part A 252–264; DAT-02 lines 753–782. Selection does not approve consequential posting.
- **Done when:** Eleven unique fixture IDs and explicit confirmation appear before scope start.
- **Effort:** M.

### GAP-SC-L-09 — Resubmit unavailable status
- **Purpose / what the viewer perceives:** An unknown ERP outcome is held; the system cannot blindly resubmit it.
- **Priority:** P0.
- **Appears in:** L-120 01:57–01:58.
- **Canvas & layout:** SC24 drawer [800,0,480,720], static availability text beside investigation area, tooltip anchored to that text.
- **Visual spec:** Neutral disabled-looking status text and information icon, hatched uncertainty panel; not an actionable retry button.
- **Exact content:** `INV-48220`, `Outcome Unknown`, `Held`, `Resubmit unavailable`, `Do not resubmit until reconciled`, `Investigate`.
- **States & variants to build:** Held with explanatory tooltip hidden or visible; investigation with absent readback.
- **Interactions & hotspots:** Focusable info icon reveals tooltip on focus/hover; no retry or resubmit action exists; Investigate remains available.
- **Animations needed in-component:** Tooltip 150ms, reduced motion immediate.
- **Data bound:** Timeout custody, missing independent readback, held status.
- **Depends on:** SC24, CMP-10, APP-03.
- **Build notes & pitfalls:** Reconcile L-120 with SC24's no Retry control by rendering non-action status, not a disabled button. Part A 300–313; Part B 143–156.
- **Done when:** Tooltip explains reconciliation and no control can resubmit.
- **Effort:** S.

### GAP-SC-L-10 — Verified summary film transition
- **Purpose / what the viewer perceives:** Independent readback moves one case from approval required to verified while the unknown stays held.
- **Priority:** P0.
- **Appears in:** L-122–L-123 01:59–02:01.
- **Canvas & layout:** Four SC25 cards 232×160 at x264/512/760/1008, y160; snapshot label above.
- **Visual spec:** White cards, 28px tabular counts, 12px mono labels; hatched unknown glyph.
- **Exact content:** `Before approval`: `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`; `After approval and verification`: `8 Verified Complete`, `2 Escalated`, `0 Approval Required`, `1 Outcome Unknown`; `Partially Complete`.
- **States & variants to build:** Historical before, approval awaiting readback unchanged, post-readback current; generic SC25 retains `Current snapshot` and 150ms opacity.
- **Interactions & hotspots:** Status cards filter corresponding cases; unknown opens SC24.
- **Animations needed in-component:** After independent readback, replace both snapshot values together with a 150ms opacity swap; other counts fixed. Reduced motion swaps immediately.
- **Data bound:** DAT-02 snapshots, approval and authoritative independent readback.
- **Depends on:** SC25, CMP-40, SC23, DAT-02.
- **Build notes & pitfalls:** L-122/123, Part A 316–328, Part B 641–653; frame transition represents two discrete valid snapshots, never intermediate totals or a fabricated count-up.
- **Done when:** Both endpoints sum to 11 and unknown remains one throughout.
- **Effort:** M.

### GAP-SC-L-11 — Six regression cards
- **Purpose / what the viewer perceives:** One original failure and five nearby variants extend the prior suite to 34.
- **Priority:** P0.
- **Appears in:** L-136 02:13–02:14.
- **Canvas & layout:** Six horizontally fanned nonrotating outlined cards in stage composition adjacent to SC28 test panel [768,112,464,520], clipped within safe area.
- **Visual spec:** Bone field, white 2px ink-outlined stage cards, 6px offset shadows; card labels in mono.
- **Exact content:** `Original failure + 5 nearby variants`; `34 scenarios`; SCN-029 original Kestrel layout v2; SCN-030 spacing; SCN-031 handling before total; SCN-032 zero handling; SCN-033 capitalization; SCN-034 separating rule.
- **States & variants to build:** Stacked, six-card fan, suite not run, regression running, complete.
- **Interactions & hotspots:** In product, each fixture can open evidence; film fan itself decorative.
- **Animations needed in-component:** 600ms horizontal fan, no rotation; subsequently use SC28 running state.
- **Data bound:** SCN-029–034 exact SC28 fixtures plus unchanged 28 base scenarios.
- **Depends on:** SC28, CMP-32, STG-01.
- **Build notes & pitfalls:** L-136; Part A 364–375; Part B 513–525. Six new cases are not six safe-escalation outcomes.
- **Done when:** Six distinct cards and total 34 appear without altering fixture identities.
- **Effort:** M.

### GAP-SC-L-12 — Future-only restore explanation
- **Purpose / what the viewer perceives:** Restore affects future eligible work, never prior business effects.
- **Priority:** P0.
- **Appears in:** L-146 02:23–02:24.
- **Canvas & layout:** SC30 timeline [264,160,992,400]; dark popover adjacent to restore control at lower right, kept above subtitle strip.
- **Visual spec:** Ink surface, white 12/18 mono text, 4px radius; no stage shadow inside product.
- **Exact content:** `Restore affects future eligible work, not prior business effects`.
- **States & variants to build:** Hidden, visible on hover/focus, confirmation separately available only for authorized approved version.
- **Interactions & hotspots:** Focus or hover explanation; selecting restore opens existing confirmation, Escape dismisses.
- **Animations needed in-component:** 150ms opacity, immediate reduced motion.
- **Data bound:** Selected version and restore authority.
- **Depends on:** SC30, CMP-10, CMP-15.
- **Build notes & pitfalls:** L-146; Part A 397–409. Explanation is not confirmation and cannot imply ERP transaction reversal.
- **Done when:** Exact text appears before restore and no business history is changed.
- **Effort:** S.

### GAP-SC-L-13 — Policy impact total reconciliation
- **Purpose / what the viewer perceives:** A policy revision identifies the exact impacted suite without silently deploying changes.
- **Priority:** P0 editorial and data consistency correction.
- **Appears in:** L-136 and L-149–L-150 02:13–02:14, 02:26–02:28.
- **Canvas & layout:** SC31 threshold diff across main 992px content; impact rows beneath effective date.
- **Visual spec:** White card, warm 1px border, mono values and neutral warning triangles.
- **Exact content:** `Invoice approval threshold`, `2.00% → 1.50%`, `effective Dec 1`, `1 playbook`, `1 agent`, `34 tests`, `Needs Revalidation`.
- **States & variants to build:** Change recorded, affected dependencies pending revalidation, authorized review; no automatic release.
- **Interactions & hotspots:** `Review boundary tests` opens proposed tests; dependent rows open respective assets.
- **Animations needed in-component:** 150ms selection; warning static.
- **Data bound:** AP-RULE-009 new version and 28 original + SCN-029–034 six added fixtures.
- **Depends on:** SC28, SC31, CMP-32, story bible editorial source.
- **Build notes & pitfalls:** Resolve older story bible §3/§7 `33` to `34` in production source: explicit 28+6 arithmetic and Part A 548 and Part C 710 govern. This is a script/source revision, not a second suite count.
- **Done when:** One consistent 34-case total appears across source, repair, impact and data; no automatic revalidation claim.
- **Effort:** S.

### GAP-SC-L-14 — Exact guide step
- **Purpose / what the viewer perceives:** Jamal receives one manual, contextual peer-fix instruction.
- **Priority:** P0.
- **Appears in:** L-151–L-152 02:28–02:30.
- **Canvas & layout:** SC04 HUD [900,148,320,144] or lower-right adjacent to ERP field without covering it; z30.
- **Visual spec:** White radius 8, warm 1px border, shadow-md, 12px padding and 16px icons.
- **Exact content:** `Known fix from AP East: Vendor tax ID format`; `Guide Me`; step `Check the vendor tax ID format`; `Next`, `Back`, `Done`, `Dismiss`.
- **States & variants to build:** Suggestion, Guide Me step 1, later steps, dismissed. Use the same exact instruction in both cuts.
- **Interactions & hotspots:** User opens guide and advances manually; underlying ERP form stays accessible.
- **Animations needed in-component:** 150ms HUD/step transition; no loop.
- **Data bound:** Approved peer fix, ST18 and current ERP context.
- **Depends on:** SC04, CMP-36, APP-05.
- **Build notes & pitfalls:** L-152 versus Part A 75–87; guidance neither changes form automatically nor verifies resolution.
- **Done when:** Canonical SC04 wording appears and user retains control of the field.
- **Effort:** S.

### GAP-SC-L-15 — Closed incident and expanded release dashboard
- **Purpose / what the viewer perceives:** A historical job snapshot, separately closed incident and expanded release coexist without merging populations.
- **Priority:** P0.
- **Appears in:** L-155 02:32–02:33.
- **Canvas & layout:** SC33 four panels inside [264,112,992,560], 16px gutters; Job counts separate from incident and release panels.
- **Visual spec:** White 8px cards, 1px warm rules, 12/18 mono metrics and hatched unknown glyph.
- **Exact content:** `JOB-0117`, `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`, `INC-0042 · Closed`, `v1.1 · Expanded`.
- **States & variants to build:** Post-readback job, incident closed after validated repair, v1.1 expanded only after authorized expansion.
- **Interactions & hotspots:** Authorized panels link to their own job, incident and release records.
- **Animations needed in-component:** 150ms panel swap; no rolling counters.
- **Data bound:** DAT-02 historical job snapshot, separate INC-0042 closure and v1.1 expansion events.
- **Depends on:** SC25, SC29, SC33, CMP-40.
- **Build notes & pitfalls:** L-155; Part A 445–457. 8/2/0/1 is JOB-0117, not incident cohort; never invent global totals.
- **Done when:** Exact two labels and all four job counts appear with populations separated.
- **Effort:** S.

### GAP-SC-L-16 — Evaluation in immutable audit history
- **Purpose / what the viewer perceives:** Completed evaluation is traceable alongside human approval and release.
- **Priority:** P0.
- **Appears in:** L-157 02:34–02:35.
- **Canvas & layout:** SC34 audit table [264,176,992,440], 32px rows; export drawer [800,0,480,720].
- **Visual spec:** White flat table, warm dividers, mono labels and authorized export drawer.
- **Exact content:** Headers `Actor`, `Event`, `Object`, `Scope`, `Outcome`; evaluation row `Actor: not recorded | Evaluation | SIM-AP-RECON v0.2 | 28 scenarios | 22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed`; export copy `Export authorized records only?`, `Raw private media is not included.`
- **States & variants to build:** Immutable evaluation record, authorized export preview and confirmation, denied export.
- **Interactions & hotspots:** Authorized export opens scope preview then requires explicit confirmation; no fabricated actor or timestamp.
- **Animations needed in-component:** Drawer and confirmation 150ms.
- **Data bound:** Actual v0.2 suite result record, recorded actor if present, authorized export scope.
- **Depends on:** SC20, SC34, CMP-07, CMP-09.
- **Build notes & pitfalls:** L-157; Part A 461–473. `Actor: not recorded` explicitly means absence, not a fabricated identity; replace only if source event actually records actor. No invented time.
- **Done when:** Evaluation row reflects the completed suite and export excludes unauthorized raw media.
- **Effort:** S.

### GAP-STG-L-07 — Neutral observation indicator
- **Purpose / what the viewer perceives:** Observation changes from active to paused without looking like agent execution.
- **Priority:** P0 editorial correction.
- **Appears in:** L-038–L-039 00:35–00:37.
- **Canvas & layout:** Companion menu [950,28,310,232], status y64, pause row y96–128.
- **Visual spec:** Neutral ink outlined active indicator and explicit text; paused uses muted neutral outline and explicit text; never cyan.
- **Exact content:** `Observation active`, `Pause observation`, `Observation paused`, `Resume observation`.
- **States & variants to build:** Active, paused after user action, resumed only after explicit action.
- **Interactions & hotspots:** Pause at P(1100,112); Resume requires explicit selection.
- **Animations needed in-component:** Menu 150ms; status switches immediately.
- **Data bound:** Consent, observation permission and paused state.
- **Depends on:** SC01, APP-12, design execution-color rule.
- **Build notes & pitfalls:** Revise L-038 cyan-to-dark description to neutral active-to-paused. Part A 27–39, Part C 190–202 and design 33–35 reserve cyan for execution.
- **Done when:** Both statuses are explicit and no observation state uses cyan.
- **Effort:** S.

### GAP-STG-L-08 — Precomposed meeting transcript reveal
- **Purpose / what the viewer perceives:** Priya's reply appears beneath Dana's attributed statement, linked to the meeting source.
- **Priority:** P0.
- **Appears in:** L-052 00:49–00:50.
- **Canvas & layout:** Existing APP-08 meeting tile and attributed transcript; Priya line below Dana with thin separator.
- **Visual spec:** Existing readable transcript type; ink on white, neutral clipping mask; no fake typing caret.
- **Exact content:** `Send me the new layout; I'll confirm the terms in writing by Friday.`; caption `only after`.
- **States & variants to build:** Dana statement visible; complete Priya text precomposed but masked; fully revealed reply.
- **Interactions & hotspots:** None; attribution remains attached to Priya.
- **Animations needed in-component:** Reveal the precomposed sentence via deterministic left-to-right mask over 900ms; do not label it typing.
- **Data bound:** Consented meeting transcript and fixed reveal frames.
- **Depends on:** APP-08, FRT-03, SC11.
- **Build notes & pitfalls:** Amend L-052 wording from `types on` to `precomposed mask reveal`; 900ms cannot satisfy 28–34 characters/s. Launch line 47, 518–525; Part C 594–606.
- **Done when:** Exact full quote is visible in 900ms without claiming human typing speed.
- **Effort:** S.

### GAP-STG-L-09 — Lifecycle ten micro-compositions
- **Purpose / what the viewer perceives:** Each lifecycle step shows its own bounded artifact and authority or verification boundary.
- **Priority:** P0.
- **Appears in:** L-063–L-072 01:00–01:10, one beat per node.
- **Canvas & layout:** STG-03 ring center (640,330), radius 230, or margin overlay [930,100,260,260]; linked miniature cards remain outside ring and above captions.
- **Visual spec:** 2px ink ring, neutral 18px nodes and mono 14/20 labels; white outlined stage cards, 6px offset; only actually executing node temporarily cyan.
- **Exact content:** `Compile`/`Agent candidate`; `Simulate`/`Scenario`; `Authorize`/`Owner approval`; `Execute`; `Verify`/`Independent readback`; `Diagnose`/`Possible cause · unconfirmed`; `Correct`/`Human correction`; `Repair`/`Bounded change`; `Re-evaluate`/`Regression suite`; `Release`/`Owner approval`.
- **States & variants to build:** Ten keyed compositions: definition blocks; test-frame scenario cards; person approval barrier; scoped work item to ERP; separate readback panel; hatched unconfirmed diagnosis; human annotation; one outlined repair step; full regression frame; narrow cohort rectangle with outside approval mark.
- **Interactions & hotspots:** Authorize approval click +500ms and release approval click +400ms; Correct pointer moves to annotation over 400ms. No other implicit approvals.
- **Animations needed in-component:** Compile block alignment 500ms, scenario cards 80ms stagger, authorize node 700ms, execute work travel 700ms, readback line 500ms, diagnosis card 500ms, correction underline 500ms, repair outline 500ms, re-evaluation 700ms; release cyan ends +800ms. Clear previous node at each advance.
- **Data bound:** Explicit event/frame, current operation and execution boolean; readback/approval separate events.
- **Depends on:** STG-03, CMP-17, CMP-27, CMP-32, CMP-33, FRT-04.
- **Build notes & pitfalls:** L-063–072 and Part C 256–269. Diagram is illustrative; never imply broad release, inferred policy or submitted action verified.
- **Done when:** Each of ten artifacts and exact labels is distinct, with no accumulated cyan or inferred authority.
- **Effort:** L.

### GAP-STG-L-10 — Candidate-to-simulator matched edge
- **Purpose / what the viewer perceives:** The candidate moves naturally into its simulator without losing version identity.
- **Priority:** P0.
- **Appears in:** L-090 01:27–01:28.
- **Canvas & layout:** Two stage frames abut on a shared central vertical edge; candidate left, simulator right; product interiors retain 1px warm rules, outer stage edge 2px ink.
- **Visual spec:** White interiors, bone field, 6px stage shadow; visible neutral v0.1 label.
- **Exact content:** `v0.1`, `Open Flight Simulator`; blank subtitle.
- **States & variants to build:** Candidate, aligned paired frames, simulator revealed, matched-edge cut.
- **Interactions & hotspots:** Pointer selects `Open Flight Simulator` over 500ms; selection opens suite, not a run.
- **Animations needed in-component:** Both frames translate 100px left over 700ms, then match cut on common edge.
- **Data bound:** Same v0.1 candidate and SIM-AP-RECON suite.
- **Depends on:** SC17, SC19, STG-01, FX-02, FRT-04.
- **Build notes & pitfalls:** L-090, Part C FX-02 498–510; preserve edge alignment and no fabricated evaluation result.
- **Done when:** Shared edge remains continuous and v0.1 remains legible through transition.
- **Effort:** M.

### GAP-STG-L-11 — Continuous containment wipe
- **Purpose / what the viewer perceives:** Three related cases are contained before any repair and one uninterrupted wipe changes the scene.
- **Priority:** P0 editorial timing correction.
- **Appears in:** L-126–L-127 02:03–02:05.
- **Canvas & layout:** Full frame [0,0,1280,720]; vertical leading edge moves left→right; fixed captions above wipe.
- **Visual spec:** Ink wipe to #0A0A0A background, #141414 surfaces, #333 rules, #F5F5F5 text; no switch UI.
- **Exact content:** `INV-48231`, `INV-48233`, `INV-48236`, `Verification unavailable`, then `INC-0042`, `Contained`, `3 cases paused`.
- **States & variants to build:** Light warning, containment dispatched at wipe start, in-progress wipe, dark contained with all three paused.
- **Interactions & hotspots:** None; no theme toggle or repair action during wipe.
- **Animations needed in-component:** One 400ms/24-frame wipe at 60fps from 02:03.700 through 02:04.100; dark warning and label enter over 150ms after leading edge reveals them.
- **Data bound:** ST12 containment event and exact timeline frame.
- **Depends on:** SC26, FX-01, FRT-04, GAP-STG-L-01.
- **Build notes & pitfalls:** Revise L-127's contradictory 300ms start-at-02:04 to continuation of L-126's +700ms start, retaining FX-01 400ms. No double wipe or uncontained repair.
- **Done when:** Wipe is continuous across boundary, all three cases are paused and dark scene has no mixed-theme seam.
- **Effort:** M.

### GAP-STG-L-12 — Verified release ring
- **Purpose / what the viewer perceives:** Three independently read-back cohort outcomes justify a single ink ring closure.
- **Priority:** P0.
- **Appears in:** L-142–L-143 02:19–02:21.
- **Canvas & layout:** SC29 cohort records remain visible; independent STG-02 ring outside product status, open gap at one o'clock.
- **Visual spec:** Three green checks with adjacent text; ink ring only, no cyan closure.
- **Exact content:** `3/3 Verified Complete` and three distinct cohort case readbacks.
- **States & variants to build:** Three pending readbacks; each verified; all three verified; ring close and hold; authorized expansion separately.
- **Interactions & hotspots:** None for film ring; Marcus expansion is a later separate action.
- **Animations needed in-component:** Three checks stagger 120ms; after third verified readback, close ring 400ms, hold 400ms, reopen 300ms. Carry hold across shot boundary if needed.
- **Data bound:** Three actual independent readback events; ring must not trigger from release or submission alone.
- **Depends on:** SC29, CMP-33, STG-02, FX-05.
- **Build notes & pitfalls:** Revise L-142 300ms close to FX-05/design's 400ms plus 400ms hold; do not change verified trigger. Launch L-142; Part C 546–559; design line 118.
- **Done when:** Closure follows all three readbacks and completes with no premature expansion.
- **Effort:** S.

### GAP-STG-L-13 — Four-column adapter grid
- **Purpose / what the viewer perceives:** A broad app montage stays distinct from actual capability claims.
- **Priority:** P0.
- **Appears in:** L-159 02:36–02:37; collapse reused at L-165.
- **Canvas & layout:** Four columns, four rows of 140×72px tiles with 12px gaps, starting (342,188); last row contains one left-aligned tile; camera pan 80px with crop safe for captions.
- **Visual spec:** Bone field, flat white/grey tiles, 1px warm border, 4px radius, 24px marks and 12/18 mono labels; extra apps grey only, no cyan.
- **Exact content:** `Gmail`, `NetSuite`, `Google Sheets`, `Slack`, `Zoom`, `HubSpot`, `Chrome`, `Salesforce`, `Outlook`, `Excel`, `Teams`, `Meet`, `Edge`.
- **States & variants to build:** Four-column launch montage, all tiles visible, later collapse; retain separate 7+6 composition elsewhere.
- **Interactions & hotspots:** Decorative tiles have no links or capabilities; SC36 matrix supplies actual supported actions.
- **Animations needed in-component:** Tile entrances stagger 40ms in reading order; 80px camera pan, 700ms collapse at L-165.
- **Data bound:** Fixed 13 labels and separate SC36 capability matrix.
- **Depends on:** APP-10, SC36, STG-01, FX-03.
- **Build notes & pitfalls:** L-159; Part C 158–170. Use licensed official marks or plain text when rights unavailable; six extra labels imply no availability.
- **Done when:** Exactly 13 tiles form four columns and unsupported apps remain grey-only.
- **Effort:** M.

### GAP-STG-L-14 — End-card URL timing
- **Purpose / what the viewer perceives:** Project URL appears legibly at consistent typing speed and holds through the end.
- **Priority:** P0 editorial timing correction.
- **Appears in:** L-173–L-176 02:54–03:00.
- **Canvas & layout:** URL pill centered at [330,470,620,52] after growing from 240px; 2px ink outline, 6px offset; mono text and caret clipped to inner field.
- **Visual spec:** White fill, ink IBM Plex Mono 15/20, ink 1–2px caret; credit above, bone dotted field.
- **Exact content:** `IBM AI Builders Challenge · AI for Business`; `https://github.com/Harikeshav-R/Oryn`.
- **States & variants to build:** Empty pill/caret, growing pill and partial URL, complete URL/stopped caret, final hold.
- **Interactions & hotspots:** Film never navigates; clickable build opens exact URL only after explicit user action.
- **Animations needed in-component:** At 02:54.000 begin empty with caret; grow 240→620px over 500ms. Reveal first character at 02:54.033, then one per 1/30s; 27 characters `https://github.com/Harikesh` by 02:54.900, all 36 characters by 02:55.200; stop caret and hold through 03:00. Per-frame count at 60fps is min(36, floor(elapsedFrames/2)), with elapsed zero at 02:54.000.
- **Data bound:** Exact approved 36-character URL and absolute frame.
- **Depends on:** STG-15, FRT-03, FRT-04.
- **Build notes & pitfalls:** Reconcile L-173/174 explicitly: empty start is real, no preroll; count prefix by exact string, not inferred rates. Replace conflicting original cue if actual character count differs; no extra suffix or fabricated content. Preserve full URL by +700ms in L-174.
- **Done when:** Exact full address is visible by 02:55.700, caret stops, empty-start and 28–34 chars/s are preserved.
- **Effort:** S.

## Storyboard and inventory contradictions

Citations below use paths relative to `docs/video/`, except the shared story bible, which is `local://oryn-story-bible.md`. These are editorial decisions; no existing source was silently changed.

| # | Conflict and evidence | Recommended resolution |
|---|---|---|
| 1 | H-096 shows “Completed with exceptions” while the unknown remains held (`hackathon-video-script.md:917-924`); SC25 instead says “Partially Complete” (`_parts/part-a-product-screens.md:316-328`; `oryn-demo-design-and-build.md:380`). | Revise H-096 to “Partially Complete”; retain 7/2/1/1 until approval and separate readback. |
| 2 | H-007 and L-032 close the ring during reveals without an actual verified business event (`hackathon-video-script.md:110-117`; `launch-video-script.md:334-341`), against verified-only rule (`oryn-demo-design-and-build.md:118`; `_parts/part-c-mocks-and-stage.md:247-249`). | Keep early marks open and remove conceptual Verified seal and ring-close cue; use a genuine verified readback, e.g. L-142, for closure. |
| 3 | L-038/039 pair passive observation with cyan indicator and arc-hum (`launch-video-script.md:390-406`); SC01 prohibits cyan for observation (`_parts/part-a-product-screens.md:27-40`). | Use neutral active/paused icons and text; remove arc-hum for passive observation. |
| 4 | Launch subtitles use x120–1160/y658–705 and 20px bold (`launch-video-script.md:45`), while design and FRT-06 use y630–688 and 13–15px (`oryn-demo-design-and-build.md:74,120,730`; `_parts/part-c-mocks-and-stage.md:642-655`). | Use design-safe x128–1152/y630–688 and 13–15px weight 600 for both cuts; reframe crucial content and revise launch global rule. |
| 5 | H-082 animates four check shapes before simulator and approval (`hackathon-video-script.md:791-798`); design limits checks to established passing evidence and approval (`oryn-demo-design-and-build.md:154,199`). | Check only independently evidenced examples; show pending hollow circles for tests and owner approval until H-091. |
| 6 | H-075 uses success hue for Approved for Guidance (`hackathon-video-script.md:728-735`); canonical badge is neutral (`oryn-demo-design-and-build.md:99`; `_parts/part-a-product-screens.md:155-168`). | Use outlined neutral shield/check and text; publication is not execution or verification. |
| 7 | Hook shots request IBM Plex Mono 700 (`hackathon-video-script.md:66-75`; `launch-video-script.md:61-75`) but bundled font list omits it (`_parts/part-b-components.md:29-42`; `oryn-demo-design-and-build.md:17`). | Bundle licensed real 700 face with font-load check, retaining 400/500/600; never synthesize a weight. |
| 8 | Story bible says 33 impacted tests and a 33-scenario regression (`local://oryn-story-bible.md:65,111`); design and parts use 34, 28 ordinary passes plus six safe escalations (`oryn-demo-design-and-build.md:212,329-338`; `_parts/part-a-product-screens.md:370,548`). | Correct both bible references to 34; preserve 28 original plus six additional cases, with 28 Passed and six Passed — Expected Safe Escalation. |
| 9 | L-032 and L-142 request 300ms ring closure (`launch-video-script.md:334-341`; see L-142); design/FX-05 require 400ms close plus 400ms hold (`oryn-demo-design-and-build.md:118,1081`; `_parts/part-c-mocks-and-stage.md:546-559`). | Remove reveal closure; use 400ms close and 400ms hold at genuine verification. |
| 10 | H-004 lower third y506–590 (`hackathon-video-script.md:83-88`) differs from design y548 (`oryn-demo-design-and-build.md:120`); L-004 uses mono name instead of the inventory Space Grotesk name (`launch-video-script.md:78-85`; `_parts/part-c-mocks-and-stage.md:276-278`). | Keep separately keyed shot-specific lower-third compositions; protect presenter and subtitle clearance and update design with cut-specific variants. |
| 11 | H-095 uses warning triangles for escalated cases (`hackathon-video-script.md:909-914`); canonical Escalated glyph is arrow/person, triangle is Needs Revalidation (`_parts/part-a-product-screens.md:9`). | Use Escalated arrow/person plus explicit label; amend H-095. |
| 12 | H-099–100 jumps from cursor approaching approval to 8 verified (`hackathon-video-script.md:944-960`), but SC23 requires explicit authorized approval and independent readback (`_parts/part-a-product-screens.md:289-297`). | Show approval click, pending verification, then independent evidence before 8/2/0/1; extend or resequence. |
| 13 | L-120 requests a disabled Resubmit control, while SC24 specifies investigation and no retry control (`launch-video-script.md:1139-1147`; `_parts/part-a-product-screens.md:300-313`). | Show a non-action “Resubmission unavailable” explanation and investigation action only; no enabled retry. |
| 14 | L-093 requests a scrolling scenario-row stream while SC19 specifies a 4×7 tile grid (`launch-video-script.md:896-904`; `_parts/part-a-product-screens.md:219-229`). | Add a deterministic film row-stream variant of the same 28 scenarios; running cyan only during execution. |
| 15 | L-123 asks for a 500ms count-up after verification; SC25 explicitly says no count-up (`launch-video-script.md:1166-1174`; `_parts/part-a-product-screens.md:322-328`). | Use a 150ms snapshot replacement after independent readback, preserving totals throughout; revise storyboard motion. |
| 16 | H-128 requires two user textures while Part C treats only launch slot 1 as placed (`hackathon-video-script.md:1205-1213`; `_parts/part-c-mocks-and-stage.md:416-429,712`). | Require two independently authorized, irreversibly redacted textures in H-128; keep fictional evidence cards separate from those textures. |
| 17 | L-126/127 describe different wipe start and duration, and FX-01 uses 400ms (`launch-video-script.md:1193-1211`; `_parts/part-c-mocks-and-stage.md:482-495`). | Use one 400ms absolute-frame wipe across the boundary, timed to containment before repair; amend both shots. |
| 18 | L-152 says “Check vendor tax ID format” while SC04 says “Check the vendor tax ID format” (`launch-video-script.md:1433-1441`; `_parts/part-a-product-screens.md:75-87`). | Use the existing SC04 wording consistently, including the article. |
| 19 | H-137 places hatch behind text while product rules forbid hatching over text (`hackathon-video-script.md:1289-1296`; `_parts/part-a-product-screens.md:9,300-313`). | Keep text on solid opaque surface; constrain hatch to adjacent glyph or panel. |
| 20 | H-057 and L-035/036 use labels absent from SC02, including “Review notice”, “I understand”, and “Permitted work observation” (`hackathon-video-script.md:566-582`; `launch-video-script.md:363-378`; `_parts/part-a-product-screens.md:43-56`). | Add exact cut-specific labels to the same accessible wizard, preserving independent capture and sharing consent. |
| 21 | L-052 specifies a long transcript type-on in 900ms, conflicting with 28–34 characters/s (`launch-video-script.md:47`; see L-052; `_parts/part-c-mocks-and-stage.md:594-606`). | Reveal a previously composed sentence with a mask over 900ms; do not present it as keystroke-rate typing. |
| 22 | H-021/022 ask for a mismatched numeric business result, but fixture policy forbids invented invoice amounts (`hackathon-video-script.md:238-253`; `_parts/part-c-mocks-and-stage.md:320-333`). | Use abstract differing bars and explicit “Result not verified”, without fabricating a transaction or amount. |


## Gap checklist

| Gap ID | Build item / required reconciliation | Priority | Done |
|---|---|---|---|
| GAP-CMP-H-font | Authentic mono bold face | P0 | [ ] |
| GAP-STG-H-lowerthird | Hackathon presenter identification | P0 | [ ] |
| GAP-STG-H-orbit | Neutral orbit node placement | P0 | [ ] |
| GAP-STG-H-close | Conceptual wordmark remains open | P0 | [ ] |
| GAP-STG-H-chipdetail | Governed-agent convergence | P0 | [ ] |
| GAP-STG-H-threecards | Test, supervise, improve | P0 | [ ] |
| GAP-STG-H-mismatch | Safe abstract mismatch illustration | P0 | [ ] |
| GAP-STG-H-paperwipe | Supplier document transition | P0 | [ ] |
| GAP-STG-H-sources | Safely sourced problem context | P0 | [ ] |
| GAP-STG-H-lifecycle | Authored fourteen-step lifecycle | P0 | [ ] |
| GAP-STG-H-ai-detail | Independent AI assistance boundaries | P0 | [ ] |
| GAP-STG-H-handoff | Bob to enrollment | P0 | [ ] |
| GAP-SC-H-notice | Explicit notice disclosure | P0 | [ ] |
| GAP-STG-H-d1overlay | Demonstration provenance overlay | P0 | [ ] |
| GAP-SC-H-role | Authorized Marcus selector | P0 | [ ] |
| GAP-SC-H-guidance | Neutral guidance publication | P0 | [ ] |
| GAP-SC-H-gate | Pending release-gate checklist | P0 | [ ] |
| GAP-STG-H-intent | Fixed-height intent typing | P0 | [ ] |
| GAP-SC-H-rule-replay | Failed replay with source overlay | P0 | [ ] |
| GAP-SC-H-preflight | Explicit job scope and start | P0 | [ ] |
| GAP-SC-H-escalation | Distinct missing-PO outcomes | P0 | [ ] |
| GAP-SC-H-summary | Honest partially complete batch | P0 | [ ] |
| GAP-SC-H-approve | Approval followed by readback | P0 | [ ] |
| GAP-STG-H-kestrel-po | Linked purchase order comparison | P0 | [ ] |
| GAP-SC-H-manual | Attributable completed case before Teach | P0 | [ ] |
| GAP-STG-H-memory | Two separate authorized texture slots | P0 | [ ] |
| GAP-STG-H-impact | Evidence-centered impact composition | P0 | [ ] |
| GAP-SC-H-hatch | Unknown status text remains solid | P0 | [ ] |
| GAP-STG-H-stat | Manual exception context | P0 | [ ] |
| GAP-SC-H-postcondition | Independent evidence connector | P0 | [ ] |
| GAP-STG-H-future | Future inference is not current route | P0 | [ ] |
| GAP-STG-H-closecopy | Presenter closing stack | P0 | [ ] |
| GAP-STG-H-url | Deterministic end-card address | P0 | [ ] |
| GAP-STG-H-credit | Full challenge credit below URL | P0 | [ ] |
| GAP-STG-L-01 | Launch caption strip | P0 | [ ] |
| GAP-CMP-L-01 | Actual IBM Plex Mono bold face | P0 | [ ] |
| GAP-STG-L-02 | Launch presenter lower-third | P0 | [ ] |
| GAP-STG-L-03 | Oversized demonstration cursor | P0 | [ ] |
| GAP-STG-L-04 | Progressive orbit traces | P0 | [ ] |
| GAP-STG-L-05 | Neutral identity node travel | P0 | [ ] |
| GAP-STG-L-06 | Safe early identity reveal | P0 | [ ] |
| GAP-SC-L-01 | Enrollment exact labels | P0 | [ ] |
| GAP-SC-L-02 | Guidance publication label | P0 | [ ] |
| GAP-SC-L-03 | Candidate confidence category | P0 | [ ] |
| GAP-SC-L-04 | Agent draft policy evidence drawer | P0 | [ ] |
| GAP-SC-L-05 | Selected invoice queue boundary | P0 | [ ] |
| GAP-SC-L-06 | Simulator launch action copy | P0 | [ ] |
| GAP-SC-L-07 | Simulator scenario row stream | P0 | [ ] |
| GAP-SC-L-08 | Fixed eleven-invoice selection | P0 | [ ] |
| GAP-SC-L-09 | Resubmit unavailable status | P0 | [ ] |
| GAP-SC-L-10 | Verified summary film transition | P0 | [ ] |
| GAP-SC-L-11 | Six regression cards | P0 | [ ] |
| GAP-SC-L-12 | Future-only restore explanation | P0 | [ ] |
| GAP-SC-L-13 | Policy impact total reconciliation | P0 | [ ] |
| GAP-SC-L-14 | Exact guide step | P0 | [ ] |
| GAP-SC-L-15 | Closed incident and expanded release dashboard | P0 | [ ] |
| GAP-SC-L-16 | Evaluation in immutable audit history | P0 | [ ] |
| GAP-STG-L-07 | Neutral observation indicator | P0 | [ ] |
| GAP-STG-L-08 | Precomposed meeting transcript reveal | P0 | [ ] |
| GAP-STG-L-09 | Lifecycle ten micro-compositions | P0 | [ ] |
| GAP-STG-L-10 | Candidate-to-simulator matched edge | P0 | [ ] |
| GAP-STG-L-11 | Continuous containment wipe | P0 | [ ] |
| GAP-STG-L-12 | Verified release ring | P0 | [ ] |
| GAP-STG-L-13 | Four-column adapter grid | P0 | [ ] |
| GAP-STG-L-14 | End-card URL timing | P0 | [ ] |
