import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { INCIDENT, REPAIR } from '@/data/incident'
import { act, motionProgress } from './contract'
import type { ProductProps } from './contract'
import { refusal } from './discovery'
import { anchored, at } from './geometry'
import { HiddenAnchors } from './settings-frame'
import { teachAccess } from './teach'
import { TEACH_ANCHORS, TEACH_ANCHOR_RECTS as R } from './teach-layout'

export function TeachScreen(props: ProductProps) {
  const { state } = props
  const access = teachAccess(state)
  if (!access.ok) return <><p role="status" style={at({ x: 264, y: 176, width: 700, height: 80 })}>Not available: {access.reason}</p><HiddenAnchors names={TEACH_ANCHORS} /></>
  const saved = state.incident.correctionRecorded
  const yes = saved || state.ui.incident.answer === 'yes'
  const linked = saved || state.ui.incident.ruleLinked
  const saveBlock = saved ? 'The correction is already saved.' : refusal(state, { type: 'TEACH' })
  const linkBlock = saved ? 'The correction is already saved.' : refusal(state, { type: 'LINK_TEACH_RULE', linked: !linked })
  const reviewBlock = state.actorId !== 'marcus' ? 'The Workflow Owner, Marcus Webb, reviews the repair.' : refusal(state, { type: 'OPEN_SCREEN', screen: 'SC28' })
  return <>
    <div style={at({ x: 256, y: 160, width: 768, height: 488 })} className="box-border rounded-lg border bg-surface" />
    <header style={at({ x: 280, y: 180, width: 700, height: 48 })}>
      <h1 className="type-section m-0">Teach Oryn What Changed</h1>
      <p className="type-data m-0 text-muted-foreground">Elena Ruiz · INV-48231 · Manually completed</p>
    </header>
    <p {...anchored('teach-question', R['teach-question'])} className="m-0 text-[18px] leading-6">{INCIDENT.correction.question}</p>
    <Button variant={yes ? 'primary' : 'outline'} {...anchored('teach-yes', R['teach-yes'])} aria-pressed={yes} disabled={saved} disabledReason={saved ? 'The correction is already saved.' : undefined} className="transition-none" onClick={() => act(props, { type: 'SET_TEACH_ANSWER', answer: yes ? 'none' : 'yes' })}>Yes</Button>
    {yes && <p style={{ ...at({ x: 396, y: 302, width: 590, height: 32 }), opacity: 0.65 + 0.35 * motionProgress(props.film, 'SET_TEACH_ANSWER') }} className="type-data m-0">Billed on top of subtotal; within approved terms</p>}
    <div {...anchored('correction-source', R['correction-source'])} className="flex items-center gap-2 font-mono text-sm"><BookOpen size={16} /> <span style={{ opacity: linked ? 0.65 + 0.35 * motionProgress(props.film, 'LINK_TEACH_RULE') : 1 }}>AP-RULE-017 Supplier handling fees</span></div>
    <Button variant="outline" {...anchored('link-rule', R['link-rule'])} aria-pressed={linked} disabled={!!linkBlock} disabledReason={linkBlock ?? undefined} className="transition-none" onClick={() => act(props, { type: 'LINK_TEACH_RULE', linked: !linked })}>{linked ? 'Rule linked' : 'Link rule'}</Button>
    <Button {...anchored('save-correction', R['save-correction'])} disabled={!!saveBlock} disabledReason={saveBlock ?? undefined} className="transition-none" onClick={() => act(props, { type: 'TEACH' })}><span style={{ opacity: saved ? 0.65 + 0.35 * motionProgress(props.film, 'TEACH') : 1 }}>{saved ? 'Correction saved' : 'Save correction'}</span></Button>
    {saveBlock && !saved && <p style={at({ x: 280, y: 420, width: 460, height: 48 })} className="type-micro m-0 text-muted-foreground">{saveBlock}</p>}
    <p {...anchored('teach-scope', R['teach-scope'])} className="type-data m-0">Marcus Webb · Bounded scope: {REPAIR.scope}</p>
    <p {...anchored('teach-notice', R['teach-notice'])} className="type-data m-0">Correction is evidence, not new policy<br />Policy remains owned by Daniel Okafor.</p>
    <Button variant="outline" {...anchored('teach-back', R['teach-back'])} className="transition-none" onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC26' })}>Back</Button>
    <Button {...anchored('review-repair', R['review-repair'], saved)} disabled={!!reviewBlock} disabledReason={reviewBlock ?? undefined} className="transition-none" onClick={() => act(props, { type: 'OPEN_SCREEN', screen: 'SC28' })}>Review repair</Button>
  </>
}
