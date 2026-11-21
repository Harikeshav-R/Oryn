export const COMMITMENT = {
  id: 'kestrel-commitment',
  ownerId: 'priya',
  vendorId: 'kestrel',
  consent: 'per-meeting opt-in',
  title: 'Confirm Kestrel handling-fee terms in writing',
  owner: 'Priya Nair',
  source: 'Zoom 00:14:32',
  originalDue: 'Fri 17:00',
  confirmedDue: 'Fri 12:00',
  qualifier: 'subject to company approval',
} as const

export const MEETING_QUOTES = [
  { speaker: 'Dana', quote: "From the next cycle we're adding a handling line to every invoice." },
  { speaker: 'Priya', quote: "Send me the new layout; I'll confirm the terms in writing by Friday." },
] as const
