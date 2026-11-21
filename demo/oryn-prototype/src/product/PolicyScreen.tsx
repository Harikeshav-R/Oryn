import { StatusGlyph } from '@/components/domain/status-glyphs'
import { Button } from '@/components/ui/button'
import { POLICY_IMPACT } from '@/data/policy-impact'
import { policyImpact } from '@/state'
import type { ScreenId } from '@/state'
import { act } from './contract'
import type { ProductProps } from './contract'
import { playbookAccess, refusal } from './discovery'
import { factoryAccess } from './factory'
import { simulatorAccess } from './simulator'
import { anchored, at } from './geometry'
import { policyAccess } from './policy'
import { POLICY_ANCHORS, POLICY_ANCHOR_RECTS as R } from './policy-layout'
import { HiddenAnchors } from './settings-frame'

export function PolicyScreen(props: ProductProps) {
  const { state } = props
  const access = policyAccess(state)
  if (!access.ok) return <><p role="status" className="type-body rounded-lg border bg-surface-2 p-4" style={at({ x: 264, y: 176, width: 992, height: 88 })}>Not available: {access.reason}</p><HiddenAnchors names={POLICY_ANCHORS} /></>
  const impact = policyImpact(state)
  const rows = [
    { anchor: 'impact-playbook', label: `${impact?.playbooks ?? 0} playbook`, screen: 'SC15' },
    { anchor: 'impact-agent', label: `${impact?.agents ?? 0} agent`, screen: 'SC17' },
    { anchor: 'impact-tests', label: `${impact?.tests ?? 0} tests`, screen: 'SC20' },
  ] as const satisfies readonly { anchor: 'impact-playbook' | 'impact-agent' | 'impact-tests'; label: string; screen: ScreenId }[]
  return <>
    <h1 className="type-title m-0" style={at({ x: 264, y: 112, width: 700, height: 40 })}>Policy change</h1>
    <section {...anchored('policy-diff', R['policy-diff'])} className="box-border rounded-lg border bg-surface p-6">
      <h2 className="type-section m-0">{POLICY_IMPACT.title}</h2>
      <div className="mt-3 flex items-center gap-8 type-data"><span>{POLICY_IMPACT.ruleId}</span><span><span className="text-muted-foreground">Before </span><span className="text-base">{POLICY_IMPACT.previousThreshold}</span></span><span aria-hidden="true">→</span><span><span className="text-muted-foreground">After </span><span className="text-base">{POLICY_IMPACT.newThreshold}</span></span><span className="sr-only">{POLICY_IMPACT.previousThreshold} → {POLICY_IMPACT.newThreshold}</span></div>
    </section>
    <p {...anchored('policy-effective', R['policy-effective'])} className="type-data m-0">effective {POLICY_IMPACT.effective}</p>
    <section {...anchored('policy-impact', R['policy-impact'])} className="box-border rounded-lg border bg-surface p-4"><h2 className="type-card m-0">{impact ? 'Affected dependencies' : 'Authorized change recorded'}</h2></section>
    {rows.map((row, index) => {
      const targetAccess = row.screen === 'SC15' ? playbookAccess(state) : row.screen === 'SC17' ? factoryAccess(state) : simulatorAccess(state)
      const reason = !targetAccess.ok ? targetAccess.reason : refusal(state, { type: 'OPEN_SCREEN', screen: row.screen })
      return <Button key={row.anchor} {...anchored(row.anchor, R[row.anchor], impact !== null)} variant="outline" className="justify-between transition-none" disabled={!!reason} disabledReason={reason ?? undefined} onClick={() => act(props, { type: 'OPEN_SCREEN', screen: row.screen })}><span className="flex items-center gap-2"><StatusGlyph status="revalidation" /> {row.label} · {POLICY_IMPACT.dependencies[index]?.id}</span><span>{POLICY_IMPACT.status}</span></Button>
    })}
    {!playbookAccess(state).ok && !state.ui.breadth.policy.tests && <p className="type-micro text-muted-foreground" style={at({ x: 840, y: 320, width: 392, height: 72 })}>Affected asset details are available to the Workflow Owner.</p>}
    <section {...anchored('boundary-tests', R['boundary-tests'], state.ui.breadth.policy.tests)} className="box-border rounded-lg border bg-surface p-4"><h2 className="type-card m-0">Proposed boundary tests</h2>{POLICY_IMPACT.boundaryTests.map((item) => <p className="type-data" key={item.position}>{item.position} {item.threshold} · {item.status}</p>)}</section>
    <p className="type-data" style={at({ x: 280, y: 540, width: 660, height: 70 })}>Release blocked until {POLICY_IMPACT.releaseRequires.join(' and ')}.<br />Prior policy continues only with an explicit bounded grant.</p>
    <Button {...anchored('review-boundary-tests', R['review-boundary-tests'])} variant="outline" className="transition-none" onClick={() => act(props, { type: 'SET_POLICY_VIEW', tests: true })}>Review boundary tests</Button>
  </>
}
