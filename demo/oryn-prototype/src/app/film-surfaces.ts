import { ProductFilmSurface } from '@/product/FilmProduct'
import { RuntimeCheckSurface, type FilmSurface } from './FilmSurfaces'

/**
 * Capturable surfaces by `<cut>/<clip-id>`. A product clip registers its surface here when the
 * screen it films is built; the capture script reports an unregistered clip instead of filming
 * a stand-in.
 */
export const FILM_SURFACES: Readonly<Record<string, FilmSurface>> = {
  'sample/runtime-check': RuntimeCheckSurface,
  'hackathon/hk-h2-problem': ProductFilmSurface,
  'hackathon/hk-h4a-enroll': ProductFilmSurface,
  'hackathon/hk-h4b-observe': ProductFilmSurface,
  'hackathon/hk-h4c-playbook': ProductFilmSurface,
  'hackathon/hk-h4d-agent': ProductFilmSurface,
  'hackathon/hk-h4e-simulate': ProductFilmSurface,
  'hackathon/hk-h4f-job': ProductFilmSurface,
  'hackathon/hk-h4g-heal': ProductFilmSurface,
  'hackathon/hk-h4h-breadth': ProductFilmSurface,
  'launch/lk-l2-chaos': ProductFilmSurface,
  'launch/lk-l4-privacy': ProductFilmSurface,
  'launch/lk-l5-observe': ProductFilmSurface,
  'launch/lk-l6-discover': ProductFilmSurface,
  'launch/lk-l7-create': ProductFilmSurface,
  'launch/lk-l8-simulate': ProductFilmSurface,
  'launch/lk-l9-run': ProductFilmSurface,
  'launch/lk-l10-heal': ProductFilmSurface,
  'launch/lk-l11-breadth': ProductFilmSurface,
  'sample/shell-tour': ProductFilmSurface,
}
