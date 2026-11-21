/** Why a capture stopped. `code` is stable for tests; `message` names the exact input and the fix. */
export type CaptureErrorCode =
  | 'usage'
  | 'unknown-cut'
  | 'unknown-clip'
  | 'timeline-missing'
  | 'timeline-malformed'
  | 'timeline-invalid'
  | 'contract'
  | 'font-missing'
  | 'font-unavailable'
  | 'asset-missing'
  | 'asset-undecodable'
  | 'surface-missing'
  | 'anchor-missing'
  | 'anchor-mismatch'
  | 'cursor-mismatch'
  | 'network'
  | 'tool-missing'
  | 'browser'
  | 'screenshot'
  | 'encode'
  | 'verify'
  | 'seek-mismatch'

export class CaptureError extends Error {
  readonly code: CaptureErrorCode

  constructor(code: CaptureErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CaptureError'
    this.code = code
  }
}
