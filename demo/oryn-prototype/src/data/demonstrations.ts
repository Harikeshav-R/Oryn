import type { PersonId, SupplierId } from './people'

export interface Demonstration {
  id: 'D1' | 'D2' | 'D3'
  contributorId: PersonId
  time: string
  invoice: string
  supplierId: SupplierId
}

/** References identify observed examples; consent and review remain independent decisions. */
export const DEMONSTRATIONS: readonly Demonstration[] = [
  { id: 'D1', contributorId: 'priya', time: 'Mon 09:14', invoice: 'INV-48203', supplierId: 'brightwater' },
  { id: 'D2', contributorId: 'priya', time: 'Mon 10:02', invoice: 'INV-48204', supplierId: 'copperline' },
  { id: 'D3', contributorId: 'jamal', time: 'Tue 13:40', invoice: 'INV-48207', supplierId: 'harlow' },
]
