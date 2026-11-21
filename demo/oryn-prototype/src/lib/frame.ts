/**
 * Film time is integer frames at 30 fps. This supersedes the 60 fps in older
 * design-doc text (ROADMAP.md BOB-00 note). Anything the film captures derives
 * from a frame number, never from a clock.
 */
export const FPS = 30

export function frameToSeconds(frame: number): number {
  return frame / FPS
}

/** The execution orbit completes one revolution in 1.8 s, linear. */
export const ORBIT_SECONDS = 1.8
export const ORBIT_FRAMES = Math.round(ORBIT_SECONDS * FPS)

/** Orbit phase in [0, 1) as a pure function of the frame. */
export function orbitPhase(frame: number): number {
  const wrapped = ((frame % ORBIT_FRAMES) + ORBIT_FRAMES) % ORBIT_FRAMES
  return wrapped / ORBIT_FRAMES
}

/** Film click: the control presses to scale .97 over 90 ms, then holds until released. */
export const PRESS_SECONDS = 0.09
export const PRESS_SCALE = 0.97

/** Scale `pressFrames` frames after a film press starts. Pure function of the frame. */
export function pressScale(pressFrames: number): number {
  const progress = Math.min(1, Math.max(0, pressFrames / (PRESS_SECONDS * FPS)))
  return 1 - (1 - PRESS_SCALE) * progress
}
