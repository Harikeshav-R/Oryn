import { Lock, ShieldAlert } from 'lucide-react'
import { COPY } from '@/state'
import { act, motionProgress, type ProductProps } from '../contract'
import { refusal } from '../discovery'
import { appTabMeta } from '../desktop-data'
import { appAnchored, appAt } from './frame'
import { HUBSPOT_ANCHOR_RECTS as R } from './hubspot-layout'

/** Original, fixture-bound HubSpot context: requesting authority never submits the draft. */
export function HubSpotView(props: ProductProps) {
  const { state, film } = props
  const reason = refusal(state, { type: 'REQUEST_APPROVAL' })
  const requested = state.unsafeRequest === 'requested'
  const denied = state.unsafeRequest === 'denied'
  const progress = film?.reducedMotion ? 1 : motionProgress(film, 'REQUEST_APPROVAL')
  const control = 'box-border rounded-md border bg-surface px-3 type-data text-foreground focus-visible:outline focus-visible:outline-2 aria-disabled:opacity-60'
  return (
    <div data-app="hubspot" className="absolute inset-0 overflow-hidden bg-background text-foreground">
      <header className="box-border flex items-center gap-3 border-b bg-surface px-4" style={appAt({ x: 0, y: 76, width: 1280, height: 56 })}>
        <img src={appTabMeta('hubspot').mark} alt="" width={16} height={16} />
        <span className="type-body font-medium">HubSpot</span>
        <span className="type-micro text-muted-foreground">crm.example</span>
      </header>
      <nav aria-label="HubSpot sections" className="box-border border-r bg-surface p-5" style={appAt({ x: 0, y: 132, width: 220, height: 514 })}>
        <span className="type-body font-medium">Deal</span>
        <div className="mt-6 h-2 w-28 rounded-sm bg-surface-2" />
      </nav>
      <section aria-label="Deal" className="box-border rounded-lg border bg-surface p-5" style={appAt({ x: 240, y: 152, width: 720, height: 410 })}>
        <h1 className="type-section m-0">Deal</h1>
        <div aria-hidden="true" className="mt-4 h-2 w-40 rounded-sm bg-surface-2" />
      </section>
      <div {...appAnchored('discount-draft', R['discount-draft'])} className="type-body">
        <span>Discount draft</span>
      </div>
      <input {...appAnchored('discount-field', R['discount-field'])} aria-label="Discount draft" value="12% discount" readOnly className="box-border rounded-md border bg-surface px-3 font-mono text-[16px]" />
      <section {...appAnchored('blocked-action', R['blocked-action'])} aria-label="Action blocked" className="box-border rounded-lg border bg-surface p-5 shadow-md" style={{ ...appAnchored('blocked-action', R['blocked-action']).style, zIndex: 20 }}>
        <div style={{ opacity: progress }}>
          <div className="flex items-center gap-2"><ShieldAlert aria-hidden="true" className="size-5 text-warning" /><strong className="type-body">Action blocked until authorized</strong></div>
          <p tabIndex={0} className="type-body mt-3">{COPY.tier3Required}</p>
        </div>
      </section>
      <div {...appAnchored('approval-requested', R['approval-requested'], requested || denied)} className="type-body" style={{ ...appAnchored('approval-requested', R['approval-requested'], requested || denied).style, zIndex: 21, opacity: progress }}>
        {requested ? 'Approval requested · awaiting Daniel Okafor' : denied ? 'Approval denied' : ''}
      </div>
      <button {...appAnchored('blocked-submit', R['blocked-submit'])} type="button" aria-disabled="true" aria-describedby="hubspot-submit-reason" className={control} style={{ ...appAnchored('blocked-submit', R['blocked-submit']).style, zIndex: 21 }}>
        <Lock aria-hidden="true" className="mr-1 inline size-4" />Submit
      </button>
      <span id="hubspot-submit-reason" className="sr-only">{COPY.tier3Required}</span>
      <button {...appAnchored('request-approval', R['request-approval'])} type="button" aria-disabled={reason !== null || undefined} title={reason ?? undefined} onClick={() => { if (!reason) act(props, { type: 'REQUEST_APPROVAL' }) }} className={control} style={{ ...appAnchored('request-approval', R['request-approval']).style, zIndex: 21 }}>Request approval</button>
      <button {...appAnchored('deny-request', R['deny-request'], state.actorId === 'daniel' && requested)} type="button" onClick={() => act(props, { type: 'DENY_UNSAFE_REQUEST' })} className={control} style={{ ...appAnchored('deny-request', R['deny-request'], state.actorId === 'daniel' && requested).style, zIndex: 21 }}>Deny request</button>
    </div>
  )
}
