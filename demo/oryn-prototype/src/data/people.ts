import type { Role } from './labels'

/**
 * DAT-01 (people and organization). Names, titles and roles are exact fixture strings.
 * `role` is the demo viewpoint, never an authorization: a role confers no authority.
 * Dana Whitfield is an external supplier representative and has no internal role.
 */
export type PersonId = 'priya' | 'jamal' | 'marcus' | 'elena' | 'daniel' | 'tomas' | 'dana'

export interface Person {
  id: string
  name: string
  title: string
  /** Internal role. `null` for the external supplier representative. */
  role: Role | 'SME' | null
  supplierId?: SupplierId
}

export const PEOPLE: readonly Person[] = [
  { id: 'priya', name: 'Priya Nair', title: 'AP Specialist', role: 'Employee' },
  { id: 'jamal', name: 'Jamal Carter', title: 'AP Specialist', role: 'Employee' },
  { id: 'marcus', name: 'Marcus Webb', title: 'AP Manager', role: 'Workflow Owner' },
  { id: 'elena', name: 'Elena Ruiz', title: 'Senior Accountant', role: 'SME' },
  { id: 'daniel', name: 'Daniel Okafor', title: 'Controller', role: 'Approver' },
  { id: 'tomas', name: 'Tomas Reyes', title: 'IT/Security Admin', role: 'Admin' },
  { id: 'dana', name: 'Dana Whitfield', title: 'Kestrel Components', role: null, supplierId: 'kestrel' },
]

export const ORGANIZATION = 'Calder & Vance Supply Co.'
export const ORGANIZATION_SELECTOR = 'Calder & Vance'
export const TEAM = 'AP East'

/** Stable supplier identities, in the order used throughout the demo. */
export const SUPPLIERS = [
  { id: 'brightwater', name: 'Brightwater Industrial' },
  { id: 'copperline', name: 'Copperline Cables' },
  { id: 'northgate', name: 'Northgate Pallets' },
  { id: 'orchard-lane', name: 'Orchard Lane Foods' },
  { id: 'harlow', name: 'Harlow Tooling' },
  { id: 'ironbark', name: 'Ironbark Fasteners' },
  { id: 'vantage', name: 'Vantage Print' },
  { id: 'meadowbrook', name: 'Meadowbrook Office' },
  { id: 'sable', name: 'Sable & Co. Logistics' },
  { id: 'kestrel', name: 'Kestrel Components' },
] as const

export type SupplierId = (typeof SUPPLIERS)[number]['id']

export function supplierName(id: SupplierId): string {
  const supplier = SUPPLIERS.find((item) => item.id === id)
  if (!supplier) throw new Error(`Unknown supplier fixture ${id}`)
  return supplier.name
}

/** Required reason when a Tier 3 decision is attempted without valid delegation (RT-02). */
export const TIER3_REASON = 'Requires Tier 3 approval - Daniel Okafor'

/** Initials for the avatar fallback: first letters of up to two words, ignoring "&". */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word))
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}
