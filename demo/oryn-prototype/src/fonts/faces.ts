/**
 * CMP-02 manifest of the ten bundled faces. Files, OFL notices and checksums:
 * public/fonts/ and public/fonts/PROVENANCE.md. Keep identical to src/styles/fonts.css.
 */

export type FontFamilyName = 'IBM Plex Mono' | 'Space Grotesk' | 'Crimson Text'
export type FontWeight = 400 | 500 | 600 | 700

export interface FontFaceSpec {
  readonly family: FontFamilyName
  readonly weight: FontWeight
  /** URL path under the app base, served from public/. */
  readonly path: string
}

export const FONT_FACES: readonly FontFaceSpec[] = [
  { family: 'IBM Plex Mono', weight: 400, path: '/fonts/IBMPlexMono-Regular.woff2' },
  { family: 'IBM Plex Mono', weight: 500, path: '/fonts/IBMPlexMono-Medium.woff2' },
  { family: 'IBM Plex Mono', weight: 600, path: '/fonts/IBMPlexMono-SemiBold.woff2' },
  { family: 'IBM Plex Mono', weight: 700, path: '/fonts/IBMPlexMono-Bold.woff2' },
  { family: 'Space Grotesk', weight: 400, path: '/fonts/SpaceGrotesk-Regular.woff2' },
  { family: 'Space Grotesk', weight: 500, path: '/fonts/SpaceGrotesk-Medium.woff2' },
  { family: 'Space Grotesk', weight: 700, path: '/fonts/SpaceGrotesk-Bold.woff2' },
  { family: 'Crimson Text', weight: 400, path: '/fonts/CrimsonText-Regular.woff2' },
  { family: 'Crimson Text', weight: 600, path: '/fonts/CrimsonText-SemiBold.woff2' },
  { family: 'Crimson Text', weight: 700, path: '/fonts/CrimsonText-Bold.woff2' },
]

export type FaceState = 'loading' | 'loaded' | 'unavailable'

export interface FaceReport {
  readonly spec: FontFaceSpec
  readonly state: FaceState
  /** Why a face is unavailable; empty otherwise. */
  readonly reason: string
}

export interface FontReport {
  readonly status: FaceState
  readonly faces: readonly FaceReport[]
}

export const LOADING_REPORT: FontReport = {
  status: 'loading',
  faces: FONT_FACES.map((spec) => ({ spec, state: 'loading', reason: '' })),
}

async function checkFace(spec: FontFaceSpec): Promise<FaceReport> {
  try {
    await document.fonts.load(`${spec.weight} 16px "${spec.family}"`)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { spec, state: 'unavailable', reason: `load failed: ${reason}` }
  }
  const declared = [...document.fonts].find(
    (face) =>
      face.family.replace(/^["']|["']$/g, '') === spec.family &&
      Number(face.weight) === spec.weight &&
      face.style === 'normal',
  )
  if (!declared) {
    return { spec, state: 'unavailable', reason: 'no matching @font-face is declared' }
  }
  if (declared.status !== 'loaded') {
    return { spec, state: 'unavailable', reason: `face status is ${declared.status}` }
  }
  return { spec, state: 'loaded', reason: '' }
}

/** Loads every face, awaits document.fonts.ready, then verifies each declared face. */
export async function verifyFonts(): Promise<FontReport> {
  const faces = await Promise.all(FONT_FACES.map(checkFace))
  await document.fonts.ready
  const status: FaceState = faces.every((face) => face.state === 'loaded') ? 'loaded' : 'unavailable'
  return { status, faces }
}
