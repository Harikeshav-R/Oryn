import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { COMMITMENT, MEETING_QUOTES } from '@/data/commitment'
import { cn } from '@/lib/utils'

export interface TranscriptLineProps {
  speaker?: string | null
  timestamp?: string | null
  quote: string
  className?: string
}

export function TranscriptLine({ speaker, timestamp, quote, className }: TranscriptLineProps) {
  return (
    <div className={cn('border-b py-4 last:border-b-0', className)}>
      <div className="font-mono text-[11px] font-medium leading-4 text-muted-foreground">
        {speaker || 'Unknown speaker'} · {timestamp || 'Time unknown'}
      </div>
      <blockquote className="mt-2 font-serif text-[16px] leading-6 text-foreground">“{quote}”</blockquote>
    </div>
  )
}

export interface CommitmentProps {
  /** Consent applies to this meeting only. */
  meetingConsent: boolean
  /** Persist this value in the parent; editing never confirms the commitment. */
  due: string
  onDueChange: (due: string) => void
  confirmed: boolean
  onConfirm: () => void
  /** Set only when the current viewer is authorized to open this transcript. */
  onOpenSource?: () => void
  className?: string
}

export function Commitment({ meetingConsent, due, onDueChange, confirmed, onConfirm, onOpenSource, className }: CommitmentProps) {
  const deadlineId = useId()
  if (!meetingConsent) {
    return <div data-anchor="commitment" className={cn('rounded-lg border bg-surface p-5 text-sm', className)}>Meeting capture requires per-meeting opt-in.</div>
  }

  return (
    <section data-anchor="commitment" className={cn('w-full max-w-96 rounded-lg border bg-surface p-5 text-foreground', className)} aria-label="Meeting commitment">
      <p className="font-mono text-xs text-muted-foreground">{confirmed ? 'Confirmed commitment' : 'Suggested commitment'}</p>
      <h3 className="mt-2 text-base font-semibold">{COMMITMENT.title}</h3>
      <dl className="mt-5 space-y-4 text-sm">
        <div><dt className="text-muted-foreground">Owner</dt><dd>{COMMITMENT.owner}</dd></div>
        <div>
          <dt className="text-muted-foreground"><label htmlFor={deadlineId}>Due</label></dt>
          <dd>{confirmed ? <span id={deadlineId}>{due}</span> : <input id={deadlineId} className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" value={due} onChange={(event) => onDueChange(event.target.value)} />}</dd>
        </div>
        <div><dt className="text-muted-foreground">Qualifier</dt><dd>{COMMITMENT.qualifier}</dd></div>
        <div><dt className="text-muted-foreground">Source</dt><dd>{onOpenSource ? <button type="button" onClick={onOpenSource} className="font-mono text-xs underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{COMMITMENT.source}</button> : <span className="font-mono text-xs">{COMMITMENT.source}</span>}</dd></div>
      </dl>
      <p className="mt-5 text-xs text-muted-foreground">Confirmation does not establish company policy or another person's acceptance.</p>
      {!confirmed && <Button className="mt-4" disabled={!due.trim()} disabledReason="Enter a deadline before confirming." onClick={onConfirm}>Confirm</Button>}
    </section>
  )
}

export function MeetingTranscript({ meetingConsent, className }: { meetingConsent: boolean; className?: string }) {
  if (!meetingConsent) return <div data-anchor="transcript" className={cn('rounded-lg border bg-surface p-5 text-sm', className)}>Meeting capture requires per-meeting opt-in.</div>
  return (
    <section data-anchor="transcript" aria-label="Meeting transcript" className={cn('rounded-lg border bg-surface px-5', className)}>
      {MEETING_QUOTES.map((line) => <TranscriptLine key={line.speaker} {...line} />)}
    </section>
  )
}

export function CommitmentReminder({ confirmed, due, context }: { confirmed: boolean; due: string; context: string }) {
  if (!confirmed || context !== 'Kestrel') return null
  return <aside className="rounded-lg border bg-surface p-4 text-sm"><strong>{COMMITMENT.title}</strong><p className="mt-1">{COMMITMENT.owner} · {due} · {COMMITMENT.qualifier}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{COMMITMENT.source}</p></aside>
}
