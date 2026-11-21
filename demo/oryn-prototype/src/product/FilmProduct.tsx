import type { FilmSurface } from '@/app/FilmSurfaces'
import { sceneAnchors } from './anchors'
import { filmAnchor, filmContextOf } from './contract'
import { ContainmentWipe } from './ContainmentWipe'

/**
 * The product, filmed. Same `ProductScreen` the clickable app renders, with no `dispatch` (a film
 * click does nothing) and a `film` context. The camera moves the world, never the pointer overlay.
 * A timeline anchor that belongs to a screen other than the current one gets a hidden stand-in, so
 * the capture finds an element on every frame and the sidecar reports it hidden.
 */
export const ProductFilmSurface: FilmSurface = ({ resolved }) => {
  const { camera } = resolved.view
  const present = new Set(sceneAnchors(resolved.state))
  const absent = Object.keys(resolved.view.anchors).filter((name) => !present.has(name))
  const identity = camera.x === 640 && camera.y === 360 && camera.zoom === 1
  return (
    <>
      <div data-theme={resolved.state.theme} style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: identity ? undefined : `translate(${640 - camera.x * camera.zoom}px, ${360 - camera.y * camera.zoom}px) scale(${camera.zoom})` }}>
        <ContainmentWipe state={resolved.state} film={filmContextOf(resolved)} />
      </div>
      {absent.map((name) => (
        <div key={name} {...filmAnchor(name)} aria-hidden="true" style={{ display: 'none' }} />
      ))}
    </>
  )
}
