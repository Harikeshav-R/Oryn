export const ARDENT_SOURCE = {
  citation: 'Ardent Partners · Payables Place · 2026',
  url: 'https://payablesplace.ardentpartners.com/2026/10/this-webinar-reveals-the-numbers-behind-smarter-faster-ap/',
  year: 2026,
  costPerInvoice: '$9.90 / invoice',
  processingTime: '11.6 days',
  description: 'Average processing cost and time per invoice',
} as const

export const MCKINSEY_SOURCE = {
  citation: 'McKinsey Global Institute, 2012',
  year: 2012,
  finding: "about 19% of interaction workers' workweek spent searching for and gathering information",
} as const

/** Omit this forecast from published material until its primary source is verified. */
export const GARTNER_SOURCE = {
  citation: 'Gartner, 2025',
  year: 2025,
  finding: 'over 40% of agentic AI projects forecast canceled by end of 2027',
  publicationStatus: 'requires-primary-source-verification',
} as const
