# BOB-13 numeric and continuity audit

Step BOB-13 of `ROADMAP.md`: audit product facts (inventory DAT-01 to DAT-13, section 4 decisions 1-18, Part D) and frame continuity across the 18 product timelines. Built and run by a coding-agent session with three parallel audit sub-agents (job, simulator, gate/incident) and a parent that wrote the frame harvest, fixed cross-slice defects, recaptured and viewed frames. It was **not** run in IBM Bob (the owner said to skip Bob); SO-B5 and SO-B7 stay unmet and must not be claimed.

## How the evidence was produced

- `bun run scripts/audit-harvest.ts` seeks every frame of the 18 timelines (7380 frames: 3060 hackathon, 4320 launch) in the same film-capture page `scripts/capture.ts` uses. Per frame it records the viewer-visible text (screen-reader-only spans excluded), each element that draws arc cyan (`#2FD8FF` or `#0B7D8E`) with whether an ancestor carries `data-running`/`data-executing` or an in-flight progress bar, the single-invoice rows, the visible named anchors with their text, and any caption element.
- `bun run scripts/audit-rules.ts` judges that dump with 17 rules and exits 1 on any finding. `scripts/audit-rules.test.ts` (6 tests) shows each rule rejects the contradiction it exists for.
- Fixtures are read from `src/data` (never hard-coded in the rules), so a fixture change is audited, not mirrored.
- Frames were extracted with `ffmpeg` and viewed; recaptured clips were compared with the previous MP4s by per-frame PSNR to list exactly which frames changed visibly.

## Audit matrix

| # | Item | Rule / test | Result | Evidence |
|---|---|---|---|---|
| 1 | DAT-02: 11 unique rows INV-48210 to INV-48220, suppliers, cents, POs; null PO renders `—` | `bob13-job-audit.test.ts`, ID-1/ID-2 | PASS | `src/data/invoices.ts`; no row in any frame shows a supplier, PO or amount that is not the fixture's |
| 2 | JOB-0117 11 = 7+2+1+1 before approval | NUM-1 | PASS | `hk-h4f-job` f120-f249, `lk-l9-run` f150-f284 |
| 3 | 11 = 8+2+0+1 only after independent readback | NUM-1 | PASS | first 8/2/0/1 frame is `hk-h4f-job` f250 and `lk-l9-run` f285, each with `Independent NetSuite readback: Matched - Variance Approved` / `independently read back` in the same frame; the approval beat (`awaiting independent verification`) holds 7/2/1/1 for 20 frames (hk f230-f249) and 30 frames (lk f255-f284) |
| 4 | INV-48219 `$18,420.00` − `$17,980.00` = `$440.00`, 2.45% | NUM-2, `bob13-job-audit.test.ts` | PASS | 44000 cents / 1798000 = 2.447%; exceeds 2.00% by integer cross-multiplication; every `Variance $… / …%` in every frame reads `$440.00 / 2.45%` |
| 5 | INV-48220 stays held, no retry or resubmit | TXT-1, `bob13-job-audit.test.ts` | PASS | no `Retry`, no bare `Resubmit`; only `Resubmit unavailable` info text and `Investigate`; `Rerun` appears only on the simulator (SC20) |
| 6 | DAT-05 28 = 21+6+1 → 22+6+0 → 34 = 28+6+0 | NUM-3, `bob13-sim-audit.test.ts` | PASS | counts derive from the rows; frames show only 0/0/0 (not run), 21/6/1, 22/6/0, 28/6/0; suite sizes only 28 and 34 |
| 7 | Boundary exactly 2.00% auto-accepts; `> 2.00%` needs approval; integer cents | `bob13-sim-audit.test.ts` | PASS | `exceedsThreshold` (`permissions.ts`): equality, one cent below and above, 1.50% policy threshold. v0.1 is now executable as `exceedsThresholdV01` (`>=`): on the exact 2.00% input it escalates and v0.2 accepts, so the recorded SCN-022 verdicts (v0.1 `failed`, v0.2 `passed`) are derived, not just asserted; they differ only at equality |
| 8 | Six safe escalations pass | NUM-3 | PASS | SCN-023 to SCN-028 count in the intended-outcome total; glyph is arrow/person + label |
| 9 | No `33`/`27 Passed`, `Completed with exceptions`, 60 fps | TXT-1 | PASS | no frame, README or fixture states them. `27/28 intended outcomes correct` (v0.1, `hk-h4e-simulate` f30-f134, `lk-l8-simulate` f30-f254) is 21+6, labelled as intended outcomes, never `27 Passed` |
| 10 | Gate provenance 5/5 = 3 observed + 2 archived | `bob13-gate-audit.test.ts`, ID-1 | PASS | D1 INV-48203, D2 INV-48204, D3 INV-48207 with the DAT-03 names and times; archived cases carry no invented ID |
| 11 | Authorization pending | `bob13-gate-audit.test.ts` | PASS | scenario/edge/owner rows pending until the v0.2 pass and Marcus's approval (`hk-h4d-agent` f90-f209; `hk-h4e-simulate` owner `Pending` f210-f221, approved from f222); Deploy disabled until all satisfied |
| 12 | Incident: three cases, $38.50 fee | NUM-4 | PASS | INV-48231, INV-48233, INV-48236; INV-48233 and INV-48236 amounts null (`—`); $4,213.50 − $4,175.00 = $38.50 (421350 − 417500 = 3850) |
| 13 | 3/3 independent release | NUM-4 | PASS | `hk-h4g-heal` f345 0/3, f366 1/3, f369 2/3, f372 3/3; `lk-l10-heal` 0/3 then 3/3 at f471; each row `Verified Complete` only after its own readback |
| 14 | Stable invoice IDs at each visible frame | ID-1, ID-2 | PASS | all IDs in all frames are DAT-02/03/07 IDs; job table order INV-48210 to INV-48220 never changes |
| 15 | Named anchors at each visible frame | ANC-1, ANC-2, ANC-3 | PASS | no visible anchor leaves 1280x720 or has no area; every click target is visible at its landing frame or the frame before (`continue` and `my-privacy-link` navigate on the landing frame); ledger anchors visible with `PO-1051`, `$4,213.50`, `$38.50` on `hk-h4g-heal` f0-f29, `erp-bill`/`erp-po` at `hk-h4b-observe` f30, `tracker-grid`/`tracker-row-inv-48203` at f48 |
| 16 | No product captions | CAP-1 | PASS | no `figcaption`, `[data-caption]`, caption class or `#0A0A0A` strip at y622-696 in any frame |
| 17 | No cyan when stopped | CYAN-1 to CYAN-3 | PASS | cyan only in `hk-h4e-simulate` f15-f29 and f165-f179, `hk-h4f-job` f34-f119, `hk-h4g-heal` f281-f299, `lk-l7-create` f522-f539, `lk-l8-simulate` f0-f29 and f284-f299, `lk-l9-run` f15-f149, `lk-l10-heal` f329-f344; each is inside an execution-flagged element; no `Partially Complete`, `Run complete` or terminal frame draws cyan |
| 18 | Cyan and frame continuity across contiguous clips | CYAN-4, CONT-1 | PASS | `lk-l7-create` ends running and `lk-l8-simulate` starts running; `hk-h4f-job` last frame text equals `hk-h4g-heal` f0 |
| 19 | D1 day shows no later invoice outcome | ID-3 | FAIL before, PASS after | see defect 1 |
| 20 | DAT-12 matrix 35 cells, DAT-10 five notices, DAT-11 15 audit events | `bob13-gate-audit.test.ts`, matrix text | PASS | `hk-h4h-breadth` f360 and `lk-l11-breadth` f390 read exactly the DAT-12 table (Zoom `Observe by per-meeting opt-in`) |

All 18 timelines were covered: `hk-h2-problem`, `hk-h4a-enroll`, `hk-h4b-observe`, `hk-h4c-playbook`, `hk-h4d-agent`, `hk-h4e-simulate`, `hk-h4f-job`, `hk-h4g-heal`, `hk-h4h-breadth`, `lk-l2-chaos`, `lk-l4-privacy`, `lk-l5-observe`, `lk-l6-discover`, `lk-l7-create`, `lk-l8-simulate`, `lk-l9-run`, `lk-l10-heal`, `lk-l11-breadth`.

## Mismatches found and fixed at their source

| # | Mismatch | Affected | Fix |
|---|---|---|---|
| 1 | The AP Exceptions Tracker showed INV-48215 `Escalated`, INV-48218 `Escalated`, INV-48219 `Approval Required` and INV-48220 `Outcome Unknown` (JOB-0117 outcomes) on the Monday D1 day. Owner decision 1 of BOB-12 handed this to BOB-13. | `hk-h4b-observe` f48-f59; `lk-l5-observe` f60-f89 (before-fix harvest: rule ID-3 fails on exactly these frames). Items: SC07/APP-06, DAT-02, DAT-03. | `trackerRows` (`src/state/selectors.ts`): context rows INV-48203 and INV-48210 from ST02 on; the four exception rows once the job has started. `TrackerView.tsx` renders only those rows and numbers the empty rows from the next row. Anchors and sidecars are unchanged; the ST01 problem montage (`hk-h2-problem` f90-f149, `lk-l2-chaos` f45-f89) keeps the full sheet, the employee's own manual view. |
| 2 | `COMPLETE_REGRESSION` appended audit event A11 (`regression evaluation completes`) only when the regression passed, so a completed failing regression left no audit event. DAT-11 A11 is `Completed` whatever the verdict. | `src/state/rules.ts`; no film frame (the filmed regression passes). | A11 is appended on every completed regression; `LIMITED_RELEASE` still needs 34 passing intended outcomes. `guards.test.ts` updated to the correct expectation. |
| 3 | SC29 cohort rows were labelled `Outcome 1/2/3` and the readback line `outcome N of 3`, so no frame named the three cases. | `hk-h4g-heal` f345-f419; `lk-l10-heal` f390-f554 (PSNR-verified visible change only here). Items: SC29, DAT-07, DAT-11 A13. | `ReleaseScreen.tsx` names INV-48231, INV-48233, INV-48236 from `INCIDENT.affectedCases`. |
| 4 | Duplicated literals could drift from the rows: version totals (`versions.ts`), the 34-test policy impact (`policy-impact.ts`), SC28 `34 scenarios`/`6 new regression cases` and progress width, SC30 `34 scenarios`. | none visible (values equal the fixtures). | Derived from the scenario and regression rows; no frame changed. |

Recaptured: all 16 kept clips (`bun run scripts/capture.ts`, each passed its own checks: 2560x1440, `r_frame_rate 30/1`, no audio, `nb_read_frames` = timeline = sidecar, every anchor equal to its DOM rectangle on every frame, reverse seeks equal to the linear pass). Sidecars are byte-identical. Visible pixel changes (PSNR < 60 dB): `hk-h4b-observe` f48-f59, `lk-l5-observe` f60-f89, `hk-h4g-heal` f345-f419, `lk-l10-heal` f390-f554. `lk-l11-breadth` f180-f239 differs only below visibility (minimum 77.8 dB). Frames viewed after the fix: `hk-h4b-observe` f50 (two context rows, empty grid), `hk-h4g-heal` f372 (three named cohort rows, `3/3 Verified Complete`).

## Decisions kept (audited, not changed)

- **Action authorization gate check** (`gateChecks`): it is the RT-02 grant lookup for the actor (Marcus holds `start-job` for JOB-0117), not a filmed event; SC18 renders only the four rows of the inventory, which stay pending until their own evidence. Dana, Tomas and Priya are denied. Not a defect.
- **Scenario gate**: RT-01 ST09 says "≥25 correct scenarios including ≥5 edge/negative"; a sub-agent proposed also requiring 0 failed, which contradicts that guard and was reverted. A failed evaluation cannot reach ST09 anyway.
- **27/28 intended outcomes** on the v0.1 results screen stays: it is 21+6 and is labelled as intended outcomes, never `27 Passed`.
- **Gmail inbox on the D1 day** lists INV-48219, INV-48231, INV-48210, INV-48203 and INV-48211 to INV-48214 as received invoice emails: a message list states no outcome, so it is not a continuity breach (rule ID-3 tests outcomes, not ID presence).
- **ST01 problem montage** keeps the full tracker sheet (see defect 1).

## Follow-up pass: every remaining issue resolved

The owner said to go with the recommendation for every open question and to fix all issues. Each issue below is closed; item 8 cannot be closed by code.

| # | Issue | Resolution |
|---|---|---|
| 1 | `notifications.ts:17` shows every occurred notice to non-Employee viewpoints (SC35 combined center vs DAT-10 recipient-only data). | **Decision, no code change.** SC35 (a P0 screen spec, H-127, L-158) requires one center that shows the approval, the incident and the reminder together, so the center is a role-level overview of which notices exist (title and object ID only). Everything recipient-bound stays recipient-bound and was already pinned: `visibleNotifications` and the toast (`activeNotification`) are per viewer, dismissal is rejected unless the viewer is the recipient (`rules.ts` `DISMISS_NOTIFICATION`), and opening the object checks the viewer's access (`noticeOpenReason`; Priya-only commitment, `notifications-screens.test.tsx`). DAT-10 "recipients see only authorized data" is read as "act on and open only what is authorized". |
| 2 | SC22 `Open case` only selected the row (BOB-12 deviation D3). | **Fixed.** A selected escalated case opens its own detail panel below the table (`CaseDetail`, `JobScreen.tsx`, `[264,584,992,104]`): `INV-48215 · Escalated: Missing Purchase Order`, supplier, amount, `Purchase order —`, job and team. One panel at a time, no route, no new anchor, no retry. Viewed in a scratch capture (`hk-h4f-job` with a `SELECT_CASE` at f100, discarded). The filmed clips only hover the row (no select), so no filmed frame changes. |
| 3 | SC25's 150 ms snapshot swap was film-only. | **Fixed.** Outside a film the snapshot label and the four cards remount on a snapshot change (keyed by `earlier`/`current`) and fade 150 ms with `animate-in fade-in duration-150 motion-reduce:animate-none`; no timer, no counter (SO-B2, decision 10). A film never uses the class (the film animates by its own frame clock). |
| 4 | No executable v0.1 comparator. | **Fixed.** `exceedsThresholdV01` (`permissions.ts`, `>=`) records the defect; `BOUNDARY_INPUT` (`simulation.ts`, 200 on a 10,000-cent PO = exactly 2.00%, never displayed) lets `bob13-sim-audit.test.ts` execute both comparators and derive that the recorded SCN-022 verdicts (v0.1 `failed`, v0.2 `passed`, replay `Expected: accept`, `Actual: escalate`) are what they produce, and that they differ only at equality. The fixture verdicts stay the source of the film; the comparator is test-only. |
| 5 | `AuditScreen.tsx:41` and `ReleaseScreen.tsx:67` hard-coded `28`/`34 scenarios`. | **Fixed.** They read `SUITE_SIZE` and `REGRESSION_SIZE`. No frame changed. |
| 6 | Decision 2 (mark closes only on verified readback) is stage-only. | **Closed as out of product scope.** The product exposes `state.readback.status` and the 3/3 cohort rows the stage reads; BOB-12 already assigned the owner (KIT-04, STG item FX-05, owner decision 5). Nothing to change in the prototype. |
| 7 | `hk-h4a-enroll` and `lk-l4-privacy` MP4s were not kept. | **Fixed.** Both captured with `scripts/capture.ts` into `demo/video/clips/` (180 and 360 frames, 2560x1440, `r_frame_rate 30/1`, no audio, anchors equal to the DOM on every frame, reverse seeks equal) with sidecars. |
| 8 | Not run in IBM Bob. | **Cannot be fixed by code.** The owner said to skip Bob; SO-B5 and SO-B7 stay unmet and nothing here claims a Bob result. |

## Deviations made in this BOB-13 work

Every departure from the inventory, the roadmap, an earlier ledger entry or the instructions, with the reason. Part D and section 4 win over older text.

| # | Deviation | Where | Reason |
|---|---|---|---|
| B1 | The tracker shows only the two context rows from ST02 until the job starts; the four exception rows appear with the job. Inventory APP-06 lists six rows without a phase. | `trackerRows`, `TrackerView.tsx` | The exception rows carry JOB-0117 outcome words; showing them on the Monday D1 day contradicts DAT-02/DAT-03 continuity (BOB-12 owner decision 1 handed this to BOB-13). The problem montage (ST01) keeps six rows. |
| B2 | Audit event A11 is recorded for a failed completed regression. The previous behaviour (passed only) was the original BOB-10 design. | `rules.ts` | DAT-11 A11 is `regression evaluation completes`, outcome `Completed`. |
| B3 | SC29 cohort rows are labelled with the invoice ID instead of `Outcome N`. | `ReleaseScreen.tsx` | DAT-07 names the three cases; a frame should show them. |
| B4 | Scenario gate keeps the RT-01 rule (≥25 correct, ≥5 edge/negative). A sub-agent's extra `0 failed` requirement was reverted. | `selectors.ts`, `guards.test.ts` | It contradicted the inventory ST09 guard. |
| B5 | The SC22 case-detail panel is a new element not in the inventory SC22 canvas, and it has no named anchor. | `JobScreen.tsx` | GAP-SC-H-escalation requires each row to open its own case; no new route or screen was allowed (D3). Not filmed, so no timeline or sidecar needed. |
| B6 | The live SC25 swap uses a CSS fade, not the film's frame-driven opacity. | `JobSummaryScreen.tsx` | Same 150 ms, same behaviour in the clickable build; the film path is untouched. |
| B7 | v0.1 comparator is test-only; the SCN-022 verdict is still the fixture row. | `permissions.ts`, `simulation.ts`, `bob13-sim-audit.test.ts` | The film and screens read recorded, immutable verdicts (DAT-05: historical v0.1 stays failed); the test proves the record, it does not re-decide it. `BOUNDARY_INPUT` is an internal 10,200 / 10,000 cents pair, never displayed. |
| B8 | The audit's 17 frame rules are text-and-DOM rules, not pixel judgements; two rule details were adjusted during the run: `Queued` counts as an executing state for cyan (a started job shows the orbit while its first case is queued), and a not-run suite reads `0/0/0`. | `audit-rules.ts` | Both are the product's own states, not suppressed failures; each adjustment is documented in the rule text and the first harvest's findings are listed in this file. |
| B9 | NUM-1 treats an independent-readback line seen earlier in the same clip as evidence for later frames. | `audit-rules.ts` | A clip frame after the readback no longer repeats the line, but the count stays 8/2/0/1. |
| B10 | `scripts/capture-core.ts` exports internal helpers (`buildApp`, `serve`, `openPage`, `guard`, `waitForFontsAndApi`, `loadInPage`, `seekInPage`, `Session`). | `capture-core.ts` | The harvest reuses the capture's page and checks instead of duplicating them. No behaviour change. |
| B11 | CAP-02 and CAP-11 stay unticked although their clips are now kept. | `ROADMAP.md` | Every CAP-nn is unticked while its clip is kept; ticking is the later capture-verification step's job. |
| B12 | One source edit in this follow-up (the two scenario-count literals in `AuditScreen.tsx` and `ReleaseScreen.tsx`) was made with a one-off Python replace through the shell instead of the `edit` tool, against the workflow rule. The result was reviewed in `git diff` (4 lines) and covered by the type check and tests. | process | Disclosed for the record. |
| B13 | Not run in IBM Bob. | all | The owner said to skip Bob. |
| B14 | Three sub-agents wrote the three `bob13-*-audit.test.ts` files and two code fixes; the parent re-ran and reviewed every change, reverted one (B4) and rewrote one test. | process | Parallel audit slices. |

## Files changed

Product and state: `src/state/selectors.ts` (`trackerRows`), `src/state/rules.ts` (A11), `src/state/permissions.ts` (`exceedsThresholdV01`), `src/state/index.ts`, `src/data/simulation.ts` (`BOUNDARY_INPUT`), `src/data/versions.ts`, `src/data/policy-impact.ts`, `src/product/apps/TrackerView.tsx`, `src/product/JobScreen.tsx` (case detail), `src/product/JobSummaryScreen.tsx` (live fade), `src/product/ReleaseScreen.tsx`, `src/product/AuditScreen.tsx`, `src/product/RepairScreen.tsx`, `src/product/VersionsScreen.tsx`.
Audit tooling: `scripts/audit-harvest.ts`, `scripts/audit-rules.ts`, `scripts/audit-rules.test.ts`, `scripts/capture-core.ts`.
Tests: `src/state/bob13-job-audit.test.ts`, `src/state/bob13-sim-audit.test.ts`, `src/state/bob13-gate-audit.test.ts`, `src/state/guards.test.ts`, `src/product/apps/tracker.test.tsx`, `src/product/job-screens.test.tsx`, `src/product/job-summary.test.tsx`.
Clips: `hk-h4b-observe`, `hk-h4g-heal`, `lk-l5-observe`, `lk-l10-heal`, `lk-l11-breadth` (changed), `hk-h4a-enroll` and `lk-l4-privacy` (newly kept).
Docs: `demo/oryn-prototype/README.md`, `docs/video/ROADMAP.md`, `docs/video/bob-12-gap-ledger.md`, this file.
