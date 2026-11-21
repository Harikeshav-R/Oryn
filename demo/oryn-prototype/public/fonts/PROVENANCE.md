# Font provenance (PRE-02, acquired 2026-11-18)

Ten self-hosted WOFF2 faces, one file per weight, no variable fonts, no subsetting.
Every face is a real upstream weight; the weight declared in `@font-face` must match the file, never synthesized.
All three families are licensed under the SIL Open Font License 1.1; license texts are in `licenses/`.
No remote font reference may appear in any HTML, CSS or JS.

| File | CSS weight | Family | Upstream source | License |
|---|---:|---|---|---|
| `IBMPlexMono-Regular.woff2` | 400 | IBM Plex Mono | npm `@ibm/plex-mono@2.5.0` -> `package/fonts/complete/woff2/` (unmodified) | `licenses/OFL-IBM-Plex.txt` |
| `IBMPlexMono-Medium.woff2` | 500 | IBM Plex Mono | same | same |
| `IBMPlexMono-SemiBold.woff2` | 600 | IBM Plex Mono | same | same |
| `IBMPlexMono-Bold.woff2` | 700 | IBM Plex Mono | same | same |
| `SpaceGrotesk-Regular.woff2` | 400 | Space Grotesk | GitHub release `floriankarsten/space-grotesk` tag `2.0.0`, `woff2/static/` (unmodified) | `licenses/OFL-Space-Grotesk.txt` |
| `SpaceGrotesk-Medium.woff2` | 500 | Space Grotesk | same | same |
| `SpaceGrotesk-Bold.woff2` | 700 | Space Grotesk | same | same |
| `CrimsonText-Regular.woff2` | 400 | Crimson Text | `google/fonts` `ofl/crimsontext/CrimsonText-Regular.ttf`, re-encoded to WOFF2 | `licenses/OFL-Crimson-Text.txt` |
| `CrimsonText-SemiBold.woff2` | 600 | Crimson Text | `ofl/crimsontext/CrimsonText-SemiBold.ttf`, re-encoded | same |
| `CrimsonText-Bold.woff2` | 700 | Crimson Text | `ofl/crimsontext/CrimsonText-Bold.ttf`, re-encoded | same |

## Source locations

- IBM Plex: https://github.com/IBM/plex (npm tarball https://registry.npmjs.org/@ibm/plex-mono/-/plex-mono-2.5.0.tgz, sha256 `55b5ffcfcd5e9db36ef2070b2b07a573434ca02c6f3be2b921c0b88fff29acad`, npm integrity `sha512-STBJIPxPomOYPmBMO7z5TKPJUotAF9u3gAUumTqVgwgrAO+K4FRNh0MlhsoJjKhJKsMbBJR10/bk4inkj/wc1w==`). Copyright (c) 2017 IBM Corp. with Reserved Font Name "Plex". Files are IBM's own unmodified WOFF2, so no Modified Version arises.
- Space Grotesk: https://github.com/floriankarsten/space-grotesk/releases/tag/2.0.0 (asset `SpaceGrotesk-2.0.0.zip`, sha256 `53b415577d4139248555300710bea0d268c7a5be67b93de53b716a9736cabffd`). Copyright 2020 The Space Grotesk Project Authors. No Reserved Font Name declared. `AUTHORS` and `CONTRIBUTORS` are kept in `licenses/`.
- Crimson Text: https://github.com/google/fonts/tree/main/ofl/crimsontext (upstream project https://github.com/googlefonts/Crimson, commit `4f1458ae64c6c0d9c5fdfbf5095c7fabe0fa063f`; font files last changed in google/fonts commit `1ac62d533f0aaeb37e348425c9122be0eadeaa22`, 2022-03-30). Copyright 2010 The Crimson Text Project Authors. No Reserved Font Name declared. Google Fonts publishes this family as TTF only, so the WOFF2 files here are a container re-encode (fontTools `TTFont.flavor = "woff2"` with brotli, tool version not recorded; no subsetting, no glyph or table edits, glyph count 718 unchanged) made with `uv run --with fonttools --with brotli`; the conversion script is not kept in the repo.

Source TTF sha256 (Crimson Text, before re-encode):

```
48e6c5d5ad1d01599d374ecb817e15890d1feb3b8a3a88e527d44c90389e1f06  CrimsonText-Regular.ttf
802e84000740fec2a9fbe0ae09b6b6811bd86a78a0173b15d44450a1530e9410  CrimsonText-SemiBold.ttf
a3a0765fc5e8d0b49b540a23aefe0184887dd79f06a0bdf4db7035cea6befa93  CrimsonText-Bold.ttf
```

## Staged file checksums (sha256)

```
ba204497f16b6d334cee9d1e963a831b73e3a56e1d6300a8489d18df7214b350  IBMPlexMono-Regular.woff2
33faf307fa6031fb4062276d7320a6d632de890cbb347576fd80cfa01077bc25  IBMPlexMono-Medium.woff2
6a825b4824c01cbb401e829e5a066a1818411bcb3538b5a5792c5ca9b82343c3  IBMPlexMono-SemiBold.woff2
ea576f38d05cc44cca48c45314984beb8cc1d2b886f58e1dce99f15dc344eb1d  IBMPlexMono-Bold.woff2
c6620e3d49a9f9dba3be3aa93c89d6d5a51096cb1c616d2691edb630551d5da5  SpaceGrotesk-Regular.woff2
f20a85be4c8a74ddad94d46fcce503666498855e5a87755d75cd728d801bbe58  SpaceGrotesk-Medium.woff2
06d705cebbab916f0c0fe82b6c6f4cae06aa07fd6f5ee078421206040326ef63  SpaceGrotesk-Bold.woff2
5a93e80d5c11b8c7b22250926b0534c4f8d66a66674d339bd7122194196dfd1e  CrimsonText-Regular.woff2
5282ee77d41e0f0feb683d30a003d0e3e0fcde462c02741fdb93d27c3f24b27a  CrimsonText-SemiBold.woff2
c6f8d492719a57b8a182625b93d3f9b4526376340ccfb3f69ac189ca828ea067  CrimsonText-Bold.woff2
```

## Verified with fontTools (2026-11-18)

Each file's `OS/2.usWeightClass` matches the table above (400/500/600/700, 400/500/700, 400/600/700). All are static. Every one of `— → ≥ ≤ · ’ × $ % − “ ” … á é € ½` is present in all ten faces.

Known gap: U+2318 `⌘` (command-palette keycap `⌘K`, inventory CMP-11/CMP-12) is absent from all ten faces. Draw the glyph as inline SVG or write the key as `Ctrl K`/`Cmd K` text; do not let the browser fall back to a system font.

## Rules for consumers

- `@font-face` per file, explicit `font-weight`, `font-style: normal`, `font-display: swap` for interactive use (inventory CMP-02, design doc 3.2); capture waits until every face is verified loaded, so a swap never appears in a captured frame. URLs relative to the project (`assets/fonts/...`).
- Await `document.fonts.ready` and verify the faces are loaded before any capture.
- Keep `licenses/` next to the font files wherever they are copied.
- Bob receives the same files: copy this folder verbatim into the prototype's font directory (BOB-00). Do not re-download or substitute other builds.
