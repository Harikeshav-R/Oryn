import type { State } from '@/state'
import type { FilmContext } from './contract'
import { CONTAINMENT_WIPE_FRAMES, preContainmentState, wipeEdge } from './incident'
import { ProductScreen } from './ProductScreen'

export function ContainmentWipe({ state, film }: { readonly state: State; readonly film?: FilmContext }) {
  const landing = film?.lastApplied('CONTAIN_INCIDENT')
  const index = landing == null || !film ? -1 : film.frame - landing
  if (!film || film.reducedMotion || state.route !== 'SC26' || index < 0 || index >= CONTAINMENT_WIPE_FRAMES) return <ProductScreen state={state} film={film} />
  const edge = wipeEdge(index)
  return <div data-containment-wipe style={{ position: 'relative', width: 1280, height: 720 }}>
    <div data-wipe-main data-theme="dark" style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${1280 - edge}px 0 0)` }}><ProductScreen state={state} film={film} /></div>
    <div data-wipe-underlay data-theme="light" aria-hidden="true" {...{ inert: '' }} style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${edge}px)`, pointerEvents: 'none' }}><ProductScreen state={preContainmentState(state)} film={film} /></div>
    <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: Math.max(0, edge - 12), width: 12, height: 720, background: '#0A0A0A', pointerEvents: 'none' }} />
  </div>
}
