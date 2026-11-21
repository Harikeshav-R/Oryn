# Oryn demo video production roadmap

## 0.1 How to use this roadmap

Work in `/Users/hari/Developer/Oryn-demo`, branch `demo/video`; never write to the main Oryn checkout. Part 1 builds the deterministic prototype with IBM Bob, builds the reusable stage kit with Claude Opus 5.5, and captures the product clips. Part 2 shoots the presenter, assembles the hackathon cut first, assembles the launch cut, then finishes sound, narration, captions, review and submission.

- [ ] Treat every unchecked box as an unmet gate. Tick it only after inspecting the named output and satisfying the human checks. Do not tick an entire step merely because a prompt ran.
- [ ] Complete the prerequisite IDs in **Why / depends on** before starting a step. If an input is missing, return to its producing step; do not invent it or substitute another take.
- [ ] Open the named model in the stated working directory. Paste the entire prompt, including its first standing-order line. Let it read the named entry IDs rather than pasting whole script entries. Capture its final REPORT and retain evidence and receipts in the named project `work/` directory.
- [ ] Read section 0.4 for Opus or 0.5 for Bob. On a failed check or worse result, follow the appropriate history/review procedure. Never hand-edit generated compositions before inspecting HyperFrames history. Supply the REPORT's open questions, missing files and exact failure to a rerun; do not mask failures or skip the check.
- [ ] Review the preview personally. Audio measurement does not replace listening. Keep originals, editable projects, sidecars, scripts, signed-off renders and submission proof at the paths below. Do not publish private footage or unresolved `[BOB_*]` and `[USER SCREENSHOT ...]` slots.

## 0.2 Decisions and environment facts

**Settled pipeline.** Bob builds `demo/oryn-prototype/` primarily, including a deterministic, scrubbable film runtime. Silent frame-exact product captures and their sidecars go to `demo/video/clips/`; Opus uses HyperFrames for the editable stage, camera, type, graphics, footage, sound and captions. Each three-minute cut is a separate project with one scene sub-composition per storyboard section. Build hackathon first, then launch.

**Clock.** Author at 1280×720 CSS pixels; capture at DPR 2, 2560×1440; deliver 1920×1080, 30 fps. This 30 fps decision supersedes the 60 fps text in both scripts and the older design notes. Absolute storyboard times map to local scene time by subtracting the host start. A film is 180 seconds and 5,400 frames. The beat grid is 120 BPM, 4/4, A minor, from frame 0. Where a cue sheet specifies off-grid offsets, align beat-synced hits to the nearest appropriate half-second without moving the story action; document conflicts and review sound-picture sync. The launch chaos montage expressly uses 0.25–0.5 s cuts; quantize quarter-seconds to the nearest 30 fps frame and report the exception rather than falsifying frame alignment.

**Editorial order.** Lock picture and music/SFX to the storyboard; make a guide track; record the owner's voice last against that picture. On-camera hook and close are recorded at the shoot to script timing with their own usable audio. Transcribe the finished speech, then conform minor slips through timeline edits and holds, never time-stretch speech. No on-screen disclosure tags. The represented third-party interfaces are independently built mocks; do not claim production use, customers, traction or invented Bob findings. The owner speaks all narration. Arc cyan means executing now, not a success color; the ring closes only on verified readback.

**Checked on 2026-11-18, not a promise about future sessions:** `/opt/homebrew/bin/ffmpeg` reports `9.0.2`; `/opt/homebrew/bin/node` reports `v26.13.1`; `/opt/homebrew/bin/ffprobe` and `/Applications/Google Chrome.app` exist. HyperFrames requires Node 22+ and FFmpeg. Skills `hyperframes`, `hyperframes-cli`, `brag-slim`, `media-use`, `hyperframes-registry`, and `better-typography` resolve in this environment; `brag-slim` resolves under `~/.agents/skills/`, not `~/.omp/agent/skills/`. These checks do not prove HyperFrames, Chrome rendering, codecs, credentials, or provider access work. Run the Part 1 doctor and tool gates at production time; `doctor --json` exits zero even on problems, so inspect its payload.

**Contest gate.** IBM AI Builders Challenge, North America, AI for Business. Plan for **2026-12-02 at 5:00 PM Eastern Time**, per Official Rules §§4–5; the event page says December 10. Confirm current rules and actual submission requirements before upload. The functioning prototype or proof of concept must be developed primarily with IBM Bob. The project page needs the problem, AI/technical approach, actual Bob use, a three-minute video with spoken narration, slides, team details and SkillsBuild certificates. Harikeshav Rameshkumar is the solo team member, The Ohio State University. A music-only or text-only video does not satisfy the narration requirement.

## 0.3 Paths, naming, captures and beat grid

```text
demo/oryn-prototype/                   Bob-built app; film/<cut>/<clip-id>.timeline.json; scripts/capture.ts
demo/video/clips/<cut>/<clip-id>.mp4   silent 2560×1440, 30 fps product clip
demo/video/clips/<cut>/<clip-id>.json  matching cursor and anchor sidecar
demo/video/stage-kit/                  canonical reusable stage sources and sync script
demo/video/footage/                    camera originals, proxies, bob-review.mov
demo/video/audio/                      music, effects, guide and voice stems
demo/video/hackathon/                  HyperFrames index.html, compositions/, assets/, work/
demo/video/launch/                     separate HyperFrames project, same structure
demo/video/renders/                    draft and delivery MP4s
```

Each project has one root `index.html`, `data-duration="180"`, and section hosts at absolute film times. Scene source is `compositions/<section-id>.html`; scene-local time starts at zero. Sync the kit into each project's `assets/kit/` and `compositions/`. Copy media into the project's `assets/` and use project-relative `assets/...` URLs, never source paths outside that project in HTML. A stage host, scene root and registered timeline must share the composition ID. Name stems and review artifacts with `hackathon` or `launch` so they cannot overwrite each other.

| Cut | Clip ID | Film interval | Seconds | Frames |
|---|---|---:|---:|---:|
| hackathon | hk-h2-problem | 00:26–00:52 | 26 | 780 |
| hackathon | hk-h4a-enroll | 01:22–01:28 | 6 | 180 |
| hackathon | hk-h4b-observe | 01:28–01:35 | 7 | 210 |
| hackathon | hk-h4c-playbook | 01:35–01:42 | 7 | 210 |
| hackathon | hk-h4d-agent | 01:42–01:49 | 7 | 210 |
| hackathon | hk-h4e-simulate | 01:49–01:57 | 8 | 240 |
| hackathon | hk-h4f-job | 01:57–02:08 | 11 | 330 |
| hackathon | hk-h4g-heal | 02:08–02:22 | 14 | 420 |
| hackathon | hk-h4h-breadth | 02:22–02:38 | 16 | 480 |
| launch | lk-l2-chaos | 00:10–00:22 | 12 | 360 |
| launch | lk-l4-privacy | 00:32–00:44 | 12 | 360 |
| launch | lk-l5-observe | 00:44–00:56 | 12 | 360 |
| launch | lk-l6-discover | 00:56–01:12 | 16 | 480 |
| launch | lk-l7-create | 01:12–01:30 | 18 | 540 |
| launch | lk-l8-simulate | 01:30–01:46 | 16 | 480 |
| launch | lk-l9-run | 01:46–02:03.50 | 17.5 | 525 |
| launch | lk-l10-heal | 02:03.50–02:24 | 20.5 | 615 |
| launch | lk-l11-breadth | 02:24–02:44 | 20 | 600 |

The two heal clips already contain FX-01, the light-to-dark wipe; do not apply it again in HyperFrames. H1, H3, H5, L1, L3 and L12 are footage/stage scenes, not product captures. H3 includes H-027–H-036 lifecycle, H-037–H-047 AI boundary and H-048–H-056 actual Bob review. Camera footage is `footage/hk-hook.mov`, `hk-close.mov`, `lk-hook.mov`, `lk-close.mov`; actual Bob review is `footage/bob-review.mov`.

**Sidecar contract.** The capture producer and stage camera must agree on the concrete JSON keys before capture. Each sidecar identifies `cut`, `clipId`, `fps` = 30, `width` = 2560, `height` = 1440, `frameCount`, `durationSeconds`, a per-frame cursor position, and named UI anchor rectangles over time. Coordinates must declare their space; use the 1280×720 authored CSS space or document conversion from capture pixels. A rectangle is `{x,y,width,height}`; each sample has a frame index or exact frame time. An absent cursor or hidden anchor must be explicit, never fabricated. The final frame index is `frameCount - 1`; duration is `frameCount / 30`. Follow the concrete schema created by BOB-03 and check all camera target names against actual sidecars; do not assume a JSON layout unsupported by the capture script.

The following is a **schema illustration**, not a claim that the capture implementation already uses these keys. BOB-03 must publish the actual schema and every downstream prompt must use that concrete version:

```json
{
  "cut": "hackathon",
  "clipId": "hk-h4a-enroll",
  "fps": 30,
  "width": 2560,
  "height": 1440,
  "coordinateSpace": "authored-css-1280x720",
  "frameCount": 180,
  "durationSeconds": 6,
  "cursor": [{"frame": 0, "x": 0, "y": 0, "visible": false}],
  "anchors": {
    "example-anchor": [{"frame": 0, "rect": {"x": 0, "y": 0, "width": 1, "height": 1}, "visible": true}]
  }
}
```

Actual cursor entries cover every captured frame; anchor samples cover each change or frame according to the implemented interpolation contract. The example anchor name is not a camera target. Require real target names and geometry from the actual clip's sidecar.

| Grid | Seconds from frame 0 | Frame |
|---|---:|---:|
| beat 1, bar 1 | 0.0 | 0 |
| beat 2 | 0.5 | 15 |
| beat 3 | 1.0 | 30 |
| beat 4 | 1.5 | 45 |
| beat 1, bar 2 | 2.0 | 60 |
| last half-second boundary | 179.5 | 5385 |
| exclusive end | 180.0 | 5400 |

Compute each beat from its index rather than accumulating rounding. 1 frame = 1/30 s; 1 beat = 15 frames; 1 bar = 60 frames. A source cue may be off-grid; do not silently change a visible action or pretend an off-grid SFX is on-grid.

## 0.4 Standing orders for every Opus 5.5 prompt (SO-O)

Every Opus prompt in this roadmap begins with the line `Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.` Opus must read this section from the repo, so keep the file at `docs/video/ROADMAP.md`.

- **SO-O1 Skills.** At the start of each session invoke `/skill:hyperframes` (read its SKILL.md and the references its table names for the job: `references/types/launch.md`, `references/format.md`, `references/motion.md`, `references/runtimes.md`; plus `references/captions.md` and `references/sound.md` when the prompt says so), `/skill:hyperframes-cli`, `/skill:brag-slim` (for its Sound rules and its check-and-render discipline only; see SO-O2), `/skill:media-use` (transcribe, beats, normalize-audio, media-treatment), `/skill:hyperframes-registry` (search before hand-writing any effect, transition, caption style, chart or card), `/skill:better-typography`. Run `npx hyperframes events --skill=hyperframes` once as the skill instructs.
- **SO-O2 brag-slim overrides.** The storyboard is the plan. Do NOT run brag-slim's ideation, its 15-25 s rule, the poster, `share-copy.txt` or the "ask what to brag about" step. Replace `brag-plan.md` with a short `work/<STEP-ID>-notes.md` (at most 40 lines: tempo, scene list with start/duration, risks). Still apply from brag-slim: readable text (about 0.3 s per word from when the whole line is settled), "make it alive", "every frame postable", "specific, never invent claims", the beat-grid Sound rules, the pre-render stills check including mid-transition times taken from the timeline, and the frame-count check on any render. Format landscape 1920x1080, **30 fps**. Keep intermediate files in `work/`.
- **SO-O3 Truth and tone.** Use only names, numbers and labels from the storyboard files and `docs/video/mock-build-inventory.md` Part B fixtures. Exact status strings (for example "Passed — Expected Safe Escalation", "Outcome Unknown", "Partially Complete"). Never invent statistics, customers, traction, certifications or Bob findings. Never write "live", "in production" or "real data". No on-screen disclosure tags of any kind. Fictional people and companies only (Calder & Vance Supply Co., Priya Nair, Marcus Webb, Elena Ruiz, Daniel Okafor, Jamal Carter, Dana Whitfield). No real person's data, no secrets, tokens, internal hostnames.
- **SO-O4 Design language.** Product layer: bone `#F6F6F3`, white, ink `#0A0A0A`, hairline `#DFDFD8`, radii 8/6/4, flat, IBM Plex Mono / Space Grotesk / Crimson Text. Stage layer: 24px dot grid at opacity .12, 2px ink outlines, 6px hard offset shadows on stage cards only, crop marks. Arc cyan `#2FD8FF` ONLY while something is executing (simulator, job, regression) and dark again when it stops. Status always has text plus a distinct glyph. Subtitle strip: x128-1152, y630-688 (in a 1280x720 authored space; scale by 1.5 in 1920x1080), IBM Plex Mono 600, 13-15px authored, white on `#0A0A0A`, one line. Fonts load from `assets/fonts/` with `@font-face` (IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700, Crimson Text 400/600/700); never rely on a remote font and never synthesize a weight.
- **SO-O5 HyperFrames contract.** Every timed element is `class="clip"` with `data-start`/`data-duration` in seconds; each composition builds ONE paused GSAP timeline and registers `window.__timelines["<id>"] = tl` after its tweens; no `Date.now()`, unseeded `Math.random()`, network fetches, timers or `repeat:-1` (use finite repeats or timeline-driven phase); never tween `display`, `visibility` or `autoAlpha` on a `.clip` (animate a child); no CSS `transform` on an element GSAP also transforms; animate transforms not `left/top/width/height`; a `<video>` is muted unless `data-has-audio="true"`, never play/pause/seek it; every `<audio>` has an `id`; asset paths are `assets/...` with no leading slash; scene files put markup, style and script inside `<template>` and style the root as `#root`; one scene per sub-composition in `compositions/`; copy and brand colours are variables (`data-var-*`, `var(--id)`); keep content inside the 90% action-safe box and key text inside the 80% title-safe box. Grades, grain and blur on footage go through `npx hyperframes media-treatment`, never CSS filters.
- **SO-O6 Timing.** Times in the storyboards are absolute film time. A sub-composition uses local time 0 at its own start and the root mounts it at the absolute `data-start`. 30 fps: every start and duration is a multiple of 1/30 s. Music runs at **120 BPM, 4/4** (one beat = 0.5 s, one bar = 2.0 s), key A minor; every hard cut, SFX hit and beat-synced motion lands on the 0.5 s grid counted from frame 0. Product clips come from `demo/video/clips/<cut>/<clip-id>.mp4` (2560x1440, 30 fps, silent) with a sidecar `<clip-id>.json` (frame count, duration, per-frame cursor position, named UI anchors with rectangles over time); camera moves in HyperFrames are scale/translate tweens on a wrapper around the clip, targeting anchors from the sidecar, never CSS filters.
- **SO-O7 History.** At the start of a turn run `npx hyperframes history begin --who opus --label "<STEP-ID>"` and `npx hyperframes history --since mine --who opus`; build on whatever the person changed; if `catch-up` is requested, run it first; end with `npx hyperframes history end`. A failed check or a worse result is undone with `history undo --who opus`, never hand-reverted.
- **SO-O8 Quality gate (every prompt).** After the last edit run `npx hyperframes lint`, then `npx hyperframes check --json`; fix every error and weigh every warning. Then `npx hyperframes snapshot` at: the first and last frame of the segment; the midpoint of every scene; the 1 frame before and 1 frame after each storyboard entry boundary that has a transition; and the timeline-derived overlap point of every exit and entry (never hand-picked). Read the PNGs and fix overflow, collisions, low contrast, text that is not readable for 0.3 s per word, and any cyan outside an execution state. A plain crossfade between two busy layouts is muddy: stagger it or dip through the background.
- **SO-O9 Deliverable and report.** Save outputs only inside the paths the prompt names. Do not commit. Do not render a final delivery file unless the prompt says to; stop at the preview (`npx hyperframes preview --background`, check the URL answers 200) and report: files created/changed, composition ids with `data-start`/`data-duration`, the `check --json` result, the snapshot list with a one-line verdict each, every deviation from the storyboard with the reason, and open questions. If a render is requested, use `npx hyperframes render --quality draft -o <path>` first, confirm the file's `ffprobe` duration and frame count (duration x 30), and decode a frame at one known time.
- **SO-O10 Scope.** Touch only the composition files, `assets/` and variables this prompt names. Never edit another step's composition. If the storyboard and this prompt conflict, follow the storyboard files (`docs/video/hackathon-video-script.md`, `docs/video/launch-video-script.md`) and report the conflict. If an input (a clip, a footage file, a kit component) is missing, stop and say exactly which one and which roadmap step produces it.

## 0.5 Standing orders for every IBM Bob prompt (SO-B)

Every Bob prompt begins with `Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).` The contest requires the prototype to be developed primarily with IBM Bob, so these prompts are meant to be run in Bob, not Opus.

- **SO-B1 Source of truth.** Build exactly the items named from `docs/video/mock-build-inventory.md` (read each item's full description, including its "Done when" and "Build notes"), using the fixtures in Part B and the design language in `docs/video/oryn-demo-design-and-build.md`. Where a Part D GAP item extends or supersedes an item, apply it. Follow the 18 resolved decisions in inventory section 4.
- **SO-B2 Stack and constraints.** `demo/oryn-prototype/`: Vite + React 18 + TypeScript + Tailwind 3.4 + upstream shadcn/ui (Radix) + Lucide + class-variance-authority + `@xyflow/react`. Use `bun`, never npm or pnpm. No backend, no network calls, no timers or randomness in anything the film captures; everything is a pure function of the fixtures and the film time. The prototype is also a clickable static build.
- **SO-B3 Clean-room.** Never copy Screenpipe code, CSS, assets or copy. Tokens come only from the values in `docs/screenpipe-design-language.md` and the Oryn design doc; fonts are self-hosted OFL files; third-party apps are original simplified mock UIs with only small nominative marks.
- **SO-B4 Branch discipline.** Work only in the worktree `~/Developer/Oryn-demo` on branch `demo/video`; never touch `~/Developer/Oryn` (main). Small commits, one item or tight group per commit.
- **SO-B5 Review loop.** After implementing, ask Bob to review its own diff against the item's "Done when" list, then fix. Keep the session open so the review can be screen-recorded where the prompt says RECORD.
- **SO-B6 Verification.** Run `bun run typecheck` and `bun run lint` if they exist (create them if not), start the dev server, and look at each built item at 1280x720 and at DPR 2. Check text for the exact strings in the inventory. Report any number that disagrees with the fixtures.
- **SO-B7 Evidence for the contest.** Keep the Bob session transcript/screenshots for each prompt and note the commit hash. Do not claim in any file what Bob did beyond what happened.
- **SO-B8 Report.** End with: items completed (IDs), files added/changed, commands run and results, deviations from the inventory with reasons, and open questions.

## 0.6 Calendar and contingency

Days are local Eastern dates. Work in dependency order even when a task slips to a later day. The deadline is Wednesday, December 2, 2026, at 5:00 PM ET; aim to submit at least one day early. Leave the launch cut until the hackathon submission is secure if time becomes tight.

| Day | Date | Planned work and gate |
|---|---|---|
| D0 | Wed Nov 18 | PRE-* access, official rules, SkillsBuild, Bob setup and environment checks; start BOB-* scaffold. |
| D1 | Thu Nov 19 | BOB-* shared primitives, composites, fixtures and deterministic runtime; retain Bob evidence. |
| D2 | Fri Nov 20 | BOB-* enrollment, observation and mock-app screens; KIT-* base canvas and fonts. |
| D3 | Sat Nov 21 | BOB-* candidate, playbook, agent and simulator; KIT-* cards, camera and typography. |
| D4 | Sun Nov 22 | BOB-* job, approval, incident and repair; KIT-* ring, diagrams and transitions. |
| D5 | Mon Nov 23 | BOB-* breadth, gap/number pass and real code review; record SHOOT-* Bob session; KIT-* sync and check. |
| D6 | Tue Nov 24 | SHOOT-* all presenter takes, backup and ingest; CAP-* hackathon captures and sidecar checks. |
| D7 | Wed Nov 25 | HK-* scaffold, H1–H3c; missing capture repairs; slack. |
| D8 | Thu Nov 26 | HK-* H4a–H4h and H5; assemble and polish. Protect time for holiday and retakes. |
| D9 | Fri Nov 27 | AUD-* hackathon music, SFX and guide; VO-* hackathon recording and captions; lock picture. |
| D10 | Sat Nov 28 | QA-* hackathon review and delivery; SUB-* slides, project copy and certificates. |
| D11 | Sun Nov 29 | Submit hackathon package early if all gates pass; retain receipt. CAP-* launch clips; LK-* L1–L6. |
| D12 | Mon Nov 30 | LK-* L7–L12, assemble and polish; AUD-* launch music, SFX and guide. |
| D13 | Tue Dec 1 | VO-* launch recording, captions and conform; QA-* launch review and delivery; slack for hackathon upload failures. |
| D14 | Wed Dec 2 | Final SUB-* logged-out link, certificate, slides and project-page checks; correct any issues and submit before **5:00 PM ET**. Reserve the final hours for platform failure, not first render. |

**If behind, cut in this order, never by falsifying the demo:** (1) optional 15-second and 30-second launch cut-downs; (2) launch-only polish and nonessential b-roll; (3) defer the entire launch cut until after contest submission; (4) simplify stage decoration and nonessential transition variety while preserving readable story and actual evidence; (5) simplify nonessential breadth presentation without removing required hackathon problem, solution, AI, Bob, demonstration, impact or next steps. Never cut the Bob-primary build, actual Bob evidence, spoken narration, certificates, truthful outcomes, legibility, audio and link checks, slides, project page or deadline buffer. If a required item cannot be done, explicitly report the missing requirement instead of calling the package complete.

## 0.7 Master step index

| Done | Step | Title (entries, film time) | Why / depends on |
|---|---|---|---|
| [x] | PRE-01 | Accounts and evidence (all sections, 00:00–03:00, 180 s) | Establish the required course, certificate, Bob access and genuine evidence before development. No earlier step. |
| [x] | PRE-02 | Worktree, tools, fonts and assets (all sections, 00:00–03:00, 180 s) | PRE-01. Prepare reproducible local assets and verify the actual environment. |
| [x] | PRE-03 | Source authorized brand marks (H-014–H-026; L-010–L-022) | PRE-02. Obtain authentic marks before original mock app work. |
| [x] | PRE-04 | Authorize and redact screenshots (H-106–H-110; L-124–L-134) | PRE-02. Provide two safe memory textures. |
| [x] | PRE-05 | Complete SkillsBuild certificate (contest prerequisite) | PRE-01. Verify the certificate as a separate human gate. |
| [ ] | BOB-00 | Scaffold and tokens (H-055–H-132; L-035–L-160, 00:32–02:38, shared) | PRE-01, PRE-02. Establish the reusable product foundation. |
| [ ] | BOB-01 | Primitives gate | BOB-00. |
| [ ] | BOB-01a | Basic controls (H-055–H-132; L-035–L-160) | BOB-00. |
| [ ] | BOB-01b | Overlay controls (H-055–H-132; L-035–L-160) | BOB-01a. |
| [x] | BOB-02 | Composite gate, accepted as-is; IBM Bob evidence remains open | BOB-01. |
| [x] | BOB-02a | Evidence and simulation, accepted as-is (H-070–H-100; L-058–L-122) | BOB-01. |
| [x] | BOB-02b | Gates and agent blocks, accepted with documented gaps (H-070–H-110; L-058–L-135) | BOB-02a. |
| [x] | BOB-02c | Approval, release and HUD, accepted as-is (H-092–H-127; L-108–L-158) | BOB-02b. |
| [x] | BOB-02d | Graph, masking and shell, accepted as-is (H-055–H-132; L-035–L-160) | BOB-02c. |
| [ ] | BOB-03 | Runtime gate | BOB-02. |
| [x] | BOB-03a | Fixtures, accepted with documented runtime gaps; IBM Bob review and evidence remain open (H-014–H-132; L-010–L-160) | BOB-02. |
| [ ] | BOB-03b | State and permissions (H-057–H-132; L-035–L-160) | BOB-03a. |
| [ ] | BOB-03c | Film runtime (H-014–H-132; L-010–L-160) | BOB-03b. |
| [ ] | BOB-03d | Capture script and sidecars (all product clips, 00:10–02:44) | BOB-03c. |
| [ ] | BOB-04 | Shell, consent and desktop (H-055–H-062; L-035–L-044, 01:22–01:28 / 00:32–00:44) | BOB-03. First product captures need a real consent and privacy path. |
| [ ] | BOB-05 | Work surfaces and meeting (H-014–H-026, H-063–H-069; L-010–L-022, L-045–L-057) | BOB-04. Establish the invoice and consented meeting across original mock apps. |
| [ ] | BOB-06 | Discovery and playbook (H-070–H-076; L-058–L-074, 01:35–01:42 / 00:56–01:12) | BOB-05. Convert demonstrations to reviewed, attributable knowledge. |
| [ ] | BOB-07 | Agent definition and gates (H-077–H-083; L-075–L-090, 01:42–01:49 / 01:12–01:30) | BOB-06. Build the scoped candidate before running simulation. |
| [ ] | BOB-08 | Simulator and correction (H-084–H-091; L-091–L-107, 01:49–01:57 / 01:30–01:46) | BOB-07. Demonstrate the boundary error and corrected evaluation. |
| [x] | BOB-09 | Job, approval and unknown outcome (H-092–H-103; L-108–L-126, 01:57–02:08 / 01:46–02:03.50) | BOB-08. Preserve truthful outcomes and independent verification. |
| [ ] | BOB-10 | Contain, teach, repair and release (H-104–H-116; L-124–L-144, 02:08–02:22 / 02:03.50–02:24) | BOB-09. The dark wipe and containment precede the repair. |
| [ ] | BOB-11 | Breadth and application capabilities (H-117–H-132; L-145–L-160, 02:22–02:38 / 02:24–02:44) | BOB-10. Complete all remaining filmed product states. |
| [ ] | BOB-12 | Product gap pass (H-014–H-132; L-010–L-160, 00:10–02:38) | BOB-11. Close every product-side Part D gap without taking ownership of stage graphics. |
| [ ] | BOB-13 | Numeric and continuity audit (H-063–H-132; L-045–L-160, 00:44–02:38) | BOB-12. Resolve fixture contradictions before recording. |
| [ ] | BOB-14 | Record the real Bob review (H-048–H-056, 01:12–01:22, 10 s) | BOB-13. Produce genuine evidence for the Bob segment. |
| [ ] | KIT-01 | Stage foundations and sync (H-001–H-154; L-001–L-176, 00:00–03:00) | PRE-02. Provide STG-01, STG-12–13 and a safe sync. |
| [ ] | KIT-02 | Camera and scrubber (H-014–H-132; L-010–L-160, 00:10–02:38) | KIT-01 and BOB-03. Frame product captures from their sidecars. |
| [ ] | KIT-03 | Captions, lower-thirds and type (H-001–H-013; L-001–L-009, 00:00–00:26 / 00:00–00:10) | KIT-01. Text must stay editable and legible. |
| [ ] | KIT-04 | Identity and lifecycle (H-006–H-013, H-027–H-036; L-023–L-034, 00:12–01:12) | KIT-01. Build a reusable open mark and the 14-node ring. |
| [ ] | KIT-05 | Diagrams and transitions gate | KIT-01. |
| [ ] | KIT-05a | Statistics and failure visuals (H-014–H-026, 00:26–00:52) | KIT-01. |
| [ ] | KIT-05b | AI boundary (H-037–H-047, 01:02–01:12) | KIT-01. |
| [ ] | KIT-05c | Bob review frame (H-048–H-056, 01:12–01:22) | KIT-01 and BOB-14. |
| [ ] | KIT-05d | Collage and privacy sweep (H-106–H-110; L-040–L-043) | KIT-01 and PRE-04. |
| [ ] | KIT-05e | Pills and end card (H-077–H-079, H-133–H-154; L-166–L-176) | KIT-01 and KIT-04. |
| [ ] | KIT-05f | Transition primitives (H-014–H-026; L-023–L-034) | KIT-01 and KIT-04. |
| [ ] | CAP-01 | Capture and verify `hk-h2-problem` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-02 | Capture and verify `hk-h4a-enroll` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-03 | Capture and verify `hk-h4b-observe` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-04 | Capture and verify `hk-h4c-playbook` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-05 | Capture and verify `hk-h4d-agent` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-06 | Capture and verify `hk-h4e-simulate` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-07 | Capture and verify `hk-h4f-job` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-08 | Capture and verify `hk-h4g-heal` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-09 | Capture and verify `hk-h4h-breadth` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-10 | Capture and verify `lk-l2-chaos` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-11 | Capture and verify `lk-l4-privacy` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-12 | Capture and verify `lk-l5-observe` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-13 | Capture and verify `lk-l6-discover` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-14 | Capture and verify `lk-l7-create` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-15 | Capture and verify `lk-l8-simulate` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-16 | Capture and verify `lk-l9-run` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-17 | Capture and verify `lk-l10-heal` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | CAP-18 | Capture and verify `lk-l11-breadth` as specified above. | BOB capture prerequisites (see Part 1.4) |
| [ ] | SHOOT-01 | Prepare the room and frame (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170; 00:00–00:10 and 02:44–02:53) | PRE-* worktree and equipment checks; scripts provide the exact lines. Capture all four presenter shots on one day with matching setup. |
| [ ] | SHOOT-02 | Record the four presenter shots (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170) | SHOOT-01. These are physical actions, not generated output. Use the storyboard entries to settle any discrepancy in exact take boundaries. |
| [ ] | SHOOT-03 | Capture the real Bob review (H-048–H-056, 01:13–01:22, 9 s) | BOB-* implementation and final Bob review; SHOOT-01. Capture Bob's actual work rather than a reenactment. |
| [ ] | SHOOT-04 | Ingest, back up and make seekable proxies (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170) | SHOOT-02 and SHOOT-03. HyperFrames needs local media with short keyframe intervals and preserved on-camera sound. |
| [ ] | HK-00 | Scaffold the hackathon project (H-001–H-154, 00:00–03:00, 180 s) | Establish the single project and its shared stage kit before building any scene. Tick PRE-02 and KIT-01–KIT-05. |
| [ ] | HK-01 | Introduction (H-001–H-013, 00:00–00:26, 26 s) | Establish presenter, identity and the central standard. Tick HK-00, SHOOT-02 and SHOOT-04. |
| [ ] | HK-02 | Problem and source context (H-014–H-026, 00:26–00:52, 26 s) | Show affected people, sourced costs and the verification gap. Tick HK-00 and CAP-01. |
| [ ] | HK-03 | Lifecycle ring (H-027–H-036, 00:52–01:02, 10 s) | Explain the complete governed loop before showing the AI boundary. Tick HK-00 and the reusable lifecycle kit. |
| [ ] | HK-04 | Local and cloud AI boundary (H-037–H-047, 01:02–01:13, 11 s) | Distinguish private local evidence from authorized cloud inference. Tick HK-03 and the architecture kit. |
| [ ] | HK-05 | IBM Bob build and review (H-048–H-056, 01:13–01:22, 9 s) | Show actual primary development and review evidence. Tick HK-00, CAP-02, SHOOT-03 and SHOOT-04. |
| [ ] | HK-06 | Enrollment and privacy (H-057–H-062, 01:22–01:28, 6 s) | Establish independent consent and visible privacy controls before observation. Tick HK-05 and CAP-02. |
| [ ] | HK-07 | Observation and commitment (H-063–H-069, 01:28–01:35, 7 s) | Follow authorized work into a separately consented meeting and human-confirmed commitment. Tick HK-06 and CAP-03. |
| [ ] | HK-08 | Candidate and playbook (H-070–H-076, 01:35–01:42, 7 s) | Separate proposed workflow knowledge from approved guidance. Tick HK-07 and CAP-04. |
| [ ] | HK-09 | Agent definition and gates (H-077–H-083, 01:42–01:49, 7 s) | Show agent scope, risk and release gates before simulation. Tick HK-08 and CAP-05. |
| [ ] | HK-10 | Simulator and corrected boundary (H-084–H-091, 01:49–01:57, 8 s) | Demonstrate the failed boundary, correct it and satisfy the gate. Tick HK-09 and CAP-06. |
| [ ] | HK-11 | Supervised job and approval (H-092–H-102, 01:57–02:08, 11 s) | Demonstrate distinct outcomes and independent verification. Tick HK-10 and CAP-07. |
| [ ] | HK-12 | Containment, correction and release (H-103–H-116, 02:08–02:22, 14 s) | Contain before repair, test the bounded change and earn release. Tick HK-11 and CAP-08. |
| [ ] | HK-13 | Breadth and command center (H-117–H-132, 02:22–02:38, 16 s) | Show adjacent workflows without changing the hero's facts. Tick HK-12 and CAP-09. |
| [ ] | HK-14 | Impact, next steps and close (H-133–H-154, 02:38–03:00, 22 s) | Finish with intended impact, honest next steps, the founder and project address. Tick HK-13, CAP-07–CAP-09, SHOOT-02 and SHOOT-04. |
| [ ] | HK-assemble | Mount and check continuity (H-001–H-154, 00:00–03:00, 180 s) | Join every finished scene without changing its internal story. Tick HK-00–HK-14. |
| [ ] | HK-polish | Picture and timing review (H-001–H-154, 00:00–03:00, 180 s) | Lock an intelligible picture before the separate sound and voice steps. Tick HK-assemble. |
| [ ] | LK-00 | Scaffold the launch project (L-001–L-176, 00:00–03:00, 180 s) | Establish the single editable launch project after the stage kit, licensed fonts and hackathon assembly are accepted. Depends on HK-assemble, PRE-02 and KIT-01–KIT-05. |
| [ ] | LK-01 | Human hook (L-001–L-008, 00:00–00:10, 10 s) | Establish the speaker and question before the first product crop. Depends on LK-00, SHOOT-02 and SHOOT-04. |
| [ ] | LK-02 | Chaos montage (L-009–L-024, 00:10–00:22, 12 s) | Show fragmented work and distinguish a click from an outcome. Depends on LK-01 and CAP-10. |
| [ ] | LK-03 | Reveal Oryn (L-025–L-034, 00:22–00:32, 10 s) | Resolve the chaos into the open brand mark. Depends on LK-02 and KIT-01–KIT-05. |
| [ ] | LK-04 | Privacy and consent (L-035–L-046, 00:32–00:44, 12 s) | Establish independent consent, local controls and masking before observation. Depends on LK-03, CAP-11 and the authorized screenshot prerequisite. |
| [ ] | LK-05 | Observe and confirm (L-047–L-058, 00:44–00:56, 12 s) | Link permitted invoice work to a human-confirmed meeting commitment. Depends on LK-04 and CAP-12. |
| [ ] | LK-06 | Discover and lifecycle overview (L-059–L-074, 00:56–01:12, 16 s) | Introduce the complete lifecycle as an overview while preserving the evidence and policy boundary. Depends on LK-05, CAP-13 and KIT-01–KIT-05. |
| [ ] | LK-07 | Create an agent (L-075–L-092, 01:12–01:30, 18 s) | Turn the reviewed playbook into a scoped candidate with visible pending gates. Depends on LK-06 and CAP-14. |
| [ ] | LK-08 | Simulate and approve (L-093–L-108, 01:30–01:46, 16 s) | Demonstrate the boundary failure, safe escalation and a reviewed release. Depends on LK-07 and CAP-15. |
| [ ] | LK-09 | Run, approve and hold (L-109–L-126, 01:46–02:04, 18 s) | Preserve the mixed Job outcomes and independent readback before the incident. Depends on LK-08, CAP-16 and CAP-17. |
| [ ] | LK-10 | Contain, repair and verify (L-127–L-146, 02:04–02:24, 20 s) | Show containment before correction and limited release before expansion. Depends on LK-09 and CAP-17. |
| [ ] | LK-11 | Breadth montage (L-147–L-166, 02:24–02:44, 20 s) | Show the adjacent workflows and honest capability boundaries. Depends on LK-10 and CAP-18. |
| [ ] | LK-12 | Human close and end card (L-167–L-176, 02:44–03:00, 16 s) | Return to the person, then hold the project URL and challenge credit. Depends on LK-11, SHOOT-02 and SHOOT-04. |
| [ ] | LK-assemble | Assemble launch picture (L-001–L-176, 00:00–03:00, 180 s) | Integrate all twelve accepted compositions without moving their story events. Depends on LK-01–LK-12. |
| [ ] | LK-polish | Picture continuity and readability (L-001–L-176, 00:00–03:00, 180 s) | Check the assembled picture before the audio and VO pipeline. Depends on LK-assemble. |
| [ ] | LK-15 | Optional 15-second cut-down (L-001–L-006, L-030–L-031, L-094–L-099, L-119–L-121, L-127, L-138, L-142, L-174–L-176; 00:00–00:15, 15 s) | Produce an independent short edit only after picture, audio and spoken narration are accepted. Depends on LK-polish, AUD-02, VO-02, VO-04, VO-05, AUD-03 and QA-02; run th… |
| [ ] | LK-30 | Optional 30-second cut-down (L-001–L-006, L-009–L-018, L-030–L-031, L-035–L-041, L-059–L-062, L-074, L-094, L-096, L-099, L-103, L-114–L-121, L-127, L-132–L-135, L-138, L-140–L-144, L-170, L-172, L-174–L-176; 00:00–00:30, 30 s) | Make a longer independent short retaining privacy and the human repair. Depends on LK-polish, AUD-02, VO-02, VO-04, VO-05, AUD-03 and QA-02; run this cut's own audio, cap… |
| [ ] | AUD-01 | Hackathon music, effects and guide (H-001–H-154, 00:00–03:00, 180 s; hackathon only) | SHOOT-04, all CAP-* hackathon clips, HK-assemble and HK-polish. The picture is the timing authority; VO is recorded after this pass. |
| [ ] | AUD-02 | Launch music, effects and guide (L-001–L-176, 00:00–03:00, 180 s) | SHOOT-04, launch CAP-* clips, LK-assemble and LK-polish; AUD-01 establishes shared sound language. |
| [ ] | AUD-03 | Final mix and loudness (H-001–H-154 and L-001–L-176, each 00:00–03:00) | For hackathon, AUD-01, VO-01, VO-03 and VO-05; for launch, AUD-02, VO-02, VO-04 and VO-05. Run separately after the selected cut's narration is placed. Hackathon may fini… |
| [ ] | VO-01 | Record hackathon narration (H-001–H-154, 00:00–03:00, 180 s; hackathon only) | HK-polish and AUD-01; picture and guide are locked. Record the voice last, except the actual on-camera takes already recorded at SHOOT-02. |
| [ ] | VO-02 | Record launch narration (L-001–L-176, 00:00–03:00, 180 s) | LK-polish, AUD-02 and SHOOT-02. Same real speaker, room and picture-lock rule as VO-01. |
| [ ] | VO-03 | Hackathon transcript and captions (H-001–H-154, 00:00–03:00, 180 s; hackathon only) | VO-01, AUD-01 and HK-assemble. Transcribe the actual full speech reference, including the camera clips. |
| [ ] | VO-04 | Launch transcript and captions (L-001–L-176, 00:00–03:00, 180 s) | VO-02, AUD-02 and LK-assemble. |
| [ ] | VO-05 | Conform picture to narration (H-001–H-154 or L-001–L-176, each 00:00–03:00) | VO-03 for hackathon or VO-04 for launch. Run once per cut before its AUD-03 final mix. |
| [ ] | QA-01 | Hackathon full review (H-001–H-154, 00:00–03:00, 180 s; hackathon only) | VO-05 for hackathon and its AUD-03 mix, HK-polish; all real Bob facts and footage must exist. |
| [ ] | QA-02 | Launch full review (L-001–L-176, 00:00–03:00, 180 s) | VO-05 for launch, AUD-03 for launch and LK-polish. |
| [ ] | QA-03 | Render and inspect both deliveries (H-001–H-154 and L-001–L-176, each 00:00–03:00) | QA-01 for the hackathon or QA-02 for launch, plus human preview and audio approval. Run hackathon first; launch may follow after submission. |
| [ ] | QA-04 | Upload, thumbnail and logged-out viewing (H-001–H-154 or L-001–L-176, each 00:00–03:00) | QA-03 for the relevant cut. Hackathon upload is required for SUB-03; launch upload is separate. |
| [ ] | SUB-01 | Build the contest slide deck (Appendix A, H-001–H-154; hackathon only) | QA-01 and the real Bob review; may run while the final hackathon upload is processing. |
| [ ] | SUB-02 | Prepare project page copy (Appendix B, H-001–H-154; hackathon only) | real BOB-* build and review, QA-01, SUB-01; QA-04 supplies the final video URL. |
| [ ] | SUB-03 | Upload certificates and submit (H-001–H-154, 00:00–03:00; hackathon only) | PRE-* SkillsBuild certificates and account access, QA-03 and QA-04 hackathon, SUB-01 and SUB-02. Submit early; deadline is **December 2, 2026, 5:00 PM ET** under Official… |

# Part 1 · Prerequisites

This part produces the Bob-built deterministic product and the separate reusable HyperFrames stage kit. Inventory ownership below is exclusive: a later gap pass may amend an owned item but does not own it again. Inclusive ranges include every numbered ID between their endpoints. SC05–SC10 are represented by APP-01–APP-09 rather than separate Part A inventory items; SC37 belongs to STG-02. Capture after all dependent Bob and gap steps, not merely after a timeline file first appears.

| Owner | Inventory IDs |
|---|---|
| BOB-00 | CMP-01–CMP-02 |
| BOB-01a | CMP-03–CMP-08 |
| BOB-01b | CMP-09–CMP-14 |
| BOB-02a | CMP-15–CMP-22 |
| BOB-02b | CMP-23–CMP-30 |
| BOB-02c | CMP-31–CMP-37 |
| BOB-02d | CMP-38–CMP-44 |
| BOB-03a | DAT-01–DAT-13 |
| BOB-03b | RT-01–RT-02 |
| BOB-03c | RT-03, FRT-01–FRT-03 |
| BOB-03d | Capture script and sidecar schema; no separate inventory ID |
| BOB-04 | SC12-FRAME, SC12, SC01–SC03; APP-11–APP-12 |
| BOB-05 | SC04, SC11; APP-01–APP-04, APP-06–APP-08 |
| BOB-06 | SC13–SC15 |
| BOB-07 | SC17–SC18 |
| BOB-08 | SC19–SC20 |
| BOB-09 | SC21–SC25 |
| BOB-10 | SC26–SC29; APP-05; FX-01 |
| BOB-11 | SC16, SC30–SC36; APP-09–APP-10, APP-13 |
| KIT-01 | STG-01, STG-12–STG-13 |
| KIT-02 | FRT-04, FRT-05 |
| KIT-03 | STG-04–STG-05, STG-16; FRT-06 |
| KIT-04 | STG-02–STG-03, FX-05 ring-close |
| KIT-05a | STG-06–STG-07 |
| KIT-05b | STG-08 |
| KIT-05c | STG-09 |
| KIT-05d | STG-10–STG-11, FX-04 |
| KIT-05e | STG-14–STG-15 |
| KIT-05f | FX-02–FX-03, FX-05 glitch |

`GAP-*` items extend these owners. BOB-12 applies product-side gaps; KIT steps apply their stage-side gaps. No stage graphic is baked into product captures, except FX-01 containment wipe. Storyboard times are absolute; timelines and clips use local zero. Inventory section 4 resolves old 60 fps and 33-scenario copy: capture at 30 fps; repaired suite is 34 scenarios, 28 passed plus 6 safe escalations.

Parent IDs BOB-01, BOB-02, BOB-03 and KIT-05 are completion gates, not additional inventory owners: tick them only after all their lettered steps pass.

## 1.1 Accounts, administration and repository

### PRE-01 · Accounts and evidence (all sections, 00:00–03:00, 180 s)
**Why / depends on:** Establish the required course, certificate, Bob access and genuine evidence before development. No earlier step.
**Checklist**
- [x] Pre-flight: `docs/video/mock-build-inventory.md`, both storyboard files, and contest account access exist.
- [x] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: SkillsBuild course completion and certificate are genuinely recorded; Bob can access this worktree; session recording is enabled without secrets.
- [x] Accept: store private evidence outside the repository; list verified facts and blockers without invented claims.
- Status 2026-11-19: certificate, official rules and private evidence folder (`~/Oryn-contest-evidence/`) done; Bob CLI 2.1.0 installed. The owner reports being logged in to Bob and that `bob` opens in this worktree; I could not verify this myself (headless `bob run` needs `BOB_API_KEY`) and `bob --list-tasks` is still empty, so no session has been recorded yet. Record each Bob session in `~/Oryn-contest-evidence/bob-sessions/<step-id>/` starting with BOB-00. Known rules risk, owner decision to proceed: official rules sections 10 and 13 require submitted materials to be clear of third-party IP, which conflicts with the unlicensed brand marks and the stand-in screenshot textures.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: PRE-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: prepare contest accounts and authentic development evidence, not build video.
SOURCE OF TRUTH: docs/video/ROADMAP.md sections 0.2, 0.4 and 0.5; docs/video/hackathon-video-script.md H-048–H-056; contest official rules. INPUTS: account access and user's authorization.
BUILD: Identify the exact required IBM SkillsBuild course and certificate from the current official rules. Guide the user to complete it personally and save the actual certificate privately. Verify IBM Bob access and that the current worktree is selected. Set up recording of Bob sessions and preserve prompts, actual results and commit hashes. Set up a dedicated private evidence folder outside the repo; never record secrets, private tokens, notifications or internal hostnames. Do not claim course completion, a certificate or a Bob finding until verified. Do not log in as the user or bypass an account check. Note the official-rules deadline 2026-12-02 5:00 PM ET; flag the conflicting event-page date rather than substituting it.
MOUNT: none; administrative step, no composition edits. TRAPS: this is not a film scene; SO-O5 still governs any future composition. QA: report whether course access, certificate, Bob access and capture setup are verified, pending or blocked. REPORT: files changed, evidence locations without secrets, real findings, deviations and open questions; stop.
```

### PRE-02 · Worktree, tools, fonts and assets (all sections, 00:00–03:00, 180 s)
**Why / depends on:** PRE-01. Prepare reproducible local assets and verify the actual environment.
**Checklist**
- [x] Pre-flight: `docs/video/ROADMAP.md`, inventory, scripts, and worktree `/Users/hari/Developer/Oryn-demo` exist.
- [x] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: branch `demo/video`; ffmpeg/ffprobe, Node, bun, Chrome and doctor available; adequate storage reported.
- [x] Verify: all ten font weights and OFL notices, rights-reviewed brand SVGs, and audio tools are locally available; two screenshot slots have no unredacted data.
- [x] Accept: assets and provenance are documented; missing rights or tools are explicit blockers.
- Accepted with owner-approved deviations on 2026-11-19 (details in `demo/video/stage-kit/work/PRE-02-notes.md` and `assets/marks/RIGHTS-LEDGER.md`): brand marks staged without owner permission and NetSuite is a 48 px favicon only; screenshot slots filled with blurred online stand-ins, not user-supplied; music is G#/C# major, not A minor, stretched 117 to 120 BPM; bundled sound-effect licence confirmed by the owner, not independently verified.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: PRE-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: prepare local dependencies and source material. SOURCE OF TRUTH: docs/video/mock-build-inventory.md sections 2 and 4, STG-13, APP-01–APP-13; docs/video/oryn-demo-design-and-build.md; H-014–H-026, H-106–H-110 and L-010–L-022, L-124–L-134.
INPUTS: checked-out worktree, internet access for authorized downloads and user-provided screenshots. BUILD: 1. Confirm repository root and branch demo/video; never modify ~/Developer/Oryn. Record outputs of ffmpeg -version, ffprobe -version, node --version, bun --version, Chrome version, available disk space, and npx hyperframes doctor --json. Report failures instead of treating earlier environment versions as current. 2. Obtain official self-hostable WOFF2 files for IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700 and Crimson Text 400/600/700, with their OFL notices and provenance; stage them in demo/video/stage-kit/assets/fonts/ and provide Bob with the same files. No remote runtime fonts or synthesized weights. 3. Obtain small official nominative SVG marks for Gmail, NetSuite, Google Sheets, Slack, Zoom, HubSpot, Chrome and macOS, plus grey tiles for Salesforce, Outlook, Excel, Teams, Meet and Edge, only where use rights permit. Record each origin and license; never invent a logo or copy application UI. 4. Prepare [USER SCREENSHOT 1] and [USER SCREENSHOT 2] as separately authorized assets: user supplies them, removes secrets and identifiers irreversibly before export, then inspects at full resolution and metadata level. Never store originals or render a missing screenshot. Third is optional. 5. Check tools for 120 BPM, 4/4, A-minor music, SFX, normalization and ffmpeg audio inspection; record actual availability, licensing and disk capacity. Do not fabricate media or user facts.
MOUNT: none. TRAPS: no HyperFrames project exists yet; do not run scene history or stage QA against an absent project. QA: list exact paths, licenses, missing tools and screenshots; verify no secrets or remote font references. REPORT: actual command results, changed files, unresolved permissions and blockers; stop.
```

### PRE-03 · Source authorized brand marks (H-014–H-026; L-010–L-022)
**Why / depends on:** PRE-02. Obtain authentic marks before original mock app work.
**Checklist**
- [x] Pre-flight: network access and inventory APP-01–APP-13.
- [x] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: eight requested marks have traceable source and usage terms.
- [x] Accept: approved SVGs and provenance exist under the named asset path.
- Accepted with owner-approved deviations on 2026-11-19 (see `demo/oryn-prototype/src/assets/marks/PROVENANCE.md`): no owner has authorized these marks, so they are "approved" only by the project owner's decision; HubSpot is the official 2025 file, the other SVGs come from the thesvg library and were not compared with official files (those sit behind logins or agreements); NetSuite is a 48 px favicon, no SVG exists; macOS is a plain-text wordmark.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: PRE-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. SOURCE OF TRUTH: inventory APP-01–APP-13; H-014–H-026, L-010–L-022. INPUTS: PRE-02.
BUILD:
1. Source official SVG marks for Gmail, NetSuite, Google Sheets, Slack, Zoom, HubSpot, Chrome and macOS where rights permit. Place approved assets in `demo/oryn-prototype/src/assets/marks/`.
2. Record official source URL, license or brand-use terms and date for each; limit use to small nominative marks. Source Salesforce, Outlook, Excel, Teams, Meet and Edge only for grey capability tiles where authorized.
3. Never trace a logo from memory, copy third-party DOM or assume trademark permission. Stop on unverified rights and report the exact missing mark.
MOUNT: none. QA: inspect SVG contents for external resources and active code, compare to official sources and verify each provenance entry. REPORT: sources, permissions, files, blockers and open questions; stop.
```

### PRE-04 · Authorize and redact screenshots (H-106–H-110; L-124–L-134)
**Why / depends on:** PRE-02. Provide two safe memory textures.
**Checklist**
- [x] Pre-flight: two user-owned screenshots and explicit separate authorizations.
- [x] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: secrets, names and metadata are absent after irreversible redaction.
- [x] Accept: two separately labeled safe textures and provenance are available.
- Accepted with owner-approved deviations on 2026-11-19: the textures in `demo/video/stage-kit/assets/textures/` (`texture-1-work-app.png`, `texture-2-grid.png`, optional `texture-3-comms.png`) are blurred online stand-ins, not the owner's own screenshots, so there is no per-image authorization or consent ledger; the owner will replace them with their own if needed. Checked: each derivative is 2400x1155, blurred until no text is legible, and has no EXIF or text chunks (only IHDR, IDAT, IEND, pHYs and colour chunks); originals are outside the repository.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: PRE-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. SOURCE OF TRUTH: inventory STG-13, GAP-STG-H-memory, section 4 decision 16; H-106–H-110, L-124–L-134. INPUTS: two separately authorized user screenshots.
BUILD:
1. Request the user's two images and explicit permission individually; identify them as [USER SCREENSHOT 1] and [USER SCREENSHOT 2]. A third is optional.
2. Redact private names, secrets, tokens, identifiers, hostnames and personal content irreversibly before export; strip metadata. Inspect the exported pixels at full resolution and inspect metadata independently.
3. Store only approved redacted derivatives in `demo/video/stage-kit/assets/`; keep originals outside the repository. Never fake missing screenshots or use reversible overlays.
MOUNT: none. QA: check each authorization and exported derivative separately; document missing permissions. REPORT: safe paths, redaction checks, blockers and questions without exposing private data; stop.
```

### PRE-05 · Complete SkillsBuild certificate (contest prerequisite)
**Why / depends on:** PRE-01. Verify the certificate as a separate human gate.
**Checklist**
- [x] Pre-flight: actual official rules and the user's SkillsBuild account.
- [x] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: user completed the required course and the certificate is genuine.
- [x] Accept: certificate stored privately and its exact name recorded.
- Verified 2026-11-19: certificate for "How IBM Bob and AI Tools Are Changing the Way Solutions Are Built" (ALM-COURSE_4076311), completion date 19 Nov 2026 GMT, matches the event page. The file is a browser printout of IBM's certificate page that could not be authenticated with IBM, so re-download it from the SkillsBuild account if the submission asks for IBM's own file. Stored outside the repo at `~/Oryn-contest-evidence/`; details in its `EVIDENCE.md`.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: PRE-05. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. SOURCE OF TRUTH: current official IBM AI Builders Challenge rules and SkillsBuild course requirements. INPUTS: user's own account access.
BUILD:
1. Verify the exact course and certificate requirement against the official rules and identify its official course page.
2. Guide the user to complete the course personally; do not authenticate on the user's behalf or claim completion before it happens.
3. Save the actual certificate outside the repository with the precise course name and completion date for the project submission.
MOUNT: none. QA: verify the certificate itself and report pending access or conflicting rule text; never invent a certificate. REPORT: verified course name, private evidence location, status and questions; stop.
```

## 1.2 Build the prototype with IBM Bob

All Bob steps use `demo/oryn-prototype/`, preserve session evidence and obey SO-B. Build timelines as clip-local scripts; actions and UI occur inside the prototype. Film time is 30 fps despite older source text. Product screenshot captures contain no stage captions, cinematic camera or external overlay. Keep original source files untouched outside the assigned worktree.

### BOB-00 · Scaffold and tokens (H-055–H-132; L-035–L-160, 00:32–02:38, shared)
**Why / depends on:** PRE-01, PRE-02. Establish the reusable product foundation.
**Checklist**
- [x] Pre-flight: inventory CMP-01–CMP-02 and the licensed font files from PRE-02 exist.
- [x] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`. (Owner pasted the prompt into Bob Shell 2.1.0 on branch `demo/video`; screenshots in `demo/video/stage-kit/work/`: `SCR-20261119-nnuv.png` shows the pasted prompt (account email redacted), `SCR-20261119-ntvu.png` shows Bob's final report.)
- [x] Verify: `demo/oryn-prototype/` starts; all ten actual font faces load; flat light and dark tokens match inventory. (Checked in headless Chromium at 1280x720, DPR 2.)
- [x] Accept: typecheck, lint and Bob review pass; retain transcript and commit hash. (Scaffold commit `84e1aac307`; `bun run typecheck`, `bun run lint`, `bun run build` pass. The scaffold files were written by an Opus session, not Bob. Bob ran for 12m48s, made no commits and left no uncommitted changes. Its final report (`SCR-20261119-ntvu.png`, tail of the report only) lists the CMP-02 Done-when checks as passing, citing code symbols rather than browser measurements, plus the ten font paths, three deviations (no `stage.css`, 30 fps vs the inventory's 60, `⌘` glyph absent from all faces), no missing assets and no open questions. No full Bob transcript is retained in the repo.)
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-00. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: scaffold demo/oryn-prototype and complete CMP-01–CMP-02 only. SOURCE OF TRUTH: docs/video/mock-build-inventory.md CMP-01–CMP-02 and section 4; docs/video/oryn-demo-design-and-build.md; H-055–H-132 and L-035–L-160. INPUTS: PRE-02 licensed font files and OFL notices.
BUILD:
1. CMP-01: scaffold Vite, React 18, TypeScript, Tailwind 3.4, Radix/shadcn, Lucide, CVA and @xyflow/react with bun. Implement light #F6F6F3 / #0A0A0A / #FFFFFF / #DFDFD8 and inventory dark tokens, 1px borders and 8/6/4 radii. Build light, dark and neutral hatch variants; anchor `product-root` for later timelines. Done when both themes are legible, arc disappears on stop, hatch is identifiable, focus is visible and scrolling works.
2. CMP-02: self-host real IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700 and Crimson Text 400/600/700 with OFL notices. Build loading, loaded and explicit unavailable states; capture waits for fonts. Done when all ten faces load, no UI font is below 11px, decimals align and frame seeking causes no text shift.
3. Add working `bun run typecheck` and `bun run lint`, and document exact font asset paths. No remote runtime fonts or competitor code.
TRAPS: #2FD8FF is execution-only; product interiors never get stage hard shadows. Frame state is deterministic at 30 fps.
MOUNT: none; prototype only. TRAPS: inventory's old 60 fps is superseded by 30 fps; do not add stage card shadows to product UI. QA: SO-B5–SO-B6; inspect 1280x720 at DPR 2, verify font weights and compare both themes to the source. REPORT: SO-B8 with commit hash, actual commands, missing assets and disagreements; stop.
```

### BOB-01 · Primitives gate
- [ ] Complete BOB-01a and BOB-01b.

### BOB-01a · Basic controls (H-055–H-132; L-035–L-160)
**Why / depends on:** BOB-00.
**Checklist**
- [x] Pre-flight: inventory CMP-03–CMP-08 and `demo/oryn-prototype/`.
- [x] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`. (Owner pasted the prompt into Bob Shell 2.1.0 on `demo/video` after the code already existed. Screenshots in `demo/video/stage-kit/work/`: `SCR-20261119-ogjy.png` shows the pasted prompt (account email redacted), `SCR-20261119-ohhx.png` shows the tail of Bob's report. Bob ran 3m 27s and left no edits and no commits.)
- [x] Verify: keyboard, status glyphs, neutral stopped states. (Headless Chromium, 1280x720 DPR 2, light and dark, `/?view=controls` and `/?view=controls&mode=film`: root 1280x720, no text under 11px, no table cell overflow.)
- [x] Accept: all six Done when lists pass. (Code commits `013ab8e8fc` and `e9ce64a1d0` were written by an Opus session, not Bob. Bob's report tail marks every visible Done-when row passing, citing code symbols rather than browser measurements, and says its light/dark check was an HTTP 200. The browser measurements are the Opus-side checks above. Bob's two open questions: `?view=controls` is a development viewer, not a film screen (BOB-03c builds that); the DPR 2 inspection it asked a human to do was done here. `bun run typecheck` and `bun run lint` pass. No full Bob transcript is retained.)
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-01a. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-03–CMP-08 and section 4; H-055–H-132, L-035–L-160. INPUTS: BOB-00.
BUILD:
1. CMP-03: buttons `Accept and continue`, `Pause`, `Confirm`, `Publish`, `Run scenarios`, `Approve`, `Reject`, `Request Changes`, `Guide Me`, `Request approval`, `Export audit pack`. Build primary, secondary, outline, ghost, danger, link and disabled/loading states. Film events press 90ms at scale .97; expose `action-button`. Acceptance: all sizes align; keyboard works; disabled reason is reachable; loading never implies success.
2. CMP-04: input and textarea with exact intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`, deadline `Fri 17:00` → `Fri 12:00`, placeholder `Type a command…`. Build empty, focused, filled, readonly, invalid and disabled; anchor `intent-field`, `deadline-field`. Acceptance: text fits, labels associate, invalid state has text and seek yields identical characters.
3. CMP-05: select/tabs with Employee, Workflow Owner, Approver, Admin; Observe, Guide, Assist, Run Supervised, Run Autonomously. Include open, selected, disabled and invalid, with film anchor `role-select`. Acceptance: keyboard selection works, dark labels survive, invalid/disabled explanations show and tabs do not trigger execution.
4. CMP-06: twelve status labels and glyphs per inventory, including `Approved for Guidance`, `Verified Complete`, `Outcome Unknown`, `Passed — Expected Safe Escalation`, `Failed`, `Needs Revalidation`, `Contained`, `Approval Required`, `Escalated`, `Held`, `Running`. Anchor `status-badge`; frame event running→stopped removes cyan. Acceptance: distinct glyph/text, both themes, hatch for unknown and no cyan after stop.
5. CMP-07: table headers `Invoice`, `Supplier`, `Amount`, `PO`, `Status`, `Action` and audit headers `Actor`, `Event`, `Object`, `Scope`, `Outcome`. Anchor `case-table`; film selects a row without mutating state. Acceptance: eleven correct records, associated headers, aligned amounts and selection changes no outcome.
6. CMP-08: fourteen labels Observe, Understand, Review, Publish, Compile, Simulate, Authorize, Execute, Verify, Diagnose, Correct, Repair, Re-evaluate, Release. Anchor `lifecycle-stepper`; film running state derives 1.8s orbit from frame. Acceptance: fourteen labels exist, running is marked, stopped is neutral and static mode is comprehensible.
TRAPS: no hatch behind text, no cyan except actual execution, no implicit authorization, no fake timers; respect reduced motion and 150ms product transitions.
ACCEPTANCE: Open each Done when, verify each item at 1280x720 DPR 2, review diff and run SO-B6. REPORT: IDs, files, actual results, commit and questions; stop.
```

### BOB-01b · Overlay controls (H-055–H-132; L-035–L-160)
**Why / depends on:** BOB-01a.
**Checklist**
- [x] Pre-flight: inventory CMP-09–CMP-14 and BOB-01a.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`. (Skipped by owner decision for this step. The code was written by an Opus session, not Bob; never claim Bob built it. Left unticked so the Bob run can still be done later.)
- [x] Verify: Escape, focus return, checkbox and progress. (Headless Chromium, 1280x720 DPR 2, light and dark, `/?view=overlays` and `&mode=film`: focus trapped in both drawers and returned to the opener on Escape, Enter-run and the ⌘K path; blocked approval cannot decide; approval leaves 7/2/1/1 and only the separate readback gives 8/2/0/1; unknown drawer has no retry; consent logic and capture guard; run seek repeatable with cyan only while running; no text under 11px. `bun run typecheck`, `bun run lint` and `bun run build` pass.)
- [x] Accept: each inventory Done when passes. (Accepted on the Opus-side checks above, with no Bob review pass: SO-B5 not run, by owner decision. Owner answers: executed scenarios stay neutral "Executed" until a complete event; the `INC-0042 Contained` toast is a warning, not danger.)
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-01b. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-09–CMP-14 and Part D; H-055–H-132, L-035–L-160. INPUTS: BOB-01a.
BUILD:
1. CMP-09: approval/evidence drawer with `INV-48219`, `Approve`, `Reject`, `Request Changes`; unknown drawer `INV-48220`, `Outcome Unknown`, `ERP submit timed out`, `Held`, `Do not resubmit until reconciled`. Anchor `approval-drawer`, `unknown-drawer`; build closed/open/blocked variants. Acceptance: focus traps and returns, diff/authority fit, unknown lacks retry and approval alone changes no verified count.
2. CMP-10: popover/tooltip with `3 observed this week + 2 SME-verified archived cases`, `Pause observation`, `My Privacy`. Anchor `gate-provenance`, `privacy-popover`; build open, focused and disabled states. Acceptance: anchors remain visible, Escape restores focus, tooltip has equivalent text and provenance totals five.
3. CMP-11: toast `Submission timed out`, command placeholder `Type a command…`, empty `No matching commands`. Anchor `timeout-toast`, `command-palette`; build one-toast, results, empty and denied states. Acceptance: no toast stack, timeout is not success, permission filtering works and keyboard closes with focus return.
4. CMP-12: breadcrumbs, keycaps, separators, avatars with `Calder & Vance`, four roles, `⌘K`, `Esc`. Anchor `breadcrumbs`; build current route and missing-avatar states. Acceptance: current page announced, initials fallback works, separator is 1px and key hints readable.
5. CMP-13: switch/checkbox for `Work applications`, `Excluded windows`, `Visual observation`, `Organizational contribution`, `Pause observation`. Anchor `capture-choice`, `sharing-choice`; build independent checked, unchecked and mandatory-disabled variants. Acceptance: unchecked consent blocks capture, mandatory exclusions remain, every toggle has label and pause takes one action.
6. CMP-14: `SIM-AP-RECON · 28 scenarios`, `Running`, `Not Run`, progress, static skeleton and scroll area. Anchor `simulation-progress`; frame events start, cancel or complete. Acceptance: seek repeatable, cancel never passes, hidden bars still scroll and cyan disappears on completion.
TRAPS: keep focus and disabled explanations accessible; no retry, timer, private evidence or idle cyan.
ACCEPTANCE: Inspect each item's full Done when, both themes and keyboard at 1280x720 DPR 2; run SO-B5–SO-B6. REPORT: files, checks, commit and questions; stop.
```

### BOB-02 · Composite gate
- [x] Complete BOB-02a–BOB-02d as owner-accepted specimens. This gate excludes the unchecked IBM Bob execution and evidence requirements; it does not assert that all original acceptance conditions passed.

### BOB-02a · Evidence and simulation (H-070–H-100; L-058–L-122)
**Why / depends on:** BOB-01.
**Checklist**
- [x] Pre-flight: inventory CMP-15–CMP-22. The owner authorized bypassing the unchecked BOB-01 gate.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`. Skipped at the owner's direction; this implementation was not built or reviewed by Bob.
- [x] Verify: 28-tile geometry and status text. Chromium at 1280×720 CSS pixels, DPR 2: host 472×416, grid 408×412, tiles 96×52, gaps 8px; 28 distinct accessible scenario names.
- [x] Accept: owner accepted BOB-02a. Independent assistant review and browser checks were performed; exhaustive Done-when and accessibility checks were not established. No Bob review or contest evidence was produced.
- Follow-up source inspection found that exhaustive CMP-15–CMP-22 accessibility, rendered interactions and independent readback verification remain unproven. The previously accepted specimen and recorded geometry check are unchanged.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-02a. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-15–CMP-22; H-070–H-100, L-058–L-122. INPUTS: BOB-01.
BUILD:
1. CMP-15: ordered audit A01–A15 and demonstration times `Mon 09:14`, `Mon 10:02`, `Tue 13:40`; anchor `evidence-timeline`. Build selected, missing-evidence states. Acceptance: order and actor/object readability hold, missing timestamps are not invented, links honor access.
2. CMP-16: `Variance Hold` → `Matched - Variance Approved`, `$18,420.00`, `$17,980.00`, `$440.00 / 2.45%`; repair before/after text per inventory. Anchor `diff`; frame opens comparison. Acceptance: columns align, values/authority show, +/- have labels and repair touches one step.
3. CMP-17: SCN-001–SCN-028, failed `SCN-022 variance_exactly_2.00pct`, `Expected: accept`, `Actual: escalate`. Anchor `scenario-grid`; 28 tiles 96x52, 8px gaps, 408x412 centered in 472x416. Acceptance: unique accessible names, failure opens replay, v0.2 removes failure, no stopped cyan.
4. CMP-18: source labels `AP-RULE-009 Variance threshold`, `AP-RULE-017 Supplier handling fees`, `INV-48231`, `PO-1051`, `$4,213.50`, `$4,175.00`, `$38.50 handling line after subtotal`. Anchor `evidence-card`. Acceptance: each source identifies object, uncertainty labeled, excluded content absent, permission failures explicit.
5. CMP-19: all eleven DAT-02 rows, approval INV-48219 and unknown INV-48220; anchor `case-table`. Frame transitions 7/2/1/1 to 8/2/0/1 only after readback. Acceptance: eleven rows, distinct missing POs, held unknown and approval verifies only after readback.
6. CMP-20: segmented progress with `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`, then 8/2/0/1; anchor `job-progress`. Acceptance: totals 11, unknown hatch persists, approval updates only after readback and idle is neutral.
7. CMP-21: five inventory risk tiers including `Tier 3 - Consequential`, Tier 4 Restricted; anchor `risk-tier`. Acceptance: all labels readable, action tiers differ, Tier 4 blocked and chip grants no permission.
8. CMP-22: `0 Observe`, `1 Suggest`, `2 Guide`, `3 Supervised Assist`, `4 Scoped Autopilot`, `5 Self-Maintaining Autopilot`; anchor `autonomy-ladder`. Acceptance: order exact, Stage 3 selected, locked stages explain and selection is not cyan.
TRAPS: no 33/27 repair counts, no false approval-to-verification shortcut and no hatch over text.
ACCEPTANCE: Inspect all inventory Done when, both themes and accessibility at 1280x720 DPR 2. Run SO-B5–SO-B6. REPORT: results, files, commit and questions; stop.
```

### BOB-02b · Gates and agent blocks (H-070–H-110; L-058–L-135)
**Why / depends on:** BOB-02a.
**Checklist**
- The owner authorized proceeding without the IBM Bob prerequisite gate. This assistant session is not IBM Bob; no Bob build or review evidence is implied.
- Assistant-built CMP-23–CMP-30 specimens; independent assistant review replaced Bob review. No Bob transcript or contest evidence was produced. Typecheck and lint passed; Chromium was inspected at 1280×720 CSS pixels, DPR 2. Measured candidate 992×110, agent definition 880×492, scope 480×508 and incident 644×486 differ from inventory heights.
- The owner accepted BOB-02b as-is to proceed to BOB-02c, including the documented geometry differences and without claiming exhaustive checks or IBM Bob evidence.
- Follow-up verification found open gaps: scenario gate counts are hard-coded and no combined release guard is demonstrated; unsupported action states are not modeled in the scope specimen; containment-before-repair is not enforced or demonstrated. The specimen also lacks capability-detail and manual-resolution interactions. The owner accepted BOB-02b with these gaps.
- [x] Pre-flight: inventory CMP-23–CMP-30.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: unverified evidence and pending gate checks inspected; gaps are documented above.
- [x] Accept: owner accepted the specimen as-is, including documented behavioral and geometry gaps; not every named Done-when condition passed.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-02b. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-23–CMP-30 and section 4; H-070–H-110, L-058–L-135. INPUTS: BOB-02a.
BUILD:
1. CMP-23: `5/5 verified human examples`, `3 observed this week + 2 SME-verified archived cases`, `28/25 representative scenarios`, `6/5 edge/negative`, `Owner approval`; anchor `gate-checklist`. Build pending and satisfied states. Acceptance: sourced counts, no premature checks, separate owner and no release bypass.
2. CMP-24: D1 Priya `Mon 09:14` INV-48203 Brightwater, D2 Priya `Mon 10:02` INV-48204 Copperline, D3 Jamal `Tue 13:40` INV-48207 Harlow; anchor `demonstration-cards`. Acceptance: all identify contributor/time/invoice, no raw capture leaks and verification remains distinct.
3. CMP-25: `Match supplier invoice to purchase order and stage result in ERP`, `3 demonstrations`, `Needs Review`, `variance exception rule: unverified until SME review`; anchor `candidate-card`. Acceptance: three evidence cards reachable, confidence labeled, exception visible and publish requires owner review.
4. CMP-26: six `AP-STEP-01`–`06`, rules AP-RULE-009 and AP-RULE-017 and DAT-04 exceptions; anchor `playbook-steps`. Acceptance: six stable IDs, rule owners/sources present, exceptions distinct and guidance never deploys agent.
5. CMP-27: exact intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` plus Purpose, Inputs, Actions, Rules, Outputs, Stopping points, `Unverified branch`; anchor `agent-definition`. Acceptance: six sections visible, intent fits, uncertainty visible and no deployed claim.
6. CMP-28: `AP East`, Gmail, NetSuite, Google Sheets, `Supplier Invoice Reconciler`, `Run Supervised`, `Tier 3 - Consequential`; anchor `scope-list`. Acceptance: team/apps listed, unsupported says unavailable, Tier 3 visible and role switching does not broaden access.
7. CMP-29: `INC-0042`, `Contained`, `3 affected cases paused`, INV-48231/48233/48236, `supplier document format change — unconfirmed`; anchor `incident-card`. Acceptance: all cases identifiable, containment precedes repair, hypothesis unconfirmed and no active cyan.
8. CMP-30: `Expected: accept`, `Actual: escalate`, `Expected: verifiable invoice total`, `Actual: cannot verify`, `$4,213.50`, `$4,175.00`, `$38.50`; anchor `expected-actual`. Acceptance: columns align, facts separate from hypothesis and dark contrast holds.
TRAPS: 5/5 evidence contains only three observed demonstrations; owner approval and evaluation stay pending until their timeline events.
ACCEPTANCE: Check all inventory Done when, interactions, geometry and copy at 1280x720 DPR 2. Run SO-B5–SO-B6. REPORT: results, files, commit and questions; stop.
```

### BOB-02c · Approval, release and HUD (H-092–H-127; L-108–L-158)
**Why / depends on:** BOB-02b.
**Checklist**
- CMP-31–CMP-37 specimens were built by an assistant, not IBM Bob. An independent assistant review replaced the requested Bob review; no Bob transcript or contest evidence was produced.
- Typecheck and lint passed. Chromium inspection used 1280×720 CSS pixels at DPR 2; approval/readback, regression, cohort, role restrictions, notification and HUD interactions were exercised. Geometry differs from the inventory: authority 480×287 versus 432×128, regression 464×356 versus 464×330, and cohort 480×371 versus 480×360.
- The owner accepted BOB-02c as-is, including the documented geometry differences. IBM Bob evidence remains absent.
- [x] Pre-flight: inventory CMP-31–CMP-37.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: approval, readback and release remain separate.
- [x] Accept: named Done-when conditions checked for the specimen; the owner accepted the geometry deviations. Unknown and duplicate regression results are blocked, notification destinations and eligibility are checked, and each watched readback is distinct.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-02c. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-31–CMP-37; H-092–H-127, L-108–L-158. INPUTS: BOB-02b.
BUILD:
1. CMP-31: `Daniel Okafor · Tier 3`, `AP-RULE-009`, `Approve`, `Reject`, `Request Changes`, `Variance Hold` → `Matched - Variance Approved`. Anchor `approval-authority`; frame events separate decision and readback. Acceptance: Daniel/scope visible, unauthorized reason shown, readback distinct and counts update only on verification.
2. CMP-32: SCN-029–SCN-034, `6 new regression cases`, `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`; anchor `regression-list`. Build not-run, running, partial and complete. Acceptance: six distinct new rows, 34 total, 28/6/0 visible, incomplete blocks release.
3. CMP-33: `Kestrel Components invoices only`, `AP East only`, `First 3/3 Verified Complete`, `Repaired - Validated`; anchor `rollout-cohort`. Build limited, 0/3–3/3, expansion and closed states. Acceptance: scope visible, 3/3 individually evidenced, owner required to expand and incident history retained.
4. CMP-34: `Playbook v1.0`, agent `v0.1`, `v0.2`, `v1.0`, `v1.1`, `Compare`, `Restore previous approved version`; anchor `version-compare`. Build failed, passed, released and restore-blocked variants. Acceptance: v1.0 object kinds remain distinct, failed v0.1 remains history and restore scope is explicit.
5. CMP-35: `Approval Required`, `INC-0042 Contained`, `Confirm Kestrel handling-fee terms in writing`, `Repair Ready`, `Release Status`; anchor `notification-card`. Build unread/read/dismissed. Acceptance: three primary rows point to correct objects, dismissal resolves nothing, no stack and permissions hold.
6. CMP-36: `Known fix from AP East: Vendor tax ID format`, `Guide Me`, `Confirm Kestrel handling-fee terms in writing · Fri 12:00`, `Dismiss`; anchor `hud-card`. Acceptance: critical fields remain visible, one card only, reminder matches vendor and dismissal is not completion.
7. CMP-37: `Calder & Vance`, `Employee`, `Workflow Owner`, `Approver`, `Admin`; anchor `role-selector`. Build open, closed and unavailable role. Acceptance: current org/role visible, identities have real grants and Daniel's authority does not arise from a display label.
TRAPS: 34 scenarios not 33, 3/3 is a separate cohort, no cyan after execution and role switching grants no permission.
ACCEPTANCE: Inspect all inventory Done when, disabled states and focus at 1280x720 DPR 2. Run SO-B5–SO-B6. REPORT: results, files, commit and questions; stop.
```

### BOB-02d · Graph, masking and shell (H-055–H-132; L-035–L-160)
**Why / depends on:** BOB-02c.
**Checklist**
- CMP-38–CMP-44 specimens were built by an assistant, not IBM Bob. An independent assistant reviewed the components; no Bob transcript or contest evidence was produced.
- Typecheck and lint passed. Chromium at 1280×720 CSS pixels, DPR 2 showed 35 capability cells, fixed shell dimensions, keyboard graph selection, consent and deadline confirmation, and light/dark masking. The source supplies a meeting timestamp but does not associate timestamps with individual quotes; the transcript reports those times as unknown.
- The owner accepted unknown individual quotation timestamps as-is; the separate meeting source timestamp remains visible. IBM Bob evidence remains absent.
- [x] Pre-flight: inventory CMP-38–CMP-44.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: unavailable capabilities, graph edges and protected fields.
- [x] Accept: named Done-when conditions checked for the specimen; the owner accepted unknown individual quotation timestamps.
- Follow-up source inspection found that a HUD reminder uses the fixed `Fri 12:00` fixture rather than an arbitrary edited commitment deadline. The filmed fixture uses the specified deadline; propagation of other deadlines is not verified.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-02d. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory CMP-38–CMP-44; H-055–H-132, L-035–L-160. INPUTS: BOB-02c.
BUILD:
1. CMP-38: fixed 240px sidebar and 56px top bar with `Home`, `Workflow Discovery`, `Playbooks`, `Operations Map`, `Agent Factory`, `Flight Simulator`, `Jobs`, `Incident Center`, `Versions`, `Command Center`, `Audit & export`, `Notifications`, `My Privacy`, `⌘K`. Anchor `sidebar`, `search`, `bell`. Acceptance: fixed shell, selected text/rail, keyboard search/bell and no unauthorized destination.
2. CMP-39: `Available`, `— Unavailable`, `Observe by per-meeting opt-in`; anchor `capability-cell`. Build available, unavailable, conditional and selected detail. Acceptance: 35 intersections explicit, Zoom condition visible and capability grants no authority.
3. CMP-40: 7/2/1/1 before approval and 8/2/0/1 after readback, `1 contained incident` separate; anchor `metric-card`. Acceptance: total 11, unknown separate, 3/3 cohort does not change job totals and no statistic is invented.
4. CMP-41: `Supplier invoice vs purchase order reconciliation`, `AP-RULE-009`, `AP-RULE-017`, `Supplier Invoice Reconciler`, `INC-0042`; anchor `graph-agent`. Build candidate dashed and approved solid links. Acceptance: four object types distinct, candidate dashed, selected links correct and equivalent list names.
5. CMP-42: Dana `From the next cycle we're adding a handling line to every invoice.`; Priya `Send me the new layout; I'll confirm the terms in writing by Friday.` Card `Confirm Kestrel handling-fee terms in writing`, `Fri 17:00` → `Fri 12:00`, `00:14:32`, `subject to company approval`. Anchor `commitment`, `transcript`. Acceptance: both quotes exact, edit persists, qualifier survives and source timestamp visible.
6. CMP-43: `BANK ACCT`, `TAX ID`, `CARD`; anchor `masked-fields`. Build light/dark already-masked and mandatory states. Acceptance: three labels readable, no raw value in DOM, mandatory protection cannot be disabled and reduced-motion remains masked.
7. CMP-44: `Ardent Partners · Payables Place · 2026`; anchor `source-line`. Build compact, full accessible source and focus variants. Acceptance: citation legible, claim/source distinct, exact year visible and no unsupported claim attached.
TRAPS: never hatch text or show sensitive values, never equate capability with permission, never count before independent readback.
ACCEPTANCE: Inspect all inventory Done when, source attribution, focus and both themes at 1280x720 DPR 2. Run SO-B5–SO-B6. REPORT: results, files, commit and questions; stop.
```

### BOB-03 · Runtime gate
- [ ] Complete BOB-03a–BOB-03d.

### BOB-03a · Fixtures (H-014–H-132; L-010–L-160)
**Why / depends on:** BOB-02.
**Checklist**
- [x] Pre-flight: inventory DAT-01–DAT-13, section 4.
- [x] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo` — skipped at the owner's request; built and reviewed without Bob.
- [x] Verify: batch and simulator arithmetic.
- [x] Accept: each fixture Done when passes, with the runtime gaps below.

Runtime verification (browser, 1280x720 DPR 2): DAT-08 opt-in gates transcript, commitment and reminder; DAT-11 timeline shows no events at frame 0, A01–A06 at approval and A01–A07 after readback. Not verifiable until BOB-03b/03c: no job-start action exists to prove only released v1.0 starts JOB-0117 (DAT-06); no recording flow exists to prove no capture before consent (DAT-08); A08–A15 have no frame timing (DAT-11). The Bob review and evidence requirements (SO-B5, SO-B7) remain unmet.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-03a. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: inventory DAT-01–DAT-13, Part D, section 4; H-014–H-132 and L-010–L-160. INPUTS: BOB-02.
BUILD:
1. DAT-01: seven named people Priya Nair, Jamal Carter, Marcus Webb, Elena Ruiz, Daniel Okafor, Tomas Reyes, Dana Whitfield; `Calder & Vance Supply Co.`, `AP East` and ten inventory suppliers. Role selector events reference stable IDs. Acceptance: all people/suppliers and roles match; external Dana cannot approve.
2. DAT-02: JOB-0117's eleven exact invoice rows, integer cents and null POs, INV-48219 `$440.00 / 2.45%`, INV-48220 `Held`; frame snapshots 7/2/1/1 then 8/2/0/1 after readback. Acceptance: eleven unique rows, both sum 11, approval is not readback, no retry.
3. DAT-03: D1 Priya Mon 09:14 INV-48203, D2 Priya Mon 10:02 INV-48204, D3 Jamal Tue 13:40 INV-48207; `3 observed this week + 2 SME-verified archived cases`, `5/5 verified human examples`. Acceptance: names/times match, five without invented archive IDs, no private evidence leaks.
4. DAT-04: candidate `Match supplier invoice to purchase order and stage result in ERP`; PB-AP-RECON v1.0 `Approved for Guidance`, six AP-STEP rows, AP-RULE-009/017 and five exceptions. Acceptance: six steps/two rules render, equality auto-accepts, candidate differs from published, scope does not grant permission.
5. DAT-05: SCN-001–028 and SCN-029–034 exactly from inventory, SCN-022 `variance_exactly_2.00pct`; versions 21/6/1 → 22/6/0 → 28/6/0. Acceptance: unique IDs, 28 base and six additions, old v0.1 remains failed.
6. DAT-06: `Supplier Invoice Reconciler`, agent v0.1/v0.2/v1.0/v1.1 and separate playbook v1.0. Acceptance: five rows and kinds distinct, suite matches each, only released v1.0 starts JOB-0117.
7. DAT-07: INC-0042, three Kestrel cases, `$38.50`, correction AP-RULE-017, bounded REP-0042-1 and verified 3/3. Acceptance: three held first, fee reconciles, only interpretation changes, release requires 34 correct outcomes and owner.
8. DAT-08: `Confirm Kestrel handling-fee terms in writing`, Priya, `Zoom 00:14:32`, Fri 17:00 → Fri 12:00, `subject to company approval`, per-meeting opt-in. Acceptance: timestamp/deadlines/qualifier match, no recording before consent, reminder has confirmed deadline.
9. DAT-09: `Invoice approval threshold 2.00% → 1.50%, effective Dec 1`, `1 playbook`, `1 agent`, `34 tests`, `Needs Revalidation`. Acceptance: count matches suite, date visible, job and incident populations distinct.
10. DAT-10: N-01–N-05 actual recipients, approval, incident, reminder, repair and release. Acceptance: five rows correct, visibility follows lifecycle, recipients see only authorized data.
11. DAT-11: immutable audit A01–A15 from inventory; events reveal only after their frame. Acceptance: fifteen ordered definitions, export excludes raw media, earlier state cannot show future events.
12. DAT-12: seven apps by five capabilities with explicit `— Unavailable`, Zoom `Observe by per-meeting opt-in`; six additional grey-only marks. Acceptance: 35 cells explicit, Zoom qualified, grey-only marks imply no capability.
13. DAT-13: consent/masking labels, `Requires Tier 3 approval - Daniel Okafor`, `Ardent Partners · Payables Place · 2026`, `$9.90 / invoice`, `11.6 days` and exact source URL from inventory. Acceptance: punctuation and source years match, no unsupported statistics, mandatory exclusions cannot be disabled.
TRAPS: never claim real customers or live operation; names are fixture identities, unknown is not zero, no invented evidence; cyan only during execution.
ACCEPTANCE: Check every DAT Done when, exact labels and arithmetic; run SO-B5–SO-B6. REPORT: files, commands, counts, commit and questions; stop.
```

### BOB-03b · State and permissions (H-057–H-132; L-035–L-160)
**Why / depends on:** BOB-03a.
**Checklist**
- [x] Pre-flight: RT-01–RT-02 and fixtures.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: ST01–ST24, role guards, independent consent.
- [x] Accept: all reducer Done when checks pass.

Built in `demo/oryn-prototype/src/state/` by a coding-agent session, not IBM Bob; the owner chose to keep this step recorded as built without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. The self-review used 14 mutation checks on a temporary copy (each broken guard failed at least one test); the delegated review agent failed on a usage limit. `bun run test` (bun test) was added; 87 tests cover every ST01–ST24 entry/exit, every lifecycle action outside its own state and the RT-01/RT-02 Done-when clauses. No visual surface was built: the reducer has no UI binding until BOB-03c and BOB-04+, so SO-B6 at 1280x720 DPR 2 does not apply yet. Owner-confirmed decisions: SC04, SC19, SC21, SC27 and SC28 are reachable one state before their view binding because they hold the control for the next state; Marcus (Workflow Owner) and Tomas (Admin) may export the audit pack (A15); Marcus holds the `start-job` grant for A05 "authorized operator"; the exact RT-02 labels live in `COPY` (`src/state/permissions.ts`) for the UI steps to render.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-03b. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: RT-01–RT-02, Part D; H-057–H-132 and L-035–L-160. INPUTS: BOB-03a.
BUILD:
1. Implement typed ST01–ST24 immutable reducer, selectors, guards and authorized roles.
2. Separate capture and contribution consent; denied consent cannot start observation. Selecting a role never grants authority.
3. Require approval and subsequent readback separately; `Outcome Unknown` stays held with `Resubmission unavailable`.
4. RT-01 interface: define typed `Action`, `State`, `reduce(state, action)` and selectors `jobCounts`, `gateSatisfied`, `suiteVerdicts`, `isRunning`, `currentRole`, `visibleNotifications`, `accessibleEvidence` and audit slice. Keep route, actor, theme, running, consent, evaluations, job cases, approval, readback, incident, repair and release as separate fields. Record ST01–ST24 entry/exit and preserve history on reverse seek. Acceptance: each state has named entry/exit, decision and verification differ, mixed counts remain consistent, backwards seek restores state and guard failure explains itself.
5. RT-02 interface: evaluate actor, delegation, action, tier, object, scope and current policy before consequential actions. Render exact labels `Employee`, `Workflow Owner`, `Approver`, `Admin`, `Daniel Okafor · Tier 3`, `Requires Tier 3 approval - Daniel Okafor`, `Correction is evidence, not new policy`. Acceptance: unauthorized actor cannot approve, role change creates no delegation, raw private capture stays local and blocked actions explain the exact guard. Exercise an Admin who is not a finance approver and Priya with and without meeting consent.
6. Guard sequence: in ST01 require notice acceptance and the selected capture category; in ST02 require meeting-specific consent before review; in ST04 require contributor review and owner approval before publishing. In ST06 pin the 28-scenario candidate; ST07 cancellation remains incomplete. In ST09 require 5/5 examples, at least 25 correct scenarios including five edge/negative, owner approval, scope confirmation and authorization before JOB-0117 starts.
7. After ST11, contain exactly three Kestrel cases before teaching; require manual INV-48231 completion and bounded scope before repair. Require 34 intended outcomes and owner authorization before limited release, then 3/3 independent verified outcomes and owner approval before expansion and closure. Audit events are ordered immutable history, and montage navigation changes route without rewriting outcomes.
8. Exercise denied consent, wrong-scope Daniel delegation, Admin with no finance grant, missing meeting consent, cancelled simulation, failed regression and pending verification. Each rejected action retains previous state and exposes its actual reason. Role-specific evidence selectors must not expose another employee's raw capture.
TRAPS: Never infer policy from a correction, infer execution from a selected route, or let a deep link bypass prerequisites. Compare cents exactly at 2.00%. Keep `Partially Complete`, no resubmit, no 33/27 repair figures and cyan only while executing.
ACCEPTANCE: Test every inventory Done when and invalid transition; run SO-B5–SO-B6. REPORT: files, checks, commit and questions; stop.
```

### BOB-03c · Film runtime (H-014–H-132; L-010–L-160)
**Why / depends on:** BOB-03b.
**Checklist**
- [x] Pre-flight: RT-03, FRT-01–FRT-03 and reducer.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: arbitrary reverse and forward seeks agree.
- [x] Accept: deterministic cursor, typing and anchor interfaces exist.

Built in `demo/oryn-prototype/src/film/` by a coding-agent session, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. `bun run test` covers resolveFrame/seek/order, cursor, typing, outlines, sidecar, reduced motion and the orbit; mutation checks on a temporary copy (no sort, moved overshoot peak, press scale, inset outline, no blink, idle cyan, unbounded jitter) each failed a test, and one surviving mutation (orbit under reduced motion) got its own test. Browser check at 1280x720 (page DPR 2, screenshots downscaled to 1280x720 by the harness) of `/?view=film-runtime&mode=film&frame=N` in light, dark and reduced motion. Camera is `[x, y, zoom]` (world point at the viewport centre). Sidecar schema is `buildSidecar` in `src/film/sidecar.ts`; BOB-03d writes the files. Timelines in `film/<cut>/` are authored by BOB-03d; `film/sample/runtime-check.timeline.json` is a runtime fixture only.

Owner decisions (answers to the BOB-03c questions, taken as the recommendations): (1) BOB-03d authors anchor rectangles in the timeline and its capture script also measures each anchor's DOM `getBoundingClientRect` at sampled frames and fails the clip when it differs from the sidecar rectangle by more than 1 CSS px; the sidecar keeps the authored rectangles. (2) The FRT-03 28–34 chars/s rule governs over the 30 chars/s wording at inventory line 3957: BOB-03d chooses the `url-pill` seed so the last character appears by 02:55.200 (1.2 s) and records the chosen seed; the film never exceeds 34 chars/s. (3) The film pointer press is a 90 ms pulse at .97 that releases; a control's `Button pressFrame` (CMP-03) keeps its hold-until-release behaviour, and a timeline that needs the control held drives `pressFrame` from its own click event.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-03c. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: RT-03, FRT-01–FRT-03; H-014–H-132, L-010–L-160. INPUTS: BOB-03b.
BUILD:
1. Derive state from immutable initial state and ordered `(frame, seq)` events at 30 fps. Timelines are `film/<cut>/<clip-id>.timeline.json`.
2. Build deterministic cubic cursor paths, click rings, hover states and seeded 28–34 chars/s typing. Provide named per-frame anchor rectangles in CSS coordinates.
3. No wall clock, network or timers; arbitrary seeks reconstruct identical state.
4. RT-03: expose `resolveFrame(timeline, frame)`, `useFilmClock()` and `sampleMotion(startFrame, durationFrames, easing)` with `fps:30`, numeric `durationFrames`, `seed` and sorted `(frame,seq)` events. Derive actions and active interpolations from immutable initial state every time. Fix locale `en-US`, timezone `America/New_York`, viewport and font bytes. Acceptance: frame 720 resolves identically after any seek, event ordering stable, typing repeatable, stopped state neutral and reduced motion preserves all labels.
5. FRT-01: overlay 20x24 black arrow with 1px white outline; travel 350–900ms on cubic path with 1–3% overshoot, press 90ms at .97, ink-alpha click ring 260ms, hover 150ms. Expose cursor position by frame. Acceptance: tip lands inside named target, click and reducer action coincide, ring is ink and seek reproduces path.
6. FRT-02: fit a neutral 2px outline to the selected target including `$18,420.00`, `INV-48219`, `Fri 17:00` or `Fri 12:00`; distinguish hover, keyboard focus and selected state. Return named per-frame CSS rectangle to sidecar. Acceptance: outline tracks target through pan, value is not occluded, focus is identifiable without color and selection matches reducer.
7. FRT-03: frame-derived caret and 28–34 chars/s seeded text reveal for `Fri 17:00` → `Fri 12:00`, exact invoice-reconciliation intent and `https://github.com/Harikeshav-R/Oryn`. Acceptance: same frame has same prefix, deadline changes only after edit, URL exact and Bob footage never has synthetic typing.
TRAPS: old 60fps/108-frame orbit becomes 30fps/54-frame phase for the same 1.8s period; no Date.now, timer, network, unseeded random or prior-frame dependency.
ACCEPTANCE: Check every inventory Done when, reverse and independent seeks, event order and no idle cyan. Run SO-B5–SO-B6. REPORT: files, interface, tests, commit and questions; stop.
```

### BOB-03d · Capture script and sidecars (all product clips, 00:10–02:44)
**Why / depends on:** BOB-03c.
**Checklist**
- [x] Pre-flight: runtime and sidecar schema in ROADMAP.md section 0.3.
- [ ] Run the prompt in IBM Bob from `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: silent 2560x1440, 30 fps MP4 and complete sidecar.
- [x] Accept: exact frame count and command work for a sample timeline.

Built in `demo/oryn-prototype/scripts/` and `src/app/FilmCapture.tsx` by a coding-agent session, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. The concrete sidecar schema and the extra timeline fields (`scene`, `filmStartFrame`, per-event `entry`, optional `assets`) are documented in `demo/oryn-prototype/README.md` under "Capture (BOB-03d)". Verified on the fixture-backed `sample/runtime-check` timeline only (480 frames, `startAt: ST03`); no product clip timeline exists yet, so CAP-01–CAP-18 are untouched. Anchor rectangles are checked against each DOM `getBoundingClientRect` at every frame (BOB-03c owner decision 1). The `url-pill` seed choice for BOB-03c owner decision 2 belongs to the timeline that films it and is not made here.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-03d. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SOURCE OF TRUTH: ROADMAP.md section 0.3; inventory RT-03, FRT-01–03; H-014–H-132, L-010–L-160. INPUTS: BOB-03c.
BUILD:
1. Implement `bun run scripts/capture.ts --cut <hackathon|launch> --clip <clip-id>` and `--help`. Load the matching clip-local JSON timeline.
2. Capture exactly durationFrames at 1280x720 CSS, DPR 2; await fonts and decoded assets, encode silent 2560x1440 30 fps MP4 in `demo/video/clips/<cut>/<clip-id>.mp4`.
3. Write same-name JSON with section 0.3 schema, clipId, fps, dimensions, frameCount, durationSeconds, per-frame cursor and named anchor rectangles. Use explicit null when absent and actionable errors.
4. Capture interface: validate cut/clip against an existing timeline, reject unknown IDs or invalid nonintegral frames, then seek frames 0 through `durationFrames-1`. Fonts must be loaded and image assets decoded before frame zero; a missing required asset is a reported error, not a substitute. Never call a live external service or use the desktop pointer.
5. Sidecar contract: use the exact section 0.3 property names and types; preserve one cursor observation per frame and one rectangle-or-null per named anchor per frame. Coordinates are authored CSS pixels, not 2560x1440 encoded pixels. Each timeline event includes the relevant H/L entry ID and local frame; keep scene and absolute film offsets explicit.
6. Verify one sample by reading MP4 metadata with ffprobe and checking no audio stream, `r_frame_rate=30/1`, width 2560, height 1440 and frame count equal to `durationFrames`. Compare cursor and target anchor at start, click frame and final frame. Reverse-seek two frames and confirm identical visual state. Ensure `--help` exposes the documented flags and destination.
7. For reproducible capture, make the timeline schema specify clip-local frame indexes, stable same-frame `seq`, seed, action, cursor, text and overlay events. Keep user interaction mode and film mode on the same reducer. Capture must reconstruct a frame from the fixture baseline and all prior ordered actions, not from the previous screenshot; out-of-order frame requests must therefore match linear capture.
8. Test a missing font, malformed timeline, missing asset and missing anchor: each failure names the exact missing input and leaves no incomplete output presented as accepted. Preserve original files while preparing destination assets. Check frame duration against both the timeline and sidecar, not only a player duration rounded to seconds. Note the clip's explicit local start and source entry boundaries in the report.
9. CAP-01–CAP-18 will exercise real finished timelines later; a sample at this step establishes the interface only. Never invent a product frame to make the test pass. The example may use an actually built, fixture-backed state and must be identified as such in the result.
TRAPS: fx-01 is prototype-only; don't bake camera reframing or captions into product clips. The launch run ends 02:03.50 and heal begins there, so capture 525 and 615 frames respectively. Report error context rather than hiding failed encoding.
ACCEPTANCE: ffprobe verifies exact frames, dimensions, rate and no audio; compare repeated arbitrary frames and sidecar samples. Run SO-B5–SO-B6. REPORT: schema, command, checks, commit and questions; stop.
```

### BOB-04 · Shell, consent and desktop (H-055–H-062; L-035–L-044, 01:22–01:28 / 00:32–00:44)
**Why / depends on:** BOB-03. First product captures need a real consent and privacy path.
**Checklist**
- [x] Pre-flight: BOB-03 runtime, local brand marks and inventory SC12-FRAME, SC12, SC01–SC03, APP-11–APP-12.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: independent consent, pause, exclusions, local retention, neutral observation and named anchors.
- [x] Accept: timelines `hk-h4a-enroll` and `lk-l4-privacy` exist and match entries.

Built in `demo/oryn-prototype/src/product/` (plus the `state.ui` slice in `src/state/`) by a coding-agent session, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors and behaviour are in `demo/oryn-prototype/README.md` under "Shell, consent and desktop (BOB-04)". Verified: `bun run typecheck`, `bunx eslint .` and `bun test` (322 tests) pass; `bun run scripts/capture.ts` captured `hk-h4a-enroll` (180 frames), `lk-l4-privacy` (360 frames) and the fixture-backed `sample/shell-tour` (270 frames), each ffprobe-checked at 2560x1440, 30 fps, no audio, with every anchor equal to its DOM rectangle on every frame and reverse seeks of the first, click, middle and final frames equal to the linear pass. The MP4s and sidecars were not kept: CAP-02 and CAP-11 stay unticked. Deviations: (1) the storyboard cursor coordinates were written for another layout, so each pointer path starts where the previous one ended and lands inside the real anchor; (2) H-061 and L-040 to L-042 hide the pointer, which keeps travelling unseen; (3) the sample `shell-tour` clip is not in the roadmap table; (4) the hackathon pointer clicks Continue at the last frame of H-059 (frame 90) because an enrollment click needs 11 frames of travel, so the notice, work-scope and finish clicks sit a few frames before their storyboard ticks. Open: the SC12-FRAME navigation resolves the 14 inventory labels to screens (SC15, SC16, SC17, ...) that later BOB steps build; until then their routes show a placeholder.

Owner decisions (answers to the BOB-04 questions, taken as the recommendations): (1) Click timing stays as built: the hackathon pointer clicks Continue at frame 90 (last frame of H-059) because an enrollment click needs 11 frames of travel, so the notice, work-scope and finish clicks sit a few frames before their storyboard ticks; the stage layer retimes cuts, the product clip is not bent to match. (2) The SC01 `Excluded window — not captured` state is not added to either storyboard clip (neither script entry shows it); it is built, unit-tested and captured in the fixture-backed `sample/shell-tour` clip (frames 210-254, 270 frames in total). (3) Navigation rows for screens later BOB steps build (SC15, SC16, SC17, ...) keep opening a placeholder until those steps land. (4) The launch clip holds My Privacy over L-044 to L-046 with the pointer hovering `Delete local history`, never clicked; those entries are stage montage. (5) The role menu and command palette are plain absolutely positioned markup, not Radix popovers, so a film renders them frame-exactly.

Changes made beyond the screens, for later steps to know: (a) `src/state/` gained a presentation slice `state.ui` and 11 presentation actions (`WIZARD_NEXT`, `WIZARD_BACK`, `SET_NOTICE_EXPANDED`, `SET_OVERLAY`, `SET_SEARCH_QUERY`, `OPEN_DELETE_DIALOG`, `CANCEL_DELETE`, `CONFIRM_DELETE_LOCAL_HISTORY`, `SELECT_APP_TAB`, `BROWSER_BACK`, `SET_FOREGROUND`); `createInitialState` carries `ui`. (b) `ResolvedFrame` gained `applied` (accepted actions with their frames) so a screen can time its own 150 ms motion. (c) `FilmCapture` adds a style reset inside the canvas and a canonical DOM digest (sorted attributes and style declarations, empty `style` dropped, `useId` masked); the reverse-seek check needed it. (d) `/?view=product` is the clickable product; `?screen=`, `?state=`, `?actor=` deep-link through the reducer's guards. (e) `scripts/author-product-clips.ts` plus `src/product/clip-specs.ts` generate the timelines and derive `anchor:<name>` visibility from the rendered markup; edit the spec, not the JSON. (f) `scripts/clips.ts` and the help text register the `sample/shell-tour` clip. (g) `scripts/capture.test.ts` now uses `hk-h4h-breadth` as its unbuilt-surface example, because `hk-h4a-enroll` has a surface. (h) Exclusion entries on SC03 are generic category names only (`Password managers`, `Messaging apps`, `Private windows`, `Lock screens`, `Banking sites`, `Health portals`).
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: build SC12-FRAME, SC12, SC01–SC03, APP-11–APP-12 and associated clip timelines. SOURCE OF TRUTH: inventory items and applicable Part D gaps; H-055–H-062; L-035–L-044. INPUTS: BOB-03; PRE-02 rights-reviewed marks.
BUILD:
1. SC12-FRAME: show `Calder & Vance`, roles Employee, Workflow Owner, Approver, Admin, sidebar 240px and top bar 56px. States: permitted role selection, light/dark, search. Anchor `role-selector`, `search` and `navigation`; timeline events select authorized viewpoints. Done when sidebar/header align, breadcrumb matches navigation, keyboard opens/dismisses search and no idle cyan appears.
2. SC12: show Home, Approvals, Incidents, Verified outcomes and Recent changes; build role-limited and denied states. Anchor `home-cards`; timeline enters Home. Done when four cards appear, role matches, cards navigate and unauthorized content remains unavailable.
3. SC01: show `Observation active`, `Capture active`, `Pause observation`, `Observation paused`, `Resume observation`, `Excluded window — not captured`. Build active, paused and excluded states; anchor `pause-observation`. Done when pause is one action, Privacy opens, excluded content is absent and passive state is neutral.
4. SC02: build `Your work, your choice`, `Notice`, `Capture and sharing`, `Work scope`, `Visual observation`, `Organizational contribution` with separate consent. Anchor `notice`, `capture-consent`, `sharing-consent`, `continue`; timeline reviews and accepts required choices. Done when all three steps exist, missing consent blocks advance, sharing can differ from capture, mandatory exclusions remain, and decline never starts observation.
5. SC03: show `Excluded apps, windows and URLs`, `Local retention: 7 days`, `BANK ACCT`, `TAX ID`, `CARD`, `Delete local history`. Build pause, locked exclusions and local-only delete confirmation; anchor `exclusions`, `masked-fields`, `delete-dialog`. Done when three categories show, mandatory protection is locked, three fields are masked, pause works and deletion warns of local-only scope.
6. APP-11: provide original Chrome-like tabs Gmail, NetSuite, AP Exceptions Tracker, Slack, Zoom, HubSpot with fictional `.example` addresses. Anchor `browser-tabs`; selection timeline switches views. Done when all tabs work, active state is clear and no network occurs.
7. APP-12: provide original desktop, menu bar and Dock, with `Observation active`, `Paused`, `Pause observation`, `Resume`, `My Privacy`; anchor `companion-menu`. Done when menu opens correctly, pause/resume works, Privacy opens and meeting capture remains independent.
8. Write `film/hackathon/hk-h4a-enroll.timeline.json` and `film/launch/lk-l4-privacy.timeline.json` with exact entry-local events and named sidecar anchors. Test denied and accepted paths, original and reversed frame seeks, 1280x720 DPR 2. No stage caption or typography is baked into these clips.
MOUNT: none. TRAPS: 30 fps supersedes source 60; passive capture is never cyan; do not imply sharing is consented merely because capture is accepted. QA: self-review each item's Done when, keyboard and 1280x720 DPR 2; seek first, middle and final frame of both timelines. REPORT: IDs, files, checks, commit and open questions; stop.
```

### BOB-05 · Work surfaces and meeting (H-014–H-026, H-063–H-069; L-010–L-022, L-045–L-057)
**Why / depends on:** BOB-04. Establish the invoice and consented meeting across original mock apps.
**Checklist**
- [x] Pre-flight: SC04, SC11, APP-01–APP-04, APP-06–APP-08; official marks and BOB-04 exist.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: fixture invoice survives transitions; Zoom consent precedes the commitment; deadline changes Fri 17:00 to Fri 12:00.
- [x] Accept: `hk-h2-problem`, `hk-h4b-observe`, `lk-l2-chaos`, `lk-l5-observe` timelines exist.

Built in `demo/oryn-prototype/src/product/apps/`, `src/product/MeetingReviewScreen.tsx`, `src/data/work-records.ts` and `src/state/` (the `state.ui.app` slice) by a coding-agent session with four parallel sub-agents, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Work surfaces and meeting (BOB-05)". Verified: `bun run typecheck`, `bunx eslint .`, `bun run build` and `bun test` (543 tests) pass; `bun run scripts/capture.ts` captured `hk-h2-problem` (780 frames), `hk-h4b-observe` (210), `lk-l2-chaos` (360) and `lk-l5-observe` (360), each ffprobe-checked at 2560x1440, 30 fps, no audio, every anchor equal to its DOM rectangle on every frame, reverse seeks of the first, click, middle and last frames equal to the linear pass; every storyboard entry of each clip appears in its timeline. Frames were inspected in light, and the Zoom and reminder states in dark.

Deviations and open questions: (1) Third-party mock apps are one browser view at a time, so storyboard entries that composite several windows (H-015, H-016, H-025, L-019, L-020, L-021) use frames of the same clip for each window (map in the README); H-017 to H-022, H-024 to H-026, L-014, L-018 and L-022 to L-024 are stage graphics, so the product holds its last view with no pointer. (2) The L-016 `Submission timed out` toast and the L-014 calendar are not product surfaces in this step (APP-05/APP-13 and STG-12); the clip shows the NetSuite bill underneath. (3) L-058 (SC13 `Needs Review`) belongs to BOB-06 but falls inside `lk-l5-observe` (frames 330-359): the clip holds the vendor record there. (4) Storyboard pointer start coordinates are honoured with placed pointers (hard cuts); targets are the real anchors, not the inventory hotspots (the attachment card sits inside the message pane, Kestrel's vendor row is at y 272-304, `Stage` at x 1068-1184). (5) `PLACE_HUD` carries a per-cut entry (`short` 150 ms hackathon, `long` 500 ms launch). (6) Added beyond the inventory, with the reason: a `Not for this meeting` consent choice (a consent flow needs a decline), a `Show next caption` control in the clickable Zoom app (nothing else dispatches the quotation), and the disabled `Confirmed` control that keeps the Confirm target visible. (7) `OPEN_SCREEN SC05` to `SC09` are reachable at ST01, and confirming the commitment keeps the user on SC11 because ST04's route (SC13) is not built.

Owner decisions (answers to the BOB-05 questions, taken as the recommendations): (1) L-058 belongs to BOB-06's product screen but sits inside the `lk-l5-observe` interval (00:55-00:56): the clip keeps holding the Kestrel vendor record for frames 330-359 until SC13 exists, and BOB-06 then re-authors that tail to show SC13 and recaptures the clip (carry-over item in the BOB-06 checklist); no placeholder SC13 is drawn now. (2) The L-016 `Submission timed out` toast and the L-014 calendar stay out of this step: the toast is APP-05/APP-13 and the calendar is stage plate STG-12, so `lk-l2-chaos` keeps the NetSuite bill under L-016 and holds its last product view through L-014; the stage layer adds both. (3) The other deviations above (frame reuse for multi-window entries, anchors instead of inventory hotspots, per-cut HUD motion, the added `Not for this meeting`, `Show next caption` and disabled `Confirmed` controls, SC05-SC09 free at ST01, Confirm staying on SC11) stand as built.

Changes made in BOB-05, for later steps to know: (a) `state.ui` gained `deadlineDraft` and an `app` slice (`record`, `mail`, `attachment`, `documentView`, `erp`, `vendor`, `trackerFocus`, `meeting`, `hud`) and 18 presentation actions (`OPEN_MESSAGE`, `CLOSE_MESSAGE`, `OPEN_ATTACHMENT`, `CLOSE_ATTACHMENT`, `SET_DOCUMENT_VIEW`, `OPEN_BILL`, `OPEN_ERP_VIEW`, `OPEN_VENDOR`, `FOCUS_TRACKER_CELL`, `SHOW_MEETING_QUOTE`, `END_MEETING`, `OPEN_GUIDE`, `GUIDE_NEXT`, `GUIDE_BACK`, `GUIDE_DONE`, `DISMISS_HUD`, `PLACE_HUD`, `DRAFT_DEADLINE`); new guard ids `record`, `meeting`, `guide`; selector `hudKind`. (b) `OPEN_SCREEN` for SC04-SC09 brings the matching browser tab forward; SC05-SC09 are reachable from ST01; `EDIT_COMMITMENT` and `CONFIRM_COMMITMENT` clear the draft; `GRANT_MEETING_CONSENT` is refused after the meeting ended. (c) `AppView` now receives full `ProductProps`; Gmail, NetSuite, tracker, Slack and Zoom are real views and only HubSpot (APP-09, BOB-11) is still the skin. `sceneAnchors(state)` takes the state, not the route, because the desktop's anchors depend on the active tab; SC11 is a new `meeting-review` scene inside the shell with breadcrumb `Meeting review` (`screenLabel`). (d) `FilmContext` gained `texts` (typed-field views). `validateTimeline` no longer requires a placed pointer (`duration: 0`) to start where the previous move ended. `ClipSpec` gained `types` and `outlines`, and a click with an empty action list is authored as `inert`. (e) `/?view=product` accepts `&actions=[...]`, ordered reducer actions applied after the deep link through the guards. (f) New files: `src/data/work-records.ts`, `inbox.ts`, `tracker-rows.ts`, `slack-channel.ts`; `src/product/apps/*`, `MeetingReviewScreen.tsx`, `meeting-review-layout.ts`, `clip-specs-work.ts`; tests `src/state/work-surfaces.test.ts`, `src/product/work-timelines.test.tsx` and one per view. (g) The captured `demo/video/clips/*` MP4s and sidecars are left untracked, as for BOB-04; regenerate them with `bun run scripts/capture.ts`.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-05. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: build SC04, SC11 and APP-01–APP-04, APP-06–APP-08. SOURCE OF TRUTH: inventory item Done when and Part D; H-014–H-026, H-063–H-069; L-010–L-022, L-045–L-057. INPUTS: BOB-04 and local approved marks.
BUILD:
1. SC04: show `Known fix from AP East: Vendor tax ID format`, `Guide Me`, `Check the vendor tax ID format`, and `Confirm Kestrel handling-fee terms in writing`, `Fri 12:00`. Anchor `hud-reminder`, `guide-me`; build reminder, guide and dismissed variants. Done when both cards have exact text, reminder only appears on Kestrel, guidance advances manually and dismissal leaves work unresolved.
2. SC11: show Priya Nair, suggested/confirmed commitment, source `00:14:32`, `subject to company approval`; edit `Fri 17:00` to `Fri 12:00` before explicit Confirm. Anchor `deadline`, `confirm-commitment`, `meeting-source`. Done when both deadlines differ, source and caveat remain, Confirm changes status and reminder uses corrected time.
3. APP-01: original Gmail inbox/message with Brightwater Industrial, `INV-48219`, `PO-1042`, `$18,420.00`, D1 `INV-48203`, and H2 `INV-48210`. Anchor `inbox-row`, `attachment`; select matching message and attachment. Done when IDs match across message/document, three contexts identify correct supplier and no private account appears.
4. APP-02: original document variants include Kestrel `INV-48231`, `PO-1051`, subtotal `$4,175.00`, `Handling fee $38.50`, total `$4,213.50`. Anchor `invoice-total`, `handling-fee`. Done when Brightwater IDs and total read, Kestrel arithmetic holds, fee follows subtotal and unknown values remain absent.
5. APP-03: original NetSuite bill/PO with `Variance Hold`, invoice `$18,420.00`, PO `$17,980.00`, `$440.00`, `2.45%`; show `Matched - Variance Approved` only after readback. Anchor `erp-bill`, `po-total`. Done when totals and variance are simultaneous, approval alone does not verify and readback gives correct status.
6. APP-04: Kestrel vendor record triggers one `Fri 12:00` reminder only after confirmation; anchor `vendor-record`. Done when correct supplier triggers reminder, unrelated vendor does not and record stays usable.
7. APP-06: `AP Exceptions Tracker` with Invoice, Supplier, Issue, Owner, State and six inventory-defined rows. Anchor `tracker-row`. Done when both missing POs remain distinct, focused selection follows cell and unknown remains labeled.
8. APP-07: `#ap-escalations`, separate `Missing purchase order: INV-48215` and `INV-48218` messages and distinct INV-48219 reference. Anchor `slack-message`. Done when links open matching cases and no message implies approval.
9. APP-08: `Meeting notice and consent`, `Meeting capture: consent required`, `Start for this meeting`, `Recording`; show only Priya and Dana and exact quotes from the item. Anchor `meeting-consent`, `meeting-quote`. Done when recording appears only after consent, both quotations match and ended state removes indicator.
10. Create `film/hackathon/hk-h2-problem.timeline.json`, `hk-h4b-observe.timeline.json`, `film/launch/lk-l2-chaos.timeline.json`, `lk-l5-observe.timeline.json`; map each entry to local frame, cursor action and named anchor. Use original UI and local rights-reviewed marks, never real screenshots or copied DOM.
MOUNT: none. TRAPS: observation is neutral and user consent precedes recording; no invented invoice amount. QA: seek each timeline and inspect exact source labels, deadline, accessibility, dark/neutral state, SO-B5–SO-B6. REPORT: completed IDs, timeline files, tests, review, commit and open questions; stop.
```

### BOB-06 · Discovery and playbook (H-070–H-076; L-058–L-074, 01:35–01:42 / 00:56–01:12)
**Why / depends on:** BOB-05. Convert demonstrations to reviewed, attributable knowledge.
**Checklist**
- [x] Pre-flight: BOB-05 and the fixture demonstrations exist (`src/data/demonstrations.ts`, `playbook.ts`). SC13–SC15 are what this step builds, not an input; the original wording listed them by mistake. Baseline checked before this step: worktree clean apart from the untracked clip files, `bun run typecheck` and `bunx eslint .` clean, `bun test` 543 pass.
- [x] Hand-off notes for this step (written after BOB-05, nothing here is built yet):
  - Remove the BOB-05 stopgap. Confirming the commitment enters ST04, whose route is SC13, but the SC11 `Confirm` handler (`MeetingReviewScreen.tsx`) and the `CONFIRM` action list in `src/product/clip-specs-work.ts` both add `OPEN_SCREEN SC11` to stay on the review. Once SC13 exists, drop that action, regenerate the four BOB-05 timelines with `bun run scripts/author-product-clips.ts`, and fix the one test that asserts it (`meeting-review.test.tsx`, "Confirm dispatches the edit first…").
  - A contributor must turn Organizational contribution on before approving a Demonstration (`APPROVE_DEMONSTRATION` guard `contribution`), but the BOB-04/BOB-05 hackathon and launch clips leave sharing off, and `CANONICAL_SCRIPT` turns it on at enrollment. A clip that starts at ST04 with `startAt: 'ST04'` therefore reconstructs sharing ON, which disagrees with the end of `hk-h4b-observe`. Decide per clip: either show the contributor's explicit sharing choice on screen before approval, or accept that the reconstructed prerequisite differs and say so in the report. Do not weaken the guard.
  - `ClipSpec.startAt` now accepts any state id (was ST01/ST02 only), so `hk-h4c-playbook` and `lk-l6-discover` can start at ST04. Register both clips in `src/app/film-surfaces.ts`; `scripts/clips.ts` already lists them (`hk-h4c-playbook` 210 frames at 95 s, `lk-l6-discover` 480 frames at 56 s).
  - `SCREEN_MIN_PHASE`: SC13 and SC14 open at ST04, SC15 at ST05. A viewpoint change goes through the role selector (`role-option-marcus`), and the Workflow Owner navigation already lists Workflow Discovery and Playbooks. SC13–SC15 are currently drawn by `ScreenPending`; give them a scene in `src/product/anchors.ts` (`sceneOf`/`sceneAnchors`) like SC11.
  - Part D gaps that apply and must not be skipped: GAP-SC-H-role (H-073: use the sidebar selector at (135,54), full `Marcus Webb · Workflow Owner` identity visible, no top-right selector), GAP-SC-H-guidance (H-075: neutral outlined shield/check, `v1.0`, `Approved for Guidance`, shown only after publication), GAP-SC-L-02 (L-062: heading `Publish for Guidance`, `Owner: Marcus Webb`, separate `Publish` action disabled until owner review), GAP-SC-L-03 (L-073: `Confidence: Medium` categorical, never a number, with the unresolved exception). GAP-SC-L-04 is the SC18 drawer (BOB-07), not this step.
  - Reuse the BOB-05 conventions: absolute-rect `*-layout.ts` per screen, every anchor rendered always and hidden with `display: none`, no timers or randomness, `motionProgress` for 150 ms motion, and a `*-timelines` test like `work-timelines.test.tsx`.
- [x] Carry-over from BOB-05 (owner decision): `lk-l5-observe` frames 330-359 (L-058, SC13 `Needs Review`) re-authored in `src/product/clip-specs-work.ts` to show SC13 (pointer from (1100,420) to the candidate in 700 ms, landing f352) and recaptured; the clip keeps its 360 frames and every other frame.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: three demonstrations and uncertainty remain distinct; `Approved for Guidance` is neutral.
- [x] Accept: `hk-h4c-playbook` and `lk-l6-discover` timeline files exist.

Built in `demo/oryn-prototype/src/product/` and `src/state/` by a coding-agent session, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Discovery and playbook (BOB-06)". Verified: `bun run typecheck`, `bunx eslint .`, `bun run build` and `bun test` (639 tests) pass; `bun run scripts/capture.ts` captured `hk-h4c-playbook` (210 frames), `lk-l6-discover` (480) and the re-authored `lk-l5-observe` (360), each ffprobe-checked at 2560x1440, 30 fps, no audio, with every anchor equal to its DOM rectangle on every frame and the first, click, middle and final frames re-seeked in reverse and equal to the linear pass. A browser run at 1280x720 DPR 2 (light and dark) checked each screen, the drawer's Tab cycle, Escape and focus return, and the click-through from the inbox to a published playbook.

Deviations and open questions: (1) `Request owner review` is a business action (`REQUEST_OWNER_REVIEW`, new guard `ownerReview`) and `PUBLISH` now needs it, because the inventory says owner review gates publication and `Publish` is disabled until it; the canonical script requests it as Jamal. The inventory's third SC15 state (owner-approved before publication) is not a separate state: the owner's `Publish` is the approval. (2) SC15 opens at ST04 (the preview before `Publish`, same one-state-earlier rule as SC19 to SC28) and SC17 at ST05 so the Agent Factory button works; SC17 itself is BOB-07. (3) The clips replay the contributor decisions at frame 0 (Priya D1 and D2; Jamal turns sharing on, approves D3 and requests the review), the second option of the hand-off note: the guard is unchanged, the reconstructed prerequisite differs from the sharing-off end of `hk-h4b-observe` and `lk-l5-observe`, and each card shows its contribution decision. In `lk-l5-observe` L-058 sharing is still off, so the rows read `Observed`. (4) The SC11 `Confirm` handler no longer adds `OPEN_SCREEN SC11` (the clickable app now follows the lifecycle route to SC13); the film keeps an explicit `OPEN_SCREEN SC11` cut in the Confirm click so H-068 and L-055 still show the confirmed review, and the BOB-05 timelines regenerate unchanged. (5) The sidebar selector shows `Marcus Webb` and `Workflow Owner` on two lines (GAP-SC-H-role asks for the full identity at the existing selector); the single string `Marcus Webb · Workflow Owner` is the stage caption. (6) The drawer enters as a 150 ms opacity ramp, not a slide, so the anchored rectangle never moves; the L-074 `Owner-approved status enters in 150ms` is the badge fading in at the publication press (L-062), already settled at L-074. (7) SC13's neutral loading state (150 ms skeleton) is not built: there is no data source that loads. (8) H-076's camera push, H-070's 100 ms row stagger, and the lifecycle ring of L-063 to L-072 belong to the stage layer. (9) Question for the owner: should the Employee navigation list Workflow Discovery? Today a contributor reaches SC13 only through the confirmed commitment and cannot navigate back to it.

Owner decisions (answers to the BOB-06 questions, taken as the recommendations): (1) The Employee navigation stays as built (Home, Notifications, My Privacy): it is the inventory's navigation table, and a contributor reaches SC13 through the confirmed commitment, so no Workflow Discovery row is added for an Employee. This is a deviation from nothing in the inventory; it is recorded because SC13 has no way back for a contributor outside the film. (2) Deviations (1) to (8) above stand as built, none is reverted: the `REQUEST_OWNER_REVIEW` action and `ownerReview` guard, SC15 at ST04 and SC17 at ST05, the frame-0 replay of contributor decisions, the explicit `OPEN_SCREEN SC11` film cut, the two-line Marcus Webb selector, the opacity-ramp drawer, the unbuilt SC13 skeleton, and the stage-layer items. (3) Later steps inherit: `PUBLISH` needs `state.ownerReviewRequestedBy`; a clip that starts at ST04 and publishes must replay `REQUEST_OWNER_REVIEW` (`REVIEWED` in `clip-specs-discovery.ts`); `state.ui.discovery.drawer` is closed by leaving SC14 or SC15; SC17 (BOB-07) must be built behind `Agent Factory` on SC15 and may assume ST05 with `playbookPublished` true.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-06. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC13–SC15 and two timeline JSON files. SOURCE OF TRUTH: inventory SC13–SC15, DAT-03–04, relevant GAP-SC-*; H-070–H-076 and L-058–L-074. INPUTS: BOB-05.
BUILD:
1. SC13: show `Workflow Discovery`, `Supplier invoice vs purchase order reconciliation`, `3 demonstrations`, `Needs Review`; D1 Priya Mon 09:14 INV-48203 Brightwater, D2 Priya Mon 10:02 INV-48204 Copperline, D3 Jamal Tue 13:40 INV-48207 Harlow. Anchor `candidate-row` and `demonstrations`; states include selected, empty and denied. Done when all source rows match, Needs Review displays, selection opens review and empty state offers next action.
2. SC14: show `Match supplier invoice to purchase order and stage result in ERP`, `Confidence`, `Variance exception rule: unverified until SME review`, `AP-RULE-009`, and `variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept`. Anchor `candidate-evidence`, `rule-drawer`, `request-review`; build suggested, evidence, contributor approval and owner review states. Done when provenance is visible, warning and threshold are correct, drawer traps focus and owner review stays separate.
3. SC15: show `Supplier invoice vs purchase order reconciliation · v1.0`, `Owner: Marcus Webb`, `Approved for Guidance`, the six inventory-defined steps and both rule links. Anchor `playbook`, `publish`, `agent-factory`; build draft and approved variants. Done when six steps, owner/version and both rule links appear and guidance remains distinct from deployment.
4. Write `film/hackathon/hk-h4c-playbook.timeline.json` and `film/launch/lk-l6-discover.timeline.json`; encode role selection, evidence opening, review and publication at each entry's local frame. Record sidecar anchors and verify each via direct and reverse seek.
TRAPS: Three demonstrations are not five verified examples; use neutral guidance badge, no invented numeric confidence and no stage decoration inside product.
MOUNT: none. TRAPS: verified examples include two archived SME examples, not five newly observed demonstrations. QA: check pending versus published states, no fabricated authority, direct seek and all SO-B checks. REPORT: IDs, files, validation results, self-review and commit; stop.
```

### BOB-07 · Agent definition and gates (H-077–H-083; L-075–L-090, 01:42–01:49 / 01:12–01:30)
**Why / depends on:** BOB-06. Build the scoped candidate before running simulation.
**Checklist**
- [x] Pre-flight: SC17–SC18, BOB-06 and exact typed intent fixture (`AGENT_DEFINITION.intent`, `src/data/versions.ts`; 84 characters, the inventory's "81" disagrees).
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: intent, Tier 3, Stage 3 and pending gate checks; no premature authorization. Only the examples row is checked on every frame of both clips; the evaluation, owner and scope rows are pending, `Deploy` and `Approve release` are disabled.
- [x] Accept: both agent timelines and named anchors exist (`film/hackathon/hk-h4d-agent.timeline.json`, `film/launch/lk-l7-create.timeline.json`, sidecars under `demo/video/clips/`).

Built in `demo/oryn-prototype/src/product/` and `src/state/` by a coding-agent session, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Agent definition and gates (BOB-07)". Verified: `bun run typecheck`, `bunx eslint .`, `bun run build` and `bun test` pass; `bun run scripts/capture.ts` captured `hk-h4d-agent` (210 frames) and `lk-l7-create` (540), each ffprobe-checked at 2560x1440, 30 fps, no audio, with every anchor equal to its DOM rectangle on every frame and the start, click, middle and final frames re-seeked in reverse. Seven mutation checks on the live files (owner row pre-checked, blank intent allowed, examples drawer on SC17, gate satisfied by any row, intent set before it is typed, Stage 3 cyan, Deploy ignoring owner approval) each failed a test, except the last, which is an equivalent mutant: the reducer refuses with the same words.

Deviations and open questions: (1) The intent needs at least 75 frames at the fastest permitted 34 characters a second after the click, so in `hk-h4d-agent` the generated rows (H-079) have 3 frames (f87 to f89) before the storyboard's cut to SC18 at f90; the clip keeps its 210 frames. Extending it (about +45 frames for a 1.5 s read of the six rows) means changing the section 0.3 table. (2) SC18 cannot hold the inventory's right panel at the stated sizes (164 + 324 + 200 = 688 px of 560), so the ladder sits under the scope in the 32 px dense variant and the right panel holds risk, gate and the release actions. (3) `CREATE_AGENT` now needs the demonstration intent, not any non-blank text: the prototype drafts one definition. (4) Controls the inventory text does not list were added because the reducer has the actions and the gate needs a way to be met: `Confirm scope`, `Approve release`, `Review evidence`, `Open Flight Simulator`, per-row `Satisfied`/`Pending` and a header `Pending`/`Satisfied`. (5) H-079's pointer travels to where the unverified branch will appear (the anchor does not exist before f87); H-080's "scope tab" has no tab, so the pointer hovers the scope panel; H-083 clicks the 5/5 row to open its drawer instead of hovering. (6) The unverified branch appears with the draft (L-079), not a beat later (L-080); the running glyph, the sequential tier rise, the count unfold, the owner-row slide and the matched-edge slide are stage-layer work, and SC18 shows all of its rows at once. (7) `lk-l7-create` holds SC18 through L-091 and L-092 and stops the pointer on `Open Flight Simulator` without pressing it: SC19 is BOB-08, which re-authors the tail. (8) GAP-SC-L-04 names Elena Ruiz as the source reviewer in the drawer while the viewpoint stays Marcus Webb (an SME has no navigation); whether Elena should be a selectable viewpoint is open.

Owner decisions (answers to the BOB-07 questions, taken as the recommendations): (1) `hk-h4d-agent` keeps its 210 frames: the section 0.3 table and the film's absolute times stay as they are, and the generated rows keep their 3 frames (f87 to f89); if the edit needs a longer read of the six rows it holds frame 89 in the stage layer. (2) The SC18 layout stands as built (ladder under the scope, risk, gate and release actions in the right panel). (3) `CREATE_AGENT` stays restricted to the demonstration intent. (4) Elena Ruiz is not a selectable viewpoint: she is named as the reviewer in the source drawer only, and the SME role keeps no navigation. (5) The `lk-l7-create` tail (f480-539, L-091 and L-092) is re-authored by BOB-08, which adds the SC19 screen, the pointer on `Run Evaluation` and the recapture; no placeholder SC19 is drawn now. (6) The added controls stay.

Deviation register for BOB-07 (everything that differs from the inventory, storyboard or prompt, in one list): (a) Hackathon typing runs at 34 characters a second, the top of the permitted range, not the storyboard's 32 (GAP-STG-H-intent), because 32 does not fit before the cut; the launch clip types at the storyboard's 30. (b) The intent is 84 characters; the inventory's "81" is wrong. (c) The generated rows of H-079 have 3 frames (see the owner decisions). (d) The intent fits one line at 880 px, so it does not wrap across two lines as H-078 describes; the field keeps its fixed 72 px height. (e) SC17 has no outer card and no `Intent` label (the field has an accessible name), and its heading is the shared 28 px `type-title`, not the 24 px H-077 names. (f) SC18's ladder is the 32 px dense variant under the scope, not 54 px rows in the right panel; the risk, ladder and gate are visible together instead of one at a time. (g) Added controls and copy the inventory does not list: `Confirm scope`, `Approve release`, `Review evidence`, `Open Flight Simulator`, per-row `Satisfied`/`Pending`, a gate header `Pending`/`Satisfied`, `Release target:` before `v1.0 · Stage 3 Supervised Assist`, `NetSuite · ` before `Run Supervised`, risk descriptors, the notes `Approving a job does not approve Tier 3 actions.`, `Tier 3 needs separate delegated human authority.` and the ladder note, and the examples drawer's subtitle and explanatory copy. (h) New state: `SET_INTENT`, `state.ui.factory.intent`, guard id `intent`, drawer kind `examples`, drawer routing per kind (the AP-RULE-009 drawer also opens from SC17), and `SET_INTENT` before `CREATE_AGENT` in the canonical script. (i) The domain components `AutonomyLadder`, `RiskTier`, `AgentDefinition` and `GateChecklist` now import their strings from `src/data/agent-draft.ts` and `src/data/gate.ts`; their rendering is unchanged. (j) Pointers: start coordinates and storyboard hotspots such as (600,350) and (410,350) are replaced by the real anchors; the field click is an `inert` click that lands no reducer action; the pointer is hidden during L-076 to L-079 although the storyboard says it types; H-079 travels to where the branch will appear; H-080 has no scope tab, so the pointer hovers the scope panel; H-083 clicks the 5/5 row instead of hovering; L-086 and L-089 hover only. (k) The unverified branch appears with the draft, not at L-080; the examples drawer is the inventory's full `[800,0,480,720]` drawer, not H-083's compact one. (l) SC18 shows every row at once: the H-082 80 ms check entrance, the L-083 and L-084 sequential tier rise, the L-086 count unfold, the L-088 owner-row slide and the L-089 tooltip are not product state and are left to the stage layer, as are the L-075 pill growth, the L-079 running glyph and the L-090 matched-edge slide. (m) `lk-l7-create` covers L-091 and L-092 (540 frames) but only holds SC18 there; the prompt's range ends at L-090. (n) In the clickable app `Deploy` ends on the SC21 placeholder and `Open Flight Simulator` on the SC19 placeholder until BOB-09 and BOB-08 build them. (o) No Bob run, no Bob review (SO-B5, SO-B7).
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-07. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC17–SC18. SOURCE OF TRUTH: inventory, DAT-04, section 4 and GAP-SC-L-04; H-077–H-083 and L-075–L-090. INPUTS: BOB-06.
BUILD:
1. SC17: build empty, typing, populated and unverified states. Display `Create Agent`, `Reconcile supplier invoices against purchase orders and stage the result in the ERP.`, `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`, `Unverified branch`, `Continue`. Anchor `intent`, `unverified-branch`, `continue`; type at deterministic 28–34 chars/s. Done when exact intent fits, all six sections show, uncertainty is flagged and blank intent blocks advance.
2. SC18: display `AP East`, Gmail, NetSuite, Google Sheets, `Tier 3 - Consequential`, all six autonomy stages, `5/5 verified human examples`, `28/25 representative scenarios`, `6/5 edge/negative`, `Owner approval`. Anchor `scope`, `autonomy-ladder`, `gate-examples`, `gate-owner`. Build pending and satisfied variants with `3 observed this week + 2 SME-verified archived cases`. Done when stages and provenance are correct, pending differs from satisfied, Tier 4 is barred and Deploy requires owner approval.
3. Write `film/hackathon/hk-h4d-agent.timeline.json` and `film/launch/lk-l7-create.timeline.json` with frame-indexed typing, scope inspection and gate events; sidecars expose all named anchors. Keep cinematic intent pill in the stage layer.
TRAPS: Never display test or owner checks before their actual events; selected Stage 3 is neutral, not execution cyan.
MOUNT: none. TRAPS: typing is deterministic 28–34 chars/s and scene copy must fit the available storyboard time; never replace authorization with a decorative check. QA: SO-B checks and entry-by-entry seek; report unsupported claims rather than inventing them. REPORT: files, actual checks, self-review, hash and open questions; stop.
```

### BOB-08 · Simulator and correction (H-084–H-091; L-091–L-107, 01:49–01:57 / 01:30–01:46)
**Why / depends on:** BOB-07. Demonstrate the boundary error and corrected evaluation.
**Checklist**
- [x] Pre-flight: SC19–SC20 and simulator fixtures exist (`src/data/simulation.ts`, DAT-05; the 28 scenarios, the six safe cases, the comparators).
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: 21/6/1 becomes 22/6/0; exact 2.00% boundary and row-stream are legible. Both totals sum to 28 on every results frame; the safe escalations are listed one by one and never counted as failures; the row stream and the replay were inspected in captured frames.
- [x] Accept: `hk-h4e-simulate` (240 frames) and `lk-l8-simulate` (480) timelines resolve deterministically (`film/hackathon/hk-h4e-simulate.timeline.json`, `film/launch/lk-l8-simulate.timeline.json`, sidecars under `demo/video/clips/`).
- [x] Carry-over from BOB-07 (owner decision): `lk-l7-create` frames 480-539 re-authored with SC19 (L-091 `Run Evaluation` hover, L-092 the press at f522 and the first frames of the evaluation) and recaptured; the pointer rests on `open-simulator` at f450 and the clip's earlier frames are unchanged.

Built in `demo/oryn-prototype/src/product/`, `src/state/` and `src/data/simulation.ts` by a coding-agent session with two parallel test-writing sub-agents, not IBM Bob; the owner chose to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Flight Simulator and results (BOB-08)". Verified: `bun run typecheck`, `bunx eslint .`, `bun run build` and `bun test` pass; `bun run scripts/capture.ts` captured `hk-h4e-simulate` (240 frames), `lk-l8-simulate` (480), and recaptured `lk-l7-create` (540) and `hk-h4d-agent` (210), each ffprobe-checked at 2560x1440, 30 fps, no audio, with every anchor equal to its DOM rectangle on every frame and the start, click, middle and final frames re-seeked in reverse. The clickable app was exercised in a browser: run, cancel (9 of 28 executed, 19 `Not Run`, no verdict, no cyan), run to completion (21 / 6 / 1, 27/28), replay, rule drawer, Escape, comparison, `Rerun` and v0.2 to completion (22 / 6 / 0, 28/28; `Rerun` disabled). A mutation check that let a running run reach 28 of 28 failed two tests.

Deviations and open questions: (a) The hackathon run takes 15 frames (H-084's 500 ms fill) and the launch runs 48 (the click at lk-l7 f522 to the cut at lk-l8 f30) and 16 (L-102); the 120 px / 900 ms stream translation of L-093 is not reproduced: 28 rows in 48 frames need about 270 px, so the stream follows the executing row (documented in `clip-specs-simulate.ts`). (b) `lk-l8-simulate` continues a run begun in the previous clip: a presentation field `ui.simulator.runLead` (18 frames) carries the elapsed run across the clip boundary; a new run resets it. (c) The reducer already routes on the phase, so `COMPLETE_SIMULATION` opens SC20 and `FIX_AND_RUN` SC19; after a failed v0.1 SC19 (reached by `OPEN_SCREEN`) is idle on v0.2 and its run control dispatches `FIX_AND_RUN`; `Rerun` on SC20 dispatches the same action directly. (d) The replay is a drawer (`[800,0,480,720]`, kind `replay`, only for SCN-022) and its rule link replaces it with the AP-RULE-009 drawer, which repeats the scenario, expected and actual; the inventory's "replay stays visible on the left behind the source drawer" is met by the grid's selected failed tile and by that repetition, not by two overlapping drawers. The unverified-branch warning is omitted from the rule drawer on SC20. (e) Categories: the 21 ordinary cases and SCN-022 are `Normal` (22), SCN-026 and SCN-027 are `Edge` (2), SCN-023, 024, 025 and 028 are `Negative` (4); the inventory names the chips but not their membership, and edge plus negative equals the six safe escalations the gate counts. (f) SC20's grid sits at `[264,200,472,416]` (its own anchors) and SC19's at `[300,220,472,416]`: the two screens share no anchor name with different rectangles, because a timeline holds one rectangle per name. (g) The failed scenario is anchored on its tile in the grid (left of the drawer), not on a list row; the results panel also shows the selected or failing scenario as `result-detail`. (h) H-091 and L-105 to L-107: the evaluation checks the two scenario rows at its completion, Marcus presses `Approve release` (f222 / f405) and `Confirm scope` (f234 / f417) as two separate presses because the reducer's `RELEASE_AND_START` needs both; `Deploy` is enabled and not pressed (the job starts in BOB-09). The storyboard's H-091 Deploy click and L-107 "Released" status are therefore BOB-09's; SC18 shows `Release approved`, `Scope confirmed` and the release target. (i) `lk-l8-simulate` f450-479 (L-108, SC21) holds SC18 with no pointer until BOB-09. (j) SC18's `Confirm scope` button is 160 px wide, was 128, so `Scope confirmed` fits (BOB-07 surface; `hk-h4d-agent` and `lk-l7-create` were regenerated and recaptured). (k) Not built, stage layer: the H-087 comparison underline, the H-085 numeral settle, the L-100 80 ms row stagger and the L-095 row expansion. (l) The row stream's rows show the scenario title, so SCN-022 reads `variance_exactly_2.00pct`; the other 27 read their DAT-05 names. (m) No Bob run, no Bob review (SO-B5, SO-B7).

Owner decisions for BOB-08 (the owner said to go with the recommendation for every open question, so each deviation above stands as built and none is reverted): (1) the stream follows the executing row instead of the 120 px / 900 ms translation; (2) `runLead` stays as the way a film continues a run across clips; (3) the replay stays a drawer with the rule drawer repeating expected and actual; (4) the Normal 22 / Edge 2 / Negative 4 categories stand; (5) `Approve release` and `Confirm scope` are two presses and `Deploy` is left to BOB-09, which owns the H-091 Deploy click, the L-107 "Released" status and L-108; (6) the SC18 `Confirm scope` button stays 160 px wide; (7) the stage-layer items in (k) stay with the stage layer.

Further deviations made while applying those decisions, not in the register above: (n) SC19 opened from ST08 keeps the selection made on SC20 (SCN-022 stays outlined, its detail reads `No recorded verdict for this run`) until `FIX_AND_RUN` clears it. (o) SC20's header (heading, suite line, version chips, status line) is not anchored; `sim-version` and `sim-status` exist on SC19 only, and the SC20 status reads `v0.x · Run complete · 28 of 28 run`. (p) `lk-l8-simulate` L-108 has no product action, so an explicit hidden-pointer event at f450 keeps its storyboard entry in the timeline (same rule as earlier clips). (q) `ProductProps` gained an optional `runFrame` (the clickable app's run clock) and `SimulatorUiState` gained `runLead`; neither exists in a film's own state beyond the `SET_SIMULATOR` event. (r) Existing tests were changed: `agent-timelines.test.tsx` now limits its "nothing runs, no cyan" frames to the Agent Factory and scope part of `lk-l7-create` (before f480), and `timelines.test.tsx` allows execution cyan while a simulation runs. (s) The SC20 safe-escalation rows use 11 px labels (`type-micro`) so `Missing Purchase Order` and `Over-threshold variance` are not truncated at the 496 px column. (t) `SET_COMPARE` and the `replay` drawer are refused until a SIM-AP-RECON run is complete; the `replay` case "before any completed run" is unreachable (SC20 is only entered by `COMPLETE_SIMULATION`) and has no test. (u) The state and screen test files were written by two parallel sub-agents from a written brief; the parent reviewed their findings and fixed the one source bug they reported.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-08. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC19–SC20 and simulator timelines. SOURCE OF TRUTH: inventory DAT-05, SC19–SC20, GAP-SC-L-06–07 and section 4; H-084–H-091 and L-091–L-107. INPUTS: BOB-07.
BUILD:
1. SC19: show `Flight Simulator`, `SIM-AP-RECON`, `28 scenarios`, v0.1/v0.2, Normal, Edge, Negative, `Run scenarios`, `Cancel`. Build idle, running, cancelled and finished states; anchor `scenario-grid`, `run-scenarios`. Done when 28 tiles exist, run binds to chosen version, cancel stays incomplete and cyan disappears at stop.
2. SC20: show v0.1 `21 Passed`, `6 Passed — Expected Safe Escalation`, `1 Failed`; `variance_exactly_2.00pct`, `Expected: accept`, `Actual: escalate`; v0.2 `22 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`, `28/28 intended outcomes correct`. Anchor `failed-scenario`, `replay`, `version-compare`, `results`. Done when both totals sum to 28, replay distinguishes expected/actual, comparison aligns equality verdict and completion has no cyan.
3. Encode run, failure, replay, correction and rerun in `film/hackathon/hk-h4e-simulate.timeline.json` and `film/launch/lk-l8-simulate.timeline.json`. Use 96x52 tiles, 8px gaps and launch row-stream variant; sample anchor rectangles at every frame.
TRAPS: Exactly 2.00% auto-accepts; only above 2.00% requires Tier 3 approval. Safe escalation is an intended pass, not a failure.
MOUNT: none. TRAPS: safe escalation is a passing intended outcome; do not count it as failure or erase it. QA: inspect boundary before/after, each run's counts, direct seeks and SO-B6; review every item Done when. REPORT: actual checks, changed files, commit and unresolved issues; stop.
```

### BOB-09 · Job, approval and unknown outcome (H-092–H-103; L-108–L-126, 01:57–02:08 / 01:46–02:03.50)
**Why / depends on:** BOB-08. Preserve truthful outcomes and independent verification.
**Checklist**
- [x] Pre-flight: BOB-08, SC21–SC25, eleven-case fixtures (`src/data/invoices.ts`, `src/data/approval.ts`, DAT-02).
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: 7/2/1/1 initial, 8/2/0/1 only after readback; unknown cannot be resubmitted. Inspected in captured frames of both clips: the stopped job has no cyan, `Awaiting verification` never shows `Verified Complete`, the unknown card stays 1 through the readback, and no screen has a retry or resubmit control.
- [x] Accept: both job timelines exist (`film/hackathon/hk-h4f-job.timeline.json` 330 frames, `film/launch/lk-l9-run.timeline.json` 525 frames, 17.5 s, ends 02:03.50; sidecars and MP4s under `demo/video/clips/`).

Built in `demo/oryn-prototype/src/product/`, `src/state/` and `film/` by a coding-agent session with parallel sub-agents (one per screen group, one for the reducer tests, two for the clip specs, one read-only reviewer), not IBM Bob; the owner said to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Jobs, approval and unknown outcome (BOB-09)".

Deviations and open questions for BOB-09: (a) `RELEASE_AND_START` now needs the `Confirm job scope` dialog to be open (new guard `jobScope`) and two new presentation steps precede it (`CONFIRM_SELECTION`, `OPEN_JOB_SCOPE`; cancel is `CANCEL_JOB_START`); the canonical script includes them, and `Deploy` on SC18 now opens the job queue (`OPEN_SCREEN SC21`) instead of starting the job, because BOB-08's owner decision left the Deploy click to this step and the storyboard's `Start Job` is a SC21 control. (b) The hackathon cut has no Deploy press and no `Confirm 11 invoices` or `Confirm job scope` press: 30 frames cannot hold three presses before `Start job`, so `hk-h4f-job` replays them as cuts at f0 and shows only `Start job` (H-092); BOB-08's `hk-h4e-simulate` (240 frames) is unchanged. (c) The launch cut's L-108 (`Confirm 11 invoices`, SC21) lives in the last 30 frames of `lk-l8-simulate`, so that clip's tail (f450-479, formerly a hidden-pointer hold of SC18) was re-authored and recaptured; its frames 0-449 are unchanged. (d) H-103 (`Layout changes`, 02:08) belongs to `hk-h4g-heal`; `hk-h4f-job` is H-092 to H-102 (330 frames, as the section 0.3 table says), and the last entry shows SC05 with the Kestrel document without `NEXT_CYCLE_INCIDENT` (that action enters ST12 and flips the theme dark, which is the next clip's). Likewise `lk-l9-run` ends at 02:03.50 in the middle of L-126 and shows the Kestrel document there; the three-card incident, the dark wipe and the stage text are the stage layer's. (e) SC22 header at y 188 and rows from y 220 (not 252) so the approval and unknown rows centre on the inventory's P(1050,524) and P(1050,556); the summary strip is therefore 72 px (not 92). (f) SC22 filters dim rows in place instead of removing them, so no anchor ever moves. (g) The row order of evaluation is the storyboard's, not table order (seven verified, then the two missing-PO escalations, then the approval and the unknown case in the hackathon cut; L-110 to L-113 order in the launch cut); the cyan row is the first still-queued row in table order. (h) L-122 shows the `Before approval` snapshot after L-118's readback in the storyboard order, so a presentation field `ui.job.snapshot` (`before`, labelled `Earlier snapshot`) keeps the stored 7 / 2 / 1 / 1 on screen; the business state is already 8 / 2 / 0 / 1 by then and the next beat (L-123) switches back to `current` with the 150 ms swap. The hackathon cut has no such conflict. (i) L-118's cyan readback line and L-121's stage headline are not product state and are left to the stage layer; the 80 ms row stagger (H-093) and the 70 ms check stagger (H-094) are approximated by the evaluation frames. (j) `Awaiting verification` is its own timeline interval (overlay `job:awaiting-verification`) between the `APPROVE` and `VERIFY_READBACK` events. (k) The summary reads `No approval decision recorded · INV-48219 remains Approval Required` instead of the prompt-less literal `No approval is pending`, which would be false while INV-48219 still needs approval. (l) The clickable app has its own job clock (`ProductApp.tsx`: 450 ms per case, then the pause) and delivers the independent readback 1.5 s after an approval; a film never uses them. (m) No Bob run, no Bob review (SO-B5, SO-B7).

Owner decisions for BOB-09 (the owner said to go with the recommendation for every open question, so each deviation above stands as built and none is reverted): (1) `Deploy` on SC18 stays an action that only opens the SC21 queue; the job starts from `Start job` on SC21, and no reducer split of release and start is made. (2) `hk-h4f-job` keeps its 330 frames and replays the Deploy press and the two confirmations as f0 cuts; `hk-h4e-simulate` is not changed and gets no Deploy press.

Further deviations made while building and reviewing, not in the register above: (n) SC21's queue header is one spanning cell (`Proposed selection` / `Selection fixed · 11 invoices`) with Amount, PO and Selection labels; it has no separate Invoice and Supplier column labels. (o) SC21's version row reads `Release approval pending` until `releaseApproved`, and the population row `Proposed: not frozen until confirmed` until `CONFIRM_SELECTION`, so neither claims more than the state shows. (p) SC21's status chip is `StatusGlyph` plus the `jobLabel` text (`Queued` right after the start) rather than `StatusBadge`, which would read `Running`; the job-row column widths were re-flowed (name 248, team 80, population 104, status 196) so the status chip does not overlap `Confirm job scope`. (q) After the start, `Confirm job scope` stays visible and disabled (`JOB-0117 is already started.`) and an `Open job progress` button (no film anchor) leads to SC22. (r) SC22's progress-part rects moved (status 192 wide, `open-summary` 128 wide at y 112, the filter chip 328 wide) so the filter text fits; a decision note (`Approved · Awaiting verification`) sits on a second line of the status cell; `approval-row` and `unknown-row` are transparent overlay buttons on the row rect, and the `Review` and `Evidence` labels appear only when the reducer would accept that route. (s) While the job is stopped SC22's status shows no glyph at all (no `Stopped` text), so nothing can read as cyan. (t) The authority card in SC23 keeps `Authority confirmed` for Daniel after a decision (it reads `approvalBlock`, not the reducer's "decision already recorded" reason), and after the readback the disabled decision buttons carry `INV-48219 is not waiting for approval.`. (u) SC23's three evidence items open their sources (the invoice document on SC05, the NetSuite bill and PO on SC06) or toggle the expanded evidence (AP-RULE-009 and the `Evidence` heading); the heading is not keyboard-focusable. (v) SC24's information control reveals the tip on hover and focus as well as on click; a click while the tip is already open (from hover or focus) closes it. (w) SC25's `job-summary` anchor is an empty, `aria-hidden`, pointer-events-none sibling at the `JOB_SUMMARY` rect rather than a parent; the readback strip also reads for rejected, changes-requested and mismatch decisions, and shows both snapshot sums only after the readback. (x) Placed pointers with no target precede each pointer hide and several restarts in both clips (`validateTimeline` rejects a hidden pointer that keeps a hover target), so the H-101 and H-102 travels in `hk-h4f-job` start at f271 and f301 and land at f286 and f316; in `lk-l9-run` the approval drawer is still open at f299 and `OPEN('SC22')` closes it at f300. (y) The Gmail anchors `lk-l9-run` and `hk-h4f-job` carry for the Kestrel document are the BOB-05 ones; no new work-application surface was built. (z) The generic timeline test that forbids cyan on every frame was relaxed to allow it while `running.job` is true (the job's execution cyan), like it already did for `running.simulation`.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-09. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC21–SC25 and job timelines. SOURCE OF TRUTH: inventory section 4, DAT-02, SC21–SC25 and product gaps; H-092–H-103 and L-108–L-126. INPUTS: BOB-08.
BUILD:
1. SC21: show `JOB-0117`, `Supplier Invoice Reconciler v1.0`, `AP East`, `11 invoices`, `Confirm job scope`, `Start job`. Anchor `job-preflight`, `start-job`; build eligible, blocked and cancelled variants. Done when version and fixed scope are visible, confirmation precedes run, unauthorized start explains why and cancel starts nothing.
2. SC22: render all eleven exact DAT-02 rows; show queued, running and finished states. Anchor `job-progress`, `approval-row`, `unknown-row`. Done when eleven identities match, initial counts are 7/2/1/1, verified counts are 8/2/0/1 and stopped execution is neutral.
3. SC23: show INV-48219, Brightwater Industrial, `Invoice $18,420.00`, `PO-1042 $17,980.00`, `Variance $440.00 / 2.45%`, `Daniel Okafor · Tier 3`, `Variance Hold`, `Matched - Variance Approved`, `Awaiting verification`. Anchor `approval-diff`, `approve`, `readback`. Done when values and authority match, decisions differ and verified count changes only after readback.
4. SC24: show INV-48220, Northgate Pallets, `$2,732.50`, PO-1044, `Outcome Unknown`, `ERP submit timed out`, `Held`, `Not resubmitted`, `Investigate`. Anchor `unknown-case` and `investigate`; build held and evidence states. Done when facts and missing evidence remain visible, no retry exists and unknown persists after approval.
5. SC25: show `Partially Complete` and initial `7 Verified Complete`, `2 Escalated`, `1 Approval Required`, `1 Outcome Unknown`; after independent readback display 8/2/0/1 by 150ms replacement. Anchor `job-summary`. Done when both snapshots match, unknown persists, approval alone does not increment verified and category filters work.
6. Write `film/hackathon/hk-h4f-job.timeline.json` and `film/launch/lk-l9-run.timeline.json`; launch ends 02:03.50 after 17.5s/525 frames. Encode selection, authorization, awaiting verification and independent readback as separate events.
TRAPS: No retry or resubmit control, no `11 successful`, no false completion or cyan while stopped.
MOUNT: none. TRAPS: never say 11 successful or count approval as verified before evidence. QA: inspect every state and status glyph, both timeline boundaries, and run SO-B5–SO-B6. REPORT: changed files, exact results, Bob review, commit and open questions; stop.
```

### BOB-10 · Contain, teach, repair and release (H-104–H-116; L-124–L-144, 02:08–02:22 / 02:03.50–02:24)
**Why / depends on:** BOB-09. The dark wipe and containment precede the repair.
**Checklist**
- [x] Pre-flight: SC26–SC29, APP-05, FX-01 and incident fixtures exist (`src/data/incident.ts`, `src/data/regression.ts`, DAT-07).
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: 400ms wipe (12 frames; first, middle and last frames inspected at edges 107, 640 and 1280 px), 3 held cases, $38.50, 34 scenarios (28 / 6 / 0) and verified 3/3 release. Inspected in captured frames of both clips.
- [x] Accept: both heal timelines include the complete wipe and correct duration (`film/hackathon/hk-h4g-heal.timeline.json` 420 frames, wipe f30-f41 = 02:09.00-02:09.40; `film/launch/lk-l10-heal.timeline.json` 615 frames, wipe f9-f20 = 02:03.80-02:04.20; sidecars and MP4s under `demo/video/clips/`).

Built in `demo/oryn-prototype/src/product/`, `src/state/` and `film/` by a coding-agent session with parallel sub-agents (one per screen group, one for the heal timeline tests, one read-only reviewer), not IBM Bob; the owner said to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Contain, teach, repair and release (BOB-10)".

Boundary and frame counts: the hackathon clip starts at 02:08.00 (film frame 3840, 420 frames) and the wipe begins at 02:09.00, after the boundary, so neither adjoining boundary moves. The launch clip starts at 02:03.50 (film frame 3705, 615 frames, ends 02:24.00) and the wipe 02:03.80-02:04.20 lies inside it (f9-f20); the wipe is not earlier than the clip start, so no boundary shift is needed.

Deviations for BOB-10: (a) `CONTAIN_INCIDENT` now sets the dark theme (previously entering ST12 did), so ST12 begins light with the incident open and the wipe is the containment visual; `EXPAND_AND_CLOSE` is split into `EXPAND_RELEASE` and `CLOSE_INCIDENT` (the storyboard has two owner presses, H-116 and L-143/L-144); `TEACH` needs a complete draft (`SET_TEACH_ANSWER`, `LINK_TEACH_RULE`); `SC27` opens from ST12 and `SC29` from ST14. (b) The hackathon clip has no light pre-containment SC26 frames of its own: its light state exists only as the right half of the wipe. (c) The SC26 status text reads `Contained` from the containment landing frame, including the 12 wipe frames; its glyph and the three pause glyphs enter after the wipe (L-127, 80 ms apart). (d) The pointer's `Open repair diff`, `Approve limited release` and `Close incident` presses name no target anchor because the control disappears with the press (same rule as earlier clips). (e) The hackathon clip is dark from f42 to the cut at f330 (`SET_THEME light`, H-114 `hard cut back to light UI`); the launch clip applies `SET_THEME dark` with the limited release because the storyboard lets L-144 keep the dark incident theme while the reducer returns to light at ST15. (f) `ProductFilmSurface` now follows `state.theme`; the capture script still does not capture a theme change by itself. (g) The clickable app's cohort clock delivers each simulated independent readback one second apart (as the ERP readback clock does after an approval); a real readback source is outside the prototype. (h) The held-timeout context of APP-05 is selected by `SELECT_CASE INV-48220` because `RECORD_IDS`/`OPEN_BILL` do not include it. (i) 12 frames at 30 fps is the 400 ms wipe; the inventory's '24 frames at 60 fps' is the same 400 ms. (j) L-145 and L-146 (02:22-02:24) are BOB-11's entries; `lk-l10-heal` holds the closed incident there without a pointer.

Owner decisions for BOB-10 (the owner said to go with the recommendation for every open question): (1) the SC26 status reads `Contained` throughout the wipe (the reducer has already contained the cases at the landing frame, so the earlier `Containing` word, which is not an inventory string, is removed); (2) the cohort clock stays as the clickable app's simulated independent readback, one per second, and deviation (g) stands; films use explicit timeline events.

Further deviations made while applying those decisions and the review, not in the register above: (k) The invented status word `Containing` is removed (decision 1), so the `incident` status text no longer changes at the end of the wipe; only its glyph does. (l) The held timeout of APP-05 no longer wins over an opened INV-48231 bill: the opened record decides, so Elena's manual-completion form stays reachable after INV-48220 was selected (reviewer finding); `app05.test.tsx` now pins that order-independent rule instead of the earlier one. (m) The SC27 `Yes`, `Link rule`, `Save correction` and `Review repair` controls use the shared `Button` `disabled`/`disabledReason` props so the prerequisite text is associated with the control (reviewer finding). (n) `SC29` `close-incident` moved from y 610 to y 580 (it overflowed the watch panel, which ends at y 632), and the expansion refusal note is 40 px high at y 536, so the inventory hotspot P(1090,630) is replaced by the anchor's own centre. (o) `timelines.test.tsx` now allows the cyan colour while `running.regression` as well as the simulation and the job; `anchors.test.tsx` and `lifecycle.test.ts` were updated for the built routes SC26 to SC29 (the `route not built yet` case now opens SC30) and for the theme turning dark at the containment instead of at ST12 entry; `guards.test.ts` pins the split expansion, the closure and the draft. (p) The authoring script was rerun for every clip; no earlier timeline or sidecar changed (git shows only the two new heal timelines). (q) A stray untracked `t-rec.mp4` at the repository root, of unknown origin and not part of any step, was deleted before the commits. (r) `ReleaseScreen` row labels fade together when a readback lands (`film.lastApplied` knows the action type, not the outcome index); the release test pins the final states only. (s) Bob is not used: the SO-B5 and SO-B7 evidence stays unmet.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-10. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC26–SC29, APP-05 and FX-01. SOURCE OF TRUTH: inventory section 4, DAT-07 and Part D; H-104–H-116 and L-124–L-144. INPUTS: BOB-09.
BUILD:
1. SC26: show `INC-0042`, `Contained`, `3 affected cases paused`, `INV-48231`, `INV-48233`, `INV-48236`, `Supplier document format change — unconfirmed`. Anchor `incident`, `affected-cases`, `fee-comparison`; build light and dark containment states. Done when all three cases are individually paused, hypothesis is unconfirmed, first invoice/PO/fee reconcile, no cyan remains and unrelated cases are not implied paused.
2. SC27: show `Teach Oryn What Changed`, Elena Ruiz, `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?`, `Yes`, `Billed on top of subtotal; within approved terms`, `AP-RULE-017 Supplier handling fees`, `Kestrel Components layout v2 only`. Anchor `teach-question`, `correction-source`. Done when question/answer and rule are visible, scope is limited and explicit save is required.
3. SC28: show `REP-0042-1`, `Permissions unchanged`, `Policy unchanged`, `6 new regression cases`, `34 scenarios`, `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`. Anchor `repair-diff`, `regression-results`; build not-run, executing and completed variants. Open SC28's full Done when and verify every checklist clause; no premature release.
4. SC29: build limited release, 3/3 independent verification, owner expansion and incident closure as separate states. Anchor `limited-release`, `verified-three`, `expand-release`; open the inventory Done when and verify each clause against evidence.
5. APP-05: show Elena's manual INV-48231 `$4,213.50`, PO-1051 `$4,175.00`, `$38.50`; separate peer validation and held INV-48220 timeout. Anchor `manual-completion`; done when contexts differ, timeout lacks retry, Elena's amounts match and HUD leaves fields accessible.
6. FX-01: render one 400ms frame-index light-to-dark wipe at containment, not a toggle. Launch starts 02:03.50; wipe 02:03.8–02:04.2 is inside 20.5s/615-frame clip. Hackathon starts 02:08.00; if wipe begins earlier, shift both adjoining boundaries to at least 0.3s before its start and recompute frames. Verify wipe first, middle and last frames.
7. Write `film/hackathon/hk-h4g-heal.timeline.json` and `film/launch/lk-l10-heal.timeline.json` with containment, manual completion, teaching, regression and verified release events and named sidecar anchors.
TRAPS: no 33/27 counts, no premature repair or release, no cyan while stopped; hypothesis remains unconfirmed.
MOUNT: none. TRAPS: never imply hypothesis is confirmed or release without 3/3 evidence; no 33-test obsolete copy. QA: seek the wipe's first/middle/last frames and all state transitions; run SO-B checks. REPORT: exact boundary, frame counts, files, commands, review, commit and questions; stop.
```

### BOB-11 · Breadth and application capabilities (H-117–H-132; L-145–L-160, 02:22–02:38 / 02:24–02:44)
**Why / depends on:** BOB-10. Complete all remaining filmed product states.
**Checklist**
- [x] Pre-flight: SC16, SC30–SC36, APP-09–APP-10, APP-13 and fixtures exist (`src/data/{versions,policy-impact,notifications,audit,capabilities,operations-graph}.ts`, `src/assets/marks/`).
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: policy 34 tests (equal to `REGRESSION_SIZE`, tested), peer fix, blocked 12% discount (no approval path exists), map edges neutral with relation labels, explicit `— Unavailable` capabilities. Inspected in captured frames of both clips.
- [x] Accept: `film/hackathon/hk-h4h-breadth.timeline.json` (480 frames, 02:22.00) and `film/launch/lk-l11-breadth.timeline.json` (600 frames, 02:24.00) exist with sidecars and MP4s under `demo/video/clips/`; `lk-l10-heal` was extended and recaptured for L-145 and L-146.

Built in `demo/oryn-prototype/src/product/`, `src/state/` and `film/` by a coding-agent session with four parallel sub-agents (one per screen group) and one read-only reviewer, not IBM Bob; the owner said to build this step without Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. Files, anchors, state rules and the per-clip frame map are in `demo/oryn-prototype/README.md` under "Breadth and application capabilities (BOB-11)".

Deviations and open questions for BOB-11: (a) `lk-l10-heal` carries L-145 and L-146 (SC30 at 02:22 to 02:24 lies inside its 02:03.50 to 02:24.00 interval): f555 `OPEN_MONTAGE` plus four `NEXT`, so the product is at ST21 there; `lk-l11-breadth` restarts from ST17 and passes ST21 and ST22 in one frame. (b) The montage order of the cuts is not the state order: the hackathon cut shows SC31 (ST19) before the peer card (SC04 opened inside ST19). `ENTRY_EFFECTS` now bring the NetSuite and HubSpot tabs forward at ST18 and ST20. (c) The reducer gained `restoredVersion`, the `restore-version` grant, `DENY_UNSAFE_REQUEST` (Daniel only; an approval is never modelled), a second `REQUEST_APPROVAL` is refused, and the `ui.breadth` slice; `RESTORE_VERSION` only records the future-only restore, nothing later consumes it because no job starts after it. (d) `EXPORT_AUDIT_PACK` keeps no confirmation guard: the canonical script and existing tests export directly, so the confirmation is a UI gate (review finding, not changed). (e) SC35 lists every occurred notice with a recipient label for the Workflow Owner, Approver and Admin viewpoints (Employees see only their own), and `SURFACE_TOAST` accepts any occurred notice for an internal viewpoint, because the storyboard shows the approval, incident and reminder together although they are addressed to three people (DAT-10 says recipient-specific; review finding left as an owner decision). At ST24 the list also holds N-04 and N-05, which have occurred; the camera crops to the first three. The incident card reads `3 affected cases paused` (inventory) and its detail keeps the fixture sentence `three Kestrel cases paused`. (f) SC34 shows the latest 12 of the 14 recorded events at 32 px rows with the omitted count stated; the fixture's A11 (34-scenario regression evaluation) is the evaluation row, so GAP-SC-L-16's `SIM-AP-RECON v0.2 | 28 scenarios` row is not drawn (review finding, left open); fixture verbs (`Publish`, `Approve release`, `Expand and close`) win over the inventory's example rows. (g) SC30's compare control sits at y 344, not P(760,300); the SC32 card is 252 px high, not 200, so `Request approval` sits inside it; SC36 tiles are about 131 px wide (7 x 140 + gaps does not fit 992 px) and the cell detail is a fixed popover beside `Gmail · Observe`. (h) SC31 shows its impact rows from the frame ST19 is entered, so H-120 and H-121 share one state and the H-121 `warning glyphs resolve in 150 ms` is not built as a separate motion; the proposed boundary tests appear by a cut (f120 hackathon, f90 launch), not by a filmed press. (i) The SC30 explanation uses `bg-foreground text-background`, so it inverts with the theme (pale on the dark scene) instead of a fixed ink. (j) APP-13 is the same `timeout-banner` anchor BOB-10 put in the NetSuite view, moved to [872,90,360,88] with `Review` and a close control; the L-016 toast of `lk-l2-chaos` stays a stage-layer item (BOB-05 owner decision), so no breadth clip films it. (k) `scripts/capture.test.ts` no longer has a registered clip without a surface to test `surface-missing`; it now asserts every registered clip has one. (l) The reviewer's `restoredVersion` note stays open; the Operations Map edge labels it asked for were added; no Bob run, no Bob review.

Owner decisions for BOB-11 (the owner said to go with the recommendation for every open question; no code changed for them, so the deviations above stand as built): (1) SC35 follows the storyboard, not strict per-recipient delivery: the Workflow Owner, Approver and Admin viewpoints see every occurred, undismissed notice with an explicit recipient label, Employees see only their own, and `SURFACE_TOAST` takes any occurred notice for an internal viewpoint (deviation e). DAT-10's per-recipient rule is honoured for Employees and for dismissal (only the recipient can dismiss) and opening still checks the viewer's own access. (2) The SC34 export confirmation stays a UI gate; `EXPORT_AUDIT_PACK` keeps no confirmation guard because the canonical script and the lifecycle tests export directly (deviation d). (3) The SC34 evaluation row is the fixture's A11 (34-scenario regression); no `SIM-AP-RECON v0.2` event is invented, because DAT-11 defines A01 to A15 and no timestamps or actors may be fabricated (deviation f). (4) `RESTORE_VERSION` stays a record of the future-only restore; no consumer is added because no job starts after ST21 in any cut (deviation c). (5) No further deviations were introduced while applying these decisions.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-11. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: implement SC16, SC30–SC36, APP-09–APP-10 and APP-13. SOURCE OF TRUTH: inventory items, DAT-09–12 and Part D; H-117–H-132 and L-145–L-160. INPUTS: BOB-10, PRE-02 brand marks.
BUILD:
1. SC16: `Operations Map`, `AP-RULE-009 Variance threshold`, `AP-RULE-017 Supplier handling fees`, `Supplier Invoice Reconciler`, `INC-0042`, `Graph`, `Table`. Anchor `map-agent`; select agent and neutral rule/incident edges. Done when object types show, edges remain neutral, details cite rule/incident and table matches graph.
2. SC30: show version history v0.1, v0.2, v1.0, v1.1, compare and rollback; anchor `version-row`. Build history, selected comparison and guarded restore states. Check every SC30 Done when before accepting.
3. SC31: show policy 2.00% → 1.50% effective Dec 1, one playbook, one agent and 34 tests `Needs Revalidation`; anchor `policy-impact`. Build impact and review states and check each SC31 Done when.
4. SC32: show `12% discount`, `Requires Tier 3 approval - Daniel Okafor`, `Request approval`. Anchor `blocked-action`; submission stays blocked. Check every SC32 Done when.
5. SC33: render Command Center and 14-Day X-Ray only from fixture-backed values; anchor `command-center`. Build summary and detail states and check all SC33 Done when.
6. SC34: render audit history and export confirmation with actual fixture records; anchor `audit-export`. Build confirmation and cancel states and check all SC34 Done when.
7. SC35: render notification list and one toast at a time; anchor `notifications`. Build unread/read and notification-open states and check all SC35 Done when.
8. SC36: show Gmail, NetSuite, Google Sheets, Slack, Zoom, HubSpot and Chrome capabilities `Observe`, `Guide`, `Assist`, `Run Supervised`, `Run Autonomously`; unavailable is explicit. Anchor `capability-matrix`. Check every SC36 Done when including Zoom per-meeting opt-in.
9. APP-09: original HubSpot discount draft, blocked submit and approval request; anchor `discount-draft`. Done when 12% and approver are visible, submit stays blocked, request does not approve and no unrelated deal is invented.
10. APP-10: show seven demonstrated marks and grey Salesforce, Outlook, Excel, Teams, Meet, Edge. Anchor `adapter-tiles`. Done when all thirteen names appear, six extras are grey, unsupported cells say unavailable and Zoom is qualified.
11. APP-13: show `Submission timed out`, `Outcome Unknown`, `Held`, optional `Review`; anchor `timeout-banner`. Done when timeout is explicit, hold survives dismissal, Review opens correct case and text remains readable.
12. Write `film/hackathon/hk-h4h-breadth.timeline.json` and `film/launch/lk-l11-breadth.timeline.json`, with exact entry-local state changes and per-frame anchors. F3 plates are allowed only where no interaction is filmed.
TRAPS: 34 tests, not 33; only fixture values; no cyan on idle selection, invented customer or unlocked unsafe action.
MOUNT: none. TRAPS: 34 is binding, not older 33; unavailable is never merely ambiguous grey. QA: compare all entry states, required click transitions, labels and SO-B checks. REPORT: IDs, files, exact test results, review and commit; stop.
```

### BOB-12 · Product gap pass (H-014–H-132; L-010–L-160, 00:10–02:38)
**Why / depends on:** BOB-11. Close every product-side Part D gap without taking ownership of stage graphics.
**Checklist**
- [x] Pre-flight: all Bob screens and `docs/video/mock-build-inventory.md` Part D.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [x] Verify: every GAP-SC and GAP-CMP is mapped to its original owner and its Done when checked; timelines updated. The ledger is `docs/video/bob-12-gap-ledger.md` (30 product gaps with entries, files, viewed frames; decisions 1-18; defects fixed; open questions).
- [x] Accept: no unaddressed product gap; stage gaps remain assigned to KIT (the 35 `GAP-STG-*` owners are listed in the ledger; no stage graphic or screenshot is in a product clip).

Built and audited by a coding-agent session with four parallel sub-agents (onboarding/discovery, simulator, job, breadth), not IBM Bob; the owner said to skip Bob, so the Bob run and the Bob review (SO-B5, SO-B7) stay unmet and must not be claimed. All 30 product gaps are MET; two are met with a recorded limit (GAP-SC-L-12: SC30 shows in `lk-l10-heal` f585-f614, not at the start of `lk-l11-breadth`; GAP-SC-L-16: the `Export authorized records only?` confirmation needs a press the 30-frame entry does not film). The audit found most gaps already satisfied by BOB-04 to BOB-11; it changed `Shell.tsx` (full Marcus identity), `FactoryScreen.tsx`, `EvidenceDrawer.tsx`, `scope-layout.ts` (selected-queue row), `ResultsScreen.tsx` and `SimTiles.tsx` (replay card, row stream, safe-escalation rows), `JobScreen.tsx`, `JobDrawers.tsx` (escalated-row selection, source/postcondition cards), `JobSummaryScreen.tsx`, `job-layout.ts`, `RepairScreen.tsx`, `VersionsScreen.tsx`, `CommandScreen.tsx`, `AuditScreen.tsx`, `NetSuiteView.tsx`, `contract.ts` and `InvoiceDocument.tsx` (an action on clip frame 0 is the start state and has no entry motion; this removed the blank first frame of `hk-h4g-heal`) and the matching specs and tests. All 16 kept clips and sidecars were recaptured; `hk-h4a-enroll` and `lk-l4-privacy` were captured to a scratch directory only (CAP-02, CAP-11 stay unticked). Verified: `bun run typecheck`, `bunx eslint .` and `bun test` (1242 tests) pass; every captured clip is 2560x1440, `r_frame_rate 30/1`, no audio, with frame counts equal to the roadmap table. No open question remains for BOB-12; the tracker rows on the D1 day (`hk-h4b-observe` f48) go to BOB-13.

Owner decisions for BOB-12 (the owner said to go with the recommendation for every open question): (1) the tracker rows shown on the D1 day (`hk-h4b-observe` f48) are left as built and handed to BOB-13, the continuity audit; (2) SC30 stays in `lk-l10-heal` f585-f614, `lk-l11-breadth` keeps its ST17 start (GAP-SC-L-12); (3) the eight stage gaps no prompt named now have owners with a `Verify stage gap` line in the checklists of HK-07 (D1 overlay), HK-12 (Kestrel PO card), LK-02 (oversized cursor, camera only), LK-04 (neutral observation), LK-05 (mask reveal caption), LK-06 (lifecycle micro-compositions), LK-07 (matched edge) and LK-11 (four-column grid); (4) the SC34 export confirmation is not filmed, because a press cannot land inside the 30-frame L-157 entry before L-158 begins; (5) the product keeps landing the three cohort readbacks together at `lk-l10-heal` f471 and the stage staggers its own checks and closes the ring after the last; (6) no clip duration changed. The full deviation register (D1 to D19: wrapped role identity, Start job at f34, per-row escalation selection, the SC20 replay card covering tile rows, 19 px row-stream rows, the H-137 and H-140 source clip, SC33 counts split across two panels, the frame-0 start-state rule and the other changes with their reasons) is in `docs/video/bob-12-gap-ledger.md`.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-12. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: apply all product-side Part D gaps as amendments to BOB-00–BOB-11, without creating a second owner. SOURCE OF TRUTH: docs/video/mock-build-inventory.md Part D, all GAP-SC-* and GAP-CMP-* and resolved decisions 1–18; H-014–H-132 and L-010–L-160. INPUTS: all prototype items and timelines.
BUILD:
1. Enumerate every GAP-SC and GAP-CMP heading from Part D; associate each with its original owner and storyboard entries. Open each exact content, states and Done when, then amend its screen and timeline.
2. Verify notice, role, neutral guidance, pending gate, failed replay, preflight, distinct missing POs, `Partially Complete`, separate approval/readback, manual completion before Teach, solid text outside hatch and independent postcondition.
3. Verify launch confidence, policy drawer, queue selection, scenario row stream, fixed eleven-case selection and unavailable resubmit. Ensure genuine Plex Mono 700, 30 fps and 34-scenario resolution. Update affected named anchor records.
4. Record stage-side GAP-STG owners without baking stage graphics or screenshots into product clips. Output per-gap acceptance, actual source entry and per-frame evidence.
TRAPS: Section 4 decisions override obsolete text; do not omit a GAP because its screen already exists.
MOUNT: none. TRAPS: if a gap conflicts with an older screen spec, the resolved decision and gap wins; don't silently omit any gap. QA: produce an item-by-item ledger with entry IDs, affected files, actual visual evidence and Done when; run SO-B5–SO-B6. REPORT: all gaps completed or explicitly blocked, verification commands, commit and questions; stop.
```

### BOB-13 · Numeric and continuity audit (H-063–H-132; L-045–L-160, 00:44–02:38)
**Why / depends on:** BOB-12. Resolve fixture contradictions before recording.
**Checklist**
- [ ] Pre-flight: all DAT modules, product surfaces and 18 clip timelines.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: exact case totals, 2.00% boundary, 34-test repair, pending approvals and source continuity.
- [ ] Accept: audit covers all timelines; Bob fixes discrepancies and reports actual results.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-13. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: audit product facts and frame continuity. SOURCE OF TRUTH: inventory DAT-01–DAT-13, section 4 and Part D; H-063–H-132 and L-045–L-160. INPUTS: BOB-12.
BUILD:
1. Audit DAT-02 and JOB-0117: 11=7+2+1+1 before approval; 11=8+2+0+1 only after independent readback. INV-48219 `$18,420.00` minus `$17,980.00` is `$440.00`, 2.45%; INV-48220 remains held.
2. Audit DAT-05: 28=21+6+1, corrected 28=22+6+0, repair 34=28+6+0. Check boundary exactly 2.00%; retain six safe escalations as passes.
3. Audit gate provenance 5/5 = 3 observed + 2 archived, pending authorization, three incident cases, $38.50 fee and 3/3 independent release. Cross-check every matching screen's exact inventory Done when.
4. Seek all 18 timelines, check stable invoice IDs and named anchors at each visible frame, no product captions and no cyan when stopped. Fix contradictions at their source and report every affected frame and item.
TRAPS: Never suppress checks, use 33/27, count approval as verified, or expose a retry for unknown.
MOUNT: none. TRAPS: compare against section 4, not obsolete script 33 or 60 fps. QA: run full relevant prototype checks and self-review all corrections; report exact mismatches and affected IDs. REPORT: audit matrix, commands/results, changed files, commit and remaining issues; stop.
```

### BOB-14 · Record the real Bob review (H-048–H-056, 01:12–01:22, 10 s)
**Why / depends on:** BOB-13. Produce genuine evidence for the Bob segment.
**Checklist**
- [ ] Pre-flight: reviewed prototype changes, real named pull request, Bob session and screen-recording setup from PRE-01.
- [ ] Run the prompt in IBM Bob from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: recorder captures authentic Bob review, named PR, actual file and actual result; secrets and notifications are absent.
- [ ] Accept: `demo/video/footage/bob-review.mov` and truthful slot notes exist; no finding is invented.
**Prompt (paste into IBM Bob)**
```text
Obey ROADMAP.md section 0.5 (SO-B1 to SO-B8).
STEP: BOB-14. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. GOAL: genuine review of a real named pull request, captured for H-048–H-056. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-048–H-056 and inventory STG-09; prototype changes from BOB-00–BOB-13. INPUTS: actual PR URL and title supplied by the user, approved recording setup.
BUILD:
1. Identify the real named pull request and its URL; if unavailable ask the user. Close notifications, private tabs, credentials and internal hostnames; choose readable editor scale.
2. RECORD START: the user starts capture. Open the actual PR and ask Bob to review its real diff for deterministic seeking, separate consent, held unknown, numeric consistency and authorization gates. Record genuine prompt and unmodified response.
3. RECORD STOP: save `demo/video/footage/bob-review.mov`; if necessary keep original privately and export irreversibly redacted footage. Record actual [BOB_PR_NAME], [BOB_PR_URL], [BOB_REVIEW_REQUEST], [BOB_REVIEW_RESULT], [BOB_OUTCOME], reviewed file, real flagged issue or `none`, and actual fix/commit hash.
4. Inspect authentic editor and cursor at the storyboard crop. If review changes code, self-review, test and recapture affected clips.
TRAPS: Never invent PR details or Bob findings; do not stage a response. Keep unobserved slots explicitly unresolved.
MOUNT: none. TRAPS: a screen recording is evidence, not staged typography or a fabricated finding. QA: inspect the file at the actual 1280x720 crop and ensure text and cursor are legible and private material absent. REPORT: exact real slots, changed files, PR and commit, checks, unobserved facts and open questions; stop.
```

## 1.3 Build the reusable stage kit with Opus

These prompts create source in `demo/video/stage-kit/`. They do not create the actual film scenes. After HK-00 and LK-00 create projects, sync the kit into each project's `assets/kit/` and `compositions/`; never overwrite scene files. For pre-project QA use a disposable kit-owned harness and remove it after checks. SO-O7–SO-O9 apply inside that harness; do not create a final render.
### Stage-kit integration contract

KIT steps build these exact reusable **source snippets**, not independently running nested compositions. Sync copies snippets to each project's `assets/kit/`; an HK/LK scene copies the relevant markup, style and tween statements into its own `<template>`, prefixes every element ID with its scene ID, and adds those statements to that scene's single paused GSAP timeline. No snippet may register a second timeline or reach outside its own scene. Use the declared `data-var-text` / `data-var-src` bindings on real markup; values are supplied in the scene's composition variables. A root mount uses a normal scene host with its own absolute start and duration; a snippet's times remain local to the scene.

| Component | Source under `demo/video/stage-kit/` | How to mount in a scene | Variables / API |
|---|---|---|---|
| Stage canvas / card / crop marks | `snippets/stage.html` | Copy needed elements inside the scene root; use `.kit-stage` and `.kit-card` on untimed wrappers. | CSS `--kit-bone`, `--kit-ink`, `--kit-grid-step`, `--kit-card-offset`; no text default. |
| Camera to sidecar anchor | `snippets/camera.js` | Copy helper into the scene script; call it with the scene's existing timeline. | `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` appends its tween; `rect={x,y,width,height}` comes from the sidecar at the intended frame; throw on missing rectangle. |
| Lower-third / kinetic line / subtitle | `snippets/type.html` | Copy desired timed markup and corresponding tween statements into the scene; one caption host for the whole film. | `data-var-text="presenter-name"`, `presenter-school`, `presenter-credit`, `kinetic-text`, `subtitle-text`. |
| Orbit / wordmark / chips / lifecycle | `snippets/identity.html` | Copy relevant markup and timeline statements; instantiate only in the scene containing the beat. | `data-var-text="wordmark"`, `agent-chip-1` through `agent-chip-5`, `lifecycle-label`; `kitVerifiedRingClose(tl, ringPath, at)` adds a 0.4s close and 0.4s hold only after verified readback. |
| Statistics / failure / AI boundary | `snippets/diagrams.html` | Copy one named group into its scene and add finite reveal statements. | `data-var-text="stat-cost"`, `stat-duration`, `stat-source`, `failure-label`, `ai-boundary-label`. |
| Bob frame / collage / privacy | `snippets/evidence.html` | Copy frame or graphic markup; put timed video directly in scene, never inside another timed element. | `data-var-src="bob-footage"`, `memory-1`, `memory-2`; `data-var-text="bob-review-result"`, `bob-outcome`, `masked-field`. |
| Intent / URL / end card | `snippets/end-card.html` | Copy needed pill or end-card markup and finite typing statements into the scene. | `data-var-text="agent-intent"`, `project-url`, `end-credit`; fixed-height pill prevents reflow. |
| Zoom / slice / morph / glitch | `snippets/transitions.js` | Copy the relevant function into the scene script and append its tweens to the scene's timeline. | `kitTransition(tl, kind, targets, {at, duration})`; `kind` is `zoom-through`, `slice`, `paper-wipe`, `morph`, or `glitch`; targets are existing scene-local elements. |

All source snippets contain only deterministic, finite operations. The kit's example harness demonstrates each API without introducing placeholder claims or invented assets. Each KIT prompt below implements the rows it owns and reports exact files and usage. Mount identifiers and frame-aligned timings in consuming scenes remain the responsibility of HK/LK steps.

### KIT-01 · Stage foundations and sync (H-001–H-154; L-001–L-176, 00:00–03:00)
**Why / depends on:** PRE-02. Provide STG-01, STG-12–13 and a safe sync.
**Checklist**
- [ ] Pre-flight: licensed fonts and marks from PRE-02; both scripts and inventory.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: dot grid, stage card, crop marks, montage crops, redacted screenshot slots and sync target paths.
- [ ] Accept: kit source and tested non-destructive sync exist.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: build STG-01, STG-12–STG-13 in demo/video/stage-kit/. SOURCE OF TRUTH: inventory items and stage gaps; H-014–H-026, H-106–H-110 and L-010–L-022. INPUTS: PRE-02 locally licensed fonts and marks; two separately authorized redacted screenshot textures.
BUILD:
1. STG-01: create bone `#F6F6F3` field with 1px dots every 24px at opacity .12, 2px ink stage card and 6px hard offset; add crop marks. Build empty, card and collage states with finite 500–900ms entrances. Done when the grid holds in world space, only stage cards have hard shadow, crop marks avoid data and pans reveal no seams.
2. STG-12: create original calendar, ticket, toolbar and error-dialog montage crops from named entries; expose swappable copy and finite transform states. Open this inventory item's full exact content and Done when, preserve each listed label, and verify every clause.
3. STG-13: use separate [USER SCREENSHOT 1] and [USER SCREENSHOT 2] authorized irreversibly redacted textures; no fake replacement or originals. Open its Done when and verify all clauses and metadata safety.
4. Bundle actual ten local font faces and OFL notices. Add collision-safe sync to `demo/video/hackathon/assets/kit/`, `demo/video/launch/assets/kit/` and each compositions directory, copying only kit-owned files after projects exist.
5. Implement `snippets/stage.html` and named CSS variables exactly as section 1.3's integration table specifies. Its static dot grid is world-space, not viewport-attached; crop-mark arms are 12px and sit 8px outside the stage-card corners. The harness mounts copied markup in a single scene template, prefixes IDs and keeps decorative wrappers out of caption text.
6. STG-12 exact variants: calendar `Kestrel review` with no dates; toolbar `#ap-escalations`, `Message #ap-escalations`; dialog `Submission timed out`, `Outcome Unknown`, `Held`; optional ticket `Exception`, `Missing Purchase Order`, `INV-48215`, `AP East`. Acceptance: Kestrel visible, no calendar date invented, timeout remains unknown and ticket contains only known facts.
7. STG-13: slots are `[USER SCREENSHOT 1: approved work-app overview, redacted]` and `[USER SCREENSHOT 2: approved spreadsheet or workflow artifact, redacted]`; third business-communication texture is optional. User authorizes each separately, irreversibly removes identifiers before ingestion, strips metadata and confirms no readable private text. Keep original aspect ratio and dim approved derivatives to 15–25% opacity. Acceptance: real supplied assets only; originals unrecoverable, private text absent and slots not presented as source evidence.
8. Provide per-component example markup and finite tween positions. Sync refuses overwriting existing user-owned files, creates destination directories as needed only after the corresponding project exists, and copies OFL notices with fonts. Validate a deliberately conflicting destination without altering that file.
TRAPS: No remote fonts, no copied app UI, no stage shadow in product interiors; SO-O5 governs all harness scenes.
MOUNT: kit-owned temporary QA harness only, local 0 and explicit duration; do not edit either root scene. TRAPS: no remote fonts, no copied third-party UI, no product-stage shadow confusion. QA: SO-O7–SO-O9 in harness, snapshots at stage edges and crop boundaries, sync collision test without overwriting user files. REPORT: source paths, component IDs, sync invocation, QA, missing assets and open questions; stop.
```

### KIT-02 · Camera and scrubber (H-014–H-132; L-010–L-160, 00:10–02:38)
**Why / depends on:** KIT-01 and BOB-03. Frame product captures from their sidecars.
**Checklist**
- [ ] Pre-flight: kit foundation and sidecar schema from BOB-03.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: anchor-targeted framing, first/last frame, safe-area guides, no video seek calls.
- [ ] Accept: FRT-04–FRT-05 reusable helper and preview harness exist.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: build FRT-04–FRT-05 camera and preview helpers under demo/video/stage-kit/. SOURCE OF TRUTH: inventory FRT-04–FRT-05, H-014–H-132 and L-010–L-160; SO-O5–SO-O6. INPUTS: KIT-01, BOB-03 sidecar schema and a real sample clip if available.
BUILD:
1. FRT-04: derive GSAP wrapper scale/translation from named per-frame sidecar rectangles in 1280x720 CSS coordinates; delivery scale is 1.5. Provide preview-only 90% action and 80% title guides; missing anchor must fail explicitly. Build first, target and last framing states; open FRT-04 Done when and verify each clause.
2. FRT-05: create finite timeline preview/scrubber harness with deterministic explicit time, first/last frame and reverse-seek states. Follow FRT-05 Done when for every control and check.
3. Time and mute the `<video>` itself; animate its untimed wrapper, never call media play/pause/seek. Register one paused timeline after tweens. No CSS transform conflict, timer or network.
4. Implement `snippets/camera.js` exactly with `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})`. Translate and scale the untimed world wrapper so the chosen sidecar rectangle's center lands at the requested viewport center; compute geometry once from the frame-specific rectangle, not in an update callback. Honor scale 1.0–1.8 and 600–1100ms easing. Use named anchors from a real sidecar and fail if an anchor is null.
5. FRT-04 editor guides use `[64,36,1152,648]` action-safe and `[128,72,1024,576]` title-safe rectangles, labeled `ACTION SAFE`, `TITLE SAFE` in preview only. Acceptance: arbitrary-frame seeks reproduce camera transform; captions remain legible and viewport-fixed; guides are excluded from export; no pan exposes unrendered edge.
6. FRT-05 labels `Hackathon`, `Launch`, `Play`, `Pause`, `Frame`, `00:00.00 / 03:00.00`, `Safe areas`, `Capture frame`. With 30fps use whole-film frame range 0–5399 rather than the older 60fps 0–10799. Arrow keys step a frame, Shift+arrows jump 30 frames, Home/End select boundaries. Acceptance: first/last selectable, reverse seek resets state, keyboard slider works and clean captures omit editor chrome.
7. Demonstrate an anchor-targeted move, reverse seek and fixed subtitle in the harness. Time the video tag itself and pass scene-local timestamps to the helper; do not tween `left`, `top`, `width`, `height` or the video element.
TRAPS: scene times are local; sidecar coordinates are authored pixels; guide overlays must not appear in delivery.
MOUNT: kit-owned QA harness only, not a film scene. TRAPS: do not animate left/top/width/height or CSS-transform an element GSAP transforms; no extra captions. QA: SO-O7–SO-O9; compare target rectangles at frame zero, anchor change, first/last frame, reverse seek and midpoint. REPORT: helper names and inputs, snapshots, checks, missing clip or anchor, deviations and questions; stop.
```

### KIT-03 · Captions, lower-thirds and type (H-001–H-013; L-001–L-009, 00:00–00:26 / 00:00–00:10)
**Why / depends on:** KIT-01. Text must stay editable and legible.
**Checklist**
- [ ] Pre-flight: fonts and kit tokens; inventory STG-04–05, STG-16, FRT-06.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: both presenter lower-thirds, subtitle dimensions and type variants; no text covers the face.
- [ ] Accept: reusable components and their harness pass.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 including captions. GOAL: create STG-04–STG-05, STG-16 and FRT-06 under demo/video/stage-kit/. SOURCE OF TRUTH: inventory and stage gap headings; H-001–H-013, H-145–H-154, L-001–L-009 and L-166–L-176. INPUTS: KIT-01 and local font assets.
BUILD:
1. STG-04: create separate presenter lower-thirds with `Harikeshav Rameshkumar`, `The Ohio State University`, and hackathon credit; launch uses name and school. Show exact hook phrases `What if`, `LEARN`, `PROVE`, `RECOVER WHEN REALITY CHANGES?`; keep face unobscured and shadow above y630. Done when name/school and cut-specific hook match and footage/voice belong to presenter.
2. STG-05: implement stacked text, typewriter, actual 400/700 weight swap and finite seeded scramble at 28–34 chars/s. Include `Clicks complete ≠ verified outcome`, `Business result?`, `STOPPING CAN BE CORRECT`, `UNKNOWN ≠ COMPLETE`. Done when seeks reproduce text, phrases match, no underlying secret appears and reduced-motion text remains legible.
3. STG-16: build shoot-day framing and graphics for actual presenter footage; open the item's exact text, states and Done when and verify each clause. No generated presenter or voice.
4. FRT-06: create single-line subtitle strip x128–1152, y630–688, Plex Mono 600 13–15px, white on #0A0A0A; scale by 1.5 for delivery. Build empty and populated states and one caption track host. Check every FRT-06 Done when against actual transcription.
5. Implement `snippets/type.html` with standalone scene-copyable groups for lower-third, kinetic line and subtitle. Bind `data-var-text` to `presenter-name`, `presenter-school`, `presenter-credit`, `kinetic-text` and `subtitle-text`, and document each group's timing positions in local seconds. The consumer supplies its scene-prefixed IDs and adds these tweens to the existing paused timeline; never register a second timeline.
6. STG-04 hackathon lower third occupies `[64,506,506,84]`, launch `[84,516,506,84]`; the 6px shadow must end above y630. Hook text uses IBM Plex Mono 44–48px with actual 400/700 weights. Acceptance: face remains unobscured; hook words match the cut; name and school spell correctly; footage and VO are the presenter's own.
7. STG-16: frame presenter at `[700,80,400,500]`, leave `[80,110,520,360]` clear for typography, retain 10 seconds empty room and 30 seconds room tone. Take names `H1-A`, `H1-B`, `H5-A`, `L1-A`, `L1-B`, `L12-A`; slate stays out of film. Acceptance: face and overlay space clear, hook/close lighting matches, audio intelligible and no slate in delivery.
8. FRT-06 acceptance: captions match actual approved audio, silence leaves a blank strip, no cue obscures important evidence and UTF-8 SRT/VTT align to final cut. The one-line section 4 decision overrides old two-line inventory text. Stage snippets provide the host only; transcription follows final recorded VO.
TRAPS: no synthesized fonts, fabricated caption speech, timers, unseeded randomness or CSS filters on footage.
MOUNT: kit-owned temporary harness at local zero, explicit duration and registered matching composition ID; no film roots. TRAPS: no synthesized fonts, timers or unseeded randomness, no footage CSS filters. QA: SO-O7–SO-O9, capture first/last and intermediate text transitions, verify safe areas and .3s per settled word where timing permits. REPORT: component paths, variants, snapshot verdicts, unresolved timing and questions; stop.
```

### KIT-04 · Identity and lifecycle (H-006–H-013, H-027–H-036; L-023–L-034, 00:12–01:12)
**Why / depends on:** KIT-01. Build a reusable open mark and the 14-node ring.
**Checklist**
- [ ] Pre-flight: inventory STG-02–03, FX-05 and kit fonts.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: 14 correct labels, five named chips, open identity, closed mark only at verified readback.
- [ ] Accept: orbit, wordmark, verified close and lifecycle kit assets exist.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. GOAL: implement STG-02–STG-03 and FX-05 ring-close in demo/video/stage-kit/; KIT-05f owns the separate glitch. SOURCE OF TRUTH: inventory section 4 decision 2, stage gaps, H-006–H-013, H-027–H-036, H-093–H-095, L-023–L-034, L-139–L-144. INPUTS: KIT-01.
BUILD:
1. Create concentric ink orbit rings with a neutral traveling node and open-ring O in Space Grotesk 700 `Oryn`; make five agent chips `Supplier Invoice Reconciler`, `Order Status Sync`, `Support Exception Triage`, `Policy Watcher`, `Peer Fix Guide`.
2. Build a 14-node ring in exact order: Observe, Understand, Review, Publish, Compile, Simulate, Authorize, Execute, Verify, Diagnose, Correct, Repair, Re-evaluate, Release. Supply editable per-scene progression; cyan only while simulator, job or regression actually executes.
3. Keep intro and reveal marks open. Offer a 400ms verified ring-close plus 400ms hold only for independently verified job outcome or 3/3 release; a closed end-card variant is allowed after verified release. All timelines are seekable, finite and frame-aligned.
4. STG-02 goes in `snippets/identity.html`: rings centered at (640,330), radii 18/31/44 in a 100-unit viewBox, 1.5-unit strokes and a 4-unit neutral node; wordmark `Oryn` has a 32° open O gap. Bind `wordmark`, `agent-chip-1` through `agent-chip-5`. States are ring assembly, one-to-five chips, convergence, open wordmark and verified close. Acceptance: five names appear, O is original and open by default, closure requires verification and inactive identity has no cyan.
5. STG-03 shows `CLOSED LIFECYCLE` and exact fourteen-label sequence, plus `Suggested`, `Owner approval`, `Independent readback`, `Human correction`, `Bounded change`, `Regression suite` microcards. At most one actively executing node is cyan; the prior node neutralizes as the next state begins. Acceptance: fourteen names and order correct, at most one cyan, cyan extinguishes when stopped, review/authorize and execute/verify remain distinct.
6. FX-05 ring-close API: include `kitVerifiedRingClose(tl, ringPath, at)` in the snippet's script; add 0.4s close, 0.4s hold and 0.3–0.4s reopen to the caller's timeline. Call only at a visibly verified readback or 3/3 cohort outcome. No separate timeline or user toggle. Acceptance: submission alone does not close, motion is finite, text legible and reduced motion preserves the same status.
TRAPS: old conceptual reveal closure is superseded by inventory decision 2. Never use a cyan logo or mark an idle node as executing; timeline times are scene-local.
MOUNT: kit-owned harness only, local zero, matching ID; no actual film roots. TRAPS: neutral passive observation and dark stopped nodes; never close mark on a mere submitted action. QA: SO-O7–SO-O9; snapshots before, during and after close and on each node state; inspect first/last. REPORT: component IDs, checks, exact snapshot verdicts and questions; stop.
```

### KIT-05 · Diagrams and transitions gate
- [ ] Complete KIT-05a–KIT-05f before marking KIT-05 complete.

### KIT-05a · Statistics and failure visuals (H-014–H-026, 00:26–00:52)
**Why / depends on:** KIT-01.
**Checklist**
- [ ] Pre-flight: STG-06–07 and GAP-STG-H-mismatch/stat/sources.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: exact sourced statistics and abstract mismatch.
- [ ] Accept: stage cards pass inventory Done when.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05a. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: inventory STG-06–07, GAP-STG-H-mismatch/stat/sources; H-014–H-026. INPUTS: KIT-01 fonts and stage tokens.
BUILD:
1. Create editable source-line and affected-role cards for AP employees and operations leaders. Preserve Ardent Partners $9.90, 11.6 days and 19.9% with year and source where each named entry requires them.
2. Build abstract differing-bar mismatch labelled `Result not verified`, and supplier format change visual; never invent an invoice amount.
3. Store reusable templates and variables under demo/video/stage-kit/; use local time, one paused registered timeline, finite tweens and SO-O5.
4. STG-06: append stat and role groups to `demo/video/stage-kit/snippets/diagrams.html`; bind `stat-cost`, `stat-duration`, `stat-source`. Use `Priya Nair · AP Specialist`, `Marcus Webb · AP Manager`, `$9.90 / invoice`, `11.6 days`, `Average processing cost and time per invoice`, `Ardent Partners · Payables Place · 2026`, `Why?`, `Investigation required`. Preserve source URL `https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/`. States: cost alone, cost plus time, roles and unresolved question. Acceptance: cost/time readable with source, roles correctly named, source year visible, no implication these are Oryn's measurements.
5. STG-07: append failure group with `Clicks complete`, `Click completed`, `Amount mismatch`, `Business result: mismatch`, `Business outcome: unverified`, `Result not verified`, `Unverified`, `Kestrel Components`, `Handling fee $38.50`. Provide completed-click/empty-evidence, broken connector and old/new document variants. Acceptance: click check physically separate from business result; mismatch and unverified labeled correctly, fee follows subtotal, stopped path neutral.
6. Build local entry-timed reveals in a single harness timeline, using scene-prefixed IDs and the `failure-label` binding. Rehearse H-017–H-026 and their source lines at 30fps; apply a neutral outlined warning, never colored success to an unverified outcome. Review first and last frame and each entry boundary, plus the one-frame-before/after and timeline-derived overlap when an element transitions.
7. Harness contract: make source snippets editable, not rendered screenshots; text fields are actual DOM with `data-var-text`. Use the cost/time card's two-column geometry `[280,180,720,330]`, source inset 24px and mono source at least 11px authored. A role-card variant names actual fictional roles, never a customer quote. Verify every settled line holds long enough for the storyboard and does not overlap the caption zone.
8. For the failure illustration, use adjacent 430x320 panels, separate completion check from the mismatch indicator and keep the connector neutral. Evaluate the sampled intermediate frame: no transition may imply that the check itself confirms an independent business outcome. Copy the group into one test scene with a unique prefix, set a real local duration, register the timeline last and test `npx hyperframes check --json` against the harness.
TRAPS: Do not invent mismatch amounts, customer results or ROI. Gartner forecast requires primary-source verification before publishing; McKinsey's 19% is a 2012 interaction-worker study, not Oryn data. No cyan except actual execution.
MOUNT: temporary kit-owned harness only. ACCEPTANCE: check each named inventory Done when, source legibility, first/last and entry transition snapshots; run SO-O7–SO-O9. REPORT: assets, checks, source claims and questions; stop.
```

### KIT-05b · AI boundary (H-037–H-047, 01:02–01:12)
**Why / depends on:** KIT-01.
**Checklist**
- [ ] Pre-flight: STG-08, GAP-STG-H-ai-detail/future.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: local private evidence is separate from governed cloud inference.
- [ ] Accept: architecture and future card pass Done when.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05b. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: inventory STG-08, GAP-STG-H-ai-detail/future; H-037–H-047, H-133–H-145. INPUTS: KIT-01.
BUILD:
1. Draw editable local capture, masking, exclusions and private evidence on one side of an explicit boundary; authorized transient inference uses a governed cloud gateway.
2. Represent workflow discovery, agent-definition generation, scenario generation, outcome verification and repair proposals without suggesting automatic human authorization.
3. Make future optional on-device inference a separate future card, not the current route; implement seekable finite local GSAP timeline in stage-kit.
4. STG-08: append boundary group to `demo/video/stage-kit/snippets/diagrams.html`, using `data-var-text="ai-boundary-label"` for editable title. Exact blocks: `LOCAL: private evidence · exclusions · masking`, `capture · deterministic validation · encrypted storage`, `Purpose authorization`, `Oryn-managed LiteLLM gateway`, `Approved cloud model`, `US processing · zero content retention after processing · no training`, `Human review and authority`, `Reviewed contribution`. Preserve `Workflow discovery`, `Agent-definition generation`, `Scenario generation`, `Verification assistance`, `Repair proposals`.
5. Build local-only, unauthorized blocked path, permitted transient gateway, five assistance cards and independent human review states. Use 500ms device reveal, 500–700ms arrow draw and 60ms card stagger, quantized to 30fps where needed. A copied scene adds these statements to its own paused timeline at local entry offsets; no network call or independently registered timeline belongs to the snippet.
6. Acceptance from STG-08: device and cloud are visibly distinct; unauthorized path stops; cloud route conditions are legible; human gate follows proposed output. Acceptance for GAP-STG-H-ai-detail/future: read each full gap and check every condition; future optional on-device inference must appear as future, not a present route. Snapshot all routes just before, at and after each gate transition, plus all timeline-derived overlap points.
7. Match the inventory geometry: local device `[120,180,370,300]`, purpose gate `[510,270,180,100]`, gateway `[710,190,220,100]`, cloud `[960,190,200,100]`, human review `[990,430,210,100]`. Treat blocked and allowed routes as separate authored timeline states; source arrows must not run behind a card's text. Keep the disclosure of processing conditions legible in the full-frame view and its camera crop.
8. Harness the five assistance labels separately from the human authority block. Capture a still after each node enters, and a still with unauthorized route blocked; compare those with the scene's last frame. If a label cannot fit at the required readability floor, revise the layout rather than shrinking it below the specified type scale. Export only source snippets, not a production film.
TRAPS: no certification badge, hidden remote evidence storage, invented model authorization or AI self-approval. Do not imply correction itself changes policy. Stage remains neutral when no job, simulator or regression executes.
MOUNT: kit-owned harness only. ACCEPTANCE: read each named Done when, check exact labels, source/target arrows, boundary snapshots and SO-O7–SO-O9. REPORT: assets, checks, deviations and questions; stop.
```

### KIT-05c · Bob review frame (H-048–H-056, 01:12–01:22)
**Why / depends on:** KIT-01 and BOB-14.
**Checklist**
- [ ] Pre-flight: STG-09, GAP-STG-H-handoff and genuine `demo/video/footage/bob-review.mov`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: actual recording and [BOB_*] facts are readable without invented findings.
- [ ] Accept: frame and handoff meet Done when.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05c. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: inventory STG-09, GAP-STG-H-handoff; H-048–H-056. INPUTS: KIT-01 and BOB-14 real recording and facts.
BUILD:
1. Create an editable stage frame for the actual `demo/video/footage/bob-review.mov`, retaining real editor chrome and cursor. If missing, stop rather than simulating the recording.
2. Provide [BOB_REVIEW_RESULT] and [BOB_OUTCOME] variables and preserve other actual [BOB_*] values from BOB-14; never invent issue text or PR details.
3. Provide the enrollment handoff as a finite seekable transition. Only timed video is a clip; mute it unless explicitly retaining audio under SO-O5.
4. STG-09: append frame and handoff groups to `demo/video/stage-kit/snippets/evidence.html`; expose `data-var-src="bob-footage"`, `data-var-text="bob-review-result"` and `data-var-text="bob-outcome"`. The consuming scene uses a real `assets/...` fallback source and a directly timed video, not a video nested inside another timed element. Preserve the actual editor, cursor, filenames, prompt and response; never fake a highlighted finding.
5. Place a real 16:9 capture within `[48,40,1184,570]` with a 2px ink frame and 6px stage offset. Crop around (640,300) only where H-048–H-054 require it; keep the native cursor and enough surrounding editor context to verify authenticity. Use only values actually recorded by BOB-14 for [BOB_REVIEW_RESULT] and [BOB_OUTCOME]. If the recording or truthfully transcribed slots do not exist, stop and name BOB-14 as the producer.
6. GAP-STG-H-handoff: stage the transition to the enrollment section using the storyboard's exact entry offsets; no portrait, fake product chrome or invented facts. Read its complete Done when and verify each line. STG-09 acceptance: inspect the inventory's full checklist, verify authentic text remains readable and no private information is visible; confirm that end-of-review and start-of-enrollment frames preserve the real material.
7. Use separate editable scene variables for the review result and outcome, and retain actual `[BOB_*]` slot values in the private production notes. The kit never extracts or rewrites text from the footage; the factual review remains the visible capture. The snippet's example must use only an approved real clip. If the user has not yet recorded it, deliver reusable frame geometry without a fabricated example and report the missing media.
8. Sample the first readable PR frame, the actual response frame, the outcome hold, and both sides of the enrollment handoff. Inspect recording at 1280x720 authored scale after the intended crop. Confirm the 2px border and 6px offset remain stage-only, the subtitle strip is not obscured, and the real editor content is not truncated by an unintended mask. Report exact snapshot times and any unresolved text readability issue.
TRAPS: never modify the recording to make Bob appear to have said something else, never synthesize a finding or represent a review as a successful fix unless observed. Video is muted unless marked as having audio, with no scripted play/pause/seek.
MOUNT: kit-owned harness only, no film scene. ACCEPTANCE: check named Done when, legibility and privacy, snapshot handoff boundaries, run SO-O7–SO-O9. REPORT: real asset, checks and questions; stop.
```

### KIT-05d · Collage and privacy sweep (H-106–H-110; L-040–L-043)
**Why / depends on:** KIT-01 and PRE-04.
**Checklist**
- [ ] Pre-flight: STG-10–11, FX-04, GAP-STG-H-memory and authorized redacted textures.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: two distinct redacted textures and hatch never expose protected data.
- [ ] Accept: collage and masking satisfy Done when.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05d. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: inventory STG-10–11, FX-04, GAP-STG-H-memory; H-106–H-110 and L-040–L-043. INPUTS: KIT-01 and PRE-04.
BUILD:
1. Create dark knowledge collage with evidence ribbons and separately swappable [USER SCREENSHOT 1] and [USER SCREENSHOT 2]. No unredacted original or fabricated substitute may enter the project.
2. Build the masking/hatch sweep and removed-field card for `BANK ACCT`, `TAX ID`, `CARD`; no actual secret exists underneath the mask.
3. Use deterministic finite clip-path or transform-based animation, avoiding footage CSS filters and keeping hatch outside text.
4. STG-10: append dark collage and evidence-ribbon group to `demo/video/stage-kit/snippets/evidence.html`. Preserve `AP-RULE-009`, `Confirm Kestrel handling-fee terms in writing`, `Known fix from AP East: Vendor tax ID format`, `INC-0042`, `Evidence`, `Candidate workflow`; D1 Priya Mon 09:14 INV-48203, D2 Priya Mon 10:02 INV-48204 and D3 Jamal Tue 13:40 INV-48207. Draw three ribbons in 700ms and cards with 100ms stagger. Acceptance: four knowledge types readable, three demonstrations preserve person/time/ID, commitment remains separate and no raw screen exposed.
5. STG-11: bind `data-var-text="masked-field"` to `BANK ACCT`, `TAX ID` or `CARD`; show `Masked on device` and optional `REMOVED`. Three 380x38 mask areas are already opaque before 300–400ms hatching, staggered 70–120ms; no actual value exists in DOM. Acceptance: no underlying values, labels readable, hatch precedes storage boundary and pause remains separately available.
6. FX-04: add privacy and unknown variants using 45° neutral 1px strokes spaced 6px; unknown text is `Unverified` or `Outcome Unknown`, `Held`. Acceptance: no field values appear, unknown label remains readable, hatch clips to the correct area and dark mode remains visible. Keep product unknown semantics distinct from privacy redaction.
7. GAP-STG-H-memory: expose `data-var-src="memory-1"` and `data-var-src="memory-2"` as separately authorized, irreversibly redacted user textures. Verify both authorizations and full-resolution exports before mounting; stop on missing assets rather than substitute. Copy all groups into the consumer scene template and append finite tween statements to its sole timeline.
8. Preserve each source ribbon's reviewed/sanitized provenance: the three demonstration thumbnails are not interchangeable with the user's background memory textures. The latter are static context only, not evidence of employee observation or organizational sharing. No crop may imply one supplier's invoice belongs to a different demonstration. An optional third screenshot is never required to render the two authorized slots.
9. In the harness, sample no-hatch, partial sweep and complete mask for each row and verify opaque underlying backgrounds at every point. Inspect the same unknown hatch in both light and dark variants; the business label must stay outside the patterned region. Verify 90% action-safe and 80% title-safe bounds, and use a narrower layout opt-out only for decorative intentional overflow.
TRAPS: no recoverable private value beneath a mask, no CSS blur on footage, no inferred business verification or cyan in a static collage.
MOUNT: temporary kit-owned harness. ACCEPTANCE: inspect named Done when, both slot identities and midpoint/end sweep frames; run SO-O7–SO-O9. REPORT: assets, redaction evidence, checks and questions; stop.
```

### KIT-05e · Pills and end card (H-077–H-079, H-133–H-154; L-166–L-176)
**Why / depends on:** KIT-01 and KIT-04.
**Checklist**
- [ ] Pre-flight: STG-14–15 and GAP-STG-H-intent/url/credit/impact, GAP-STG-L-14.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: fixed pill dimensions, actual URL and credit.
- [ ] Accept: components satisfy Done when.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05e. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: STG-14–15, GAP-STG-H-intent/url/credit/impact, GAP-STG-L-14; H-077–H-079, H-133–H-154, L-166–L-176. INPUTS: KIT-01, KIT-04.
BUILD:
1. Make fixed-height typed intent pill containing `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` and editable URL pill `https://github.com/Harikeshav-R/Oryn`.
2. Build impact and next-step cards using only source text, plus end card credit `IBM AI Builders Challenge · AI for Business`; no fabricated traction.
3. Use a closed mark only for the verified-release end card. Type deterministically, use local fonts and variables.
4. STG-14: write intent group in `demo/video/stage-kit/snippets/end-card.html`, bind `data-var-text="agent-intent"`, and use `[230,310,820,72]` stage pill with 2px outline, 6px offset, 24px padding. States: empty, focused, partial, full, submitted, candidate. Grow 320→820px in 700ms; type the exact 81-character intent at 30–32 chars/s with needed preroll. Show `Create Agent`, then `Purpose`, `Inputs`, `Actions`, `Rules`, `Outputs`, `Stopping points`, `Unverified branch`. Acceptance: exact sentence, no model picker, caret ends at text and generated branch stays unverified.
5. STG-15: add groups bound to `data-var-text="project-url"` and `data-var-text="end-credit"`. Exact copy: `Oryn`, `IBM AI Builders Challenge · AI for Business`, `https://github.com/Harikeshav-R/Oryn`, `Fewer repeated investigations`, `Clearer, verifiable decisions`, `Application-specific validation`, `Evidence-backed verification`, `Controlled releases`, `Optional on-device inference`. Keep last item explicitly future. Use URL pill `[300,470,680,52]`, 2px border and 6px offset; type 28–34 chars/s with preroll, final address held through 03:00.
6. Acceptance from STG-15: full URL readable in final frame, exact credit, future inference not current v1.0, no unsupported claims. Check GAP-STG-H-intent/url/credit/impact and GAP-STG-L-14 individually against their exact Done when. Consumer copies only the appropriate group and its local tweens into its scene's existing timeline; do not nest a second timeline.
7. Read the 81-character intent's actual script timing and keep an existing prefix or perform a preroll if the allocated visible interval cannot contain the whole typing sequence. A fixed-height pill must not move surrounding cards when the caret advances. The candidate's `Unverified branch` is visible after submit; submission is not deployment. Test first character, final character, post-submit and reduced-motion states by exact seek.
8. End-card variables must remain editable without changing source code. Use authentic project URL and explicit credit only, not a shortened or redirected address; do not turn the film's pill into a navigation event. Test impact, next steps, URL typing and final hold as separate states, and inspect subtitle clearance for each. A closed end-card mark is permissible only because the preceding limited release was independently verified.
TRAPS: never type faster merely to fit a shot, invent traction, introduce a model selector or close the identity before a verified release.
MOUNT: kit-owned harness only. ACCEPTANCE: check all named Done when and snapshots at first, middle, last, exact typed strings and readable safe areas; run SO-O7–SO-O9. REPORT: assets, checks and questions; stop.
```

### KIT-05f · Transition primitives (H-014–H-026; L-023–L-034)
**Why / depends on:** KIT-01 and KIT-04.
**Checklist**
- [ ] Pre-flight: FX-02–03, FX-05 glitch, GAP-STG-H-paperwipe.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: zoom-through, slice/paper wipe, morph and finite glitch seek correctly.
- [ ] Accept: transitions pass Done when and overlap snapshots.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: KIT-05f. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and registry. SOURCE OF TRUTH: inventory FX-02–03, FX-05 glitch, GAP-STG-H-paperwipe; H-014–H-026 and L-023–L-034. INPUTS: KIT-01 and KIT-04.
BUILD:
1. Search registry before creating zoom-through, hard slice, supplier paper wipe, card growth/morph and finite glitch primitives.
2. Implement seekable transform/mask tweens without timers, infinite repeat, media seek calls or CSS filters on footage. Keep FX-01 containment wipe in the prototype.
3. Use local scene times and matching host/composition/timeline IDs; expose timing variables and honor 30 fps.
4. FX-02: implement `kitTransition(tl, kind, targets, {at, duration})` in `demo/video/stage-kit/snippets/transitions.js`; kinds `zoom-through`, `slice` and `paper-wipe` append finite tweens to the supplied timeline. Use 2D scale 1→1.5 or 1.8, zoom 600–900ms and three opposing horizontal strips 80–180px high over 500ms. Preserve `INV-48219`, `PO-1042`, `AP Exceptions Tracker` when visible. Acceptance: no blank frame, same-record identity survives cut, captions remain above scene and no accidental 3D motion.
5. FX-03: implement `morph` for chip convergence, message-to-review card, intent-to-candidate and logo-grid-to-node. Use 500–800ms transform, stagger 60–120ms and fade old labels before overlap. Destination content exists independently. Acceptance: record and intent keep meaning, names never clip, destination exists and idle mark is neutral.
6. FX-05 glitch: implement `glitch` localized to failed card or line, one 100ms event with deterministic 2–4px ink/trace displacement. Preserve `Business result: mismatch`, `Result not verified`. Acceptance: no repeated glitch loop, text legible, reduced motion conveys same status. Ring-close itself belongs to KIT-04.
7. GAP-STG-H-paperwipe: inspect the complete gap item, retain old/new supplier layout distinction and its exact entry-time anchor; test every Done when. Copy functions into consumer's template script; all `at` values are scene-local and all durations frame-aligned at 30fps. Sample timeline-derived midpoint, first and last transition frames and one frame on either side of each boundary.
8. Transition examples must exercise two real scene-local graphical children, not reach across sub-composition roots. The helper appends explicit absolute positions to the caller's existing paused timeline; the caller owns the outgoing and incoming scene hosts and must mount each with correct local and absolute timing. Reject missing targets and negative duration rather than silently skipping animation.
9. Compare intermediate overlap frames, not only endpoints. Ensure a wipe never obscures a critical invoice amount or subtitle, and a morph does not stretch text: fade old labels, transform the card's decorative wrapper, then reveal a separately rendered destination label. In reduced motion, snap to the destination while retaining semantic order. Document selector requirements and examples next to the source function.
TRAPS: never tween `display`, `visibility`, `autoAlpha` on clips, CSS-transform a GSAP target, filter footage, seek media or use infinite repeats. FX-01 containment wipe remains inside the prototype.
MOUNT: temporary kit-owned harness only. ACCEPTANCE: inspect all named inventory Done when, timeline-derived overlaps and first/last transition frames; run SO-O7–SO-O9. REPORT: assets, checks and questions; stop.
```

## 1.4 Capture product clips

After BOB-13, capture from `/Users/hari/Developer/Oryn-demo/demo/oryn-prototype`. The command below accepts the `--cut` and `--clip` values in each row. The MP4 and JSON output share the basename under `demo/video/clips/<cut>/`. Each row is one independent capture step. If any check fails, fix its Bob owner and recapture every affected clip. Read named storyboard entries at capture, including an entry that straddles a clip boundary; retain its correct local fragment, never omit it.

```bash
bun run scripts/capture.ts --cut <cut> --clip <clip-id>
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=width,height,r_frame_rate,nb_read_frames -of default=noprint_wrappers=1 ../video/clips/<cut>/<clip-id>.mp4
```

Every CAP row requires all of these checks: timeline and capture script exist; run its exact command; verify MP4 is silent, 2560x1440, 30 fps and `nb_read_frames` equals the listed count; inspect JSON `clipId`, `fps`, `frameCount`, `durationSeconds`, frame-indexed cursor and required named anchor rectangles; inspect first, last, boundary and representative action frames against named source entries and their exact on-screen strings; accept only when the MP4 and sidecar are in `demo/video/clips/<cut>/` and tell the same deterministic story. Check no disclosure, no private data, and no cyan while stopped. At each cut, confirm the last frame of one clip and first frame of the next retain intended state without a gap.

| Step | Entries / film range | Duration / frames | Command | Verify in addition |
|---|---|---:|---|---|
| CAP-01 | H-014–H-026, 00:26–00:52 | 26 s / 780 | `bun run scripts/capture.ts --cut hackathon --clip hk-h2-problem` | Mock app crops; no fabricated invoice amount. |
| CAP-02 | H-057–H-062, 01:22–01:28 | 6 s / 180 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4a-enroll` | Consent separate; `Pause observation`. |
| CAP-03 | H-063–H-069, 01:28–01:35 | 7 s / 210 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4b-observe` | Meeting consent, Fri 12:00, source 00:14:32. |
| CAP-04 | H-070–H-076, 01:35–01:42 | 7 s / 210 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4c-playbook` | Three examples and neutral `Approved for Guidance`. |
| CAP-05 | H-077–H-083, 01:42–01:49 | 7 s / 210 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4d-agent` | Scoped Tier 3, pending gate checks. |
| CAP-06 | H-084–H-091, 01:49–01:57 | 8 s / 240 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4e-simulate` | 21/6/1 then 22/6/0. |
| CAP-07 | H-092–H-103, 01:57–02:08 | 11 s / 330 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4f-job` | 7/2/1/1 then 8/2/0/1 after readback; unknown held. |
| CAP-08 | H-104–H-116, 02:08–02:22 | 14 s / 420 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4g-heal` | Inspect complete 400ms wipe and 34-case suite. If wipe begins before 02:08, move this boundary and CAP-07 end to at least 0.3s before wipe begins; recompute both frame counts and update both timelines. |
| CAP-09 | H-117–H-132, 02:22–02:38 | 16 s / 480 | `bun run scripts/capture.ts --cut hackathon --clip hk-h4h-breadth` | Policy 34 tests, blocked discount, capabilities. |
| CAP-10 | L-010–L-022, 00:10–00:22 | 12 s / 360 | `bun run scripts/capture.ts --cut launch --clip lk-l2-chaos` | Mock crop montage and exact source states. |
| CAP-11 | L-035–L-044, 00:32–00:44 | 12 s / 360 | `bun run scripts/capture.ts --cut launch --clip lk-l4-privacy` | Consent, masked BANK ACCT / TAX ID / CARD. |
| CAP-12 | L-045–L-057, 00:44–00:56 | 12 s / 360 | `bun run scripts/capture.ts --cut launch --clip lk-l5-observe` | Consent before meeting, Fri 12:00. |
| CAP-13 | L-058–L-074, 00:56–01:12 | 16 s / 480 | `bun run scripts/capture.ts --cut launch --clip lk-l6-discover` | Three demonstrations; neutral guidance. |
| CAP-14 | L-075–L-090, 01:12–01:30 | 18 s / 540 | `bun run scripts/capture.ts --cut launch --clip lk-l7-create` | Intent exact text, Tier 3 and pending gate. |
| CAP-15 | L-091–L-107, 01:30–01:46 | 16 s / 480 | `bun run scripts/capture.ts --cut launch --clip lk-l8-simulate` | 28 scenarios, 21/6/1 then 22/6/0. |
| CAP-16 | L-108–L-126, 01:46–02:03.50 | 17.5 s / 525 | `bun run scripts/capture.ts --cut launch --clip lk-l9-run` | Correct partial boundary; no duplicate wipe. |
| CAP-17 | L-124–L-144, 02:03.50–02:24 | 20.5 s / 615 | `bun run scripts/capture.ts --cut launch --clip lk-l10-heal` | Full 02:03.8–02:04.2 wipe inside clip; 34 scenarios, 3/3 readback. |
| CAP-18 | L-145–L-160, 02:24–02:44 | 20 s / 600 | `bun run scripts/capture.ts --cut launch --clip lk-l11-breadth` | Map, revalidation, capabilities and evidence. |

- [ ] CAP-01 · Capture and verify `hk-h2-problem` as specified above.
- [ ] CAP-02 · Capture and verify `hk-h4a-enroll` as specified above.
- [ ] CAP-03 · Capture and verify `hk-h4b-observe` as specified above.
- [ ] CAP-04 · Capture and verify `hk-h4c-playbook` as specified above.
- [ ] CAP-05 · Capture and verify `hk-h4d-agent` as specified above.
- [ ] CAP-06 · Capture and verify `hk-h4e-simulate` as specified above.
- [ ] CAP-07 · Capture and verify `hk-h4f-job` as specified above.
- [ ] CAP-08 · Capture and verify `hk-h4g-heal` as specified above.
- [ ] CAP-09 · Capture and verify `hk-h4h-breadth` as specified above.
- [ ] CAP-10 · Capture and verify `lk-l2-chaos` as specified above.
- [ ] CAP-11 · Capture and verify `lk-l4-privacy` as specified above.
- [ ] CAP-12 · Capture and verify `lk-l5-observe` as specified above.
- [ ] CAP-13 · Capture and verify `lk-l6-discover` as specified above.
- [ ] CAP-14 · Capture and verify `lk-l7-create` as specified above.
- [ ] CAP-15 · Capture and verify `lk-l8-simulate` as specified above.
- [ ] CAP-16 · Capture and verify `lk-l9-run` as specified above.
- [ ] CAP-17 · Capture and verify `lk-l10-heal` as specified above.
- [ ] CAP-18 · Capture and verify `lk-l11-breadth` as specified above.

### Part 1 exit gate

- [ ] PRE-01–PRE-05 complete; verified course/certificate and private evidence retained, tool and rights blockers resolved.
- [ ] BOB-00–BOB-14 complete; all prototype inventory IDs and product gaps have one owner and every Done when is checked.
- [ ] Bob review footage exists, is legible and contains only actual PR, review and outcome; [BOB_*] facts are recorded truthfully.
- [ ] KIT-01–KIT-04 and KIT-05a–KIT-05f complete; every stage inventory item and GAP-STG is covered; assets licensed, self-hosted and sync collision-safe.
- [ ] CAP-01–CAP-18 MP4 and JSON pairs exist; frame counts, cursor and anchor samples match their timelines and exact storyboard copy.
- [ ] Both containment wipes are wholly inside their heal clip; any changed boundary and recomputed frame counts are communicated to the corresponding scene step.
- [ ] Part 2 can consume the named assets without invented footage, screenshots, statistics or Bob findings.

# Part 2 · Production

## 2.1 Shoot day

### SHOOT-01 · Prepare the room and frame (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170; 00:00–00:10 and 02:44–02:53)

**Why / depends on:** PRE-* worktree and equipment checks; scripts provide the exact lines. Capture all four presenter shots on one day with matching setup.

**Checklist**
- [ ] Pre-flight: `docs/video/hackathon-video-script.md`, `docs/video/launch-video-script.md`, camera or phone capable of 16:9, tripod, external microphone and headphones, charged batteries, storage, soft window or diffused key, neutral laptop, teleprompter and visible timer outside the lens frame.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`; then set up and shoot yourself. Opus must not claim the shoot happened.
- [ ] Verify: quiet bright room; eye-level locked camera; presenter frame-right; upper-left third clear for white type; subtitle band x128–1152/y630–688 and lower-third do not cover the face.
- [ ] Verify: 16:9 medium-wide and matching tighter framing, same eyeline and hand positions; wardrobe plain, no logos or tight patterns; no sensitive background material.
- [ ] Accept: documented setup and four spoken shots recorded under SHOOT-02, with clean sound and room tone.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: SHOOT-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: section 0.4, including hyperframes, hyperframes-cli, brag-slim and media-use; read hyperframes references/overlays.md and captions.md. GOAL: prepare a real shoot, not generate a presenter or fabricate any footage. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-001–H-005 and H-143–H-147 and Shoot list; docs/video/launch-video-script.md L-001–L-008 and L-167–L-170 and Shoot list. Read each named entry, VO and timing. INPUTS: these scripts and the operator's physical camera, microphone and room.

BUILD: 1. Create a concise shoot plan in demo/video/footage/work/SHOOT-01-notes.md, including a bright quiet room, eye-level locked 16:9 tripod, Harikeshav seated center-right at a warm table, neutral closed laptop at lower left, soft window light, no private information and enough depth to separate the background. Use 4K if available, never claim it was captured until checked. 2. Specify a medium-wide take and matching tighter shot, identical eyeline, light, wardrobe and hand placement, leaving upper left clear for white kinetic type. Reserve authored x128–1152, y630–688 for the caption strip, and keep the lower-third above it and away from the face. Use a plain non-patterned shirt; avoid logos. 3. Prepare a teleprompter displaying the exact four on-camera lines and a visible elapsed timer facing the speaker, both outside frame. Note the H1 00:00–00:10 and L1 00:00–00:10 windows and each actual H5/L12 line interval from the entries. Rehearse at conversational speed without cutting syllables or stretching audio. 4. Specify external mic near the mouth, headphone monitoring, manual exposure and white balance, clean recordings, clap in view for sync, and at least ten seconds room tone. Keep three complete takes per shot and a clean neutral hold. Record any setup limitations honestly.

MOUNT: none; this is a physical shoot plan, not a composition. TRAPS: do not generate video, invent completion, perform a remote shoot, expose personal data, or edit other steps' compositions. Use the storyboard's exact words, not paraphrases. QA: verify time windows against each entry; list gear and four shots, check the safe-area math and readable prompter copy. Apply section 0.4 quality checks to any project files actually edited; if no HyperFrames project exists, report that gate not applicable instead of claiming it passed. REPORT: output path, shot/timer list, checks actually made, missing gear and open questions; stop.
```

### SHOOT-02 · Record the four presenter shots (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170)

**Why / depends on:** SHOOT-01. These are physical actions, not generated output. Use the storyboard entries to settle any discrepancy in exact take boundaries.

**Checklist**
- [ ] Pre-flight: SHOOT-01 plan, scripts, working camera, sound monitor, teleprompter and visible timer; target `demo/video/footage/`.
- [ ] Record hackathon hook, wide and tight: “What if your workflows could learn, prove their work, and recover when reality changes? I'm Harikeshav Rameshkumar, from The Ohio State University.” Preserve hand position for the 00:04 cut.
- [ ] Record hackathon close, wide and tight: “I'm building Oryn so operational knowledge can improve without surrendering human control.” Hold neutral before speech and two seconds after.
- [ ] Record launch hook, wide and tight: “What if your workflows could learn from your people, prove their results, and recover from change?”
- [ ] Record launch close, wide and tight: “Build workflows that learn, agents that prove, and operations that recover. This is Oryn.”
- [ ] Record three complete takes per shot, sync clap, 10 seconds of room tone, and usable handles; monitor for clipped peaks, noise and focus errors. Capture clean neutral b-roll of hands, table and laptop, with no private content.
- [ ] Accept: originals and backups under `demo/video/footage/originals/`; select actual recordings, not synthetic voices or reconstructed shots. Note take names and any reshoot needs.

### SHOOT-03 · Capture the real Bob review (H-048–H-056, 01:13–01:22, 9 s)

**Why / depends on:** BOB-* implementation and final Bob review; SHOOT-01. Capture Bob's actual work rather than a reenactment.

**Checklist**
- [ ] Pre-flight: final review prompt in the real IBM Bob session; clean editor window; screen recorder with cursor and sufficient resolution; `demo/video/footage/`.
- [ ] RECORD the actual prompt, named files or PR, Bob's response and actual resulting action in a continuous take longer than the six-second edit. Avoid unrelated tabs and notification banners.
- [ ] Remove or hide secrets, tokens, personal names, internal hostnames and unrelated private content **before** recording. Review every frame before use; do not fabricate Bob's finding or erase a material qualification.
- [ ] Write verified values for `[BOB_TASK]`, `[BOB_REVIEWED]`, `[BOB_FINDING]`, `[BOB_ACTION]`, plus any slots named in H-048–H-056. A genuine no-finding result remains a no-finding result. Keep session evidence and commit hash.
- [ ] Accept: `demo/video/footage/bob-review.mov`, a private backup and truthful slot notes; never publish unresolved slots.

### SHOOT-04 · Ingest, back up and make seekable proxies (H-001–H-005, H-143–H-147; L-001–L-008, L-167–L-170)

**Why / depends on:** SHOOT-02 and SHOOT-03. HyperFrames needs local media with short keyframe intervals and preserved on-camera sound.

**Checklist**
- [ ] Pre-flight: selected source takes and `bob-review.mov`; verify file duration and an audible, synced slate. Preserve originals unchanged under `demo/video/footage/originals/` and a separate backup.
- [ ] Create one proxy per selected take. Replace the example source names with real selected files; run from `/Users/hari/Developer/Oryn-demo`:

```bash
mkdir -p demo/video/footage/originals demo/video/footage/proxies
for name in hk-hook hk-close lk-hook lk-close; do
  ffmpeg -i "demo/video/footage/originals/${name}.mov" -map 0:v:0 -map 0:a:0 \
    -vf 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2' \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -g 30 -c:a aac -b:a 192k \
    "demo/video/footage/${name}.mov"
done
```

- [ ] If a selected take has no audio, stop and recapture or explicitly sync its separate real microphone track; do not silently drop `-map 0:a:0`. Preserve slates and source handles; trim during edit, not by overwriting originals.
- [ ] Verify each of `hk-hook.mov`, `hk-close.mov`, `lk-hook.mov`, `lk-close.mov` with `ffprobe`, then play the first, middle and last seconds and listen for sync. Confirm Bob recording contains no private content and has legible real review text.
- [ ] Accept: the four named proxies and `bob-review.mov` in `demo/video/footage/`, originals and external backup retained, plus written selected-take and `[BOB_*]` notes.

## 2.2 Product capture

See Part 1.4 for every CAP-* clip, capture command, sidecar and frame-count gate.

## 2.3 Hackathon cut (HK-xx)

Build picture first. Each scene uses its own local clock; its host starts at the absolute film time below. The fixed capture manifest is in section 0.3. The 30 fps decision supersedes the older 60 fps text in the storyboards and design document. The storyboard's entry intervals remain the visual source of truth. Section 0.4 governs every prompt; audio, guide track, transcription, captions and delivery belong to later production steps. Preserve the on-camera recordings' own audio without adding a separate narration mix here.

Complete capture prerequisites before the affected scene: CAP-01 supplies H2; CAP-02 through CAP-09 supply H4a through H4h in that order. The named source `.json` belongs beside each `.mp4`; copy both into the project before mounting. The sidecar is an editing reference, not an excuse to redraw filmed controls or duplicate the captured cursor. If a required visual is absent from its source, stop and report its producing step, entry ID and film time. Section-specific checks do not replace the standing-order checks. Audio and subtitle work is intentionally absent here except for retaining the authentic sound already recorded with the two presenter shots.

### HK-00 · Scaffold the hackathon project (H-001–H-154, 00:00–03:00, 180 s)

**Why / depends on:** Establish the single project and its shared stage kit before building any scene. Tick PRE-02 and KIT-01–KIT-05.

**Checklist**
- [ ] Pre-flight: `docs/video/ROADMAP.md`, `docs/video/hackathon-video-script.md`, `docs/video/mock-build-inventory.md`, licensed font files and `demo/video/stage-kit/` exist.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: root is 1920×1080, 30 fps, `data-duration="180"`; fourteen scene hosts have the starts and lengths below.
- [ ] Verify: local font faces load, stage-kit assets are project-local, and caption/audio hosts are empty.
- [ ] Verify: scene roots, host IDs and timeline keys match; placeholder hosts never obscure completed scenes.
- [ ] Accept: editable scaffold is at `demo/video/hackathon/`; no soundtrack, caption groups or delivery render exists.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-00. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: invoke those in SO-O1. GOAL: initialize one editable 180-second hackathon project, not fourteen separate projects. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-001–H-154; docs/video/mock-build-inventory.md sections 2 and 4 and STG-01–STG-16; ROADMAP.md 0.3–0.4. INPUTS: demo/video/stage-kit/ and the licensed font files from Part 1. If absent, stop and identify the producing prerequisite step.

BUILD:
0. After initialization in task 1, run the non-destructive KIT-01 sync using its reported invocation; verify `demo/video/hackathon/assets/kit/` and its `snippets/` directory exist, and stop on any collision.
1. From the worktree root run `npx hyperframes init demo/video/hackathon --skip-skills --skill=hyperframes`. Do not overwrite an existing project blindly; inspect history and preserve the user's work. Then run project commands from demo/video/hackathon.
2. Set the root composition to 1920×1080, 30 fps, start 0, duration 180. Author layout on a 1280×720 coordinate grid, scaled uniformly 1.5 for delivery. Copy the prepared, licensed IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700 and Crimson Text 400/600/700 into assets/fonts/ and declare each actual face with @font-face; do not synthesize weights or fetch fonts. Preserve kit licenses and use the source snippets under assets/kit/snippets/ as specified in section 1.3; do not treat snippets as nested compositions.
3. Declare editable text, color and source variables for Oryn branding and the actual media. Add empty, non-covering audio and single captions-track hosts for later steps, without audio clips, transcriptions or subtitle text. Set up scene-host structure, and only valid, inert placeholder scene files where necessary to make mounts loadable. Each host, scene root and timeline key must use the same ID. Each scene has one paused GSAP timeline, registered after its tweens. Use unique child IDs. Do not attach scene timelines to the root timeline.
4. Make these absolute host slots: hk-h1-intro 0/26; hk-h2-problem 26/26; hk-h3a-lifecycle 52/10; hk-h3b-ai 62/11; hk-h3c-bob 73/9; hk-h4a-enroll 82/6; hk-h4b-observe 88/7; hk-h4c-playbook 95/7; hk-h4d-agent 102/7; hk-h4e-simulate 109/8; hk-h4f-job 117/11; hk-h4g-heal 128/14; hk-h4h-breadth 142/16; hk-h5-close 158/22. Use compositions/<same-id>.html. Hosts use graphics tracks; their local time begins at zero. Do not place fabricated scene content in placeholders.
5. Preserve section boundaries and reserve the subtitle strip, but do not create captions. The user-shot presenter footage's own sound is later kept via data-has-audio="true"; product captures are muted. Do not add music, SFX, narration, subtitles or a final render.

MOUNT: main 0/180 with the fourteen slots above. TRAPS: no leading slash in assets paths; timed video itself receives class=clip and timing, not a timed camera wrapper. No unsupported filter on footage. No invented facts. QA: apply SO-O7 and SO-O8, including timeline-derived seam snapshots where actual content exists; distinguish intentionally empty hosts from defects. Run preview and check HTTP 200 as SO-O9 requires. REPORT: paths, IDs and exact slots, fonts and kit sync, checks and snapshots, unresolved inputs or conflicts; stop.
```

### HK-01 · Introduction (H-001–H-013, 00:00–00:26, 26 s)

**Why / depends on:** Establish presenter, identity and the central standard. Tick HK-00, SHOOT-02 and SHOOT-04.

**Checklist**
- [ ] Pre-flight: `demo/video/footage/hk-hook.mov`, `demo/video/hackathon/assets/kit/`, fonts and `compositions/hk-h1-intro.html` exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: first 10 s show the real presenter; the face, lower-third and caption-safe band do not collide.
- [ ] Verify: exact name, university, contest and track appear; the intro O is open, without cyan.
- [ ] Verify: `Clicks complete ≠ verified outcome` leads to `Business result?` before 00:26.
- [ ] Accept: scene `hk-h1-intro` mounts at 0 for 26 s and previews correctly.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1, including overlay and film references. GOAL: build the visual introduction and retain authentic on-camera sound. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md entries H-001–H-013; ../../../docs/video/mock-build-inventory.md STG-01, STG-02, STG-04, STG-05, FX-02, FX-03 and resolved decision 2. INPUTS: ../footage/hk-hook.mov and assets/kit/; stop if missing. Copy the source to assets/footage/hk-hook.mov or use a project-local proxy made from it; never link outside assets/ from HTML.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/type.html`, `assets/kit/snippets/identity.html`, `assets/kit/snippets/transitions.js`. Copy required markup, styles and tweens into the scene template, prefix every ID `hk-h1-intro`, and append tweens to its single paused timeline. Bind `data-var-text="presenter-name"`, `presenter-school`, `presenter-credit`, `kinetic-text`, `wordmark`, `agent-chip-1` through `agent-chip-5`. Copy `kitTransition(tl, kind, targets, {at, duration})`, using `morph` and `zoom-through` on scene-local targets.
1. Read every entry H-001–H-013, including screen, motion and transition. At 0–6 show the presenter's real waist-up take frame-right. At x80 y150 author white 48px mono `What if`; reveal `LEARN` and `PROVE`, then `RECOVER WHEN REALITY CHANGES?` on the left with the H-003 1.00→1.06 crop. Preserve the shot's own audio with data-has-audio="true". Keep text backing restrained and the face visible.
2. At 6–10 add the stage lower-third `Harikeshav Rameshkumar` then `The Ohio State University`, 2px outline and 6px offset, using the storyboard rectangle x64–570 y506–590. Keep it above the future subtitle area. Match the H-004 500ms slide and H-005 300ms school reveal, quantized to 30 fps.
3. H-006–H-008 at 10–16: cut to bone dot grid, three orbit rings and a dark moving node; form the open-ring Space Grotesk 700 `Oryn` wordmark and show `IBM AI Builders Challenge, North America` and `AI for Business`. Ring remains open and unlit: this is not a verified readback.
4. H-009–H-011 at 16–22: assemble the five exact chips `Supplier Invoice Reconciler`, `Order Status Sync`, `Support Exception Triage`, `Policy Watcher`, `Peer Fix Guide`; compress them into `Governed agent`, then reveal `Test`, `Supervise`, `Improve`. Use kit transitions, 2D movement and the durations in each entry. Keep chip names legible.
5. H-012–H-013 at 22–26: contrast `Clicks complete ≠ verified outcome` with `Business result?`; prepare the specified zoom-through to the next scene without pre-empting its slot. No synthetic success check. No captions, music or SFX are added in this step.

MOUNT: compositions/hk-h1-intro.html, id hk-h1-intro, root host start 0 duration 26. TRAPS: timed footage is the clip; animate its untimed camera wrapper. Never tween clip visibility or animate footage filters. Match live-action source audio to the chosen take, and report an unsuitable or missing take instead of inventing one. QA: SO-O7–SO-O9, including first and last frames, entry seam frames, transition overlaps, preview HTTP 200 and readable text holds. REPORT: scene/asset paths, absolute and local times, checks, snapshots and conflicts; stop.
```

### HK-02 · Problem and source context (H-014–H-026, 00:26–00:52, 26 s)

**Why / depends on:** Show affected people, sourced costs and the verification gap. Tick HK-00 and CAP-01.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h2-problem.mp4` and matching `.json`, stage kit and fonts exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: INV-48210 and PO-1031 remain identifiable through Gmail, NetSuite, Sheets and Slack.
- [ ] Verify: `$9.90 / invoice`, `11.6 days` and the Ardent source are legible; Gartner forecast wording is verified before publication.
- [ ] Verify: abstract mismatch has no fabricated transaction amount; Kestrel's `$38.50` fee and `Investigation required` appear.
- [ ] Accept: `hk-h2-problem` mounts at 26 for 26 s; no product cursor is duplicated.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1 and data/film references. GOAL: show fragmented accounts-payable work, grounded external context and an unverified business outcome. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-014–H-026 and source-stat notes; ../../../docs/video/mock-build-inventory.md STG-06, STG-07, APP-01–APP-04 and decision 14. INPUTS: ../clips/hackathon/hk-h2-problem.mp4 and hk-h2-problem.json, assets/kit/ and fonts. Copy media and sidecar under assets/clips/hackathon/; stop if absent.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/diagrams.html`, `assets/kit/snippets/camera.js`, `assets/kit/snippets/transitions.js`. Copy needed markup, styles, helpers and tweens into the scene template, prefix IDs `hk-h2-problem` and keep one paused timeline. Bind `data-var-text="stat-cost"`, `stat-duration`, `stat-source`, `failure-label`. Use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with the sidecar rectangle at the intended frame; missing rectangles are errors. Append `kitTransition(tl, kind, targets, {at, duration})` with `paper-wipe` or `zoom-through` on scene-local targets.
1. Read all H-014–H-026. Use the full 26-second captured product film as the actual UI and original cursor, not a recreated interface. Frame and cut its distinct intervals using the sidecar's time-varying named UI anchor rectangles. Put timed video on an untimed camera wrapper; use no additional cursor. If the captured clip already contains a specified visual, preserve it and do not duplicate it with a stage layer.
2. H-014–H-017, absolute 26–34: show Brightwater Industrial, Calder & Vance Supply Co. and INV-48210; at 28 match PO-1031 between email and NetSuite; at 30 show `AP Exceptions Tracker` and `#ap-escalations`, panning 120px left over 700ms; at 32 present `Priya Nair · AP Specialist` and `Marcus Webb · AP Manager`. Zoom 1→1.15 toward the PDF anchor for the first shot. Take actual anchor names from the sidecar, report the selected names and never guess rectangles.
3. H-018–H-020, 34–40: use the stage stat component for `$9.90 / invoice` and `11.6 days`, with `Average processing cost and time per invoice` and `Ardent Partners · Payables Place · 2026`. Keep the source line visible throughout the paired values; the source is https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/. These describe external AP context, not Oryn performance.
4. H-021–H-024, 40–48: keep `Clicks complete` distinct from `Result not verified`, and use differing abstract bars without an invented invoice, numerical outcome or false success. At 44 show Kestrel Components and `Handling fee $38.50`, using the paper wipe and stopped, ink-only broken path.
5. H-025–H-026, 48–52: show `Why?`, Priya's role and `Investigation required`. Include the exact separate Gartner 2025 forecast and McKinsey Global Institute 2012 source lines from H-025. The Gartner wording is explicitly marked for verification before publishing; if not independently verified, report that release blocker rather than silently asserting it. Honor the 600ms peripheral fade and exception-card zoom-through to the lifecycle.

MOUNT: compositions/hk-h2-problem.html, host start 26 duration 26, local start 0. TRAPS: 30 fps; no idle cyan; preserve source attribution and any intentionally abstract failure state. Hold required text for roughly 0.3 s per word once settled, without shifting section boundaries. Do not add audio or captions. QA: SO-O7–SO-O9 including boundary and overlap snapshots. REPORT: exact sidecar anchors used, clip in/out and frame count, sourced text, checks, snapshots and any conflicting entry or unreadable line; stop.
```

### HK-03 · Lifecycle ring (H-027–H-036, 00:52–01:02, 10 s)

**Why / depends on:** Explain the complete governed loop before showing the AI boundary. Tick HK-00 and the reusable lifecycle kit.

**Checklist**
- [ ] Pre-flight: `demo/video/stage-kit/`, `demo/video/hackathon/assets/kit/` and `compositions/hk-h3a-lifecycle.html` exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: all fourteen labels appear in the source order and release returns to observation.
- [ ] Verify: mark is open and the node remains dark; diagram and future caption area do not overlap.
- [ ] Verify: the pullback at 01:01 reveals the full ring without clipped text.
- [ ] Accept: `hk-h3a-lifecycle` mounts at 52 for 10 s.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: animate the fourteen-stage governed lifecycle as an explanatory stage diagram. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-027–H-036; ../../../docs/video/mock-build-inventory.md STG-01, STG-03, FX-02 and its lifecycle rules. INPUTS: assets/kit/ and local fonts. Stop if the ring kit is missing.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/identity.html`, `assets/kit/snippets/transitions.js`. Copy markup, styles and tween statements into the scene template, prefix IDs `hk-h3a-lifecycle`, and keep one paused timeline. Bind `data-var-text="lifecycle-label"` and `wordmark`. Copy `kitTransition(tl, kind, targets, {at, duration})` for the opening `zoom-through`, targeting scene-local elements.
1. Read each entry H-027 through H-036, including its one-second absolute interval. At 52 begin with the specified 300ms zoom-through, 24px bone grid, concentric 2px ink rings around authored (640,330), heading `CLOSED LIFECYCLE` and a single dark traveling node. Draw the ring over 700ms; its motion is finite and seekable.
2. At 53 add `Observe` and consent card; at 54 add `Understand`, evidence and connecting line; at 55 `Review · Publish` with `Suggested`; at 56 `Compile · Simulate` with the definition and test grid; at 57 `Authorize · Execute` with a distinct authorization gate. Preserve each entry's entrance, stagger and 2px stage framing. These are explanation cards, not live activity.
3. At 58 add `Verify · Diagnose`, separating independent evidence from the prior execution card; at 59 add `Correct · Repair`, including human correction; at 60 add `Re-evaluate · Release` and its release gate. The exact sequence is Observe, Understand, Review, Publish, Compile, Simulate, Authorize, Execute, Verify, Diagnose, Correct, Repair, Re-evaluate, Release. At 61–62 pull from 1.2 to 1 over 700ms to reveal all labels and the connector returning release to observation.
4. Keep the central O open. The illustrative node and labels are ink, not cyan: no simulator, job or regression is executing here. Use genuine kit components, not a second visual convention. Use the entry timings as boundaries and local scene time as absolute minus 52; quantize to 1/30 s. For long labels, begin early or hold within the available scene so each intended line is readable without hiding other stages.

MOUNT: compositions/hk-h3a-lifecycle.html, scene id hk-h3a-lifecycle, host 52/10. Use a single registered paused timeline and graphics lane. TRAPS: never nest a second composition timeline into the root timeline; do not imply AI approval or pre-close the mark. Reserve y630–688 authored for later captioning. QA: SO-O7–SO-O9; examine each label's settled state, the full ring, seam and overlap frames and report unreadable timing rather than silently removing a stage. No captions, music, SFX or final render. REPORT: files, timing, snapshots, any deviations or open questions; stop.
```

### HK-04 · Local and cloud AI boundary (H-037–H-047, 01:02–01:13, 11 s)

**Why / depends on:** Distinguish private local evidence from authorized cloud inference. Tick HK-03 and the architecture kit.

**Checklist**
- [ ] Pre-flight: `demo/video/hackathon/assets/kit/` includes the architecture diagram and fonts.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: local capture, masking, exclusions and storage stay distinct from the authorized cloud path.
- [ ] Verify: LiteLLM gateway, route conditions, five AI uses and human review are readable.
- [ ] Verify: model suggestions never appear as authorization, evidence or automatic policy.
- [ ] Accept: `hk-h3b-ai` mounts at 62 for 11 s.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: show the actual local/cloud boundary and five bounded uses of AI, without inventing a security certification. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-037–H-047; ../../../docs/video/mock-build-inventory.md STG-08 and relevant privacy and gateway fixtures. INPUTS: assets/kit/ architecture components and local fonts; stop when absent.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/diagrams.html`. Copy needed markup, styles and finite reveal statements into this scene template, prefix every ID `hk-h3b-ai`, and append to the single paused timeline. Bind `data-var-text="ai-boundary-label"` to an editable scene variable and preserve source labels.
1. Open every entry H-037–H-047. At absolute 62–64, device card x120–490 reads `LOCAL: private evidence · exclusions · masking`; show `capture · deterministic validation · encrypted storage`. Hatch protected values without ever rendering the values. This local boundary concerns durable private evidence, not a claim that inference is on-device.
2. At 64–67 draw the authorized route through `Purpose authorization`, separate blocked branch, `Oryn-managed LiteLLM gateway` and `Approved cloud model`. Show `US processing · zero content retention after processing · no training` as the storyboard's route conditions, not as a compliance badge or a claim about every possible route. Keep unauthorized material from entering the cloud path. Use the entry-specific 500ms connectors and 350ms footnote reveal.
3. At 67–72 reveal the five separate cloud-use cards in source order: `Workflow discovery`, `Agent-definition generation`, `Scenario generation`, `Verification assistance`, `Repair proposals`. Keep generated definitions and repairs visibly suggested; keep scenario oracle and verification evidence separate from model output. Apply each entry's 350–500ms reveal, not one simultaneous list.
4. At 72–73 emphasize `Human review and authority` and retain `Suggested` on the adjacent output. Leave room for the next actual Bob recording. Make captions possible later without adding captions now. Start every internal action at entry absolute time minus 62 and use frame-exact 30 fps timing.

MOUNT: compositions/hk-h3b-ai.html, id hk-h3b-ai, start 62 duration 11. TRAPS: finite deterministic timeline; idle diagram ink only, no execution cyan. Never treat the architecture as an invented product screenshot. Each label must hold approximately 0.3 s per word after it settles; if the exact script timing makes that impossible, report it rather than hiding or changing the claim. Do not add audio, VO, captions or a final render. QA: SO-O7–SO-O9; inspect boundaries, all five cards, route footnote, human gate and transition overlap. REPORT: project-local paths, IDs, checks, snapshot verdicts and open questions; stop.
```

### HK-05 · IBM Bob build and review (H-048–H-056, 01:13–01:22, 9 s)

**Why / depends on:** Show actual primary development and review evidence. Tick HK-00, CAP-02, SHOOT-03 and SHOOT-04.

**Checklist**
- [ ] Pre-flight: `demo/video/footage/bob-review.mov`, `demo/video/clips/hackathon/hk-h4a-enroll.mp4` and its `.json`, and Bob frame kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: actual build, request, response and outcome can each be read; editor and recorded pointer are authentic.
- [ ] Verify: editable `[BOB_*]` slots correspond to known source offsets; no invented finding, result or simulated cursor appears.
- [ ] Verify: 01:20–01:22 hands off to the actual enrollment visual without duplicating a cursor.
- [ ] Accept: `hk-h3c-bob` mounts at 73 for 9 s; missing evidence is reported.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-05. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1 and film/overlays references. GOAL: show genuine IBM Bob development and review, not a reconstructed review. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-048–H-056 and fill-in slots; ../../../docs/video/mock-build-inventory.md STG-09, SC02 and relevant GAP items. INPUTS: ../footage/bob-review.mov; ../clips/hackathon/hk-h4a-enroll.mp4 and .json; assets/kit/. Copy only required sources into assets/footage/ and assets/clips/hackathon/. Stop if the real recording, its relevant segment or safe enrollment frame is unavailable.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/evidence.html`, `assets/kit/snippets/camera.js`, `assets/kit/snippets/transitions.js`. Copy Bob-frame markup, styles and tweens into the scene template, prefix IDs `hk-h3c-bob`, and append to its one paused timeline. Bind `data-var-src="bob-footage"` to the real local source and `data-var-text="bob-review-result"` and `bob-outcome` only to visible facts; unknowns remain unresolved. Copy `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` for sidecar-backed enrollment framing and `kitTransition(tl, kind, targets, {at, duration})` with `zoom-through` for the scene-local handoff.
1. Read H-048–H-056 individually. Inspect the actual screen recording and identify edit points for `[BOB_CAPTURE: real recorded IBM Bob workspace]`, `[BOB_BUILD: real capture of Bob used during development]`, `[BOB_REVIEW_REQUEST: real prompt and project file under review]`, `[BOB_REVIEW_RESULT: actual Bob response]` and `[BOB_OUTCOME: actual resulting edit, test or decision]`. Create editable source/offset variables from real observed material; never fill an unknown value from inference. If the footage does not contain the segment, stop and report the exact missing slot.
2. At 73–74 frame the authentic Bob panel in the 2px ink/6px stage-shadow card, camera 1→1.05 over 700ms. At 74–75 pan 600ms to the real build prompt and preserve editor chrome. At 75–76 frame the real review request and filename, zoom 1.05→1.18 over 700ms. Do not change the interface colors or manufacture task text.
3. At 76–78 hold the actual review response, with original pointer and context, moving 1.18→1.22 over 700ms. At 78–80 show the actual edit, test or decision and hold. An inconclusive outcome remains inconclusive. Do not add an invented highlight, summary, conclusion or synthetic cursor. Treat `[BOB_TASK]`, `[BOB_REVIEWED]`, `[BOB_FINDING]` and `[BOB_ACTION]` as editable verified-fact slots for later project-page work, never as on-screen claims in this scene.
4. At 80–81 shrink the actual Bob frame 1→.65 over 700ms. For H-055–H-056 expose a still derived from the actual first frame of hk-h4a-enroll, if it shows the required SC02 enrollment state; otherwise stop and request the appropriate captured enrollment frame rather than fabricating it. At 81–82 show `Calder & Vance · Employee`, settle 1.05→1, and use only a real captured pointer where present. A still extracted from the capture must be a project-local asset, not a seek command in the timeline.

MOUNT: compositions/hk-h3c-bob.html id hk-h3c-bob, host 73/9. TRAPS: the Bob recording is silent unless it actually supplies needed audio; no new narration, music, SFX or captions. Video clips carry timing directly; use editable data-media-start offsets for source trims, no play/pause/seek. Ensure no secrets, personal data or internal hostnames are visible; stop if the source is unsafe. QA: SO-O7–SO-O9 and snapshots of each real source segment and the 80–82 handoff. REPORT: source offsets and slot evidence, paths, checks, snapshot verdicts, unresolved slots and deviations; stop.
```

### HK-06 · Enrollment and privacy (H-057–H-062, 01:22–01:28, 6 s)

**Why / depends on:** Establish independent consent and visible privacy controls before observation. Tick HK-05 and CAP-02.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4a-enroll.mp4` and `.json`, kit and fonts exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: notice acknowledgment, work scope and sharing consent are not conflated.
- [ ] Verify: `BANK ACCT`, `TAX ID`, `CARD` are masked from the first frame; `Pause` remains visible.
- [ ] Verify: passive `Capture active` is neutral, with no cyan; pointer exists only once.
- [ ] Accept: `hk-h4a-enroll` mounts 82/6 with correct entry and exit.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-06. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: stage the actual enrollment capture without recreating its interactions. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-057–H-062; ../../../docs/video/mock-build-inventory.md SC01–SC03, STG-11, FX-04, decision 18. INPUTS: ../clips/hackathon/hk-h4a-enroll.mp4 and hk-h4a-enroll.json, assets/kit/. Copy both capture files to assets/clips/hackathon/. If missing, stop and identify CAP-02.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/evidence.html`. Copy the camera helper and any needed stage-owned evidence markup into the scene template; prefix IDs `hk-h4a-enroll`, append statements to its single paused timeline, and use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with actual sidecar rectangles. If a separate masking label is necessary bind `data-var-text="masked-field"`; never duplicate captured masking.
1. Read each H-057–H-062 entry. Mount the silent six-second frame-exact clip at local 0, preserving its cursor, UI timing and 30 fps. Load its sidecar offline at authoring time and choose its actual named anchor rectangles for enrollment notice, scope checkboxes, privacy field rows and menu-bar Pause; report the chosen anchor names. Animate only scale and translation on an untimed enclosing camera wrapper. Never draw a second pointer over the film.
2. At absolute 82–84, preserve `Priya Nair`, `Calder & Vance`, `Organization notice`, `Review notice`, `Permitted work observation` and `I understand`. Acknowledging notice is not consent to capture or organizational sharing. Keep each 150ms panel transition and captured click visible instead of mimicking it in the stage layer.
3. At 84–86 show the separate `Work applications` and `Excluded windows` scope, then `My Privacy` and `Pause`, including exclusions, retention and deletion controls when visible. The visual treatment is flat product UI, not a stage-card hard shadow; do not cover the selected control with future captions.
4. At 86–87 frame `BANK ACCT`, `TAX ID`, `CARD` and their three neutral hatch sweeps; values must already be covered before the sweep. At 87–88 show `Capture active` and `Pause` in the macOS popover, with the captured hover but no click that disables the next observation. A neutral status glyph, never cyan, denotes passive capture.
5. Use the specified hard cuts at 85 and 87 and retain the continuity from the actual enrollment frame in HK-05. End on the frame before 88, then hard-cut to observation. Do not create captions, effects audio or another simulation of this app.

MOUNT: compositions/hk-h4a-enroll.html, scene id hk-h4a-enroll, host 82/6. TRAPS: no CSS filter on footage, no timed media nested in a timed wrapper, no fake values or missing consent. 150ms storyboard motions may need nearest-frame quantization; preserve ordering. QA: SO-O7–SO-O9, check first/last and every cut, sidecar-targeted focus, redaction and caption-safe area. REPORT: selected anchors and camera transforms, duration, source frame count, checks and snapshot verdicts; stop.
```

### HK-07 · Observation and commitment (H-063–H-069, 01:28–01:35, 7 s)

**Why / depends on:** Follow authorized work into a separately consented meeting and human-confirmed commitment. Tick HK-06 and CAP-03.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4b-observe.mp4` and `.json`, kit and fonts exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: `INV-48203`, demonstration D1 and meeting consent appear in sequence.
- [ ] Verify: Priya changes `Fri 17:00` to `Fri 12:00` before `Confirmed Commitment`.
- [ ] Verify: `00:14:32`, `subject to company approval` and the vendor-context reminder are legible.
- [ ] Verify stage gap `GAP-STG-H-d1overlay` (owner assigned by BOB-12): read the full gap; `Demonstration D1 · Priya · Mon 09:14` is a stage overlay over the actual NetSuite and tracker anchors (`hk-h4b-observe` f30 and f48), with no invented fields.
- [ ] Accept: `hk-h4b-observe` mounts 88/7 with no duplicate pointer.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-07. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: present a continuous chain from allowed observation to reviewed human commitment. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-063–H-069; ../../../docs/video/mock-build-inventory.md SC04, SC05, SC06, SC09, SC11 and their GAP extensions. INPUTS: ../clips/hackathon/hk-h4b-observe.mp4 and hk-h4b-observe.json, assets/kit/. Copy both into assets/clips/hackathon/; if absent stop and name CAP-03.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`. Copy the helper into the scene script, prefix added IDs `hk-h4b-observe`, and use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles on its existing single paused timeline.
1. Open every H-063–H-069 entry. Mount the silent capture with its own product cursor and already-performed actions. At 88–90 show the Brightwater message and attached PDF `INV-48203`, then the NetSuite PO form and sheet with `Demonstration D1 · Priya · Mon 09:14`. Match cut on invoice identity; pan 100 authored px right over 600ms using the actual sidecar PO anchor.
2. At 90–92 show the SC09 meeting with Dana Whitfield and Priya. `Meeting capture: consent required` precedes the indicator and is accepted before capture. Show the exact in-window line `From the next cycle we're adding a handling line to every invoice.` Use the recorded product animation; do not add a separate synthetic voice, meeting participant or unearned consent.
3. At 92–94 frame the SC11 commitment `Confirm Kestrel handling-fee terms in writing`, owner Priya, source `00:14:32` and `subject to company approval`. Show deadline `Fri 17:00` changing to `Fri 12:00`, followed by the explicit `Confirm` action and `Confirmed Commitment`. A confirmed commitment is not company policy.
4. At 94–95 show the SC06 Kestrel vendor record and one SC04 reminder: `Confirm Kestrel handling-fee terms in writing · Fri 12:00`. Follow named sidecar rectangles for meeting consent, deadline, confirm and reminder; record the actual names and time ranges. Do not mask or duplicate existing product elements. Use a hard cut at 95 into the next actual capture.

MOUNT: compositions/hk-h4b-observe.html, host id hk-h4b-observe start 88 duration 7; footage starts local 0. TRAPS: timeline owns the video but camera wrapper has no clip timing; no play, pause or seek. Preserve 30 fps, neutral observation status and the caption-safe zone. If an anchor is missing, stop instead of guessing its coordinates. No soundtrack, new VO or captions. QA: SO-O7–SO-O9, inspect consent before indicator, deadline before and after, every hard-cut neighbor and transition overlap. REPORT: paths, exact anchors, timing, checks, snapshots and open questions; stop.
```

### HK-08 · Candidate and playbook (H-070–H-076, 01:35–01:42, 7 s)

**Why / depends on:** Separate proposed workflow knowledge from approved guidance. Tick HK-07 and CAP-04.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4c-playbook.mp4` and `.json`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: three demonstration identities, times and invoice IDs match H-070.
- [ ] Verify: uncertainty and AP-RULE-009's exactly-2.00% boundary remain visible.
- [ ] Verify: v1.0 `Approved for Guidance` is neutral and is not an agent deployment.
- [ ] Accept: `hk-h4c-playbook` mounts 95/7.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-08. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: make the source evidence, uncertainty, owner review and playbook publication legible in the captured product. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-070–H-076; ../../../docs/video/mock-build-inventory.md SC13–SC15, DAT fixtures and resolved decisions 5–6. INPUTS: ../clips/hackathon/hk-h4c-playbook.mp4 and hk-h4c-playbook.json, assets/kit/. Copy clip and sidecar to assets/clips/hackathon/; if absent name CAP-04 and stop.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/transitions.js`. Copy helpers into the scene template, prefix added IDs `hk-h4c-playbook`, and append statements to its one paused timeline. Use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with the sidecar rectangle and `kitTransition(tl, kind, targets, {at, duration})` with `zoom-through` on scene-local targets.
1. Read all seven entries. Place the seven-second muted capture, preserving its actual cursor and state transitions. Use the sidecar to identify actual anchors for demonstration rows, candidate title, uncertainty, rule drawer, publish status and evidence. Animate only the camera wrapper; do not reconstruct or overlay a second cursor or altered UI.
2. At 95 show the three rows exactly: `D1 Priya Mon 09:14 INV-48203`, `D2 Priya Mon 10:02 INV-48204`, `D3 Jamal Tue 13:40 INV-48207`. At 96–98 show `Match supplier invoice to purchase order and stage result in ERP`, `Suggested`, labeled confidence without an invented percentage, and `Variance exception rule: unverified until SME review`. The candidate is not policy.
3. At 98–100 preserve the role change `Marcus Webb · Workflow Owner`, the AP-RULE-009 evidence drawer, and `variance above 2.00% requires Tier 3 approval; at or below 2.00% auto-accept`. The visual must not imply that clicking evidence is equivalent to approval. Use the captured pointer path, 150ms product transitions and the hard cut given in H-073.
4. At 100–102 frame `Supplier invoice vs purchase order reconciliation · v1.0` and the neutral outlined `Approved for Guidance` shield/check, followed by `Steps · Decisions · Exceptions · Evidence`. Apply the specified 1→1.08 camera push on the sidecar evidence anchor. Finish with a zoom-through toward the agent intent in the next scene while keeping both capture boundaries intact.

MOUNT: compositions/hk-h4c-playbook.html id hk-h4c-playbook, host 95/7. TRAPS: check exact source times, film time minus 95; no added stage shadow inside product, no new typing, no cyan for review. Keep readable material out of y630–688. Do not add captions or sound. QA: SO-O7–SO-O9, scene ends, entry boundaries and overlaps; flag a sidecar or capture that cannot show an essential value instead of fabricating it. REPORT: actual anchor names, source duration/frame count, path, checks and snapshots; stop.
```

### HK-09 · Agent definition and gates (H-077–H-083, 01:42–01:49, 7 s)

**Why / depends on:** Show agent scope, risk and release gates before simulation. Tick HK-08 and CAP-05.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4d-agent.mp4` and `.json`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: exact intent and `Unverified branch` appear without fabricated typing.
- [ ] Verify: six autonomy levels, Tier 3 and 5/5 evidence provenance are visible.
- [ ] Verify: test and owner checks remain pending before evaluation.
- [ ] Accept: `hk-h4d-agent` mounts 102/7.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-09. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: show the captured agent definition, scoped authority and unsatisfied gates. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-077–H-083; ../../../docs/video/mock-build-inventory.md SC17–SC18, CMP-21–CMP-23, STG-14 and decisions 5 and 18. INPUTS: ../clips/hackathon/hk-h4d-agent.mp4 and hk-h4d-agent.json; assets/kit/. Copy capture and sidecar under assets/clips/hackathon/, stopping with CAP-05 if absent.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/end-card.html`, `assets/kit/snippets/transitions.js`. Copy helpers into the scene template, prefix IDs `hk-h4d-agent`, and append statements to its single paused timeline. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with the actual sidecar rectangle; call `kitTransition(tl, kind, targets, {at, duration})` with `zoom-through` on scene-local targets. Use `data-var-text="agent-intent"` from end-card.html only if a separate stage pill is needed, never over the captured input.
1. Read H-077–H-083 in full. Mount the actual silent seven-second capture and its recorded cursor. Follow the sidecar's real names for intent input, unverified branch, risk panel, Stage 3 ladder and gate checklist. The playbook-to-field zoom-through begins at 102; use a scale/translate wrapper without changing the clip's own clock.
2. At 102–104 show `Create Agent`, then exact intent `Reconcile supplier invoices against purchase orders and stage the result in the ERP.` The source says 32 characters/s and typing pre-roll; do not restart the capture or fabricate the long line inside one second. At 104–105 show the six proposed fields and explicit `Unverified branch` and `Stopping points`.
3. At 105–107 show `Tier 3 - Consequential`, read Tier 0, tag/stage Tier 1/2 and post or variance approval Tier 3. Frame the six exact ladder levels: `0 Observe`, `1 Suggest`, `2 Guide`, `3 Supervised Assist`, `4 Scoped Autopilot`, `5 Self-Maintaining Autopilot`. Stage 3 is a neutral selection, not an active execution signal.
4. At 107–109 show `5/5 verified examples`, `28 representative scenarios`, `6 edge/negative`, `Owner approval`, and `3 observed this week + 2 SME-verified archived cases`. Only examples have an independently evidenced check at this point; scenario and owner rows remain pending until H-091. Preserve captured 150ms interface transitions and the in-scene evidence drawer.

MOUNT: compositions/hk-h4d-agent.html id hk-h4d-agent, root host 102/7. TRAPS: no guessed anchor rectangles, duplicate cursor, synthetic UI or premature approval. Clip time is local absolute-minus-102; all section boundaries lie on the 0.5s grid. Do not add music, captions or separate VO. QA: SO-O7–SO-O9 with source/sidecar cross-check, text holds, first and last frames and every transition overlap. REPORT: camera anchors, paths, checks, snapshots, unreadable timing and conflicts; stop.
```

### HK-10 · Simulator and corrected boundary (H-084–H-091, 01:49–01:57, 8 s)

**Why / depends on:** Demonstrate the failed boundary, correct it and satisfy the gate. Tick HK-09 and CAP-06.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4e-simulate.mp4` and `.json`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: v0.1 shows 21 passed, 6 expected safe escalations and 1 failed.
- [ ] Verify: exact 2.00% is accepted after correction; v0.2 shows 22/6/0.
- [ ] Verify: cyan appears only while a run executes; Stage 3 approval follows the passing suite.
- [ ] Accept: `hk-h4e-simulate` mounts 109/8.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-10. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: present a real captured simulation failure, evidence-driven fix and release gate. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-084–H-091; ../../../docs/video/mock-build-inventory.md SC18–SC20, DAT scenario fixtures and decisions 5 and 13. INPUTS: ../clips/hackathon/hk-h4e-simulate.mp4 and hk-h4e-simulate.json and kit. Copy the pair to assets/clips/hackathon/; stop and name CAP-06 if missing.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`. Copy the helper into the scene script, prefix added IDs `hk-h4e-simulate`, and call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles; append tweens to the existing one paused timeline.
1. Read every entry H-084–H-091. At 109–110 frame `SIM-AP-RECON · 28 scenarios`, v0.1 and the Run suite click. Keep the actual 500ms running bar cyan only while execution runs. Do not create a new job, cursor or progress animation: these are already in the capture. Obtain suite, result, replay, rule, compare and gate rectangles from actual sidecar anchors.
2. At 110–112 show `21 Passed · 6 Passed — Expected Safe Escalation · 1 Failed`, then `variance_exactly_2.00pct` with `Expected: accept` and `Actual: escalate`. The three status categories require distinct glyphs. Cyan must be off at completion. Keep the first result on screen long enough to distinguish six safe passes from failures.
3. At 112–114 show AP-RULE-009 and `at or below 2.00% auto-accept`, then the v0.1/v0.2 side-by-side with `> 2.00% requires approval`. At 114–116 show the actual rerun, including missing PO twice, duplicate, over-threshold variance, ERP timeout and unreadable PDF; the corrected result reads `22 Passed · 6 Passed — Expected Safe Escalation · 0 Failed` and `28/28 intended outcomes correct`.
4. At 116–117 show the evidence-backed gate: `5/5 examples`, `28 passing scenarios`, `6 edge/negative`, Marcus's owner approval and `v1.0 · Stage 3 Supervised Assist`; only now can previously pending checks appear. Preserve the cut and Deploy click from the capture; do not imply that publication alone granted execution.

MOUNT: compositions/hk-h4e-simulate.html, host hk-h4e-simulate 109/8. TRAPS: muted timed video within untimed scale/translate wrapper; do not seek media or add cursor. Retain action order, status text, 30 fps and end-of-run cyan-off frame. No soundtrack, captions or final render. QA: SO-O7–SO-O9, inspect failed and corrected counts, safe escalation glyphs, actual active intervals and all transitions; report any text that cannot meet the reading hold. REPORT: actual sidecar anchors, clip timing and frame count, snapshot verdicts, errors and unresolved issues; stop.
```

### HK-11 · Supervised job and approval (H-092–H-102, 01:57–02:08, 11 s)

**Why / depends on:** Demonstrate distinct outcomes and independent verification. Tick HK-10 and CAP-07.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4f-job.mp4` and `.json`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: initial 7/2/1/1 and later 8/2/0/1 sum to eleven.
- [ ] Verify: INV-48219's approval is pending before independent readback; INV-48220 stays held and not resubmitted.
- [ ] Verify: the open O closes only after verified readback; the 02:07 Kestrel fee leads into the next clip.
- [ ] Accept: `hk-h4f-job` mounts 117/11, ending at 128.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-11. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: show the exact job ledger, decision and subsequent independent verification. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-092–H-102, job table; ../../../docs/video/mock-build-inventory.md SC21–SC25, DAT invoices and decisions 1, 2, 9–11. INPUTS: ../clips/hackathon/hk-h4f-job.mp4 and hk-h4f-job.json plus assets/kit/. Copy both into assets/clips/hackathon/ or stop and name CAP-07.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/identity.html`. Copy the helper and any needed identity markup and tweens into this scene template, prefix IDs `hk-h4f-job`, and append to its one paused timeline. Use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles. If the captured readback does not already show closure, use `kitVerifiedRingClose(tl, ringPath, at)` on a scene-local mark only after readback; never duplicate closure.
1. Read all H-092–H-102. Mount the 11-second muted capture with its own pointer; use actual sidecar anchors for queue, first case, exceptions, summary, unknown, approval, readback and Kestrel fee. Do not recreate the product or animate a second cursor. At 117–119 show `JOB-0117 · 11 invoices`, `AP East`, `Supplier Invoice Reconciler v1.0`, first case `INV-48210`, `$6,240.00`, `PO-1031`; cyan exists only while execution runs.
2. At 119–122 show `7 Verified Complete`; only after independent first-case readback close the O over 400ms and hold 400ms. Show INV-48215 and INV-48218 as `Escalated: Missing Purchase Order`; then `Partially Complete` and `7 Verified Complete · 2 Escalated · 1 Approval Required · 1 Outcome Unknown`. At 122–123 frame INV-48220 Northgate Pallets, `$2,732.50`, `PO-1044`, `Outcome Unknown · ERP submit timed out · Held`, with hatch beside—not behind—text.
3. At 123–126 show INV-48219, `$18,420.00`, PO-1042 `$17,980.00`, `$440.00 / 2.45%`, and `Daniel Okafor · Tier 3`. Preserve `Variance Hold` → `Matched - Variance Approved`; after the approval click display `Pending verification` before independent ERP readback. Only then swap the summary in 150ms to `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`; no count-up.
4. At 126–128 return to `Held · Reconciliation required · Not resubmitted`; no retry or resubmit control exists. Then H-102 shows Kestrel Components invoice layout v2 and the `$38.50` handling line. End this capture at 128. The next capture starts at 128 and contains the entire 400ms dark wipe at H-104, 129–129.4, one second after its own start; never add another wipe at this seam.

MOUNT: compositions/hk-h4f-job.html, id hk-h4f-job, host 117/11. TRAPS: use muted timed video and untimed camera wrapper, no CSS footage filters; preserve exact outcomes and 30 fps. Reserve caption band, but add no captions or audio. QA: SO-O7–SO-O9; inspect pre/post readback, distinct outcome glyphs, no blind retry, all boundary and transition snapshots. REPORT: clip frame count, sidecar anchors, exact times, checks and any mismatch; stop.
```

### HK-12 · Containment, correction and release (H-103–H-116, 02:08–02:22, 14 s)

**Why / depends on:** Contain before repair, test the bounded change and earn release. Tick HK-11 and CAP-08.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4g-heal.mp4` and `.json`.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: the sole light-to-dark wipe is inside the capture at 02:09, not at the clip seam.
- [ ] Verify: three cases are contained before repair; the cause remains `unconfirmed`.
- [ ] Verify: 34 regressions resolve 28/6/0, then limited release, 3/3 verification and owner expansion occur in order.
- [ ] Verify stage gap `GAP-STG-H-kestrel-po` (owner assigned by BOB-12): read the full gap; a stage PO card beside the PDF (`hk-h4g-heal` f0-f29) shows `INV-48231`, `$4,213.50`, `PO-1051`, `$4,175.00`, `Handling fee $38.50` and no Brightwater PO detail.
- [ ] Accept: `hk-h4g-heal` mounts 128/14 and ends 142.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-12. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: faithfully stage the captured incident, human correction and controlled repair. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-103–H-116; ../../../docs/video/mock-build-inventory.md SC26–SC29, FX-01, DAT incident and decisions 2, 8 and 12. INPUTS: ../clips/hackathon/hk-h4g-heal.mp4 and hk-h4g-heal.json, assets/kit/. Copy pair into assets/clips/hackathon/; stop and name CAP-08 if absent.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/identity.html`. Copy the camera helper and any required verified-mark markup into the scene template, prefix IDs `hk-h4g-heal`, and append to its one paused timeline. Use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles. Only if a separate mark is needed and the clip does not already show it, call `kitVerifiedRingClose(tl, ringPath, at)` after independent 3/3 readbacks; never duplicate the captured wipe or mark.
1. Read every H-103–H-116 entry. Mount the 14-second muted capture, preserve its pointer and select sidecar anchors for fee, incident, affected cases, teach question, scope, diff, regression and release. At 128–129 show `INV-48231`, `$4,213.50`, `PO-1051`, `$4,175.00` and `$38.50`; camera 1→1.12 over 600ms.
2. H-104 starts at 129: FX-01's 400ms left-to-right wipe from bone to #0A0A0A is already rendered inside this capture. The clip starts at 128, one second before the wipe, exceeding the 0.3-second lead. Never create another wipe, toggle or layer. At 130–132 show `INC-0042`, `Contained · 3 affected cases paused`, INV-48231, INV-48233 and INV-48236; then `Expected: verifiable invoice total`, `Actual: cannot verify`, `Supplier document format change — unconfirmed`. No cyan remains during containment.
3. At 132–135 show Elena Ruiz's manual case and `Teach Oryn What Changed`; the exact question `Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?`, `Yes`, and `AP-RULE-017 Supplier handling fees`. At 135–137 show Marcus's `Kestrel Components layout v2 only`, `Correction is evidence, not new policy`, proposal `REP-0042-1`, and bounded step `Interpret invoice totals`.
4. At 137–139 run the captured `6 new regression cases · 34 total` and display `28 Passed · 6 Passed — Expected Safe Escalation · 0 Failed` for the v1.1 candidate. Cyan only during the executing interval. At 139–142 return by the captured hard cut to light UI, show `Limited release · Kestrel Components invoices · AP East only`, `First 3/3 Verified Complete`, owner expansion and `Repaired - Validated`, in that order.

MOUNT: compositions/hk-h4g-heal.html id hk-h4g-heal, host 128/14. TRAPS: no duplicated wipe, false confirmed hypothesis, premature release or 33-test figure. Keep timed video on an untimed camera wrapper, no seek, no duplicate pointer or footage filter. Do not add sound or captions. QA: SO-O7–SO-O9; inspect frames around 128, 129, 129.4, containment, regression stop and 142, plus all transitions. REPORT: sidecar anchors, frame count, wipe start/end, checks, snapshot verdicts and discrepancies; stop.
```

### HK-13 · Breadth and command center (H-117–H-132, 02:22–02:38, 16 s)

**Why / depends on:** Show adjacent workflows without changing the hero's facts. Tick HK-12 and CAP-09.

**Checklist**
- [ ] Pre-flight: `demo/video/clips/hackathon/hk-h4h-breadth.mp4` and `.json`; the two separately authorized, irreversibly redacted screenshot textures used in H-128.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: policy revalidation is 1 playbook, 1 agent and 34 tests; 12% discount is blocked.
- [ ] Verify: screenshot textures carry no sensitive material and stay separate from fictional evidence cards.
- [ ] Verify: app capability gaps say `Unavailable`; final summary is 8/2/0/1 `Partially Complete`.
- [ ] Accept: `hk-h4h-breadth` mounts 142/16.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-13. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: present the breadth montage and truthful post-approval command center using the captured film. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-117–H-132; ../../../docs/video/mock-build-inventory.md SC16, SC30–SC36, STG-13 and decisions 8, 9, 15 and 16. INPUTS: ../clips/hackathon/hk-h4h-breadth.mp4 and hk-h4h-breadth.json; independently authorized, irreversibly redacted `[USER SCREENSHOT 1: redacted permitted-work email]` and `[USER SCREENSHOT 2: redacted permitted-work document]`, already embedded in the capture or supplied as project-local assets. Stop and name CAP-09 or the missing authorized texture.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/camera.js`, `assets/kit/snippets/stage.html`, `assets/kit/snippets/evidence.html`. Copy the camera helper and required stage/evidence markup and tweens into this scene template; prefix IDs `hk-h4h-breadth` and append to its single paused timeline. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` using sidecar rectangles. If textures are not embedded, bind approved assets using `data-var-src="memory-1"` and `memory-2` on separate stage markup; never duplicate embedded textures.
1. Read every entry H-117–H-132. Mount the 16-second muted capture with its actual cursor. Use named sidecar anchors for graph node, policy card, HUD, block, version diff, command center, matrix and final summary. At 142–145 show `Workflow · Rule · Agent · Incident`, AP-RULE-009, Supplier Invoice Reconciler and INC-0042; pan 90px over 600ms, keeping selected edges neutral #333.
2. At 145–149 show `Invoice approval threshold 2.00% → 1.50%, effective Dec 1`, then `1 playbook · 1 agent · 34 tests Needs Revalidation`. Show the single peer HUD `Known fix from AP East: Vendor tax ID format` and `Guide Me`; then the HubSpot draft 12% discount and `Requires Tier 3 approval - Daniel Okafor`, `Request approval`. Never imply execution or approval occurred.
3. At 149–153 show playbook v1.0 and agent v0.1, v0.2, v1.0, v1.1, diff and rollback; then `Verified outcomes · Exceptions · Incidents · Release`, `Immutable change history`, `Export audit pack` and one notification at a time. No fabricated ROI or hours saved.
4. At 153–154 present both user-supplied screenshot textures only if separately authorized and irreversibly redacted; place the fictional `Reviewed evidence` cards separately, never identifying either texture as evidence. If redaction cannot be verified, stop before placing it. At 154–157 show Gmail Observe/Guide/Assist; NetSuite and Google Sheets Observe/Guide/Run Supervised; Slack Observe/Guide; Zoom `Observe by per-meeting opt-in · Guide`; HubSpot Observe/Guide/Assist; Chrome Observe/Guide. Unsupported cells explicitly say `Unavailable`.
5. At 157–158 return to JOB-0117 `Partially Complete` and `8 Verified Complete · 2 Escalated · 0 Approval Required · 1 Outcome Unknown`, with distinct glyphs and hatch outside text. Settle camera 1.05→1 over 700ms on actual outcome-tile anchors. Preserve entry hard cuts; do not replace the captured state with a recreated dashboard.

MOUNT: compositions/hk-h4h-breadth.html id hk-h4h-breadth, host 142/16. TRAPS: status and capability text must stay legible; do not invent dates, counts or content for source textures. No cyan on selected graph edges; no extra cursor, audio or captions. QA: SO-O7–SO-O9; check redaction, each cut, counts, source anchors and transition overlap. REPORT: anchor names, asset provenance and redaction confirmation, checks, all snapshot verdicts and any unresolved inputs; stop.
```

### HK-14 · Impact, next steps and close (H-133–H-154, 02:38–03:00, 22 s)

**Why / depends on:** Finish with intended impact, honest next steps, the founder and project address. Tick HK-13, CAP-07–CAP-09, SHOOT-02 and SHOOT-04.

**Checklist**
- [ ] Pre-flight: `demo/video/footage/hk-close.mov`; `hk-h4f-job`, `hk-h4g-heal`, `hk-h4h-breadth` capture pairs; stage kit and fonts.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: `19.9% of invoices require manual exception handling` retains its 2026 Ardent source.
- [ ] Verify: future on-device inference is not connected to the v1.0 cloud path.
- [ ] Verify: real presenter and exact GitHub URL appear; final credit and open-ring wordmark match H-153–H-154.
- [ ] Accept: `hk-h5-close` mounts 158/22, with held final frame at 179+29/30.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-14. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1, overlays and film. GOAL: articulate intended impact, supported next steps, founder close and an editable end card. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-133–H-154, shoot list and source notes; ../../../docs/video/mock-build-inventory.md STG-15, STG-16, SC24, SC25, SC29, SC36 and decision 2. INPUTS: ../footage/hk-close.mov; ../clips/hackathon/hk-h4f-job.mp4/.json, hk-h4g-heal.mp4/.json and hk-h4h-breadth.mp4/.json; assets/kit/ and fonts. Copy used media into assets/; stop if unavailable.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/type.html`, `assets/kit/snippets/identity.html`, `assets/kit/snippets/diagrams.html`, `assets/kit/snippets/end-card.html`, `assets/kit/snippets/camera.js`, `assets/kit/snippets/transitions.js`. Copy required markup, styles, helpers and tweens into this scene template; prefix IDs `hk-h5-close` and append to its one paused timeline. Bind `data-var-text="kinetic-text"`, `wordmark`, `stat-source`, `project-url`, `end-credit`. Use `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` for any sidecar-backed crop, and `kitTransition(tl, kind, targets, {at, duration})` only for storyboard transitions on scene-local targets. Never register a snippet timeline.
1. Read H-133–H-154. At 158–161 use stage components for `Knowledge stays attached to evidence`, `Fewer repeated investigations`, and `Evidence → Decision`; show a human approval glyph, not automatic approval or a claimed improvement metric. At 161–163 use frames derived from the actual job capture: the post-approval four-category `Partially Complete` summary and `Outcome Unknown · Held` evidence. Extract the exact matching frames as still assets after inspecting the sidecar; if the needed state is absent stop, rather than fabricate UI.
2. At 163–164 show `19.9% of invoices require manual exception handling` with `Ardent Partners · Payables Place · 2026`, sourced to https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/. This is external context, not an outcome claim. At 164–167 show `Supported application validation`, a genuinely unavailable matrix cell, `Business postcondition · Evidence`, and `Cohort · Approval · Monitor`, using suitable real capture stills from CAP-09, CAP-07 and CAP-08 where their states match. If the composition requires a state those captures do not contain, report exactly what source is needed.
3. At 167–169 show separate `Later: optional on-device inference` and `v1.0: cloud inference via LiteLLM`; no current local-model arrow or invented date. At 169–173 use the actual hk-close.mov, keeping its recorded on-camera sound via data-has-audio=\"true\". Present the founder frame-right; at left add `OPERATIONAL KNOWLEDGE`, `CAN IMPROVE`, `HUMAN CONTROL`, with H-145–H-147 timing and restrained dark backing. Do not hide his face.
4. At 173–180 show the open-ring `Oryn` wordmark, then the white outlined pill. At 174 it grows 180→620px over 500ms. From 175–177.4 reveal `https://github.com/Harikeshav-R/Oryn` in the H-150–H-152 segments; at 178 add `IBM AI Builders Challenge, North America · AI for Business`, and hold through the final frame. Use deterministic type-on and retain an open mark as H-148 and H-153 specify; no traction, customer logo or badge.

MOUNT: compositions/hk-h5-close.html id hk-h5-close, host 158/22. TRAPS: source captures are silent timed video or extracted stills, not manually sought media; show only states actually captured. Keep caption band clear, but add no captions, new VO, music or SFX. QA: SO-O7–SO-O9; review every section, sourced stat, long URL hold, both ends and all seam overlaps. REPORT: source frame timestamps, exact anchors, on-camera audio choice, paths, checks and snapshots; stop.
```

### HK-assemble · Mount and check continuity (H-001–H-154, 00:00–03:00, 180 s)

**Why / depends on:** Join every finished scene without changing its internal story. Tick HK-00–HK-14.

**Checklist**
- [ ] Pre-flight: all fourteen `demo/video/hackathon/compositions/hk-*.html` scene files and their local assets exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: every host appears once in order, no gaps or unwanted overlaps, root exactly 180 s at 30 fps.
- [ ] Verify: first frame, every boundary and frame 5399 show correct scene and no blank placeholder.
- [ ] Verify: clip continuity, single dark wipe and truthful 7/2/1/1 → 8/2/0/1 are intact.
- [ ] Accept: assembled `demo/video/hackathon/index.html` previews and reports its timeline.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-assemble. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1. GOAL: assemble all approved scene hosts into one gapless editable 180-second picture. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-001–H-154 and ROADMAP.md sections 0.3–0.4; ../../../docs/video/mock-build-inventory.md section 4. INPUTS: completed compositions/hk-h1-intro.html, hk-h2-problem.html, hk-h3a-lifecycle.html, hk-h3b-ai.html, hk-h3c-bob.html, hk-h4a-enroll.html through hk-h4h-breadth.html and hk-h5-close.html, plus their project-local assets. Stop and identify the missing HK step if any is absent.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/transitions.js`. If a root-level handoff is required, copy `kitTransition(tl, kind, targets, {at, duration})` into the root script and append to the existing root paused timeline, targeting root-local elements only. Do not reach inside a subscene or register a second timeline; retain per-scene snippet copies and prefixed IDs.
1. Read timeline JSON and history before editing. Mount existing scene files, without rebuilding their contents, at these absolute start/durations: hk-h1-intro 0/26, hk-h2-problem 26/26, hk-h3a-lifecycle 52/10, hk-h3b-ai 62/11, hk-h3c-bob 73/9, hk-h4a-enroll 82/6, hk-h4b-observe 88/7, hk-h4c-playbook 95/7, hk-h4d-agent 102/7, hk-h4e-simulate 109/8, hk-h4f-job 117/11, hk-h4g-heal 128/14, hk-h4h-breadth 142/16, hk-h5-close 158/22. Scene host ID, composition root ID and registered timeline key match exactly. Root is 1920×1080, 30 fps, data-duration 180.
2. Organize graphics hosts in sensible tracks with z-index determining paint order, and preserve empty audio and single captions host for later work. Do not attach subscene timelines to the root. Use actual timeline JSON to check each media element's absolute start/end, slot and source offset. Cut at scene boundaries unless the storyboard explicitly calls for a zoom-through, matched cut or card handoff. Implement any root-level transition only within the available existing slots; do not extend a capture, double a cursor or overlay two busy layouts. If an intended overlap needs unavailable frames, stop and report the precise conflict instead of shifting footage.
3. Check the 26, 52, 62, 73, 82, 88, 95, 102, 109, 117, 128, 142 and 158 second joins. In particular, the H-104 wipe begins at 129, fully inside hk-h4g-heal, which starts 128; it is never re-created at 128. Check the first readback ring-close at 119, approval/readback ordering at 124–126, unknown remains held, and the final URL and challenge credit survive through the last frame.
4. Do not add or edit soundtrack, VO, caption groups or a delivery file. Restrict changes to index.html and named mount configuration; if a scene itself needs repair, report its owner step and use that step's history rather than silently editing it here. Avoid replacing authentic on-camera audio.

MOUNT: exactly the 14 slots above; their durations total 180 s or 5400 frames. QA: SO-O7–SO-O9, `npx hyperframes timeline --json`, first and last frames, all scene midpoints, one frame either side of all boundaries and actual exit/entry overlaps. Check no black gap, frozen capture, missing font or unsafe text; preview URL must answer 200. REPORT: timeline manifest, paths, check result, every snapshot verdict, deviations and open questions; stop.
```

### HK-polish · Picture and timing review (H-001–H-154, 00:00–03:00, 180 s)

**Why / depends on:** Lock an intelligible picture before the separate sound and voice steps. Tick HK-assemble.

**Checklist**
- [ ] Pre-flight: `demo/video/hackathon/index.html`, all fourteen completed scenes, capture sidecars and a working preview exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: all intended text has an adequate settled reading hold; no text or important control enters the future subtitle strip.
- [ ] Verify: camera anchors, source citations, consent, pending states and both job summaries remain correct.
- [ ] Verify: transitions are clean at actual overlap frames, no idle cyan, no duplicate pointer and no duplicated wipe.
- [ ] Accept: picture is ready for later AUD/VO/QA steps; unresolved readability conflicts are documented, not hidden.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: HK-polish. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: SO-O1, especially better-typography, motion, format and overlay references. GOAL: review and lock visual timing and legibility while preserving the storyboard, media and approved user edits. SOURCE OF TRUTH: ../../../docs/video/hackathon-video-script.md H-001–H-154; ../../../docs/video/mock-build-inventory.md section 4 and relevant scene items; ROADMAP.md sections 0.3–0.4. INPUTS: index.html, all fourteen scene files, their local media, capture sidecars, kit and fonts. Stop if any scene or capture is incomplete.

BUILD:
0. KIT INPUTS: `assets/kit/snippets/stage.html`, `assets/kit/snippets/camera.js`, `assets/kit/snippets/type.html`, `assets/kit/snippets/identity.html`, `assets/kit/snippets/diagrams.html`, `assets/kit/snippets/evidence.html`, `assets/kit/snippets/end-card.html`, `assets/kit/snippets/transitions.js`. Preserve section 1.3: snippets are copied into their owning scene templates with IDs prefixed by scene ID and statements appended to the scene's single paused timeline. When adjusting anchor moves retain `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})`; for eligible transitions retain `kitTransition(tl, kind, targets, {at, duration})`. Preserve `data-var-text` and `data-var-src` bindings; never introduce nested snippet timelines.
1. Read history, `npx hyperframes timeline --json` and each storyboard entry alongside its actual scene. Inspect the visual story in order: human introduction; sourced AP problem; all fourteen lifecycle nodes; local/cloud authorization; real Bob evidence; privacy and meeting consent; reviewed playbook; unsatisfied then satisfied gate; failed then corrected simulation; truthful job and held unknown; containment then repair and narrow release; breadth; impact and closing card.
2. Compare every intended reading line against its actual settled start and exit: about 0.3 s per word after the whole line settles. Retain source labels, relevant values and status glyphs. Preserve absolute section boundaries and 180-second total. If an exact storyboard entry gives too little time, use available internal holds, stagger or frame-exact trims without losing the referent or changing the real product state. If the problem cannot be solved inside the available slot, identify the conflicting entries and propose a human decision instead of silently dropping copy or extending the cut.
3. Check 90% action-safe and 80% title-safe regions, reserve authored x128–1152 y630–688 for future captions, and make sure type never covers faces, controls, source lines or status glyphs. Inspect font loads and contrast at 1920×1080 delivery scale. Keep unknown hatch beside solid text, `Passed — Expected Safe Escalation` distinct from `Failed`, and cyan only while simulator, job or regression executes. Check the open intro mark and verified-only ring-close.
4. Inspect actual motion and timeline-derived transition overlaps: stagger or dip through bone rather than crossfade busy views. Check the H-104 400ms wipe remains only inside hk-h4g-heal, beginning at 129 after its 128 start, and the 179+29/30 last frame holds the complete URL and contest credit. Adjust only the specific scene files and mount variables named in the report, retaining product footage, original pointers and timing semantics. Use history for each edit; do not change another section without naming it.
5. Do not add music, SFX, narration, captions or a final render. Preserve real on-camera media audio; the later production steps own the audio mix and transcription.

MOUNT: existing 14 hosts, 0–180 seconds, unchanged section slots. QA: SO-O7–SO-O9 plus an interval-by-interval reading-hold report, all section midpoints, first/last and one-frame-before/after every transitioned boundary; use actual exit/entry overlaps from timeline, not guessed times. Check preview HTTP 200 and inspect the PNGs. REPORT: files and IDs changed, all hold conflicts, exact check result, snapshot verdicts, deviations and open questions; stop.
```

## 2.4 Launch cut (LK-xx)

Build after the hackathon picture is assembled and the prerequisite stage kit and launch captures are accepted. All paths below are relative to `/Users/hari/Developer/Oryn-demo` unless a prompt says otherwise. The launch source is `docs/video/launch-video-script.md`; the binding corrections are in `docs/video/mock-build-inventory.md` section 4. The 30 fps decision supersedes the script's 60 fps. Picture is locked before the separate audio and caption steps in sections 2.5–2.6. Keep the black subtitle-strip host empty until transcription; retain on-camera sound from the takes.

The lifecycle signature is the overview in L-059–L-072, **all hosted in L6**, not a second ring scattered across later product scenes: Observe 00:56, Understand 00:57, Review 00:58, Publish 00:59, Compile 01:00, Simulate 01:01, Authorize 01:02, Execute 01:03, Verify 01:04, Diagnose 01:05, Correct 01:06, Repair 01:07, Re-evaluate 01:08, Release 01:09. In that overview use neutral nodes for passive observation and conceptual non-executing actions; cyan only during an actual simulator, Job or regression execution, then extinguish. The overview does not authorize the later agent. The ring returns neutral at L-165. The verified-release ring closes only on independent readback at L-142, 02:19.20–02:19.60, holds through 02:20.00, and may remain closed on the end card under inventory decision 2.

The script requests a 400 ms wipe at 02:03.80–02:04.20. Keep it wholly inside the prototype's `lk-l10-heal` capture: `lk-l9-run` ends at 02:03.50, and `lk-l10-heal` starts at 02:03.50 and runs 20.5 seconds through 02:24. The last 0.5 seconds of L-126 are in the latter clip. Keep stage, music and captions at their absolute storyboard times; add no stage wipe or theme toggle.

### LK-00 · Scaffold the launch project (L-001–L-176, 00:00–03:00, 180 s)
**Why / depends on:** Establish the single editable launch project after the stage kit, licensed fonts and hackathon assembly are accepted. Depends on HK-assemble, PRE-02 and KIT-01–KIT-05.
**Checklist**
- [ ] Pre-flight: `docs/video/ROADMAP.md`, `docs/video/launch-video-script.md`, `docs/video/mock-build-inventory.md`, `demo/video/stage-kit/` and licensed font files exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: root is 1920×1080, 30 fps and exactly 180 seconds; all 12 hosts have the times below; local fonts load; audio and captions hosts are empty.
- [ ] Verify: synced kit is local and placeholder scenes do not fake completed product visuals.
- [ ] Accept: `demo/video/launch/index.html`, `compositions/`, `assets/`, and `work/LK-00-notes.md` are ready for section steps.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-00. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, including launch, format, motion and runtime references. GOAL: scaffold the 180-second launch project, not its finished picture.
SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176 and its global continuity rules; docs/video/mock-build-inventory.md section 4; ROADMAP.md 0.2–0.4. The explicit 30 fps decision supersedes the older 60 fps in the script. INPUTS: demo/video/stage-kit/ and the licensed local font assets from Part 1; stop if missing and name the producing prerequisite.
BUILD:
1. Initialize with `npx hyperframes init demo/video/launch --skip-skills --skill=hyperframes`. Use history and catch-up as SO-O7 directs. Preserve existing user edits if the project already exists; do not overwrite them with a fresh init.
2. Set a 1920×1080 root at 30 fps, data-start 0 and data-duration 180. Create 12 correctly sized, editable placeholder hosts with matching host/scene/timeline IDs: lk-l1-hook 0/10, lk-l2-chaos 10/12, lk-l3-reveal 22/10, lk-l4-privacy 32/12, lk-l5-observe 44/12, lk-l6-discover 56/16, lk-l7-create 72/18, lk-l8-simulate 90/16, lk-l9-run 106/18, lk-l10-heal 124/20, lk-l11-breadth 144/20, lk-l12-close 164/16. Scene-local time starts at zero. Product media split at 123.5 seconds is independent of the stage-host boundary at 124 seconds: L9 displays the first 0.5 seconds of lk-l10-heal media; L10 continues it at source offset 0.5 seconds. Do not prebuild later sections.
3. Sync stage-kit source snippets into the project's assets/kit/ without overwriting scenes; they are not nested compositions. Supply local IBM Plex Mono 400/500/600/700, Space Grotesk 400/500/700 and Crimson Text 400/600/700 with licensed files and actual face weights. Declare editable copy, colour and media variables. Create empty audio and a single caption-track host; no music, voiceover or caption text yet. Reserve the subtitle strip at authored x128–1152, y630–688 scaled by 1.5, without obscuring scene actions.
Run the KIT-01 sync script and verify `demo/video/launch/assets/kit/snippets/` exists and contains the synced kit files; stop if missing.
4. Write work/LK-00-notes.md, at most 40 lines, covering 120 BPM, A minor, start/duration map and risks. Limit writes to demo/video/launch and the requested notes. Use template-wrapped scenes, one paused registered timeline per composition, stable IDs and self-contained assets/ paths. Do not nest scene timelines into root.
MOUNT: root owns the 12 hosts at the listed absolute starts and durations; track kind graphics for scenes, captions for the caption host. TRAPS: no scene content, final render, external font or fake source media. QA: SO-O8; inspect every placeholder midpoint and root end frame, confirm nonzero check samples, then preview and test HTTP 200. REPORT: SO-O9, including the host map, checks, snapshot verdicts, missing prerequisites and conflicts; end history and stop.
```

### LK-01 · Human hook (L-001–L-008, 00:00–00:10, 10 s)
**Why / depends on:** Establish the speaker and question before the first product crop. Depends on LK-00, SHOOT-02 and SHOOT-04.
**Checklist**
- [ ] Pre-flight: `demo/video/footage/lk-hook.mov`, the synced kit, fonts, and `demo/video/launch/index.html` exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: Harikeshav's recorded line and sound are intact; name and university clear his face and the subtitle zone.
- [ ] Verify: final question becomes the invoice corner at 00:08.50; the 00:10 cut reaches the next scene.
- [ ] Accept: `demo/video/launch/compositions/lk-l1-hook.html` plays for 10 seconds.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1; also read references/overlays.md and film.md. GOAL: the live-action question, not a generated stand-in. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-008; open every entry including its SCREEN, MOTION and TRANSITION. INPUTS: demo/video/footage/lk-hook.mov, demo/video/launch/index.html, assets/fonts/ and the synced stage-kit lower-third and kinetic type. Stop if footage or kit is missing and identify the shoot or kit step.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `type.html`, `transitions.js`. BUILD: copy required markup, styles and tween statements into this scene's `<template>`, prefix IDs `lk-l1-hook-`, and append to its one paused timeline. Bind actual markup using `data-var-text="presenter-name"`, `presenter-school`, and `kinetic-text`; call `kitTransition(tl, "zoom-through", targets, {at, duration})` on scene-local invoice targets.
BUILD:
1. Use the authentic recorded line: “What if your workflows could learn from your people, prove their results, and recover from change?” Keep the take's on-camera audio, with a timed video marked data-has-audio=true. Copy or sync the selected footage into launch/assets/footage/ and use an assets/... path. No TTS or invented speaker. Use the bright workspace, locked camera, presenter center-right, closed laptop lower left and generous left-side type space. Do not put text over the face or reserved subtitle zone.
2. L-001–L-004: at 00:00 type “What if” in white 48px authored mono; add “your workflows”, then tight-cut “could learn”, then “from your people,” with the named word-weight changes. Bring in the stage lower-third at authored x84 y516: “Harikeshav Rameshkumar” and “The Ohio State University”; its shadow also ends above y630. Make the label variable-bound, but retain these exact defaults.
3. L-005–L-008: show “prove their results,” then “recover from change?”; hold the question 00:07–00:08.50, with the 500ms punctuation emphasis. At 00:08.50 use the specified 900ms 2D zoom-through from question mark to the corner of “INV-48219”; finish the hard cut at 00:10. Match the next scene without fabricating extra invoice data. The footage's audible sentence must not be split across takes.
4. Use the reusable stage frame, kinetic type and lower-third. Keep the reserved black strip empty until VO/caption steps. Only touch compositions/lk-l1-hook.html, its own launch/assets/footage files, the lk-l1-hook host in index.html and work/LK-01-notes.md. No music, SFX, caption text or final render.
MOUNT: lk-l1-hook at absolute 0, duration 10; scene local zero. All timed elements obey SO-O5; camera transforms an untimed inner wrapper. QA: SO-O8, especially scene midpoint, 00:08.50 transition sides and timeline-derived overlap. Check speaker, lower-third, motion and cut on the 30 fps frame grid. REPORT: SO-O9 including footage path, host, visual verdicts and open questions; end history and stop.
```

### LK-02 · Chaos montage (L-009–L-024, 00:10–00:22, 12 s)
**Why / depends on:** Show fragmented work and distinguish a click from an outcome. Depends on LK-01 and CAP-10.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l2-chaos.mp4` and `.json`, `demo/video/launch/index.html` and synced stage kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: readable `INV-48219`, `PO-1042`, `$18,420.00`, `AP Exceptions Tracker` and `#ap-escalations` come from captured states.
- [ ] Verify: `Click completed` is distinct from `Business outcome: unverified`; the last node is ink, not cyan.
- [ ] Verify stage gap `GAP-STG-L-03` (owner assigned by BOB-12): read the full gap. The capture already carries its own pointer (`lk-l2-chaos` f120-f149); enlarge it only through the camera wrapper and never add a second cursor. If the gap needs a separate larger cursor, report the conflict with SO-O10.
- [ ] Accept: `demo/video/launch/compositions/lk-l2-chaos.html` mounts at 10/12 with no reconstructed product actions.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: build the rapid work-surface montage from the captured deterministic film, not a synthetic UI or a collection of unrelated stills.
SOURCE OF TRUTH: docs/video/launch-video-script.md L-009–L-024, read every entry; docs/video/mock-build-inventory.md Part B. INPUTS: demo/video/clips/launch/lk-l2-chaos.mp4 and lk-l2-chaos.json, demo/video/launch/index.html and synced kit. Stop and name the exact capture prerequisite if either clip or sidecar is absent. Copy them to launch/assets/clips/launch/ without changing their timing. Inspect the sidecar's actual named anchor rectangles and per-frame cursor; do not invent anchor IDs.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `transitions.js`, `diagrams.html`. BUILD: copy needed markup, styles and tweens into the scene `<template>`, prefix IDs `lk-l2-chaos-`, and append to its one paused timeline. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles, throwing if missing; bind `data-var-text="failure-label"` and call `kitTransition(tl, "slice", targets, {at, duration})` on scene-local targets.
BUILD:
1. L-009–L-016, 00:10–00:14: show the actual Gmail attachment and Brightwater Industrial, the PDF with “$18,420.00” and “PO-1042”, the NetSuite bill, “AP Exceptions Tracker”, “#ap-escalations”, “Kestrel review”, Zoom with “Priya Nair” and “Dana Whitfield”, and “Submission timed out”. Isolate the named anchors using scale/translate on an untimed wrapper around the timed muted video. Match each source entry and its camera position, not a guessed screen crop.
2. The script's opening montage uses 0.5-second cuts, which satisfy its 0.25–0.5-second range and the mandated 120 BPM half-second hard-cut grid at 30 fps. Preserve all cuts from the source. Do not create 0.25-second hard cuts off-grid. Keep focal text readable and use existing clip timing rather than changing captured action speed.
3. L-017–L-022, 00:14–00:20: preserve the captured click and its 260ms ink ring; “Click completed” is an action, while “Business outcome: unverified” is a distinct hatched panel. Stage the Gmail/NetSuite/Sheets triptych, opposing 2D horizontal slice at 00:17–00:18, centered “INV-48219”, then “Unverified”. Stage-only frames may use hard shadows; the captured product interior stays flat. Never introduce a new money figure or success state.
4. L-023–L-024, 00:20–00:22: collapse the invoice rectangle into an ink node; trace two circles on dotted bone and carry the node into L3. This shape match is a set-piece transition. Reserve the empty subtitle-strip host for later work. Do not add music or SFX here. Author only compositions/lk-l2-chaos.html, this scene's launch/assets/clips/launch/ copies, its root host, and work/LK-02-notes.md.
MOUNT: lk-l2-chaos absolute start 10, duration 12. Use matching host, scene and timeline IDs; a muted timed video, no seeks, and one paused registered scene timeline. QA: SO-O8 including each entry boundary, midpoint of slices and the node handoff, and actual frame-accurate sidecar action. REPORT: SO-O9, include exact anchors selected, source copy, check, snapshots and any mismatch; end history and stop.
```

### LK-03 · Reveal Oryn (L-025–L-034, 00:22–00:32, 10 s)
**Why / depends on:** Resolve the chaos into the open brand mark. Depends on LK-02 and KIT-01–KIT-05.
**Checklist**
- [ ] Pre-flight: `demo/video/launch/index.html`, local fonts and `demo/video/stage-kit/` are available.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: five correctly named chips compress into an open ring; the mark remains open through 00:32.
- [ ] Verify: 00:31–00:32 zoom-through reaches enrollment without a cyan success indicator.
- [ ] Accept: `demo/video/launch/compositions/lk-l3-reveal.html` mounts at 22/10.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: perform the specific open-mark reveal. SOURCE OF TRUTH: docs/video/launch-video-script.md L-025–L-034, each entry; docs/video/mock-build-inventory.md section 4 decision 2. INPUTS: demo/video/launch/index.html, synced orbit, wordmark, chip, stage canvas and zoom-through kit components, and local fonts. If an input is absent, stop and identify KIT-01–KIT-05 or PRE-02.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `identity.html`, `transitions.js`. BUILD: copy markup, styles and tween statements into this scene's `<template>`, prefix IDs `lk-l3-reveal-`, and append to its one paused timeline. Bind `data-var-text="wordmark"` and `agent-chip-1` through `agent-chip-5` on actual elements. Call `kitTransition(tl, "morph", targets, {at, duration})` for compression and `kitTransition(tl, "zoom-through", targets, {at, duration})` for enrollment using local targets.
BUILD:
1. L-025: start at the ink node inherited from L2. Trace three concentric 2px ink orbit rings with the northeast gap clearly open on the bone 24px dot grid. Trace for 800ms with 100ms staggers; move camera 1.0→1.08. Crop marks are stage-only.
2. L-026–L-028: introduce precisely five neutral white stage chips in this order: “Supplier Invoice Reconciler”, “Order Status Sync”, “Support Exception Triage”, “Policy Watcher”, “Peer Fix Guide”. Use 2px ink borders and 6px offsets only on stage cards. Follow each entry's 500–700ms arrivals, including the 120ms opposing slide stagger. Keep labels in ink and avoid all cyan because no simulator, Job or regression is executing.
3. L-029–L-033: hide the labels before their borders overlap; compress all chips toward authored (640,330) from scale 1 to .12 over 800ms. Morph to the open ink ring with its travelling ink node. Assemble “Oryn” in Space Grotesk 700 with an open O, 80ms letter stagger, then hold the open mark unchanged through 00:31. The reveal has no verified outcome and therefore must not close. Do not substitute a product-name wordmark that omits the gap.
4. L-034: at 00:31 use the open O as the edge of the white enrollment window. Execute the 900ms 1→1.8 2D zoom-through, landing on the L4 frame at 00:32. Coordinate with the adjoining scene without editing its composition. Work only in compositions/lk-l3-reveal.html, its required assets, its root host and work/LK-03-notes.md. Keep the caption strip empty; do not add SFX, VO or a render.
MOUNT: lk-l3-reveal start 22, duration 10, local clock zero. Use one paused GSAP timeline registered after all tweens, animate children rather than clip visibility and keep all effects deterministic. QA: SO-O8; inspect chip overlap, 00:27 morph, the open hold and both sides of 00:32, including actual transition overlap. REPORT: SO-O9 including explicit mark state and any script/decision conflict; end history and stop.
```

### LK-04 · Privacy and consent (L-035–L-046, 00:32–00:44, 12 s)
**Why / depends on:** Establish independent consent, local controls and masking before observation. Depends on LK-03, CAP-11 and the authorized screenshot prerequisite.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l4-privacy.mp4` and `.json`, the approved `[USER SCREENSHOT 1]` source, `demo/video/launch/index.html` and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: notice precedes observation, capture and contribution are separate, and pause/resume remain neutral.
- [ ] Verify: `BANK ACCT`, `TAX ID` and `CARD` are masked before storage; screenshot contains no readable private data.
- [ ] Verify stage gap `GAP-STG-L-07` (owner assigned by BOB-12): read the full gap; passive observation is neutral ink with text, no cyan and no arc-hum (product states: `lk-l4-privacy` f90-f149).
- [ ] Accept: `demo/video/launch/compositions/lk-l4-privacy.html` mounts at 32/12.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: show meaningful consent and on-device masking using the actual captured product film. SOURCE OF TRUTH: docs/video/launch-video-script.md L-035–L-046; docs/video/mock-build-inventory.md section 4 decisions 3, 16 and 18, SC01–SC03 and relevant Part B fixtures. Read every entry before editing.
INPUTS: demo/video/clips/launch/lk-l4-privacy.mp4 and .json from CAP-11; user-approved irreversibly redacted [USER SCREENSHOT 1] from PRE-02; launch/index.html and synced kit. Stop if any is missing. Copy media under demo/video/launch/assets/ with asset-relative paths. Inspect actual sidecar anchors before selecting a target; retain the recorded cursor and UI states, not a manually fabricated interaction.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `evidence.html`, `diagrams.html`, `transitions.js`. BUILD: copy markup, styles and tweens into the scene `<template>`, prefix IDs `lk-l4-privacy-`, and use its one paused timeline. Bind sanitized texture with `data-var-src="memory-1"`, fields with `data-var-text="masked-field"`, and boundary with `data-var-text="ai-boundary-label"`. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rects, throwing if absent, and `kitTransition(tl, "zoom-through", targets, {at, duration})` on local document targets.
BUILD:
1. L-035–L-039: frame “Organization notice”, “I understand”, “Permitted work observation” and the separately controlled “Organizational contribution”. Notice acceptance does not start capture or approve sharing. Follow the sidecar to “Excluded apps”, “Excluded windows”, “Excluded URLs” and then the companion's “Pause” → “Paused” → “Resume” → “Observation active”. These are neutral textual states, never cyan or execution hum.
2. L-040–L-043: isolate labeled empty “BANK ACCT”, “TAX ID”, “CARD” fields; perform the 300ms staggered hatch sweep before the storage boundary. Show “Masked on device”, “Private evidence · device”, “Authorized cloud inference · transient”, and “Reviewed contribution” as distinct domains, followed by “Local retention” and “Delete local history”. Never imply that transient cloud inference runs locally or that an employer can inspect raw private evidence. No exposed values.
3. L-044–L-046: use the actual supplied sanitized screenshot only as background texture, never as an evidence record. Inspect its redaction before import; use a pretreated asset if defocus is needed, not CSS filters. Keep “Private evidence” separate from “Reviewed contribution”. At 00:43–00:44 zoom through the “INV-48203” document at 1→1.7 over 900ms into the next Gmail view. This is a set-piece transition; align with L5 without editing L5.
4. Animate the untimed camera wrapper to the real sidecar anchors. Keep exact product text visible and use the kit hatch, camera and split-card devices; no hard shadows inside product windows. Reserve the empty subtitle host. Edit only compositions/lk-l4-privacy.html, its named media/assets, its root host and work/LK-04-notes.md; do not add narration, music, captions or final render.
MOUNT: lk-l4-privacy at 32, duration 12; local start zero. Follow SO-O5 for template, timed video and paused registered timeline. QA: SO-O8 including masking order, independent consent, screenshot privacy, 00:43 transition and 00:44 seam. REPORT: SO-O9 with selected sidecar anchor names and screenshot handling; end history and stop.
```

### LK-05 · Observe and confirm (L-047–L-058, 00:44–00:56, 12 s)
**Why / depends on:** Link permitted invoice work to a human-confirmed meeting commitment. Depends on LK-04 and CAP-12.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l5-observe.mp4` and `.json`, launch project and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: Priya's `INV-48203` is visible; meeting consent appears before recording.
- [ ] Verify: deadline changes from `Fri 17:00` to `Fri 12:00` before `Confirmed Commitment`, with approval caveat.
- [ ] Verify stage gap `GAP-STG-L-08` (owner assigned by BOB-12): read the full gap; Priya's reply is already revealed by a 27-frame mask inside the capture (`lk-l5-observe` f150-f179), so the stage adds only the caption `only after`, with no second reveal and no caret.
- [ ] Accept: `demo/video/launch/compositions/lk-l5-observe.html` mounts at 44/12.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-05. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1; use launch, motion and film references. GOAL: preserve the causal chain from a permitted demonstration to a reviewed commitment. SOURCE OF TRUTH: docs/video/launch-video-script.md L-047–L-058, each entry, and inventory Part B meeting and demonstration fixtures.
INPUTS: demo/video/clips/launch/lk-l5-observe.mp4 and .json from CAP-12, launch/index.html and synced stage kit. Stop if missing and name CAP-12. Copy the files to launch/assets/clips/launch/ and inspect actual sidecar anchor rectangles over time. Animate only a wrapper around the timed muted capture; preserve the cursor's existing captured movement and clicks.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `evidence.html`, `transitions.js`. BUILD: copy markup, styles and tweens inside the scene `<template>`, prefix IDs `lk-l5-observe-`, and append to its one paused timeline. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rects, failing on absence, and `kitTransition(tl, "morph", targets, {at, duration})` for the meeting-to-review card.
BUILD:
1. L-047–L-049: frame “Priya Nair · Mon 09:14”, “INV-48203”, the Gmail PDF, NetSuite “Match purchase order”, and “AP Exceptions Tracker”. This is Priya's human demonstration, not an agent Job. Track anchors on the specific record and fields while leaving enough app chrome for context.
2. L-050–L-052: show “Meeting notice and consent” and the deliberate “Start for this meeting” selection before the recording indicator. Dana Whitfield's transcript is onscreen text, not a second voice: “From the next cycle we're adding a handling line to every invoice.” at “00:14:32”. Priya's reply is “Send me the new layout; I'll confirm the terms in writing by Friday.” Reveal that pre-composed sentence with a 900ms mask, not implausible simulated typing. Preserve both speakers' attribution.
3. L-053–L-056: grow the review card from the meeting tile over 700ms. Focus “Confirm Kestrel handling-fee terms in writing”, owner “Priya Nair”, original “Fri 17:00” and “subject to company approval”. The real captured edit changes it to “Fri 12:00”; only the explicit “Confirm” produces “Confirmed Commitment”. Then show the one reminder on the Kestrel vendor record. Do not imply automatic policy, external sending or private meeting capture.
4. L-057–L-058: separate the commitment from the three Gmail/NetSuite/Sheets evidence ribbons and reveal “Candidate workflow” / “Needs Review”. Maintain its warning and ordinary neutral status. Coordinate the 00:56 cut into L6. Use stage card and camera helpers only where the source requires them. Restrict edits to compositions/lk-l5-observe.html, its copied assets, root host and work/LK-05-notes.md. Caption text and later VO are out of scope.
MOUNT: lk-l5-observe absolute start 44 duration 12. Honor scene-local timings and the timed-video/untimed-wrapper contract. QA: SO-O8; inspect 00:47 consent, 00:50–00:53 review and confirmation, and both sides of the candidate transition. REPORT: SO-O9, exact anchors, proof of preserved chronology, checks and missing facts; end history and stop.
```

### LK-06 · Discover and lifecycle overview (L-059–L-074, 00:56–01:12, 16 s)
**Why / depends on:** Introduce the complete lifecycle as an overview while preserving the evidence and policy boundary. Depends on LK-05, CAP-13 and KIT-01–KIT-05.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l6-discover.mp4` and `.json`, 14-node kit and launch project exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: all 14 labels appear in order, previous nodes return neutral, and cyan appears only during actual simulation or regression execution.
- [ ] Verify: three named demonstrations, `Approved for Guidance`, and the exact `2.00%` threshold are readable.
- [ ] Verify stage gap `GAP-STG-L-09` (owner assigned by BOB-12): read the full gap; ten micro-compositions L-063 to L-072 sit over the held SC15 product frames (`lk-l6-discover` f120-f419) using the KIT-04 STG-03 components.
- [ ] Accept: `demo/video/launch/compositions/lk-l6-discover.html` mounts at 56/16.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-06. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: compose the complete lifecycle signature and the genuine candidate-to-playbook evidence. SOURCE OF TRUTH: docs/video/launch-video-script.md every entry L-059–L-074; inventory section 4, especially decision 3, and Part B fixtures. The ring is an explanatory overview, not a claim that all stages execute simultaneously.
INPUTS: demo/video/clips/launch/lk-l6-discover.mp4 and .json from CAP-13; the synced 14-node lifecycle ring, camera and evidence cards from KIT-01–KIT-05; launch/index.html. Stop for missing sources. Place media in launch/assets/clips/launch/, then inspect the sidecar and use its actual named anchors for real recorded thumbnails, labels and pointer paths.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `identity.html`, `evidence.html`. BUILD: copy lifecycle markup, styles and tweens into this scene's `<template>`, prefix IDs `lk-l6-discover-`, and append to its one paused timeline. Bind actual nodes with `data-var-text="lifecycle-label"` using the correct entry-specific values. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with actual sidecar rectangles, throwing if absent. This scene alone hosts the fourteen-node lifecycle overview.
BUILD:
1. L-059–L-062: show the evidence chain “Priya Nair · Mon 09:14 · INV-48203”, “Priya Nair · Mon 10:02 · INV-48204”, and “Jamal Carter · Tue 13:40 · INV-48207”. Bring in the three thumbnails while the stage ring marks Observe, Understand, Review and Publish at absolute 00:56, 00:57, 00:58 and 00:59. Show Marcus Webb's “Publish for Guidance” and the playbook name “Supplier invoice vs purchase order reconciliation”. Observation is neutral.
2. L-063–L-072: continue the same ring in this scene only, one node each second: Compile 01:00, Simulate 01:01, Authorize 01:02, Execute 01:03, Verify 01:04, Diagnose 01:05, Correct 01:06, Repair 01:07, Re-evaluate 01:08, Release 01:09. Read the companion graphics for each entry: candidate, test frame, human approval, scoped work, independent readback, unconfirmed cause, human correction, bounded change, regression suite and narrow cohort. Current and prior labels remain readable in ink.
3. Resolve the storyboard's broader cyan wording using binding inventory decision 3: cyan only when a simulator, Job or regression is actually shown executing; all conceptual, review, approval, publish, observation and completed nodes stay neutral. The previous node is neutral before the next appears; no accumulating cyan completion trail. Show the ring as overview rather than early real authorization. No cyan when an operation ends.
4. L-073–L-074: frame “Match supplier invoice to purchase order and stage result in ERP”, “Confidence: Medium”, “variance exception rule: unverified until SME review”, “Approved for Guidance”, “AP-RULE-009 Variance threshold”, “> 2.00%: Tier 3 approval” and “≤ 2.00%: auto-accept within match”. Approved for Guidance uses a neutral outlined shield/check and text. Keep footage flat and text above the subtitle zone. Edit only compositions/lk-l6-discover.html, its media, root host and work/LK-06-notes.md.
MOUNT: lk-l6-discover absolute 56, duration 16, local zero. QA: SO-O8 with every node transition, first and last frames, and sampled cyan states. REPORT: SO-O9 including ring-node times, sidecar anchor names and documented cyan correction; end history and stop.
```

### LK-07 · Create an agent (L-075–L-092, 01:12–01:30, 18 s)
**Why / depends on:** Turn the reviewed playbook into a scoped candidate with visible pending gates. Depends on LK-06 and CAP-14.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l7-create.mp4` and `.json`, project and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: full intent and v0.1 unverified branch; Stage 3 gate remains pending before evaluation and owner approval.
- [ ] Verify: six autonomy stages, risk tiers and `Run Supervised` are readable; cyan only during actual execution.
- [ ] Verify stage gap `GAP-STG-L-10` (owner assigned by BOB-12): read the full gap; the matched edge joins `lk-l7-create` f450-f479 (SC18, `v0.1`) to the simulator frame, with no fabricated evaluation result.
- [ ] Accept: `demo/video/launch/compositions/lk-l7-create.html` mounts at 72/18.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-07. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: show the actual Agent Factory action, authority and honest pending gates. SOURCE OF TRUTH: docs/video/launch-video-script.md L-075–L-092, every entry; mock-build-inventory.md section 4 decisions 3 and 5 and SC17–SC19.
INPUTS: demo/video/clips/launch/lk-l7-create.mp4 and .json from CAP-14, demo/video/launch/index.html, local fonts and synced camera, prompt-pill and card kit. Stop and identify CAP-14 or KIT-01–KIT-05 if absent. Copy the silent capture and sidecar to launch/assets/clips/launch/. Inspect actual sidecar anchor names and trajectories; follow the recorded UI and cursor rather than generating interactions.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `end-card.html`, `transitions.js`. BUILD: copy markup, styles and tweens into the scene `<template>`, prefix IDs `lk-l7-create-`, and use its one paused timeline. Bind actual pill text with `data-var-text="agent-intent"` without duplicating captured text. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rectangles, failing if absent, and `kitTransition(tl, "morph", targets, {at, duration})` on scene-local pill/card targets.
BUILD:
1. L-075–L-079: use the captured “Create Agent” intent pill, no model selector, growing 320→820px over 700ms. Preserve typing at 30 characters/s: “Reconcile supplier invoices against purchase orders and stage the result in the ERP.” Animate the stage crop to the real pill anchor; do not overlay duplicate typed product text. At 01:16–01:17 the small pill grows into a candidate card, showing “Purpose”, “Inputs”, “Actions”, “Rules”, “Outputs”, “Stopping points”. No cyan for generation under binding decision 3.
2. L-080–L-084: show “Supplier Invoice Reconciler · v0.1”, “Variance exception branch · Unverified”, and Elena's evidence review of “AP-RULE-009”; above 2.00% requires Tier 3 approval, at or below 2.00% auto-accepts within match. Scope to “AP East”, “Gmail”, “NetSuite”, “Google Sheets”, “Selected invoice queue”. Read and frame tiers 0 Informational, 1 Low-risk reversible, 2 Controlled reversible, 3 Consequential and “Tier 4 Restricted · unavailable to agents”.
3. L-085–L-089: show “0 Observe”, “1 Suggest”, “2 Guide”, “3 Supervised Assist”, “4 Scoped Autopilot”, “5 Self-Maintaining Autopilot”; stage 3 is neutral. Gate: “5/5 verified human examples”, “3 observed this week + 2 SME-verified archived cases”, “≥25 passing representative scenarios · suite 28”, “≥5 edge/negative · suite 6”, “Evaluation pending” and “Owner approval: pending”. “NetSuite · Run Supervised” does not waive “Tier 3 action requires separate approval”. Keep pending glyphs hollow; no early release.
4. L-090–L-092: match-cut the v0.1 candidate to “SIM-AP-RECON”, “28 scenarios”, then follow the captured “Run Evaluation” click. Cyan is allowed only after the actual simulation starts and disappears when it stops. Align the 01:30 seam with L8. Limit edits to compositions/lk-l7-create.html, its asset copies, its root host and work/LK-07-notes.md. No SFX, captions, added VO or final render.
MOUNT: lk-l7-create 72/18, local zero. QA: SO-O8, especially intent legibility, 01:16 pill morph, gate chronology and start of actual run. REPORT: SO-O9, actual anchor names and any wording conflict; end history and stop.
```

### LK-08 · Simulate and approve (L-093–L-108, 01:30–01:46, 16 s)
**Why / depends on:** Demonstrate the boundary failure, safe escalation and a reviewed release. Depends on LK-07 and CAP-15.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l8-simulate.mp4` and `.json`, project and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: `21 / 6 / 1` changes to `22 / 6 / 0`; `variance_exactly_2.00pct` is explained.
- [ ] Verify: Marcus approves only after evaluation and before Stage 3 release; cyan extinguishes on completion.
- [ ] Accept: `demo/video/launch/compositions/lk-l8-simulate.html` mounts at 90/16.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-08. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: make the failure, safe stop, fix and human gate understandable without changing the captured simulator. SOURCE OF TRUTH: docs/video/launch-video-script.md each of L-093–L-108, inventory section 4 decisions 3, 5 and 13, and SC19–SC21.
INPUTS: demo/video/clips/launch/lk-l8-simulate.mp4 and .json from CAP-15; launch project and synced camera and stage-type kit. Stop for a missing file, naming CAP-15. Copy capture to launch/assets/clips/launch/ and inspect the actual anchor rectangles and cursor stream. The row stream is the film variant of the same 28 scenarios, not a different evaluation.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `type.html`, `transitions.js`. BUILD: copy markup, styles and tweens into the scene `<template>`, prefix IDs `lk-l8-simulate-`, and append to its one paused timeline. Bind the headline with `data-var-text="kinetic-text"`. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` using actual sidecar rects, failing if absent, and `kitTransition(tl, "zoom-through", targets, {at, duration})` for the Job handoff.
BUILD:
1. L-093–L-097: show “SIM-AP-RECON · v0.1” executing; only the active row is cyan. When it stops, display “21 Passed”, “6 Passed — Expected Safe Escalation”, “1 Failed”; all running cyan goes dark. Target “variance_exactly_2.00pct” and its replay: “Expected: auto-accept within match”, “Actual: escalated”, “2.00%”. Link the rule text “≤ 2.00% auto-accept within match” and “> 2.00% Tier 3 approval”.
2. L-098–L-100: frame “Missing Purchase Order” with the complete “Passed — Expected Safe Escalation” verdict; stage “STOPPING CAN BE CORRECT” and show the six safety cases: “Missing PO ×2”, “Duplicate invoice”, “Over-threshold variance”, “ERP timeout”, “Unreadable PDF”. Do not relabel a correct stop a failure. Use the real captured result and the stage typography helper; no new numeric claims.
3. L-101–L-104: compare “v0.1: ≥ 2.00%” against “v0.2: > 2.00%”; show the captured rerun and extinguish cyan as it finishes. The final result is “22 Passed”, “6 Passed — Expected Safe Escalation”, “0 Failed”, “28/28 intended outcomes correct”. Compare “v0.1 · 21 / 6 / 1” and “v0.2 · 22 / 6 / 0” on the “Same suite”. Never imply a failed or pending run passed.
4. L-105–L-108: show “5/5 verified examples”, “28 passing representative scenarios”, “6 edge/negative”, “Mandatory checks passed”, then Marcus Webb's explicit “Approve Stage 3 release”. Only then show “v1.0”, “Stage 3 · Supervised Assist”, “AP East”. Target “JOB-0117”, “11 invoices” and the “Confirm 11 invoices” click for the 01:45–01:46 zoom-through into L9. Keep all product actions in the source clip. Touch only compositions/lk-l8-simulate.html, its assets, root host and work/LK-08-notes.md.
MOUNT: lk-l8-simulate 90/16. QA: SO-O8; inspect every result transition, owner click, zoom-through midpoint and 01:46 boundary. REPORT: SO-O9 including arithmetic, actual camera anchors and verification status; end history and stop.
```

### LK-09 · Run, approve and hold (L-109–L-126, 01:46–02:04, 18 s)
**Why / depends on:** Preserve the mixed Job outcomes and independent readback before the incident. Depends on LK-08, CAP-16 and CAP-17.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l9-run.mp4` and `.json`, `lk-l10-heal.mp4` and `.json`, project and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: before/after counts are `7/2/1/1` and `8/2/0/1`; the unknown has no retry control.
- [ ] Verify: first 0.5 seconds of the heal clip begin at 02:03.50; the prototype wipe starts 02:03.80, without an added stage wipe.
- [ ] Accept: `demo/video/launch/compositions/lk-l9-run.html` mounts at 106/18.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-09. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: show actual scoped execution, approval, readback and uncertainty. SOURCE OF TRUTH: docs/video/launch-video-script.md all entries L-109–L-126 and mock-build-inventory.md section 4 decisions 1, 2, 3, 9–12, Part B batch fixtures.
INPUTS: demo/video/clips/launch/lk-l9-run.mp4 and .json from CAP-16, lk-l10-heal.mp4 and .json from CAP-17, launch project and stage kit. The former spans 106–123.5 seconds; the latter spans 123.5–144 seconds. Stop if either is missing or the FX-01 wipe isn't captured continuously. Copy to launch/assets/clips/launch/ and use actual sidecar names and cursor frame data for camera targets.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `identity.html`, `type.html`. BUILD: copy markup, styles and tweens inside this scene's `<template>`, prefix IDs `lk-l9-run-`, and append to its one paused timeline. Bind the headline with `data-var-text="kinetic-text"`; call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with actual sidecar rectangles, throwing if absent. If the first verified Job readback is staged with a mark, call `kitVerifiedRingClose(tl, ringPath, at)` exactly at verification; never instantiate the lifecycle overview here.
BUILD:
1. L-109–L-114: display “JOB-0117”, “v1.0 · Stage 3”, 11 selected invoices and only actual running cyan. Frame the seven verified cases from the fixture: INV-48210 $6,240.00 PO-1031; INV-48211 $3,118.40 PO-1032; INV-48212 $1,905.00 PO-1034; INV-48213 $12,480.00 PO-1036; INV-48214 $847.25 PO-1037; INV-48216 $529.90 PO-1039; INV-48217 $1,376.12 PO-1040. INV-48215 $2,260.00 and INV-48218 $4,415.00 each say “Escalated: Missing Purchase Order” with arrow/person glyph, not a warning triangle.
2. L-114–L-118: focus INV-48219, $18,420.00, PO-1042 $17,980.00, $440.00 and 2.45%; “Approval Required (Tier 3)”. Daniel Okafor reviews AP-RULE-009 and the diff “Variance Hold” → “Matched - Variance Approved”. Approval yields “Approved · verification pending”; only independent NetSuite readback produces “Verified Complete”. Per decision 2, the first true Job verification may close the stage mark in ink over 400ms plus a 400ms hold; do not confuse approval with verification.
3. L-119–L-124: INV-48220 $2,732.50 PO-1044 has “Outcome Unknown”; show “Held”, “Check outcome before further action”, “Resubmission unavailable” and “Investigate outcome”. There is no retry or resubmit control, and hatch is not behind text. Add stage type “UNKNOWN ≠ COMPLETE”. Display before snapshot 7 Verified Complete / 2 Escalated / 1 Approval Required / 1 Outcome Unknown; after independent readback replace the entire snapshot over 150ms with 8 / 2 / 0 / 1. Use binding exact status “Partially Complete”; the total remains 11.
4. L-125–L-126: show Kestrel Components, INV-48231 and “Handling fee $38.50”, then INV-48231, INV-48233, INV-48236 and “Verification unavailable”. Time the first video until local 17.5, then a second muted timed video using lk-l10-heal source offset 0 for local 17.5–18; its prototype FX-01 starts at absolute 123.8. No stage wipe. L10 continues the same file at source offset .5. Preserve exact absolute stage timing despite the media split.
MOUNT: lk-l9-run 106/18. Touch only compositions/lk-l9-run.html, the two named media copies, its host and work/LK-09-notes.md. QA: SO-O8, both sides of 123.5 and 124, wipe's timeline-derived midpoint, all counts, no false success. REPORT: SO-O9 and both capture anchors; end history and stop.
```

### LK-10 · Contain, repair and verify (L-127–L-146, 02:04–02:24, 20 s)
**Why / depends on:** Show containment before correction and limited release before expansion. Depends on LK-09 and CAP-17.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l10-heal.mp4` and `.json`, project and stage kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: one continuous dark wipe completes at 02:04.20; three cases are paused before repair.
- [ ] Verify: regression is `28 Passed`, `6 Passed — Expected Safe Escalation`, `0 Failed`, total 34; ring closes only on 3/3 readback.
- [ ] Accept: `demo/video/launch/compositions/lk-l10-heal.html` mounts at 124/20.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-10. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1. GOAL: retain the existing prototype wipe and show a bounded, human-authorized repair. SOURCE OF TRUTH: docs/video/launch-video-script.md every entry L-127–L-146, plus L-126 for the incoming wipe; mock-build-inventory.md section 4 decisions 2, 3, 8 and 12, SC26–SC30 and Part B incident fixtures.
INPUTS: demo/video/clips/launch/lk-l10-heal.mp4 and .json from CAP-17, launch/index.html, synced camera and orbit kit. CAP-17 begins at absolute 123.5 and lasts 20.5 seconds. L9 already plays source 0–0.5; this scene plays the same captured video from data-media-start 0.5 for 20 seconds, no seek script. Stop if the sidecar, wipe or first half is missing. Use actual sidecar named anchors for the crop and preserve all recorded actions.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `identity.html`. BUILD: copy required markup, styles and tweens into this scene's `<template>`, prefix IDs `lk-l10-heal-`, and append to its one paused timeline. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with sidecar rects, throwing if absent. At local 15.2 call `kitVerifiedRingClose(tl, ringPath, at)` on the scene's stage mark, yielding the 0.4-second close and 0.4-second hold; do not reproduce FX-01 or the lifecycle overview.
BUILD:
1. L-127–L-130: continue the same FX-01 wipe, begun at 123.8, through 124.2; do not add another wipe, an inversion filter, or a theme-toggle click. “INC-0042”, “Contained” and “3 cases paused” appear only after it completes. Show INV-48231, INV-48233 and INV-48236, then “Invoice $4,213.50”, “PO-1051 $4,175.00”, “Handling fee $38.50”. The “Possible cause: supplier document format change” is explicitly “Unconfirmed”.
2. L-131–L-135: Elena Ruiz manually completes INV-48231 and selects “Teach Oryn What Changed”. Show the exact question “Is the $38.50 handling fee part of the invoice total, and is it covered by the PO terms?” Her answer is “Yes · billed on top of subtotal · within approved terms”; link “AP-RULE-017 Supplier handling fees”. Marcus validates “Kestrel Components · layout v2 only”; “Correction is evidence, not new policy”. Repair “REP-0042-1” touches “Interpret invoice totals” with “No policy or permission change”.
3. L-136–L-140: 28 original scenarios plus “6 new regression cases”, “Original failure + 5 nearby variants”, total “34 scenarios”. Run v1.1 with cyan only while regression executes, then show “28 Passed”, “6 Passed — Expected Safe Escalation”, “0 Failed”. Marcus explicitly selects “Approve limited release”; display “Kestrel Components invoices only”, “AP East only”, “Stage 3 · Supervised Assist”. Never use obsolete 33.
4. L-141–L-146: independent readback yields “3/3 Verified Complete” at 02:19.20; start the ink ring closure there, close over 400ms and hold closed for 400ms. Only then Marcus selects “Expand release”; “INC-0042 · Closed” and “Repaired - Validated” follow. Show Playbook v1.0 and Agent v0.1 → v0.2 → v1.0 → v1.1; “Restore affects future eligible work, not prior business effects”. Pull the dark canvas into L11 at 02:24. Edit only compositions/lk-l10-heal.html, required asset copies, host and work/LK-10-notes.md.
MOUNT: lk-l10-heal 124/20, media offset .5. QA: SO-O8 including wipe seam, containment, 34-case arithmetic, 02:19.20 closure and 02:24 exit. REPORT: SO-O9, sidecar anchors, source offset and cyan intervals; end history and stop.
```

### LK-11 · Breadth montage (L-147–L-166, 02:24–02:44, 20 s)
**Why / depends on:** Show the adjacent workflows and honest capability boundaries. Depends on LK-10 and CAP-18.
**Checklist**
- [ ] Pre-flight: `demo/video/clips/launch/lk-l11-breadth.mp4` and `.json`, launch project and kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: policy impact is `1 playbook · 1 agent · 34 tests`; the 12% discount remains blocked.
- [ ] Verify: matrix marks unavailable capabilities explicitly and Zoom requires per-meeting opt-in.
- [ ] Verify stage gap `GAP-STG-L-13` (owner assigned by BOB-12): read the full gap; exactly 13 tiles in four columns, stage-side and decorative, apart from the product's own 7 + 6 tiles (`lk-l11-breadth` f360-f389) and the capability matrix.
- [ ] Accept: `demo/video/launch/compositions/lk-l11-breadth.html` mounts at 144/20.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-11. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1 and film.md. GOAL: create the rapid but evidence-grounded breadth montage from the captured product. SOURCE OF TRUTH: docs/video/launch-video-script.md each L-147–L-166; mock-build-inventory.md section 4 decisions 3, 8, 9, 15 and SC04/SC16/SC31–SC36.
INPUTS: demo/video/clips/launch/lk-l11-breadth.mp4 and .json from CAP-18, demo/video/launch/index.html and synced collage, camera and ring kit. Stop if missing. Copy capture and sidecar into launch/assets/clips/launch/, inspect the actual rectangles and recorded cursor, and use those for every camera target; do not draw replacement product panels.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `camera.js`, `evidence.html`, `identity.html`, `transitions.js`. BUILD: copy collage and neutral ring markup, styles and tweens into this scene's `<template>`, prefix IDs `lk-l11-breadth-`, and append to its one paused timeline; this is not a second lifecycle overview. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` on sidecar rects, throwing if absent, and `kitTransition(tl, "zoom-through", targets, {at, duration})` for the collage-to-map and ring-to-person transitions.
BUILD:
1. L-147–L-150: begin on the dark knowledge collage “AP-RULE-009”, “Kestrel commitment”, “Peer fix”, “INC-0042”. At 02:25 zoom through a collage card into the Operations Map and select “Supplier Invoice Reconciler”, linking “AP-RULE-009” and “INC-0042” in neutral grey. Show “Invoice approval threshold”, “2.00% → 1.50%”, “Effective Dec 1”, “1 playbook · 1 agent · 34 tests”, “Needs Revalidation”, “Proposed boundary tests”. Warning triangles mean revalidation, not escalation.
2. L-151–L-158: show “Known fix from AP East: Vendor tax ID format”, “Guide Me” and “Check the vendor tax ID format”. In HubSpot show “12% discount”, “Requires Tier 3 approval - Daniel Okafor”, “Request approval” and “Blocked”; no external submission. Command Center shows “8 Verified Complete”, “2 Escalated”, “1 Outcome Unknown”, “INC-0042 · Closed”, “v1.1 · Expanded”; X-Ray shows scope, evidence quality and privacy limitations, no invented ROI. Include “Immutable change history”, “Export audit pack”, “Authorized scope”, “Approval request”, “Commitment reminder”.
3. L-159–L-164: cut back to bone, not a second theme toggle. Include the exact five matrix columns “Observe”, “Guide”, “Assist”, “Run Supervised”, “Run Autonomously” and “— Unavailable” in unsupported cells. Gmail: Observe, Guide, Assist; NetSuite and Google Sheets: Observe, Guide, Run Supervised; Slack and Chrome: Observe, Guide; Zoom: Observe by per-meeting opt-in, Guide; HubSpot: Observe, Guide, Assist. Salesforce, Outlook, Excel, Teams, Meet and Edge are grey tiles only, not claims of support.
4. L-165–L-166: collapse tiles to an ink node and a lifecycle ring with all nodes neutral. At 02:43–02:44 scale its open center 1→1.8 over 900ms to reveal the speaker; no cyan. Preserve the captured motion and crop rather than faking actions. Touch only compositions/lk-l11-breadth.html, its asset copies, root host and work/LK-11-notes.md; leave audio, captions and render to later steps.
MOUNT: lk-l11-breadth 144/20. QA: SO-O8, inspect collage-to-map, policy totals, capability labels and ring zoom-through. REPORT: SO-O9 including source anchors and any correction to script conflicts; end history and stop.
```

### LK-12 · Human close and end card (L-167–L-176, 02:44–03:00, 16 s)
**Why / depends on:** Return to the person, then hold the project URL and challenge credit. Depends on LK-11, SHOOT-02 and SHOOT-04.
**Checklist**
- [ ] Pre-flight: `demo/video/footage/lk-close.mov`, launch project, fonts and end-card kit exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: the genuine speaker's complete sentence is audible; overlays clear his face.
- [ ] Verify: card has closed mark after verified release, exact challenge credit and full `https://github.com/Harikeshav-R/Oryn` through the final frame.
- [ ] Accept: `demo/video/launch/compositions/lk-l12-close.html` mounts at 164/16.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-12. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, references/overlays.md and film.md. GOAL: finish on the user's real close, then a legible, truthful end card. SOURCE OF TRUTH: docs/video/launch-video-script.md every entry L-167–L-176; mock-build-inventory.md section 4 decision 2, which permits the end-card mark closed after verified release and takes precedence over the script's open end-card wording.
INPUTS: demo/video/footage/lk-close.mov, launch/index.html, synced end-card, orbit, kinetic type and URL-pill kit, local fonts. If any input is missing stop and name the producing shoot or KIT step. Copy the footage into launch/assets/footage/; keep the real sound with a timed video data-has-audio=true. Do not replace the person or record artificial narration.
KIT INPUTS: `demo/video/launch/assets/kit/snippets/stage.html`, `type.html`, `identity.html`, `end-card.html`. BUILD: copy needed markup, styles and tweens into this scene's `<template>`, prefix IDs `lk-l12-close-`, and append to its one paused timeline. Bind actual elements with `data-var-text="kinetic-text"`, `wordmark`, `project-url`, and `end-credit`, providing corresponding scene variable values. The mark is already closed following verified readback; do not call a new closure animation or duplicate the lifecycle overview.
BUILD:
1. L-167–L-170: same bright room and eyeline as opening, Harikeshav right of frame, white 48px authored mono at x85 left. Keep the actual on-camera take: “Build workflows that learn, agents that prove, and operations that recover. This is Oryn.” At 02:44, 02:46 and 02:48 present “workflows that learn”, “agents that prove”, “operations that recover” respectively; perform the script's 700–900ms reveals and bold “prove”. Clear type before the 02:52 cut. Reserve the subtitle strip but do not write captions.
2. L-171–L-172: on the dotted bone stage assemble the ink mark and “Oryn” in Space Grotesk 700, x480 y285 in authored coordinates. Use the closed mark because L-142 already showed independent verified release; no cyan, no certification, no traction. Show exact credit “IBM AI Builders Challenge · AI for Business” in 15px mono. Do not trigger an additional ring-close at this unrelated end-card entry.
3. L-173–L-176: grow a white 2px outlined pill with 6px stage shadow from 240 to 620 authored pixels, 500ms. Type `https://github.com/Harikeshav-R/Oryn` at 30 characters/s; use the script's partial text “https://github.com/Harikesh” before completion. Hold full URL, credit and wordmark from 02:56 through the final 03:00 frame, with the black strip empty until caption work. No black slate.
4. Make text and asset sources editable variables, retain safe margins and allow no overlays on the speaker. Edit only compositions/lk-l12-close.html, its assets, root host and work/LK-12-notes.md; no new music, SFX or final render. Ensure the footage's source audio stays in sync.
MOUNT: lk-l12-close at 164, duration 16. QA: SO-O8 including 02:52 cut, completed URL and last frame 179+29/30; note the intentional closed-mark decision as the script deviation. REPORT: SO-O9 with capture source, timestamps and checks; end history and stop.
```

### LK-assemble · Assemble launch picture (L-001–L-176, 00:00–03:00, 180 s)
**Why / depends on:** Integrate all twelve accepted compositions without moving their story events. Depends on LK-01–LK-12.
**Checklist**
- [ ] Pre-flight: `demo/video/launch/index.html`, all twelve `compositions/lk-l*.html`, their assets and sidecars exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: root duration is exactly 180 seconds; each host and timeline ID matches; no gaps, frozen scenes or missing fonts.
- [ ] Verify: three set pieces, at 00:17–00:18, 00:31–00:32 and 02:43–02:44, land cleanly; 02:03.80–02:04.20 contains one uninterrupted prototype wipe.
- [ ] Accept: assembled launch preview and `work/LK-assemble-notes.md` exist; no final delivery render.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-assemble. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, launch, format, motion and film references. GOAL: assemble the accepted picture, retaining authored scene work and leaving audio and caption production to later steps. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176 and the resolved decisions in docs/video/mock-build-inventory.md section 4.
INPUTS: demo/video/launch/index.html, compositions/lk-l1-hook.html through lk-l12-close.html, all referenced launch/assets/ media, fonts and kit. Stop and identify LK-01–LK-12, CAP-10–CAP-18 or the shoot if any source is missing. Run history before editing; honor user changes.
BUILD:
1. In index.html confirm the 12 graphics hosts with matching IDs and timeline keys: lk-l1-hook 0/10, lk-l2-chaos 10/12, lk-l3-reveal 22/10, lk-l4-privacy 32/12, lk-l5-observe 44/12, lk-l6-discover 56/16, lk-l7-create 72/18, lk-l8-simulate 90/16, lk-l9-run 106/18, lk-l10-heal 124/20, lk-l11-breadth 144/20, lk-l12-close 164/16. Root is 1920×1080, 30 fps, start 0, duration exactly 180. Do not add child timelines to the root timeline.
2. Use `npx hyperframes timeline --json` to inspect actual absolute starts, source offsets and overlap points. Check the 00:08.50–00:10 invoice zoom, 00:17–00:18 opposing slice, 00:26–00:28 chip morph, 00:31–00:32 enrollment zoom, 00:43–00:44 document zoom, 01:45–01:46 Job zoom and 02:43–02:44 ring-to-human zoom. Do not add a crossfade of busy UIs. If an individual composition needs a change outside this step's scope, report its owner and exact problem rather than changing it.
3. Verify the media seam independently of the stage-host seam: lk-l9-run capture ends 123.5; lk-l10-heal starts 123.5 in the L9 composition for 0.5 seconds and continues from data-media-start .5 in L10 at absolute 124. The sole prototype FX-01 wipe spans 123.8–124.2 without a second wipe or a frame jump. Confirm containment precedes correction and the 02:19.20 verified ring closure precedes expansion.
4. Keep on-camera video audio intact; leave music, SFX, recorded VO and caption text to AUD/VO. Maintain a single empty captions-track host and correct paint order independent of track indices. Author only index.html, launch/assets/ needed for mounting and work/LK-assemble-notes.md. Do not edit another step's scene files; no final render.
MOUNT: root `data-duration=180`; section host starts and durations above. QA: SO-O8 over the whole film, including every scene midpoint, first and last frames, each transition boundary ±1 frame and timeline-derived overlaps; report defects in out-of-scope scenes rather than hiding them. Preview and check HTTP 200. REPORT: SO-O9 with timeline, every seam verdict, source offsets and open blockers; end history and stop.
```

### LK-polish · Picture continuity and readability (L-001–L-176, 00:00–03:00, 180 s)
**Why / depends on:** Check the assembled picture before the audio and VO pipeline. Depends on LK-assemble.
**Checklist**
- [ ] Pre-flight: assembled `demo/video/launch/index.html`, twelve compositions and all referenced assets exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: full settled lines hold about 0.3 seconds per word, safe areas remain clear and no product window gains stage shadows.
- [ ] Verify: no cyan remains after execution, no false completion appears, and the 180-second timeline is unchanged.
- [ ] Accept: preview is picture-locked or the report names exact scene-specific repairs needed.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-polish. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, launch, typography, motion and film references. GOAL: establish a picture lock without adding audio, captions or a final render. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176, mock-build-inventory.md section 4, and the actual assembled timeline.
INPUTS: demo/video/launch/index.html, all twelve accepted compositions, their assets, local font faces and stage kit. Stop and name LK-assemble or the owning scene step for missing inputs. Read the current history and timeline; retain user changes and do not rewrite the cut from scratch.
BUILD:
1. Audit timing at 30 fps against each storyboard entry and its 0.5-second beat grid. Hard cuts stay on beat, action starts and scene boundaries retain their absolute positions; do not speed up source product playback or silently shift the 180-second end. Confirm the pre-captured wipe is continuous from 123.8 to 124.2 and no stage overlay duplicates it.
2. Audit text contrast and safety: title-safe 80%, action-safe 90%, subtitle strip authored x128–1152 y630–688 scaled 1.5, all labels above that zone. Give each full settled line approximately 0.3 seconds per word; check camera crop and actual source holds, not merely entry duration. Review stills on laptop and phone-scale; report irreconcilable density instead of changing a numeric label or shortening a mandatory action.
3. Check visual continuity and claims: open reveal, neutral passive capture, sole executing cyan, no hatch behind text, correct authority and held-unknown sequence, 28/34 simulator arithmetic, 7/2/1/1 then 8/2/0/1 Job arithmetic, 3/3 independent verification before ring close and owner expansion. Ensure 34 impacted tests and explicit unavailable adapter cells. The end mark is closed per decision 2 after verified release.
4. Scope changes to index.html, launch/assets/ and work/LK-polish-notes.md only. Do not edit another step's scene file or alter source media. For issues requiring scene edits, list the precise LK step, entry IDs, timestamps and required adjustment in the report. Keep existing on-camera audio; add no other audio, subtitle text or delivery render.
MOUNT: preserve all LK-assemble starts, scene durations and 180-second root. QA: SO-O8 across all scenes, with actual transition overlap and ±1-frame boundary stills, and verify a responding preview URL. REPORT: SO-O9 with picture-lock verdict, readable holds, cyan intervals, arithmetic and every unresolved scene-specific repair. End history and stop.
```

### LK-15 · Optional 15-second cut-down (L-001–L-006, L-030–L-031, L-094–L-099, L-119–L-121, L-127, L-138, L-142, L-174–L-176; 00:00–00:15, 15 s)
**Why / depends on:** Produce an independent short edit only after picture, audio and spoken narration are accepted. Depends on LK-polish, AUD-02, VO-02, VO-04, VO-05, AUD-03 and QA-02; run this cut's own audio, captions and review gates.
**Checklist**
- [ ] Pre-flight: `demo/video/launch/index.html`, its picture and audio assets, `demo/video/footage/lk-hook.mov` and a fresh recorded 15-second hook take exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: fresh hook is intelligible; failure, held unknown and verified release remain distinct; `https://github.com/Harikeshav-R/Oryn` and credit hold.
- [ ] Verify: exactly 15 seconds, 30 fps, no speed-ramped continuous chronology or music-only delivery.
- [ ] Accept: independent `demo/video/launch-15/` preview; no change to the 180-second launch project.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-15. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, launch, film, sound and captions references. GOAL: create an optional, independent 15-second cut with real narration, not accelerated playback of the main film. SOURCE OF TRUTH: docs/video/launch-video-script.md “Cut-down plans” and the full entries L-001–L-006, L-030–L-031, L-094–L-099, L-119–L-121, L-127, L-138, L-142 and L-174–L-176. Read each before choosing crops. Inventory section 4 corrections remain binding.
INPUTS: locked demo/video/launch/ scenes, licensed assets, final launch voice, captions and music stems under demo/video/audio/, plus [LK15_HOOK_TAKE] supplied by the user saying “What if workflows could learn, prove, and recover?” in a fresh on-camera take. No fresh take means stop and name it, never fake or synthesize it. Do not alter demo/video/launch/.
KIT INPUTS: `demo/video/stage-kit/snippets/stage.html`, `camera.js`, `type.html`, `identity.html`, `end-card.html`, `transitions.js`; sync to `demo/video/launch-15/assets/kit/snippets/`. BUILD: copy needed markup, styles and tweens into each scene `<template>`, prefix IDs with the scene ID, and append to its one paused timeline. Bind actual `data-var-text="kinetic-text"`, `wordmark`, `project-url`, and `end-credit` where used. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` with source sidecar rectangles, `kitTransition(tl, kind, targets, {at, duration})` for a supported local transition, and `kitVerifiedRingClose(tl, ringPath, at)` only at shown verified readback.
BUILD:
1. Initialize an independent project demo/video/launch-15/ using the same local kit and fonts. Root is 1920×1080, 30 fps, duration 15 seconds. Author editable scene hosts with their own local timelines. Reuse or copy only the source assets and clips needed; use actual source offsets and sidecar anchors, never imply the trimmed clips form one continuous elapsed incident.
2. Recut 00:00–00:03 from L-001–L-006 and the fresh hook; 00:03–00:05 L-030–L-031 open ring and “Oryn”; 00:05–00:08 L-094–L-099 boundary failure and “Passed — Expected Safe Escalation”; 00:08–00:11 L-119–L-121 “Outcome Unknown”, “Held” and no resubmission. Prioritize readable evidence, not tiny dashboards.
3. At 00:11–00:13 use L-127 containment, L-138 34-scenario regression (28 Passed + 6 Passed — Expected Safe Escalation + 0 Failed), and L-142 independent “3/3 Verified Complete” release as separate legible crops, in that order. Do not claim the human decision happened before it did. At 00:13–00:15 use L-174–L-176 full “https://github.com/Harikeshav-R/Oryn” and “IBM AI Builders Challenge · AI for Business”; use the post-verification closed end mark.
4. Include real spoken audio and verified word-level captions on the single caption host, using the new take and truthful continuous sentence fragments or fresh user pickups. Never use TTS or music alone. Retain a 120 BPM, A-minor grid; no off-beat hard cuts. Respect source permissions, actual cue timing, readable holds and the required single black strip. Scope all new files and notes to demo/video/launch-15/; no delivery render.
MOUNT: independent 15-second root, local scene clocks and matching timeline IDs. QA: SO-O8 at all boundaries and overlap points, verify speech and chronology; preview HTTP 200. REPORT: SO-O9 including source ranges, media offsets, fresh-take path, caption/voice provenance and timing compromises; end history and stop.
```

### LK-30 · Optional 30-second cut-down (L-001–L-006, L-009–L-018, L-030–L-031, L-035–L-041, L-059–L-062, L-074, L-094, L-096, L-099, L-103, L-114–L-121, L-127, L-132–L-135, L-138, L-140–L-144, L-170, L-172, L-174–L-176; 00:00–00:30, 30 s)
**Why / depends on:** Make a longer independent short retaining privacy and the human repair. Depends on LK-polish, AUD-02, VO-02, VO-04, VO-05, AUD-03 and QA-02; run this cut's own audio, captions and review gates.
**Checklist**
- [ ] Pre-flight: accepted `demo/video/launch/` sources, `demo/video/audio/` stems and a fresh on-camera 30-second hook take exist.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: consent precedes capture; failed test precedes corrected result; approval precedes independent readback; containment precedes repair.
- [ ] Verify: complete URL and credit remain legible; audible user narration is present; duration is exactly 30 seconds.
- [ ] Accept: independent `demo/video/launch-30/` preview; original 180-second project remains unchanged.
**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: LK-30. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: SO-O1, launch, film, sound and captions references. GOAL: create an independent narrated 30-second edit with explicit action boundaries, not a faster rendering of the three-minute project.
SOURCE OF TRUTH: docs/video/launch-video-script.md cut-down plan and every entry L-001–L-006, L-009–L-018, L-030–L-031, L-035–L-041, L-059–L-062, L-074, L-094, L-096, L-099, L-103, L-114–L-121, L-127, L-132–L-135, L-138, L-140–L-144, L-170, L-172, L-174–L-176; mock-build-inventory.md section 4.
INPUTS: demo/video/launch/ locked compositions and media, demo/video/audio/ accepted launch stems, and [LK30_HOOK_TAKE], a fresh user-recorded hook suited to four seconds. Missing take, source audio or sidecar means stop and report the producing step. No invented VO, findings or UI. Copy necessary licensed assets into demo/video/launch-30/ only; do not change the main project.
KIT INPUTS: `demo/video/stage-kit/snippets/stage.html`, `camera.js`, `type.html`, `identity.html`, `evidence.html`, `end-card.html`, `transitions.js`; sync to `demo/video/launch-30/assets/kit/snippets/`. BUILD: copy markup, styles and tweens into each scene `<template>`, prefix IDs with the scene ID, and append to its one paused timeline. Bind actual `data-var-text="kinetic-text"`, `wordmark`, `masked-field`, `project-url`, and `end-credit` where used. Call `kitCameraToAnchor(tl, wrapper, rect, {at, duration, scale, viewportWidth, viewportHeight})` on source rectangles, throwing if absent; call `kitTransition(tl, kind, targets, {at, duration})` on local targets and `kitVerifiedRingClose(tl, ringPath, at)` only on verified readback.
BUILD:
1. Create a separate 1920×1080, 30 fps, 30-second HyperFrames root, local scene clocks, matched scene/timeline IDs and an empty captions host to populate from the actual cut's spoken audio. 00:00–00:04 use L-001–L-006 with the new hook. 00:04–00:06 use L-009–L-018 cropped work and “Business outcome: unverified”; 00:06–00:08 L-030–L-031 open mark and “Oryn”.
2. 00:08–00:11 use L-035–L-041: notice, independent observation consent, exclusions, “BANK ACCT”, “TAX ID”, “CARD” masked before storage. 00:11–00:14 use L-059–L-062 and L-074 for three named demonstrations, Marcus's published “Approved for Guidance” playbook and the 2.00% rule. Use only genuine source crops and independent labels, not invented interaction.
3. 00:14–00:18 use L-094, L-096, L-099, L-103: first “21 Passed”, “6 Passed — Expected Safe Escalation”, “1 Failed”, equality boundary, “STOPPING CAN BE CORRECT”, then corrected “22 Passed”, “6 Passed — Expected Safe Escalation”, “0 Failed”. 00:18–00:21 use L-114–L-121: Daniel's specific Tier 3 approval, pending verification, independent readback, and “Outcome Unknown” held without retry.
4. 00:21–00:26 use L-127, L-132–L-135, L-138, L-140–L-144 in order: three cases contained; Elena's answer and AP-RULE-017; bounded repair; 34-scenario 28/6/0 result; owner-approved narrow cohort; 3/3 verified; explicit expansion and closure. These are discrete legible crops, not falsely continuous elapsed footage. 00:26–00:30 use L-170, L-172 and L-174–L-176, spoken “This is Oryn.”, exact credit “IBM AI Builders Challenge · AI for Business” and full `https://github.com/Harikeshav-R/Oryn`.
5. Keep real voice and transcribe the new edit for word-timed captions; use fresh user pickups where continuous fragments would misrepresent chronology. Music/SFX follow 120 BPM A minor. Make the cut readable without removing safety caveats; no cyan after execution. Scope writes to demo/video/launch-30/ and its work/LK-30-notes.md; no final render.
MOUNT: independent root 0/30; hosts tile without gaps. QA: SO-O8 for each retained beat, inspect all transitions and listen to the actual voice; preview HTTP 200. REPORT: SO-O9 with source offsets, take and caption provenance, exact runtime and all compromises; end history and stop.
```

## 2.5 Audio

The picture must be assembled and visually approved before the music/SFX pass. The on-camera takes retain their recorded voice. Each cut has separate 180-second stems. All SFX are motivated by actual visible actions; read the full per-entry SFX fields as well as each cue sheet. Storyboard offsets and the half-second music grid sometimes disagree: retain causal sync, use beat-aligned hits where possible, and report every intentional off-grid cue. Do not time-shift a click to make music fit.

### AUD-01 · Hackathon music, effects and guide (H-001–H-154, 00:00–03:00, 180 s; hackathon only)

**Why / depends on:** SHOOT-04, all CAP-* hackathon clips, HK-assemble and HK-polish. The picture is the timing authority; VO is recorded after this pass.

**Checklist**
- [ ] Pre-flight: `demo/video/hackathon/index.html`, its mounted scene files and assets, `demo/video/footage/hk-hook.mov`, `hk-close.mov`, `bob-review.mov`, and `docs/video/hackathon-video-script.md`.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: 120 BPM A minor, 0.5 s beats; audible on-camera lines; no execution hum outside running states; effects cause-matched and gentle.
- [ ] Verify: guide beeps are on a separate stem, never in the final mix; stems and deterministic cue-assembly script exist and play for 180 s.
- [ ] Accept: picture-locked preview, stems under `demo/video/audio/`, copied project assets, `work/AUD-01-notes.md` and cue/timing report.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: AUD-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: section 0.4; read hyperframes references/sound.md, film.md and media-use references/audio.md, local.md and mixing.md. GOAL: add a coherent music and SFX score plus a separate rehearsal guide to an already locked 180-second hackathon picture, before recording non-camera narration. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-001–H-154, clean read-aloud transcript and SFX cue sheet; docs/video/mock-build-inventory.md Part B. INPUTS: index.html, compositions/, assets/ from HK-assemble/HK-polish; selected hk-hook.mov, hk-close.mov and real bob-review.mov; real user-licensed or available instrumental/SFX assets. If any is missing stop and identify the producing step.

BUILD: 1. Read timeline --json and the script's per-entry SFX, not just the cue table. Build one coherent 120 BPM, 4/4, A minor score on beats 0, 0.5, 1.0 ... 179.5; confirm mood changes support problem, lifecycle, simulation, containment and release. Use approved nonvocal music with an actual source and rights record, or follow media-use's catalog/sign-in flow; do not invent a source, covertly install a model, or claim to have heard it. Effects sit softly under the bed, in the same acoustic space, and under the eventual speaker. No harsh peaks. Use real causal cues rather than random ticks. A specifically required cue like ring-close must reflect an actual verified readback; no ring-close at the reveal.
2. Create separate `demo/video/audio/hackathon-music.wav`, `hackathon-sfx.wav`, `hackathon-guide.wav` and any licensed source ledger; retain a deterministic placement/mixing script in `work/AUD-01-assemble.mjs` and its source list. The guide is a rehearsal-only track with clearly separated short beeps preceding H1 00:00, H2 00:26, H3 00:52, H4 01:22 and H5 02:38 and entry-level speech cues derived from actual VO entries. Preserve three seconds of pre-roll outside the 180-second reference if recording equipment needs it, without moving film time. Do not add guide beeps to the project mix or delivery. Include an audio-free visual cue sheet keyed to entries.
3. Place effects per H-001–H-154: room tone and hook typing at 00:00–00:10; paper, glitch and problem at 00:26–00:52; lifecycle and privacy at 00:52–01:13; actual Bob recording at 01:13–01:22; simulator 01:49–01:57; verified readback and ring-close at 01:59; approval, held unknown and containment 02:04–02:10; regression and release 02:17–02:22; final typed URL 02:54–02:57.40. Include the cue sheet's exact time offsets in a machine-readable ledger. Arc hum occurs only while the simulator, job or regression is executing and stops with that state; passive lifecycle has none. Do not fake audio from Bob or add it if its recording is silent.
4. The 0.5 s beat grid and specified off-grid offsets cannot both be exact for every event: retain the picture action and choose the closest musically justified placement, logging original, placed time and reason. Never move dialogue to a beat. Keep music in a project-local assets path and mount uniquely identified timed audio clips; preserve selected on-camera sound exactly once, either on its source video with data-has-audio or as a linked audio clip, never double it.

MOUNT: root's music/SFX hosts only, 0–180 seconds; do not edit scene compositions. TRAPS: never add captions or non-camera VO now, never play/seek media in code, never put guide on the final mix. QA: lint, check --json, beat analysis and section 0.4 snapshots; preview and inspect relevant audio waveforms. Report actual measured levels, source licenses, cue ledger, deviations and human listening still required. REPORT: files, audio ids and timings, checks, preview URL and open questions; stop without final render.
```

### AUD-02 · Launch music, effects and guide (L-001–L-176, 00:00–03:00, 180 s)

**Why / depends on:** SHOOT-04, launch CAP-* clips, LK-assemble and LK-polish; AUD-01 establishes shared sound language.

**Checklist**
- [ ] Pre-flight: `demo/video/launch/index.html`, mounted scenes, `lk-hook.mov`, `lk-close.mov`, launch script and licensed sound sources.
- [ ] Run the prompt in Opus 5.5 from working dir `/Users/hari/Developer/Oryn-demo/demo/video/launch`.
- [ ] Verify: launch stem lasts 180 s, 120 BPM in A minor, no repeated or fake sound from passive observation, no duplicated talking-head voice.
- [ ] Verify: cue ledger covers all L-001–L-176, including open mark at 00:29–00:31, containment before repair and verified ring-close at 02:19.20.
- [ ] Accept: `demo/video/audio/launch-music.wav`, `launch-sfx.wav`, `launch-guide.wav`, source ledger and reproducible project-local script.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: AUD-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/launch. SKILLS: section 0.4, plus hyperframes references/sound.md and media-use references/audio.md, local.md, mixing.md. GOAL: score the locked 180-second launch picture and produce a separate spoken-cue guide without adding synthesized narration. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176, its exact clean transcript, per-entry SFX lines and SFX cue sheet; docs/video/mock-build-inventory.md Part B. INPUTS: assembled launch index.html and scene files, local stage assets and clips, selected lk-hook.mov and lk-close.mov, AUD-01 licensed source ledger where reusable. Stop if missing.

BUILD: 1. Inspect timeline --json, the complete script and actual picture. Compose one coherent, nonvocal 120 BPM, 4/4, A minor score from a verified licensed source, using media-use as applicable. Reuse the approved hackathon palette where it fits, but let the launch film's story lead: warm pulse at 00:00, restrained percussion in the work montage, reduced texture under the open mark, precise pulse through discovery and simulation, silence or thinning for the held unknown, low impact at containment, restrained rebuild at regression and a resolved end. The owner remains the only voice. Effects blend softly beneath music and future VO; repeated effects vary naturally and cannot spike or cover speech.
2. Deliver `demo/video/audio/launch-music.wav`, `launch-sfx.wav`, `launch-guide.wav`, source/rights ledger, and `work/AUD-02-assemble.mjs` that deterministically places the source recordings and writes the stems. The guide uses short pre-cues for L1 00:00, L2 00:10, L3 00:22, L4 00:32, L5 00:44, L6 00:56, L7 01:12, L8 01:30, L9 01:46, L10 02:04, L11 02:24 and L12 02:44, plus the actual speech entry cues. A recording pre-roll is outside film time. The guide is never placed in delivery audio. Do not substitute TTS for the speaker.
3. Place exact events by reading L-001–L-176: 00:00 room tone and typing, 00:03 hit, 00:08.75 whoosh; 00:10–00:20 paper, click and glitch; 00:21–00:29 reveal; 00:29–00:31 the mark stays open; 00:32–00:43 privacy; 00:44–00:55 actual permitted work; 01:30–01:46 simulation; 01:46–02:04 job, verified outcomes and unknown; 02:03–02:04 containment; 02:09–02:20 human correction, regression and ring-close at 02:19.20; 02:44–03:00 on-camera close and URL. Cross-check individual entry offsets and include all cues, not only this summary.
4. Music is locked to 0.5 s beats from frame zero, while certain scripted actions/cues are off-grid and the montage has 0.25–0.5 s cuts. Keep causal sound-picture alignment, quantize only where it does not break it, and report exact offsets and reasons. Hum only while execution is actually running. Copy selected sources to project `assets/`, use uniquely identified timed audio elements and retain on-camera sound once, not twice.

MOUNT: root music/SFX tracks only for 0–180 s. TRAPS: no caption or non-camera VO yet; no guide in delivery; no ring closure at the reveal; no fabricated sound or claims. QA: lint, check --json, beats and section 0.4 snapshots; verify the audio ledger against storyboard timing and report measured, not heard, audio. REPORT: files, ids/timings, rights, exceptions, preview URL, checks and open questions; stop.
```

### AUD-03 · Final mix and loudness (H-001–H-154 and L-001–L-176, each 00:00–03:00)

**Why / depends on:** For hackathon, AUD-01, VO-01, VO-03 and VO-05; for launch, AUD-02, VO-02, VO-04 and VO-05. Run separately after the selected cut's narration is placed. Hackathon may finish before launch starts.

**Checklist**
- [ ] Pre-flight: cut's project, `demo/video/audio/<cut>-music.wav`, `<cut>-sfx.wav`, selected `<cut>-vo.wav`, on-camera takes, and current caption project.
- [ ] Run the prompt in Opus 5.5 from the relevant project directory, once per cut; set `[CUT]` to `hackathon` or `launch`.
- [ ] Verify: speech is intelligible, room tone has no hard seams, music and SFX sit underneath, no doubled on-camera audio, no guide beeps in delivery.
- [ ] Verify: final rendered mix measures approximately −16 LUFS integrated and at most −1 dBTP; retain measurement output. A human listens on headphones and a phone speaker.
- [ ] Accept: project-local mix, independent stems and measured report for each cut; no claim of hearing by the model.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: AUD-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/[CUT], where [CUT] is exactly hackathon or launch. SKILLS: section 0.4; read media-use references/mixing.md, local.md and audio.md, and hyperframes references/sound.md. GOAL: rebalance the real recorded speaker, on-camera sound, music and effects after the VO pass, without changing the 180 s picture or transcript. SOURCE OF TRUTH: the selected cut's docs/video/hackathon-video-script.md H-001–H-154 or launch-video-script.md L-001–L-176, actual narration recording, cue ledger from AUD-01 or AUD-02, and current timeline --json. INPUTS: index.html, all its mounted assets, demo/video/audio/[CUT]-music.wav, [CUT]-sfx.wav, [CUT]-vo.wav and the real selected on-camera takes. Stop for missing inputs.

BUILD: 1. Inspect audio ownership, timing and source lengths. Check which video elements carry real on-camera voice and ensure it appears exactly once. Include the full actual spoken presentation, not merely music or a guide; no synthetic voice and no music-only cut. Respect all silent gaps in the launch transcript. 2. Place separately identifiable audio elements with local assets paths, IDs, start, duration and gain; preserve 180.0 s root duration. Set appropriate fades and automation to keep effects softly under music and music below speech; avoid compression pumping, sudden transients and clipped on-camera consonants. Retain room tone under dialogue joins. Do not include guide beeps in the final project. Do not time-stretch voice.
3. Run `npx hyperframes normalize-audio --lufs=-16 --write` from the selected project. This adjusts placed HTML audio gain, not a guarantee of true-peak compliance; use appropriate measured limiting outside or in the existing audio workflow if required. Measure integrated mix loudness and true peak from a draft render using ffmpeg loudnorm/ebur128 or a compatible meter. Target −16 LUFS integrated and at most −1 dBTP; record actual measurements and any source treatment. Retain unmodified original takes and separate stems. If the meter or actual mix cannot meet these limits, stop and report rather than declaring success.
4. Save the mix decisions and measurement command/output to `work/AUD-03-[CUT]-mix.txt`; list each real audio file and relative level. Do not claim subjective listening. Ask the human to check a full playthrough, headphones and phone speaker, especially clicks, the 02:03–02:10 containment section and the final spoken line. If they identify a problem, begin a new history turn and fix it.

MOUNT: existing root audio lanes only; do not touch other steps' compositions. QA: obey section 0.4 lint, check and snapshot gates. If a temporary draft is needed for measurement, render draft first to `../renders/[CUT]-audio-draft.mp4`, ffprobe 180 s / 5400 frames and decode a known frame. REPORT: changed files, IDs, measurements, peak, exceptions, checks, listening not performed by the model, preview and open questions; stop.
```

## 2.6 Voiceover and captions

### VO-01 · Record hackathon narration (H-001–H-154, 00:00–03:00, 180 s; hackathon only)

**Why / depends on:** HK-polish and AUD-01; picture and guide are locked. Record the voice last, except the actual on-camera takes already recorded at SHOOT-02.

**Checklist**
- [ ] Pre-flight: `docs/video/hackathon-video-script.md` clean transcript and per-entry VO, approved 180 s picture, `demo/video/audio/hackathon-guide.wav`, real hook and close takes, microphone and headphones.
- [ ] Record in a quiet, treated room, microphone 15–20 cm away and slightly off-axis, stable gain and posture. Monitor peaks below clipping, target approximately −12 dBFS peak, retain breaths and 10 seconds room tone; turn off noisy devices.
- [ ] Play the locked picture and guide in headphones. Record complete sentences and three takes per section, leaving natural silence; use on-camera audio rather than doubling or replacing it. Do not stretch recordings.
- [ ] Pickups: H1 H-001–H-013 identity and standard; H2 H-014–H-026 `$9.90`, `11.6 days` and brittle automation; H3 H-027–H-056 fourteen-stage loop, local/cloud boundary and true Bob statement; H4 H-057–H-132 consent, examples, `2.00%`, 28 scenarios, 7/2/1/1, held unknown and contained repair; H5 H-133–H-154 impact, next steps and close. Read each full sentence from the script, not this summary.
- [ ] Verify: no line was invented, all names and figures are intelligible, H1/H5 on-camera words sync with lips, and no room noise or clipped syllables intrudes. Track take/time for every pickup.
- [ ] Accept: original takes and `demo/video/audio/hackathon-vo.wav`, a 180 s film-aligned stem with silence where on-camera audio plays; retain a separate full speech reference for transcription, including the actual on-camera audio. Keep source takes untouched.

### VO-02 · Record launch narration (L-001–L-176, 00:00–03:00, 180 s)

**Why / depends on:** LK-polish, AUD-02 and SHOOT-02. Same real speaker, room and picture-lock rule as VO-01.

**Checklist**
- [ ] Pre-flight: `docs/video/launch-video-script.md` clean transcript, locked picture, `demo/video/audio/launch-guide.wav`, selected hook/close takes, microphone and headphones.
- [ ] Record three full-sentence takes with stable mic distance and measured peaks below clipping; record room tone and retain intentional silence. Never replace on-camera audio with TTS or stretch a take.
- [ ] Pickups: L1 L-001–L-008 hook; L2 L-009–L-024 finished clicks; L3 L-025–L-034 “Introducing Oryn.”; L4 L-035–L-046 consent; L5 L-047–L-058 commitment; L6 L-059–L-074 candidate and playbook; L7 L-075–L-092 agent scope and gates; L8 L-093–L-108 boundary and safe escalation; L9 L-109–L-126 seven/two/one/one and held unknown; L10 L-127–L-146 contain, teach, regression and verified release; L11 L-147–L-166 capabilities; L12 L-167–L-176 closing sentence. Read the actual script verbatim.
- [ ] Verify: Priya and Daniel names, “safe escalation,” “unknown,” “first,” and “verified outcomes” sound clear. Keep a clean pickup of each phrase; maintain on-camera lip sync and genuine silence.
- [ ] Accept: originals, `demo/video/audio/launch-vo.wav` with on-camera gaps, and a separate film-aligned full speech reference including real on-camera audio.

### VO-03 · Hackathon transcript and captions (H-001–H-154, 00:00–03:00, 180 s; hackathon only)

**Why / depends on:** VO-01, AUD-01 and HK-assemble. Transcribe the actual full speech reference, including the camera clips.

**Checklist**
- [ ] Pre-flight: `demo/video/audio/hackathon-vo.wav`, the film-aligned full speech reference, `demo/video/hackathon/index.html`, `assets/fonts/` and the hackathon script.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: words exactly match spoken audio, including actual on-camera lines; no hallucinated silence-tail text or duplicated captions.
- [ ] Verify: a single caption track, one group at a time, white IBM Plex Mono 600 at authored 13–15px on `#0A0A0A`, x128–1152 and y630–688; important content remains clear.
- [ ] Accept: timestamped transcript and caption composition in the hackathon project, manually reviewed against the recording.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: VO-03. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: section 0.4; read hyperframes references/captions.md, format.md and media-use references/audio.md. GOAL: transcribe the actual 180-second hackathon speech and create editable one-line captions, preserving picture lock. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-001–H-154, clean transcript, actual selected takes and film-aligned speech reference from VO-01. INPUTS: index.html, existing caption host and local fonts, demo/video/audio/hackathon-vo.wav, the full speech reference with on-camera words and no music. Stop if missing.

BUILD: 1. Run `npx hyperframes transcribe <film-aligned-full-speech-reference> --json` with the actual path substituted. It writes `assets/transcript.json`; immediately save a named copy such as `assets/transcripts/hackathon.json` because another transcription overwrites the default. Preserve one word and start/end timestamp per entry. Examine nonsense, duplicated words and silence-tail hallucinations; compare by position and by listening with the user's help to actual speech, not by blindly forcing the clean transcript onto different audio. If transcription quality is poor, use an appropriate larger English model and report it. Do not invent missing words.
2. Search the caption registry first, then construct `compositions/hk-captions.html` as a single caption sub-composition with one paused registered timeline and one caption host. Follow references/captions.md, but the storyboard's strip wins over generic caption placement: authored x128–1152, y630–688, one line IBM Plex Mono 600, 13–15px, white on #0A0A0A. At 1920×1080 multiply coordinates by 1.5. Host uses `data-track-kind=\"captions\"`; groups are timed clips with stable IDs and local start/duration. Open each group at or before its first word, end after its last; only one group at a time, and avoid stale groups. If required use a child for fade or instant state changes, never tween visibility on a clip. Respect the source sentence, punctuation and real speech; avoid a caption in silence.
3. Match H1 through H5 speech and on-camera lines to H-001–H-154; maintain all existing UI labels and no on-screen disclosure. Keep the black strip while following the script's silent intervals. Fit the actual words inside one line without covering the presenter, lower-thirds or mandatory controls. Hold fully settled text as long as speech and readability permit; report impossible 0.3-second-per-word conflicts rather than trimming words or inventing speech. Preserve root duration 180 and its established assets.

MOUNT: one root host `hk-captions` at data-start 0, data-duration 180, track kind captions; also copy the VO-01 film-aligned narration stem into `assets/audio/` and mount it as a uniquely identified timed audio element at 0–180, without duplicating on-camera dialogue. Do not edit other scene compositions. QA: lint, check --json and snapshots at all caption transitions and scene midpoints, plus human audio/text comparison of every phrase. REPORT: transcript and composition paths, host ID/timing, actual checks and human checks outstanding, corrections, conflicts, preview and open questions; stop.
```

### VO-04 · Launch transcript and captions (L-001–L-176, 00:00–03:00, 180 s)

**Why / depends on:** VO-02, AUD-02 and LK-assemble.

**Checklist**
- [ ] Pre-flight: launch project, `demo/video/audio/launch-vo.wav`, film-aligned full speech reference including real on-camera audio, local fonts and launch script.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/launch`.
- [ ] Verify: all 195 scripted words are compared with actual audio; captions do not fill intentional silent beats or manufacture additional speech.
- [ ] Verify: one line in the exact subtitle strip; on-camera face, controls and lower-thirds remain unobscured.
- [ ] Accept: independently saved launch transcript and caption host, reviewed at timing boundaries and against the actual recording.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: VO-04. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/launch. SKILLS: section 0.4; read hyperframes references/captions.md, format.md and media-use references/audio.md. GOAL: turn the user's real film-aligned launch speech into one accurate, editable caption track without changing picture or adding words. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176, clean transcript and caption appendix, plus VO-02's real speech reference. INPUTS: index.html, local fonts, demo/video/audio/launch-vo.wav, complete film-aligned speech reference with the selected on-camera hook and close. Stop for missing inputs.

BUILD: 1. Run `npx hyperframes transcribe <film-aligned-full-speech-reference> --json` after substituting its real path. Preserve `assets/transcript.json` immediately as `assets/transcripts/launch.json`, separately from hackathon, since subsequent runs overwrite the default. Inspect one-word records and timing, remove silence hallucinations and duplicate tails, retry an appropriate larger model if needed. Compare repeated words by position and reconcile transcript with actual recorded words, not guesses. Human listening is mandatory for final accuracy.
2. Search the registry for a caption style, then build one `compositions/lk-captions.html` host using one paused timeline registered after tweens and stable IDs. The exact storyboard strip overrides generic caption style placement: x128–1152, y630–688 in 1280×720; 13–15px IBM Plex Mono 600, white on #0A0A0A, single line, scaled by 1.5 for 1920×1080. Time one group at a time using per-word starts and ends; retain black strip without glyphs during intentional silence. No overlap, stale captions, duplicate glyphs or invented speech. Animate children rather than tweening visibility on timed clips.
3. Cross-check L1–L12, L-001–L-176, including “Introducing Oryn.”, “A safe escalation is a pass.”, the 7/2/1/1 spoken summary, “The unknown stays held, never blindly resubmitted.” and “Build workflows that learn, agents that prove, and operations that recover. This is Oryn.” The script totals 195 words; if the actual approved take differs, report the difference rather than silently altering it. Preserve real on-camera voice exactly once. Keep captions, lower-thirds and the face distinct, with legible settled holds and no on-screen disclosure.

MOUNT: one root caption host `lk-captions`, start 0, duration 180, track kind captions; also copy the VO-02 film-aligned narration stem into `assets/audio/` and mount it as a uniquely identified timed audio element at 0–180, without duplicating on-camera dialogue. Leave the other scenes untouched. QA: lint, check --json, snapshots of all caption boundaries and midpoints; flag text whose reading hold conflicts with actual speech. REPORT: saved transcript, host ID and timing, checks, deviations, human listening outstanding and preview URL; stop.
```

### VO-05 · Conform picture to narration (H-001–H-154 or L-001–L-176, each 00:00–03:00)

**Why / depends on:** VO-03 for hackathon or VO-04 for launch. Run once per cut before its AUD-03 final mix.

**Checklist**
- [ ] Pre-flight: selected project's complete `index.html`, captions, measured real speech reference and current `timeline --json`; actual picture lock notes.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/[CUT]`, setting `[CUT]` to `hackathon` or `launch`.
- [ ] Verify: cue words and corresponding actions agree, no syllables cut, no change in speaker speed, no lost frame or duplicate clip; film remains 180 s and 5400 frames.
- [ ] Verify: planned edits have receipts, caption boundaries follow actual audio and all modified transitions pass snapshots; listen for awkward seams.
- [ ] Accept: updated timeline, preserved receipts, preview and a list of all timing deltas. Retake any line too long for a safe hold.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: VO-05. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/[CUT], with [CUT] exactly hackathon or launch. SKILLS: section 0.4; read hyperframes-cli SKILL.md timeline commands, hyperframes references/captions.md, format.md and review.md. GOAL: conform only minor narration/picture timing slips after real recording and word-level captions, without changing spoken speed or extending the 180-second cut. SOURCE OF TRUTH: selected script's H-001–H-154 or L-001–L-176, actual film-aligned full speech recording, caption transcript and approved section timeline. INPUTS: current index.html, caption host, assets, VO-03 or VO-04 output and timeline --json.

BUILD: 1. Begin history, inspect the person's changes and read `npx hyperframes timeline --json`, including absolute starts/ends, owning file and stable refs. Compare actual cue words against script entry IDs. Make a list of differences by film time and frame, marking which are safe short holds or trims and which require a retake. Keep on-camera mouth and source audio in sync; never separate linked clips or change speech playback rate. 2. For each minimal picture correction use `npx hyperframes timeline move|trim|split <ref> ... --plan --json` and inspect the plan before applying the documented command; save each receipt under `work/VO-05-[CUT]-receipts/`. Use a still exported from the correct source frame for a mid-source freeze if necessary. Do not fake a video seek in runtime. Keep the named subject visible, preserve state and evidence, and do not make an approval look like verification.
3. Adjust caption group timing to the actual speech, not the other way around. Ensure one group at a time, one line and script-specific strip. Do not alter spoken wording, stretch or compress audio, or move dialogue merely to align beats. A hold may consume neighboring visual slack, never remove a mandatory state or conceal an important boundary. Keep 30 fps frame-aligned starts, root duration exactly 180 seconds and all existing music/SFX causal. If no safe slack exists or a change would affect another scene owned by another step, stop and request a pickup rather than forcing an overwrite.
4. Save the before/after timeline and a concise list of modified refs, source entry IDs, old/new frame times, receipt paths and remaining retakes in `work/VO-05-[CUT]-conform.txt`. Do not edit an unrelated composition. Keep the actual on-camera tracks and transcript synchronized; return to AUD-03 to rebalance if timing moves.

MOUNT: preserve existing scene and caption hosts; only explicitly identified affected timeline clips. QA: run lint and check --json; snapshot segment ends, every affected midpoint, both sides of each changed cut and timeline-derived overlap. Verify 180 s and no gap or unintended overlap. Ask for a human playthrough. REPORT: receipts, deltas, IDs and data-start/data-duration, checks, snapshots, deviations, preview and open questions; stop.
```

## 2.7 QA, render and submit

### QA-01 · Hackathon full review (H-001–H-154, 00:00–03:00, 180 s; hackathon only)

**Why / depends on:** VO-05 for hackathon and its AUD-03 mix, HK-polish; all real Bob facts and footage must exist.

**Checklist**
- [ ] Pre-flight: complete `demo/video/hackathon/` project, hackathon script, `docs/video/mock-build-inventory.md` Part B and actual Bob evidence.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/hackathon`.
- [ ] Verify: all P0 issues fixed; review sheets readable at 1080p and 360px; every caption matches real speech and no private information appears.
- [ ] Verify: exact fixture numbers, truthful Bob outcome, verified-versus-approved distinction, cyan only during execution, 180 s and 5400 frames.
- [ ] Accept: `demo/video/hackathon/REVIEW.md`, check results, three reviewed contact sheets, timeline-derived transition stills and human audio review.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: QA-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/hackathon. SKILLS: section 0.4; read hyperframes references/review.md, captions.md, sound.md and format.md, hyperframes-cli references/lint-validate-inspect.md and preview-render.md. GOAL: review the completed hackathon film as a first-time judge before delivery. SOURCE OF TRUTH: docs/video/hackathon-video-script.md H-001–H-154 and Appendix A/B, docs/video/mock-build-inventory.md Part B and resolved decisions, real selected VO and Bob review. INPUTS: complete 180 s index.html and mounted assets, captions, actual VO and mix, source/rights ledger, Bob slot notes and timeline.

BUILD: 1. Run lint and `npx hyperframes check --json`, fix every error and account for warnings. Run `npx hyperframes snapshot --review` and open all three sheets: beats, cuts and phone-size. For hero and payoff take `snapshot --range ... --frames 8`; use timeline --json to calculate every exit/entry overlap and inspect that midpoint plus frames immediately before and after each relevant transition. Describe what a stranger sees, grade findings P0/P1/P2, and save concise timestamped fixes to `REVIEW.md`. Fix P0 and worthwhile P1 with history, without replacing real source footage.
2. Audit every on-screen number and status against H-001–H-154 and Part B: `$9.90`, `11.6 days`, `19.9%` only as sourced external context; 5/5 examples, 28 scenarios with 21 passed + 6 expected safe escalations + 1 failed, then 22 + 6 + 0; eleven cases, 7 Verified Complete, 2 Escalated, 1 Approval Required and 1 Outcome Unknown, followed only after independent verification by 8/2/0/1; exactly 2.00% policy boundary; $38.50 fee and 3 contained cases. Read the actual fixture details rather than inferring absent invoice values. Check labels “Passed — Expected Safe Escalation”, “Outcome Unknown”, “Contained” and “Approved for Guidance”. Do not imply approval itself proves an outcome or an unknown was retried.
3. Review every caption against actual speech and time, 0.3 s per settled word, 1080p and 360px readability, contrast and crop. Inspect both phases of every incident wipe; cyan only while simulator, job or regression executes, dark after stop. Check ring closure only after verified readback, local evidence versus authorized cloud inference, consent and meeting permissions. Check Bob footage is genuine and `[BOB_TASK]`, `[BOB_REVIEWED]`, `[BOB_FINDING]`, `[BOB_ACTION]` match evidence. No private data, fake facts, disclosure tags, invented credentials or unsupported claims. Verify spoken challenge, team, problem, solution, AI, Bob, demo, impact and next steps.
4. Produce a draft only for review at `../renders/hackathon-review-draft.mp4`. Use ffprobe to check duration 180.0, 1920×1080, 30 fps and exactly 5400 video frames; decode a known frame. Measure audio integrated loudness and true peak, target −16 LUFS and ≤ −1 dBTP. Run `npx hyperframes audio ../renders/hackathon-review-draft.mp4 --json` and retain results. State measured rather than heard; require the human to listen to all 180 seconds and note issues. Do not claim compliance before human listening.

MOUNT: preserve all hosts and their existing times; change only named defect locations with history and record each change. QA: rerun section 0.4 checks after edits and re-open affected frames. REPORT: `REVIEW.md`, findings and disposition, all checks/actual measured values, snapshot paths, human listening outstanding, deviations and open questions; stop before delivery render.
```

### QA-02 · Launch full review (L-001–L-176, 00:00–03:00, 180 s)

**Why / depends on:** VO-05 for launch, AUD-03 for launch and LK-polish.

**Checklist**
- [ ] Pre-flight: complete launch project, launch script, `docs/video/mock-build-inventory.md` Part B, launch VO and licensed audio.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo/demo/video/launch`.
- [ ] Verify: every P0 fixed, exact 180 s / 5400 frames, real speech and captions match, cyan is execution-only and no ring closure occurs at reveal.
- [ ] Verify: launch scene cuts, held unknown, contained incident, 34-scenario regression and verified release remain truthful and legible at full and phone size.
- [ ] Accept: launch `REVIEW.md`, inspected review sheets, draft measurement report and human listening sign-off.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: QA-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo/demo/video/launch. SKILLS: section 0.4; read hyperframes references/review.md, captions.md, sound.md and format.md, hyperframes-cli references/lint-validate-inspect.md and preview-render.md. GOAL: complete an evidence-based visual, numerical and audio review of the full launch cut. SOURCE OF TRUTH: docs/video/launch-video-script.md L-001–L-176, its 195-word transcript and cue sheet; docs/video/mock-build-inventory.md Part B, resolved decisions and real VO. INPUTS: completed index.html, footage, product clips and sidecars, captions, real audio and licensed music ledger.

BUILD: 1. Run lint, `npx hyperframes check --json`, `npx hyperframes snapshot --review`; open all three sheets including 360px and every cut strip. Read `timeline --json` to locate overlap midpoints and inspect both sides of all transitions. Sample eight frames around the three set pieces and wipe. Write each P0/P1/P2 as `t=... · where · problem → exact change · what stays` in `REVIEW.md`; fix P0 and justified P1, then review affected frames. Do not substitute invented UI or change product clip actions.
2. Compare every number, label and factual claim against L-001–L-176 and Part B. Check 5/5 examples, 28 scenarios, 21 + 6 + 1 then 22 + 6 + 0; 11 invoices with 7 verified, 2 escalated, 1 approval required and 1 unknown; only after verified readback 8/2/0/1. Check exactly 2.00% auto-accepts, $38.50 handling fee, 3 contained cases and 34-scenario regression with 28 Passed, 6 Passed — Expected Safe Escalation and 0 Failed. The 6 new regression cases comprise the original failure plus 5 nearby variants; policy change affects 34 tests. Confirm the 12% unsafe discount is blocked, 1.50% is a later policy change, and no unsupported application capability is implied. Distinguish local masking/private evidence from authorized cloud inference. Do not introduce customers, production use, source-free statistics or Bob findings.
3. Verify the open identity stays open at 00:22–00:32; ring closes only on verified readback around 02:19.20. Cyan means actively executing, not verified, not a CTA or decorative line. Inspect the light-to-dark wipe inside the heal clip without a duplicate stage wipe. Check actual VO and one-line subtitles at x128–1152/y630–688 in authored coordinates, no private data or disclosure tags, readable legal source lines and 0.3 seconds per settled word. Validate screenshot authorization and redaction. Include human listening as a separate gate.
4. Render draft `../renders/launch-review-draft.mp4`, measure frame count using ffprobe, confirm exactly 5400 at 30 fps, 180 seconds and 1920×1080, and decode a known frame. Measure integrated loudness around −16 LUFS and true peak no higher than −1 dBTP; run `npx hyperframes audio ../renders/launch-review-draft.mp4 --json`. Record real values and limitations. The model must not say it heard audio; request full human listening.

MOUNT: preserve existing scene hosts and absolute timing except specifically approved minimal fixes; retain all history and review notes. QA: rerun lint, check and changed snapshots; `REVIEW.md` names weakest shot, actual measurements, kept warnings and anything untested. REPORT: files, timings, findings, measured values, preview URL and open questions; stop before delivery.
```

### QA-03 · Render and inspect both deliveries (H-001–H-154 and L-001–L-176, each 00:00–03:00)

**Why / depends on:** QA-01 for the hackathon or QA-02 for launch, plus human preview and audio approval. Run hackathon first; launch may follow after submission.

**Checklist**
- [ ] Pre-flight: selected project's `REVIEW.md`, passed check and approved human listening notes; write destination `demo/video/renders/`.
- [ ] From the selected project directory run the draft and delivery commands below, substituting `hackathon` or `launch` for `[CUT]`. Confirm the draft before the delivery command.
- [ ] Verify with ffprobe: 1920×1080, 30/1 fps, 180.0 s, 5400 decoded video frames, audio present; decode and inspect an expected frame. Measure −16 LUFS integrated and ≤ −1 dBTP; listen again to the actual delivery.
- [ ] Verify: first/last frame, subtitle and ending URL, no black frames or glitches, and every source with private or restricted content is cleared.
- [ ] Accept: `demo/video/renders/hackathon-delivery.mp4` and `launch-delivery.mp4`, each with check, frame count, audio report and human approval.

```bash
# Run from demo/video/hackathon or demo/video/launch; replace [CUT] first.
npx hyperframes render --fps 30 --quality draft -o ../renders/[CUT]-final-draft.mp4
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=width,height,r_frame_rate,nb_read_frames,duration \
  -of default=noprint_wrappers=1 ../renders/[CUT]-final-draft.mp4
# Inspect and approve the draft before continuing.
npx hyperframes render --fps 30 --quality delivery -o ../renders/[CUT]-delivery.mp4
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=width,height,r_frame_rate,nb_read_frames,duration \
  -of default=noprint_wrappers=1 ../renders/[CUT]-delivery.mp4
ffmpeg -ss 60 -i ../renders/[CUT]-delivery.mp4 -frames:v 1 ../renders/[CUT]-check-60.png
ffmpeg -i ../renders/[CUT]-delivery.mp4 -filter_complex 'ebur128=peak=true' -f null -
```

Do not report success merely because a render exits zero. View the decoded frame and play the whole final file. Verify audio streams with `ffprobe -show_streams`; capture the loudness report. If integrated loudness or peak fails, return to AUD-03 and redo QA; never normalize away a clipping defect without rechecking the resulting mix.

### QA-04 · Upload, thumbnail and logged-out viewing (H-001–H-154 or L-001–L-176, each 00:00–03:00)

**Why / depends on:** QA-03 for the relevant cut. Hackathon upload is required for SUB-03; launch upload is separate.

**Checklist**
- [ ] Pre-flight: approved delivery MP4, relevant platform account, submission rules, and a safe settled frame with no private material.
- [ ] Choose a settled, legible Oryn frame and create a thumbnail in `demo/video/renders/<cut>-thumbnail.png`; do not change frame 0 or alter the 180 s delivery to accommodate it.
- [ ] Upload the hackathon delivery to an accepted YouTube, Vimeo or Drive destination according to current contest rules; choose visibility that judges can access. Upload launch separately if desired. Do not claim a video is uploaded until the service confirms it.
- [ ] Open the exact submitted URL in a logged-out/private browser session, without author credentials. Play beginning, middle and end; confirm audio, captions, resolution, permissions and expected duration. Repeat after changing sharing settings.
- [ ] Accept: working URL, platform confirmation, thumbnail and timestamped logged-out playback evidence. Keep any private source and editable project out of the public upload.

### SUB-01 · Build the contest slide deck (Appendix A, H-001–H-154; hackathon only)

**Why / depends on:** QA-01 and the real Bob review; may run while the final hackathon upload is processing.

**Checklist**
- [ ] Pre-flight: `docs/video/hackathon-video-script.md` Appendix A, `docs/video/mock-build-inventory.md` Part B, approved screenshot assets, actual `[BOB_*]` notes.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: every Appendix A slide exists in order, exact numbers and statuses agree with fixtures, links and visuals are legible; Bob facts reflect actual evidence.
- [ ] Verify: 16:9 export opens, speaker notes remain available, no confidential source, unsupported claim or unresolved slot appears.
- [ ] Accept: editable slide project and an export accepted by the contest, under `demo/video/submission/`.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: SUB-01. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: `/skill:slideshow` for the actual slide deck, plus section 0.4 skills and better-typography. This is a deck, not a video composition; follow the slideshow skill for build, review and export. GOAL: create the actual editable hackathon slide deck and contest-compatible export, not a video or a placeholder. SOURCE OF TRUTH: docs/video/hackathon-video-script.md Appendix A in full, including every slide's exact on-slide copy, visual specification and speaker notes; H-001–H-154 and docs/video/mock-build-inventory.md Part B for supporting facts. INPUTS: approved product captures, original Oryn assets, local licensed fonts, verified `[BOB_TASK]`, `[BOB_REVIEWED]`, `[BOB_FINDING]`, `[BOB_ACTION]`, and real Bob review evidence. Stop if the factual slots or required assets are missing.

BUILD: 1. Read every Appendix A slide in order and build that complete sequence. Do not compress it into a generic pitch deck or invent a slide count. Preserve the provided copy and notes. The opening includes exactly “Oryn”, “Operational knowledge, verified action, governed improvement.”, “Harikeshav Rameshkumar · The Ohio State University”, and “IBM AI Builders Challenge, North America · AI for Business”. Use the actual review session, not a fabricated finding. Explain who is affected, what the workflow does, how AI and Bob are used, the demo, impact and next steps as the source specifies.
2. Use 16:9, bone #F6F6F3, ink #0A0A0A, 1px warm borders, generous margins, Space Grotesk titles, IBM Plex Mono labels and Crimson Text short human explanations. Keep product screenshots flat; stage-only illustrations may use 2px outlines and 6px offset shadows. Keep the orbit mark open except where verified readback is specifically depicted. Cyan is active execution only. Do not put private data, invented certifications, partners, traction or on-screen disclosure in slides.
3. Audit exact figures: external invoice context is $9.90 and 11.6 days, not an Oryn result; 5/5 examples; simulator 21 + 6 + 1 then 22 + 6 + 0 out of 28; job 7/2/1/1 then verified 8/2/0/1; 2.00% boundary, $38.50 and 3 contained cases. Quote exact approved labels and source lines where Appendix A calls for them. Never claim a human approval verifies an external outcome. Compare all slide numbers with fixtures and real footage; record corrections.
4. Save the editable source, export and slide review notes in `demo/video/submission/`, with stable names `oryn-contest-slides` and the format accepted by the actual submission. Render and visually inspect every slide, verify order, text fit, contrast and speaker notes, and open the exported file. Report any unavailable asset, unsupported export or unverified Bob fact; do not publish or submit on the owner's behalf.

MOUNT: none; deck is separate from the 180-second videos. QA: slideshow skill checks and human review; section 0.4 HyperFrames lint/check/snapshots apply only if you actually edit a HyperFrames video project, otherwise report not applicable. REPORT: exact files, slide count, export checks, sources, corrections, unresolved questions and any human approval still needed; stop.
```

### SUB-02 · Prepare project page copy (Appendix B, H-001–H-154; hackathon only)

**Why / depends on:** real BOB-* build and review, QA-01, SUB-01; QA-04 supplies the final video URL.

**Checklist**
- [ ] Pre-flight: `docs/video/hackathon-video-script.md` Appendix B, actual Bob recording and `[BOB_*]` facts, approved contest video link and slide export.
- [ ] Run the prompt in Opus 5.5 from `/Users/hari/Developer/Oryn-demo`.
- [ ] Verify: Problem, Challenge, AI/technical approach, Bob use, Impact, Next steps, team and video/slide links all match actual artifacts and contest fields.
- [ ] Verify: source lines and numerical claims match Part B and Appendix B; no invented customer, deployed service, savings, endorsement, credential or Bob finding.
- [ ] Accept: reviewed copy in `demo/video/submission/project-page.md` with no unresolved `[BOB_*]` slots and real links inserted only after upload.

**Prompt (paste into Opus 5.5)**
```text
Obey ROADMAP.md section 0.4 (SO-O1 to SO-O10) before anything else.
STEP: SUB-02. WORKING DIRECTORY: /Users/hari/Developer/Oryn-demo. SKILLS: section 0.4 and better-typography; this is project-page copy, not a video edit. GOAL: prepare truthful paste-ready project-page text for the IBM AI Builders Challenge, North America, AI for Business. SOURCE OF TRUTH: docs/video/hackathon-video-script.md Appendix B in full, H-001–H-154, docs/video/mock-build-inventory.md Part B, actual Bob build and review evidence, actual approved video and slide links. INPUTS: all source files, `[BOB_TASK]`, `[BOB_REVIEWED]`, `[BOB_FINDING]`, `[BOB_ACTION]`, real team and school, contest requirements, QA-04 URL and SUB-01 slide export. Stop for missing facts rather than inventing them.

BUILD: 1. Read and preserve all Appendix B section content and the actual application field limits. Prepare distinct Problem, Challenge, AI and technical approach, How IBM Bob was used, Impact and Next steps blocks. Include Harikeshav Rameshkumar, The Ohio State University and the challenge identity. Where the platform has different field names, map the content explicitly without deleting required substance. Include the actual 3-minute narrated video URL and real slide attachment path; do not invent an upload or URL.
2. Fill the four Bob variables only with recorded evidence: actual development task, exact reviewed scope, actual finding or genuine no finding, actual action. Make no claim beyond what the session shows. The project was built primarily using Bob only if the retained sessions establish that fact. Do not present a fictional review as real. No secrets or personal information from the screen capture.
3. Preserve the privacy boundary: masking, exclusions and private evidence are local; authorized cloud inference goes through the governed gateway; optional on-device inference is a later direction. No unsupported claim that all data or models stay on device. Describe job figures as the demonstrated case, not measured customer impact: 7 Verified Complete, 2 Escalated, 1 Approval Required, 1 Outcome Unknown; verified approval changes that to 8/2/0/1. External Ardent Partners context is $9.90, 11.6 days and 19.9%; preserve attribution and do not attribute industry averages to Oryn. Do not add invented ROI, deployment, customers, awards, certifications or endorsements.
4. Write `demo/video/submission/project-page.md` with field headings and exact user-ready copy, real evidence notes and link placeholders only when those inputs genuinely do not yet exist; if any remain, mark the output blocked rather than ready for publication. Cross-check with Appendix B, source fixtures and actual Bob review. Validate that screenshots and slides contain no private material. Do not submit or claim the page was published.

MOUNT: none. QA: proofread exact labels, names, links and figures; report actual checks and any missing evidence. HyperFrames project quality gates apply only if a video project was edited; otherwise say not applicable. REPORT: path, section list, true Bob substitutions, checked links, deviations and open questions; stop.
```

### SUB-03 · Upload certificates and submit (H-001–H-154, 00:00–03:00; hackathon only)

**Why / depends on:** PRE-* SkillsBuild certificates and account access, QA-03 and QA-04 hackathon, SUB-01 and SUB-02. Submit early; deadline is **December 2, 2026, 5:00 PM ET** under Official Rules §§4–5.

**Checklist**
- [ ] Pre-flight: current official rules and submission portal; hackathon delivery URL from QA-04; `demo/video/submission/` slides and page copy; actual SkillsBuild certificate files; Bob session evidence; team and university details.
- [ ] Confirm the applicable certificate(s) are earned and belong to the participant. Upload the actual files in the portal fields; check the portal accepted them. Never claim a certificate that does not exist.
- [ ] Enter project name **Oryn**, team member **Harikeshav Rameshkumar**, institution **The Ohio State University**, challenge **IBM AI Builders Challenge, North America**, track **AI for Business**. Follow actual portal field names and verify spelling.
- [ ] Paste the verified project-page fields from SUB-02, add the working narrated 3:00 hackathon video link and attach the SUB-01 slides. Fill any remaining mandatory team/contact fields accurately.
- [ ] Reopen the public or judge-visible project page logged out. Test the exact video link and slides from that page; confirm access, playback, narration and correct files. Fix permissions and retest.
- [ ] Submit before 5:00 PM ET on 2026-12-02; preserve the portal's actual confirmation, submission ID and timestamp. The event page's December 10 date does not replace the earlier Official Rules deadline for this plan.
- [ ] Accept: portal confirms submission, certificates and attachments appear, the logged-out test passes, and proof is saved privately in `demo/video/submission/`.

### Definition of done

- [ ] Bob was the primary development tool for the functioning deterministic prototype; real session evidence and the truthful review recording exist.
- [ ] Hackathon film is 180.0 s, 1920×1080, 30 fps, 5400 frames, with the owner's intelligible spoken narration, accurate captions and audible original on-camera lines.
- [ ] The story shows the problem, affected people, solution, AI boundary, actual Bob use, prototype, impact and next steps; all figures and states match fixtures and no private data or invented claims appear.
- [ ] Picture, transitions, sound and titles were reviewed; −16 LUFS integrated target and ≤ −1 dBTP were measured; a person listened and approved the actual delivery.
- [ ] Project page, contest slide deck, team details and genuine SkillsBuild certificates are accepted; exact judge-visible video and slide links work while logged out.
- [ ] The submission portal actually confirmed receipt before the deadline, and its evidence is retained. Launch delivery is a separate goal, not a condition for a valid hackathon submission.
