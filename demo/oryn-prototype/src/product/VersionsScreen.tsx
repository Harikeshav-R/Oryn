import { Button } from '@/components/ui/button'
import { REPAIR } from '@/data/incident'
import { REGRESSION_PASS_RESULTS } from '@/data/regression'
import { VERSION_HISTORY } from '@/data/versions'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { FocusOnOpen } from './focus-on-open'
import { trapTab } from './focus-trap'
import { anchored, at, within } from './geometry'
import { Frame, HiddenAnchors } from './settings-frame'
import { VERSIONS_ANCHORS, VERSIONS_ANCHOR_RECTS as R } from './versions-layout'
import { versionsAccess } from './versions'

const cards = ['version-playbook', 'version-v01', 'version-v02', 'version-v10', 'version-v11'] as const
const headings = ['Playbook v1.0 · Approved for Guidance', 'Agent v0.1 · Candidate', 'Agent v0.2 · Candidate', 'Agent v1.0 · Released · Stage 3', 'Agent v1.1 · Repair'] as const

export function VersionsScreen(props: ProductProps) {
  const { state, film } = props
  const access = versionsAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={VERSIONS_ANCHORS} /></>
  const view = state.ui.breadth.versions
  const open = view.restore === 'confirm'
  const reason = refusal(state, { type: 'RESTORE_VERSION' })
  const openReason = refusal(state, { type: 'SET_VERSION_VIEW', restore: 'confirm' })
  const opacity = film?.reducedMotion ? 1 : 0.65 + 0.35 * motionProgress(film, 'SET_VERSION_VIEW')
  const close = () => act(props, { type: 'SET_VERSION_VIEW', restore: 'closed' })
  return <>
    <h1 className="type-title m-0" style={at({ x: 264, y: 112, width: 600, height: 40 })}>Version history</h1>
    <div {...anchored('version-row', R['version-row'])} className="box-border rounded-lg border bg-surface" />
    {cards.map((name, index) => <article key={name} {...anchored(name, R[name])} className="box-border overflow-hidden rounded border bg-surface-2 p-3">
      <h2 className="type-data m-0 font-semibold">{headings[index]}</h2>
      <p className="type-micro mt-2">{VERSION_HISTORY[index]?.detail}</p>
    </article>)}
    <Button {...anchored('version-compare-evaluation', R['version-compare-evaluation'])} variant="outline" className="transition-none" onClick={() => act(props, { type: 'SET_VERSION_VIEW', compare: 'evaluation' })}>Compare v0.1 / v0.2</Button>
    <Button {...anchored('version-compare-repair', R['version-compare-repair'])} variant="outline" className="transition-none" onClick={() => act(props, { type: 'SET_VERSION_VIEW', compare: 'repair' })}>Compare v1.0 / v1.1</Button>
    <section {...anchored('version-comparison', R['version-comparison'], view.compare !== null)} className="box-border rounded-lg border bg-surface p-4" style={{ ...anchored('version-comparison', R['version-comparison'], view.compare !== null).style, opacity }}>
      {view.compare === 'evaluation' ? <div className="grid grid-cols-2 gap-6 type-micro"><div><strong>Agent v0.1</strong><p>{VERSION_HISTORY[1]?.detail}</p><p>SCN-022 · Failed</p></div><div><strong>Agent v0.2</strong><p>{VERSION_HISTORY[2]?.detail}</p><p>SCN-022 · Passed</p></div></div> : <div className="grid grid-cols-2 gap-6 type-micro"><div><strong>Agent v1.0 · Before</strong><p>{REPAIR.before}</p></div><div><strong>Agent v1.1 · After</strong><p>{REPAIR.after}</p><p>{VERSION_HISTORY[4]?.detail} · {REGRESSION_PASS_RESULTS.length} scenarios</p><p>Permissions and policy unchanged.</p></div></div>}
    </section>
    <Button {...anchored('restore-previous', R['restore-previous'])} variant="outline" className="whitespace-normal px-3 text-center leading-4 transition-none" disabled={!!openReason} disabledReason={openReason ?? undefined} onMouseEnter={() => act(props, { type: 'SET_VERSION_VIEW', hint: true })} onMouseLeave={() => act(props, { type: 'SET_VERSION_VIEW', hint: false })} onFocus={() => act(props, { type: 'SET_VERSION_VIEW', hint: true })} onBlur={() => act(props, { type: 'SET_VERSION_VIEW', hint: false })} onKeyDown={(event) => { if (event.key === 'Escape') act(props, { type: 'SET_VERSION_VIEW', hint: false }) }} onClick={() => act(props, { type: 'SET_VERSION_VIEW', restore: 'confirm' })}>Restore previous approved version</Button>
    <div {...anchored('version-restore-hint', R['version-restore-hint'], view.hint && !open)} className="box-border rounded bg-foreground p-3 type-micro text-background" style={{ ...anchored('version-restore-hint', R['version-restore-hint'], view.hint && !open).style, opacity: film?.reducedMotion ? 1 : motionProgress(film, 'SET_VERSION_VIEW') }}>Restore affects future eligible work, not prior business effects</div>
    {state.restoredVersion !== null && <p role="status" className="type-data" style={at({ x: 280, y: 580, width: 650, height: 30 })}>Restored for future jobs: Agent v1.0</p>}
    <FocusOnOpen open={open} interactive={!film} anchor="version-restore-cancel" />
    <div aria-hidden={!open} style={{ ...at({ x: 0, y: 0, width: 1280, height: 720 }), display: open ? undefined : 'none', zIndex: 40, opacity }} className="bg-black/80" onClick={(event) => { if (event.target === event.currentTarget) close() }} />
    <Frame anchor="version-restore-dialog" rect={R['version-restore-dialog']} visible={open} role="dialog" aria-modal="true" aria-labelledby="restore-title" className="shadow-lg" style={{ zIndex: 41, opacity }} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close() } else trapTab(event, event.currentTarget) }}>
      <h2 id="restore-title" className="type-section m-0" style={at({ x: 24, y: 24, width: 460, height: 36 })}>Restore for future jobs only?</h2>
      <p className="type-body m-0" style={at({ x: 24, y: 76, width: 460, height: 28 })}>Prior business effects will not be undone.</p>
      <p className="type-data m-0" style={at({ x: 24, y: 112, width: 460, height: 28 })}>Agent v1.0</p>
      {reason && <p className="type-micro m-0 text-muted-foreground" style={at({ x: 24, y: 140, width: 460, height: 28 })}>{reason}</p>}
      <Button {...anchored('version-restore-cancel', within(R['version-restore-dialog'], R['version-restore-cancel']), open)} variant="outline" className="transition-none" onClick={close}>Cancel</Button>
      <Button {...anchored('version-restore-confirm', within(R['version-restore-dialog'], R['version-restore-confirm']), open)} disabled={!!reason} disabledReason={reason ?? undefined} className="transition-none" onClick={() => act(props, { type: 'RESTORE_VERSION' })}>Restore</Button>
    </Frame>
  </>
}
