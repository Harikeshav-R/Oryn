# Brand marks: provenance (PRE-03, 2026-11-19)

Small nominative marks that identify third-party apps inside original mock UIs. Use them at 16-24 px beside the product-name text label. They show no integration, sponsorship or affiliation. Never trace, redraw or recolor a file in place; for grey tiles apply `filter: grayscale(1)` in CSS.

**Rights status: the marks' owners have NOT granted permission for this use.** Their published terms (quoted verbatim with URLs in `demo/video/stage-kit/assets/marks/RIGHTS-LEDGER.md`) require written permission or a licence. The project owner decided on 2026-11-19 to use them anyway for a non-profit contest demo and accepted that risk. If an owner objects, replace that mark with its plain-text name.

## Files

| File | Mark | Where it came from | Checked against an official file? |
|---|---|---|---|
| `hubspot.svg` | HubSpot (sprocket plus wordmark, 2025 brand, `#ff4800`) | Official HubSpot logo ZIP linked from https://www.hubspot.com/newsroom: https://www.hubspot.com/hubfs/WBZ%202025%20Rebrand/HubSpot%20Logo/HubSpot%20Logo%20Zip/HubSpot%20Logos_2025.zip (zip sha256 `dfd0a26e647b15c4805ab784e9c5abf6f651e7588f31b2c2da821dd346272b95`), file `HubSpot_Logo_Primary.svg`, unmodified | Yes, it is the official file. The earlier thesvg sprocket (old salmon colour) did not match the 2025 brand and was replaced. |
| `gmail.svg`, `google-sheets.svg`, `chrome.svg`, `meet.svg` | Gmail, Google Sheets, Chrome, Google Meet | `npx hyperframes media-use resolve --type logo`, provider thesvg (`glincker/thesvg` at commit `e5957fa742c1ebf6da07ac40665bdd01d8add35f`) | No. Google's official icon files sit behind a Partner Marketing Hub login or an agreement; not downloaded. Visual check: current-generation icons. |
| `slack.svg` | Slack | same thesvg commit | No. Slack's logo collection (https://salesforce.widencollective.com/c/xt57vnlf) asks for sign-in. |
| `zoom.svg` | Zoom (blue app-icon tile) | same thesvg commit | Partly. Zoom's public media-kit file is the wordmark PNG https://media.zoom.com/images/assets/zoom-logo-2025.png/... (sha256 `f8b5cc5e08ca27af64550b48205b49260299c219599968eec9d22ac7e43a4f90`), a different official mark from this icon; same blue, not byte-comparable. |
| `macos.svg` | macOS (plain "macOS" wordmark) | same thesvg commit | No official macOS logo is published for third-party use. Unreadable below about 24 px. |
| `salesforce.svg`, `outlook.svg`, `excel.svg`, `teams.svg`, `edge.svg` | Grey tiles only | same thesvg commit | No. Salesforce's ZIP is behind Widen; Microsoft publishes icons only inside guideline PDFs. |
| `netsuite-favicon.png` | NetSuite, 48x48 raster | DuckDuckGo favicon service for netsuite.com via media-use | No. No NetSuite SVG exists in the available libraries; none was traced. Chip-size use only. |

thesvg licence tags (CC0-1.0 or MIT) describe the repo's own packaging, not a grant from the trademark owner. Exact tags and per-file sha256 are in `RIGHTS-LEDGER.md`.

## QA performed 2026-11-19

- All 13 SVGs scanned for `<script>`, `<image>`, `href`, `url(http...)`, `data:image`, event handlers, `<foreignObject>` and `@import`: none found. `hubspot.svg` has one inline `<style>` with a single `fill: #ff4800` rule and no other CSS.
- Rendered all marks at 16, 24 and 48 px on white in Chrome: clean (contact sheet, not kept).
- Not done: byte or visual comparison with official files for every mark except HubSpot, because the official files are behind a login or an agreement that was not accepted on the owner's behalf.

Sha256 of the staged copies:

```
883ba903494b9eb6ae8886f05362eb3914ce1c97a9d347aa50d1fd3464f35893  hubspot.svg
```

The other files are byte-identical copies of the same-named files in `demo/video/stage-kit/assets/marks/`; their hashes are in `RIGHTS-LEDGER.md`.
