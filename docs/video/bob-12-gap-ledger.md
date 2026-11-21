# BOB-12 product gap ledger

Step BOB-12 of `ROADMAP.md`: every product-side Part D gap (30: 12 `GAP-SC-H-*`, 16 `GAP-SC-L-*`, 2 `GAP-CMP-*`) applied as an amendment to its original BOB owner, plus the stage-side owners of the 35 `GAP-STG-*` gaps. Built and audited by a coding-agent session with four parallel sub-agents (onboarding/discovery, simulator, job, breadth) and a parent that regenerated, recaptured and inspected the frames. It was **not** run in IBM Bob; the Bob run and Bob review (SO-B5, SO-B7) stay unmet and must not be claimed.

## How the evidence was produced

- `bun run scripts/author-product-clips.ts` regenerated every `film/<cut>/*.timeline.json` from `src/product/clip-specs*.ts`.
- `bun run scripts/capture.ts --cut <cut> --clip <id>` recaptured all 16 kept clips (each passed its own checks: 2560x1440, `r_frame_rate 30/1`, no audio, `nb_read_frames` = timeline = sidecar, every anchor equal to its DOM rectangle on every frame, reverse seeks equal to the linear pass). `hk-h4a-enroll` (180 frames) and `lk-l4-privacy` (360 frames) were captured the same way into a scratch directory only; their MP4s are not kept (CAP-02 and CAP-11 stay unticked).
- Frames were extracted with `ffmpeg -i <clip>.mp4 -vf "select=eq(n\,<local frame>)" -frames:v 1` and looked at. "Viewed" below means the extracted PNG was inspected. Local frame -> entry: hackathon `H-(first + floor(f/30))`, launch likewise (README clip tables).
- Part D read at `docs/video/mock-build-inventory.md` lines 2917-3960; decisions 1-18 at lines 46-70.

## Product gaps

`Done when` verdicts: **MET** unless stated. `Files` lists what BOB-12 changed for the gap (blank = audited, already compliant, no change).

| Gap | Original owner | Entries | Files changed by BOB-12 | Evidence (clip, local frames; all viewed) and what was seen |
|---|---|---|---|---|
| GAP-CMP-H-font | BOB-00 CMP-02 | H-002-003, H-146 | `src/fonts/faces.test.ts` (new) | `public/fonts/IBMPlexMono-Bold.woff2`: fontTools reads `usWeightClass 700`, `IBM Plex Mono Bold`, v2.005, `macStyle 1`, digest unique among the ten faces and equal to `PROVENANCE.md`. Declared identically in `fonts.css` and `faces.ts`; `font-synthesis: none`; a face that fails to load blocks capture (`FontGate`, capture test names `Space Grotesk 700`; the 700 face shares the path). All 18 captures passed the font gate. |
| GAP-CMP-L-01 | BOB-00 CMP-02 | L-002-005, L-168 | same | Same face, same proof. |
| GAP-SC-H-notice | BOB-04 SC02 | H-057-058 | none | `hk-h4a-enroll` f0 collapsed `Review notice`, f20 expanded prose (durable evidence stays on device, authorized inference transient, sharing separate), f46 `I understand` checked and `Accept and continue` enabled by the separate acknowledgement, f60 step 2 with capture and sharing unchecked. |
| GAP-SC-L-01 | BOB-04 SC02 | L-035-036 | none | `lk-l4-privacy` f0 `Organization notice`/`I understand` unchecked and `Accept and continue` disabled, f20 accepted, f35 `Permitted work observation`, `Visual observation`, `Organizational contribution` (not shared), f60 My Privacy. Capture never starts on unchecked notice (reducer guards, `enrollment.test.tsx`). |
| GAP-SC-H-role | BOB-06 SC14/SC12-FRAME | H-073 | `Shell.tsx` | `hk-h4c-playbook` f104 closed selector, f108 and f112 popover (Employee/Workflow Owner/Approver/Admin groups, grants-nothing note), f118 `Marcus Webb · Workflow Owner`, `Calder & Vance`, candidate and sources intact. No second selector. Deviation: the 240 px selector wraps the identity onto two lines (one contiguous string in the DOM). |
| GAP-SC-H-guidance | BOB-06 SC15 | H-075 | none | `hk-h4c-playbook` f150/f160 `Draft · Review requested`, f175 neutral outlined shield `Approved for Guidance`, `v1.0`; no success hue; `Published for guidance. This does not create, release or authorize an agent.` |
| GAP-SC-L-02 | BOB-06 SC15 | L-062 | none | `lk-l6-discover` f90/f100 `Publish for Guidance`, `Owner: Marcus Webb`, separate `Publish`; f115/f130 `Published` and badge. |
| GAP-SC-L-03 | BOB-06 SC14 | L-073 | none | `lk-l6-discover` f420/f435 `Confidence: Medium`, warning triangle + `Variance exception rule: unverified until SME review`, three demonstration cards, no numeric score. |
| GAP-SC-H-gate | BOB-07 SC18 | H-082-083, H-091 | `scope-layout.ts` (queue row, see L-05) | `hk-h4d-agent` f165 only `5/5 verified human examples` checked, `28/25`, `6/5`, `Owner approval` hollow and `Pending`, Deploy disabled; f200 provenance drawer `3 observed this week + 2 SME-verified archived cases`. `hk-h4e-simulate` f215 scenario rows satisfied by the completed v0.2 run, owner pending; f230 all satisfied after `Approve release`; f239 `Scope confirmed`, Deploy enabled. |
| GAP-SC-L-04 | BOB-07 SC17/SC14 | L-080-081 | `FactoryScreen.tsx`, `EvidenceDrawer.tsx` | `lk-l7-create` f165 draft titled `Create Agent · v0.1`; f200/f205 AP-RULE-009 drawer: `Elena Ruiz`, `v0.1 · Supplier Invoice Reconciler`, `Unverified branch`, `variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept`, exactly 2.00% auto-accepts, warning; draft remains visible behind the scrim. |
| GAP-SC-L-05 | BOB-07 SC18 | L-082 | `scope-layout.ts` | `lk-l7-create` f210-f300 separate outlined 40 px `Selected invoice queue | AP East` row under `Gmail`/`NetSuite`/`Google Sheets`, no cyan, no queue ID, no authority. |
| GAP-SC-H-rule-replay | BOB-08 SC20 | H-087 | `ResultsScreen.tsx` | `hk-h4e-simulate` f104 replay drawer, f110/f119 replay card (`SCN-022 · variance_exactly_2.00pct`, `Expected: accept`, `Actual: escalate`) on the left with the AP-RULE-009 drawer on the right (`> 2.00% requires approval`), red failed glyph, no cyan; f121 closed: same failure still selected, 21/6/1. The card height was tightened to 112 px after viewing. |
| GAP-SC-L-06 | BOB-08 SC19 | L-091 | none | `lk-l7-create` f480 `Run Evaluation` (upper right), `Flight Simulator`, `SIM-AP-RECON · 28 scenarios`, `v0.1`, `Not Run · 0 of 28`; f507 hover; f522 running (`Running`, cyan only from here), f539 9 of 28. |
| GAP-SC-L-07 | BOB-08 SC19 | L-093 | `SimTiles.tsx`, `simulator-layout.ts` | `lk-l8-simulate` f0, f14, f27, f29: 28 rows from the sealed suite scroll 120 px over 27 frames clipped to the host, one `Running` row, executed rows `Executed`, the rest `Not Run`, no verdict before completion, detail panel visible beside it. 4x7 grid unchanged elsewhere (decision 13). |
| GAP-SC-H-preflight | BOB-09 SC21 | H-092 | `clip-specs-job-hackathon.ts` | `hk-h4f-job` f0 queue, f16 `Confirm job scope` dialog (`JOB-0117`, `Supplier Invoice Reconciler v1.0`, `AP East`, `11 invoices`, `Permitted applications`, `Policy`, `Cancel`, `Start job`), f32 pointer on `Start job`, f35 running. No cyan before the Start press. Deviation: the Start press moves to f34 (H-093) so the dialog is readable. |
| GAP-SC-L-08 | BOB-09 SC21 | L-108-109 | none | `lk-l8-simulate` f450 `Proposed selection` eleven INV-48210..INV-48220, `Confirm 11 invoices`; f470 `Selection confirmed`, `Fixed`; `lk-l9-run` f5/f14/f16 preflight dialog before Start. |
| GAP-SC-H-escalation | BOB-09 SC22 | H-095 | `JobScreen.tsx`, `clip-specs-job-hackathon.ts` | `hk-h4f-job` f90/f96/f98/f110: `INV-48215` and `INV-48218`, each `Escalated: Missing Purchase Order` with the arrow/person glyph and text, no triangle, staggered; counts 7/1, 7/2. Deviation: each row selects its own case inside SC22 (own ID and reason); no new route. |
| GAP-SC-H-summary | BOB-09 SC25 | H-096 | none | `hk-h4f-job` f120/f130/f149 `Partially Complete`, `Before approval` 7/2/1/1, hatch only in its own panel, no cyan. |
| GAP-SC-H-approve | BOB-09 SC23/SC25 | H-099-100 | none | `hk-h4f-job` f215 `Pending Tier 3`, `Daniel Okafor · Tier 3`, `Before: Variance Hold`, `After: Matched - Variance Approved`, `Independent readback: not requested`; f230 click landed, `Approved by Daniel Okafor · awaiting independent verification`, `Awaiting verification`; f250/f255 SC25 `INV-48219 independently read back` and 8/2/0/1 only after the separate readback. |
| GAP-SC-L-09 | BOB-09 SC24 | L-120 | none | `lk-l9-run` f330/f345/f359 `Resubmit unavailable` as static info text (not a button), tooltip `A timeout proves neither failure nor submission. Do not resubmit until reconciled.`, `Investigate` available, no resubmit control. |
| GAP-SC-L-10 | BOB-09 SC25 | L-122-123 | `JobSummaryScreen.tsx`, `job-layout.ts` | `lk-l9-run` f390 (first SC25 frame) `Before approval` 7/2/1/1 with the label `Earlier snapshot · INV-48219 has since been independently verified`; f420-428 `After approval and verification` 8/2/0/1 replaced together by a 150 ms opacity swap; both sum to 11, unknown stays 1. Audit fixes: the first frame of the stored snapshot was blank and its label was truncated. |
| GAP-SC-H-manual | BOB-10 APP-05/SC26/SC27 | H-107 | `NetSuiteView.tsx` | `hk-h4g-heal` f120/f130 dark original ERP: `Vendor Bill · Manual completion`, `Elena Ruiz · INV-48231 · manually completed`, `Yes; billed on top of subtotal and within approved terms`, `Completion evidence` link, `Correction is evidence, not new policy.`, then `Teach Oryn What Changed`; f135 SC27 opens. No approval badge, no invented approver. Form spacing tightened after viewing (text sat on the card border). `lk-l10-heal` f135/f145/f150 same (viewed). |
| GAP-SC-H-hatch | BOB-09 SC24 | H-137 | `JobDrawers.tsx` | Source for the H-137 still: `hk-h4f-job` f270-299. `Outcome Unknown`, `Held`, `Reconciliation required`, `Not resubmitted` solid on white; hatch only in the separate glyph panel at the left. |
| GAP-SC-H-postcondition | BOB-09 SC24 | H-140 | `JobDrawers.tsx`, `clip-specs-job-hackathon.ts` | Source for the H-140 still: `hk-h4f-job` f270-299. Two cards, `Evidence` (`NetSuite ERP timeout record`, `ERP submit timed out`) and `Business postcondition` (`Reconciliation required`, `Independent readback unavailable`) with a thin connector; f299 pointer on the source link, which selects INV-48220 and opens the NetSuite tab with the existing timeout banner. No green, no cyan, no retry. |
| GAP-SC-L-11 | BOB-10 SC28 | L-136 | `RepairScreen.tsx`, `repair-layout.ts` | `lk-l10-heal` f285/f300 `34 scenarios`, `Original failure + 5 nearby variants`, SCN-029 original Kestrel layout v2, 030 spacing, 031 handling before total, 032 zero handling, 033 capitalization, 034 separating rule; f335 running (tiles 1-34, cyan only now); f350 `28 Passed · 6 Passed — Expected Safe Escalation · 0 Failed`, tiles 029-034 ordinary passes. The stage fan is not baked in (stage owner). |
| GAP-SC-L-12 | BOB-11 SC30 | L-146 | `VersionsScreen.tsx` | `lk-l10-heal` f584 hidden, f585 fade start, f590/f614 `Restore affects future eligible work, not prior business effects` above the restore control. Blocked as specified at the start of `lk-l11-breadth`: that clip starts at ST17 on SC16 and SC30 needs ST21; L-146 lives in `lk-l10-heal` (unchanged since BOB-11). |
| GAP-SC-L-13 | BOB-11 SC31 | L-136, L-149-150, H-120-121 | none | `lk-l11-breadth` f70/f100 and `hk-h4h-breadth` f100/f125 (viewed): `Invoice approval threshold`, `Before 2.00% → After 1.50%`, `effective Dec 1`, `1 playbook`, `1 agent`, `34 tests`, `Needs Revalidation`, `Review boundary tests` -> three proposed tests. Grep of `src/` and `film/`: no `33 tests`, `33 scenarios` or `27 Passed` (the only `27/28` is v0.1's intended-outcome count). |
| GAP-SC-L-14 | BOB-05 SC04 | L-151-152 | none | `lk-l11-breadth` f140/f170 and `hk-h4h-breadth` f158/f170: `Known fix from AP East: Vendor tax ID format`, `Guide Me`, step `Check the vendor tax ID format`, Back/Next, dismiss; the ERP field stays empty and uncovered. |
| GAP-SC-L-15 | BOB-11 SC33 | L-155 | `CommandScreen.tsx` | `lk-l11-breadth` f240/f250/f269: four panels; `JOB-0117 · Partially Complete`, `After approval and verification`, `8 Verified Complete`; Exceptions `2 Escalated`, `0 Approval Required`, `1 Outcome Unknown`; `INC-0042 · Closed` ... `Separate incident population`; `v1.1 · Expanded`. The four job counts are split across two panels, not one line. |
| GAP-SC-L-16 | BOB-11 SC34 | L-157 | `AuditScreen.tsx` | `lk-l11-breadth` f300/f310 headers `Actor Event Object Scope Outcome`, row `Actor: not recorded | Evaluation | SIM-AP-RECON v0.2 | 28 scenarios | 22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed`; f320 export drawer `Authorized scope`, `14 event records`, `Raw private media is not included.`. The `Export authorized records only?` confirmation exists (`audit-confirm`, tested) but needs the Continue press, which the 30-frame entry does not film. |

## Resolved decisions 1-18 (product-side check)

| # | Result |
|---|---|
| 1 | `Partially Complete` in `hk-h4f-job` f120-f329 and `lk-l9-run` f390-f524; never `Completed with exceptions`. |
| 2 | Stage only; the product draws no ring. |
| 3 | `lk-l4-privacy` f95-f145 (viewed): `Observation paused`, `Resume observation` in neutral ink; no cyan. |
| 4 | Stage only. |
| 5 | GAP-SC-H-gate above. |
| 6 | GAP-SC-H-guidance above. |
| 7 | GAP-CMP rows above. |
| 8 | 34 across `RepairScreen`, `PolicyScreen`, fixtures and the tests (`guards.test.ts` rejects 33/27 reasons); 28 + 6 + 0 in `lk-l10-heal` f350. |
| 9 | Arrow/person glyph on `Escalated` in SC22, SC25 and SC33 (viewed); triangle only on `Needs Revalidation`. |
| 10 | GAP-SC-H-approve and GAP-SC-L-10 above. |
| 11 | GAP-SC-L-09 and GAP-SC-H-hatch above. |
| 12 | FX-01 unchanged: 12 frames `hk-h4g-heal` f30-f41, `lk-l10-heal` f9-f20 (`containment-wipe.test.tsx`). |
| 13 | 96x52 tiles centred in the 472x416 host (`hk-h4e` f200, `lk-l7` f480), row stream only in `lk-l8` f0-f29. |
| 14, 16 | Stage only. |
| 15 | `Check the vendor tax ID format` in both cuts (GAP-SC-L-14). |
| 17 | `lk-l5-observe` f150-f179 (viewed): Priya's pre-composed reply revealed left to right by mask in 27 frames, full quote `Send me the new layout; I'll confirm the terms in writing by Friday.` at f179; no caret. |
| 18 | GAP-SC-H-notice and GAP-SC-L-01 above. |

## Defects found by the audit and fixed in the owner files

1. SC20 safe-escalation rows wrapped `SCN-0nn` into two lines that overlapped the next row (since BOB-08; `hk-h4e-simulate` f180-f209, `lk-l8-simulate`): `ResultsScreen.tsx` now keeps id, label and status on one row.
2. SC25 `Before approval` entry frame was blank (`lk-l9-run` f390) and its `Earlier snapshot` label was truncated: `JobSummaryScreen.tsx`, `job-layout.ts`.
3. The first frame of `hk-h4g-heal` was an empty Gmail view while `hk-h4f-job` ends on the open Kestrel PDF: `motionProgress` (`contract.ts`) and the document slide (`InvoiceDocument.tsx`) no longer animate an action that lands on clip frame 0 (the replayed start state). Five tests that pinned a frame-0 landing now land on frame 1; `gmail.test.tsx` and `job-summary.test.tsx` gained tests for the start state.
4. APP-05 manual-completion text overflowed its card (`NetSuiteView.tsx`).

## Stage-side GAP-STG owners (recorded only; no stage graphic or screenshot is in a product clip)

"Named" means an existing roadmap prompt already names the gap. "Assigned" means BOB-12 assigned the owner (owner decision 3) and added a `Verify stage gap` line to that step's checklist in `ROADMAP.md`.

| Gap | Owner | Product-side source the stage reads |
|---|---|---|
| H-lowerthird, H-closecopy, L-01, L-02 | KIT-03 (by STG item: STG-04, STG-16, FRT-06) | none |
| H-orbit, H-close, H-chipdetail, H-threecards, H-lifecycle, L-04, L-05, L-06, L-12 | KIT-04 (by STG item: STG-02, STG-03, FX-05) | L-12: the three cohort readbacks land together at `lk-l10-heal` f471, `Expand release` f510 (BOB-10); the stage staggers its own three checks (owner decision 5) |
| H-mismatch, H-sources, H-stat | KIT-05a (named) | none |
| H-ai-detail, H-future | KIT-05b (named) | none |
| H-handoff | KIT-05c (named) | none |
| H-memory | KIT-05d (named) | none |
| H-intent, H-impact, H-url, H-credit, L-14 | KIT-05e (named) | H-intent: `hk-h4d-agent` f0-f87, fixed-height field, 84-character intent at 34 characters/s (BOB-07 deviation) |
| H-paperwipe | KIT-05f (named) | `hk-h2-problem` f540-f599 (both Kestrel layouts overlapping, fee outlined from f558) |
| H-d1overlay | HK-07 (assigned; KIT-02 camera pan) | `hk-h4b-observe` f30 NetSuite D1, f48 tracker; anchors `erp-bill`, `erp-po`, `tracker-grid` |
| H-kestrel-po | HK-12 (assigned; KIT-01 stage card) | `hk-h4g-heal` f0-f29 anchors `document-page`, `po-number`, `invoice-total`, `handling-fee` (`PO-1051`, `$4,175.00`, `$38.50`, `$4,213.50` seen) |
| L-03 | LK-02 (assigned; KIT-02 camera) | `lk-l2-chaos` f120-f149 (the capture's own pointer) |
| L-07 | LK-04 (assigned) | product neutral states `lk-l4-privacy` f90-f149 (viewed) |
| L-08 | LK-05 (assigned; caption `only after` KIT-03) | `lk-l5-observe` f150-f179 (mask reveal in the product, viewed) |
| L-09 | LK-06 (assigned; KIT-04 STG-03 components) | `lk-l6-discover` f120-f419 held SC15 frames |
| L-10 | LK-07 (assigned; KIT-05f FX-02) | `lk-l7-create` f450-f479 (SC18 `v0.1`) |
| L-11 | KIT-04/KIT-05f (by STG item FX-01, already built in the product) | `lk-l10-heal` f9-f20 (12-frame wipe, unchanged) |
| L-13 | LK-11 (assigned; KIT-01 STG-01) | `lk-l11-breadth` f360-f389 (product 7 + 6 tiles) |

## Owner decisions

The owner said to go with the recommendation for every open question. Nothing in the code changed for decisions 1, 2, 4, 5 and 6; decision 3 changed `ROADMAP.md` only.

1. **D1 tracker rows** (`hk-h4b-observe` f48 shows later rows INV-48215, INV-48218, INV-48219 and INV-48220 on the D1 day): leave the product as built and give the question to BOB-13, the continuity audit, which owns the fix and any affected frames. It is a fixture-continuity question, not a Part D gap.
2. **SC30 timing (GAP-SC-L-12):** L-146 stays in `lk-l10-heal` f585-f614. `lk-l11-breadth` keeps its ST17 start on SC16.
3. **Stage-gap owners:** assigned as in the table above, by the composition step that mounts the entry, and a `Verify stage gap` line was added to each of those eight checklists (HK-07, HK-12, LK-02, LK-04, LK-05, LK-06, LK-07, LK-11). No prompt text changed.
4. **Export confirmation (GAP-SC-L-16):** do not add a Continue press. L-157 is 30 frames: the drawer lands at f315 and a press needs at least 11 frames of travel, so the confirmation would be cut off by L-158 at f330. The scope preview that the gap requires before confirmation is the filmed state.
5. **Cohort readbacks (GAP-STG-L-12):** the product keeps landing the three independent readbacks together at f471 (BOB-10 decision). The stage staggers its own three checks 120 ms apart and closes the ring after the last, 400 ms close plus 400 ms hold, which still follows all three readbacks.
6. **Clip durations:** unchanged. The approval and snapshot beats fit the current lengths.

## Deviation register

Every deviation from the inventory, the roadmap or an earlier README statement that BOB-12 made or found, with the reason. Part D text wins over an older screen spec; where a gap's exact wording could not be met literally, the row says so.

| # | Deviation | Where | Reason |
|---|---|---|---|
| D1 | The role selector wraps `Marcus Webb · Workflow Owner` onto two lines in the 240 px sidebar; the DOM text is one contiguous string. | `Shell.tsx`, GAP-SC-H-role | The canonical selector at P(135,54) is fixed width; moving it is forbidden by the gap. |
| D2 | `Start job` is pressed at f34 (H-093), not inside H-092; scope opens at f11. | `clip-specs-job-hackathon.ts`, GAP-SC-H-preflight | The gap asks for both actions to be readable and allows resequencing; one second cannot hold both. No clip length changed. |
| D3 | An escalated row selects its own case inside SC22; there is no dedicated case-detail route. | `JobScreen.tsx`, GAP-SC-H-escalation | The reducer has no route for it and no new screen is built. Agreed with the sub-agent before the change. |
| D4 | SC20 replay is a 480 x 112 card over the top rows of the tile grid (SCN-001 to SCN-008 are covered) while the AP-RULE-009 drawer is open, not a static left view beside it. | `ResultsScreen.tsx`, GAP-SC-H-rule-replay | The 472 px host leaves no free area; the failed tile SCN-022 and its outline stay visible and the card shows both outcomes. |
| D5 | SC19 row stream rows are 19 px, not 30 px (README BOB-08 said 30). | `simulator-layout.ts`, `SimTiles.tsx`, GAP-SC-L-07 | A 120 px translate over 27 frames with 30 px rows scrolled the executing row out of the 416 px host. The README BOB-08 line is corrected below. |
| D6 | The H-137 and H-140 stills have no clip of their own; their source is `hk-h4f-job` f270-f299 (SC24). | GAP-SC-H-hatch, GAP-SC-H-postcondition | HK-14 reuses job stills (roadmap HK-14 step 1). The state is filmed in a real clip, not drawn. |
| D7 | The SC24 evidence link opens the NetSuite tab at the existing held-timeout banner; no new app record was invented. | `JobDrawers.tsx`, GAP-SC-H-postcondition | The fixture has the timeout evidence in APP-05; a new record would be invented data. |
| D8 | The six SC28 regression cases are buttons inside the results panel; the stage fan of six cards is not drawn. | `RepairScreen.tsx`, GAP-SC-L-11 | The fan is a stage composition (KIT), not product. |
| D9 | SC33 shows the four job counts across two panels (`Verified outcomes`, `Exceptions`) and not as the one string `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`. Labels `JOB-0117`, `INC-0042 · Closed`, `v1.1 · Expanded` appear. | `CommandScreen.tsx`, GAP-SC-L-15 | BOB-11 built four panels with separated populations (the gap's own Done when). The exact one-line string is an editorial join; not changed. |
| D10 | The SC34 export confirmation is not filmed (owner decision 4). | GAP-SC-L-16 | 30-frame entry. |
| D11 | SC30 is not at the start of `lk-l11-breadth` (owner decision 2). | GAP-SC-L-12 | Phase guard ST21 and the ST17 clip start. |
| D12 | `motionProgress` and the invoice document slide treat an action landed on clip frame 0 as the start state (no entry motion). This applies to every product clip. | `contract.ts`, `InvoiceDocument.tsx` | A clip replays its prerequisites at f0; the previous clip already showed that state, so a fade made f0 differ from it (blank first frame of `hk-h4g-heal`). Five tests that pinned a frame-0 landing now land on frame 1; no clip content changed otherwise. |
| D13 | SC25's stored `Before approval` snapshot is fully visible on its first frame; only the switch to the current snapshot fades. | `JobSummaryScreen.tsx` | Same reason as D12. |
| D14 | The SC25 snapshot label rectangle widened from 420 to 676 px. | `job-layout.ts` | The `Earlier snapshot` sentence was truncated. |
| D15 | `hk-h4a-enroll` and `lk-l4-privacy` were captured to a scratch directory only and their MP4s are not kept. | CAP-02, CAP-11 | They were not kept at BOB-04 and the owner decision stands. |
| D16 | One shared run of `author-product-clips.ts` regenerated every timeline (all clips share it); only timelines whose spec output changed differ in git. | process | The script writes every clip. |
| D17 | Two throwaway capture scripts under `scripts/` were deleted after use; frame extracts live in `/tmp` and are not committed. | process | SO-B cleanup. |
| D18 | A first instruction to a sub-agent read as removing `Request approval` from SC32. It was withdrawn before any change landed; the control, its hover and the blocked submit remain. | `HubSpotView.tsx` | The control is required by BOB-11 items 4 and 9 and never approves. |
| D19 | Not run in IBM Bob (owner said to skip Bob). | all | SO-B5 and SO-B7 stay unmet and are not claimed. |

README corrections made with this ledger: BOB-08 row stream rows are 19 px (D5), and the BOB-12 section.
