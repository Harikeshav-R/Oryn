import { orbitPhase } from '@/lib/frame'

/**
 * Execution orbit (design spec section 3.5): 100-unit mark, centre (50,50), radii
 * 18/31/44, 1.5 unit rings, one 4 unit node on the middle ring. The node angle is a
 * pure function of `frame`. The arc colour exists only while `running`; on stop the
 * node turns neutral and stays at the frozen frame.
 */
export function Orbit({
  frame,
  running,
  size = 48,
  decorative = false,
}: {
  frame: number
  running: boolean
  size?: number
  /** Hide from assistive tech when an adjacent label already names the state. */
  decorative?: boolean
}) {
  const angle = orbitPhase(frame) * 2 * Math.PI - Math.PI / 2
  const x = 50 + 31 * Math.cos(angle)
  const y = 50 + 31 * Math.sin(angle)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': running ? 'Running' : 'Stopped' })}
      data-running={running ? 'true' : 'false'}
      className="shrink-0 text-trace"
    >
      {[18, 31, 44].map((r) => (
        <circle key={r} cx={50} cy={50} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} />
      ))}
      <circle
        cx={x}
        cy={y}
        r={2}
        style={{ fill: running ? 'var(--arc-mark)' : 'var(--foreground)' }}
        data-orbit-node=""
      />
    </svg>
  )
}

/**
 * Small-size orbit (button loading ring, status glyph, stepper node). At 24px or less the
 * three-ring mark's 1.5-unit strokes fall below one device pixel, so this variant keeps a
 * single ring at a fixed 1.5px stroke with the node on it. The node angle is the same pure
 * function of `frame`; it is arc only while `running` and neutral and frozen otherwise.
 */
export function OrbitNode({
  frame,
  running,
  size = 16,
  decorative = false,
  className = 'text-trace',
}: {
  frame: number
  running: boolean
  size?: number
  decorative?: boolean
  /** Ring colour class. Defaults to the neutral trace. */
  className?: string
}) {
  const c = size / 2
  const nodeR = size >= 18 ? 3 : size >= 16 ? 2.25 : 2
  // The node sits on the ring, so the ring radius leaves room for it inside the viewBox.
  const ring = c - nodeR
  const angle = orbitPhase(frame) * 2 * Math.PI - Math.PI / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': running ? 'Running' : 'Stopped' })}
      data-running={running ? 'true' : 'false'}
      className={`shrink-0 ${className}`}
    >
      <circle cx={c} cy={c} r={ring} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle
        cx={c + ring * Math.cos(angle)}
        cy={c + ring * Math.sin(angle)}
        r={nodeR}
        style={{ fill: running ? 'var(--arc-mark)' : 'var(--foreground)' }}
        data-orbit-node=""
      />
    </svg>
  )
}
