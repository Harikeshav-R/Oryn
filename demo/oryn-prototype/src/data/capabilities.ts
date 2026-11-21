/** DAT-12 describes adapter capabilities, not a user's authorization to use them. */
export const CAPABILITY_COLUMNS = ['Observe', 'Guide', 'Assist', 'Run Supervised', 'Run Autonomously'] as const
export type Capability = (typeof CAPABILITY_COLUMNS)[number]
export type CapabilityAvailability = 'available' | 'unavailable' | 'per-meeting-opt-in'
export type CapabilityApplication = 'Gmail' | 'NetSuite' | 'Google Sheets' | 'Slack' | 'Zoom' | 'HubSpot' | 'Chrome'

export interface CapabilityRow {
  application: CapabilityApplication
  capabilities: Record<Capability, CapabilityAvailability>
}

export interface CapabilitySelection {
  application: CapabilityApplication
  capability: Capability
}

export const CAPABILITY_MATRIX: readonly CapabilityRow[] = [
  { application: 'Gmail', capabilities: { Observe: 'available', Guide: 'available', Assist: 'available', 'Run Supervised': 'unavailable', 'Run Autonomously': 'unavailable' } },
  { application: 'NetSuite', capabilities: { Observe: 'available', Guide: 'available', Assist: 'unavailable', 'Run Supervised': 'available', 'Run Autonomously': 'unavailable' } },
  { application: 'Google Sheets', capabilities: { Observe: 'available', Guide: 'available', Assist: 'unavailable', 'Run Supervised': 'available', 'Run Autonomously': 'unavailable' } },
  { application: 'Slack', capabilities: { Observe: 'available', Guide: 'available', Assist: 'unavailable', 'Run Supervised': 'unavailable', 'Run Autonomously': 'unavailable' } },
  { application: 'Zoom', capabilities: { Observe: 'per-meeting-opt-in', Guide: 'available', Assist: 'unavailable', 'Run Supervised': 'unavailable', 'Run Autonomously': 'unavailable' } },
  { application: 'HubSpot', capabilities: { Observe: 'available', Guide: 'available', Assist: 'available', 'Run Supervised': 'unavailable', 'Run Autonomously': 'unavailable' } },
  { application: 'Chrome', capabilities: { Observe: 'available', Guide: 'available', Assist: 'unavailable', 'Run Supervised': 'unavailable', 'Run Autonomously': 'unavailable' } },
]

/** These names are shown separately and carry no capability assertion. */
export const OTHER_APPLICATIONS = ['Salesforce', 'Outlook', 'Excel', 'Teams', 'Meet', 'Edge'] as const
