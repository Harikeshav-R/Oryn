import { Check, Circle, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { REGRESSION_CASES, REGRESSION_PASS_RESULTS, type RegressionResult } from '@/data/regression'
import { cn } from '@/lib/utils'

const CASE_SUMMARIES: Record<(typeof REGRESSION_CASES)[number]['id'], string> = {
  'SCN-029': 'Subtotal + handling; PO covers fee',
  'SCN-030': 'Handling after subtotal; spacing differs',
  'SCN-031': 'Handling before total; permitted terms',
  'SCN-032': 'Zero handling; permitted terms',
  'SCN-033': 'Handling label capitalization differs',
  'SCN-034': 'Separating rule above total',
}

export type RegressionPhase = 'not-run' | 'running' | 'partial' | 'complete'

export interface RegressionListProps {
  phase?: RegressionPhase
  results?: readonly RegressionResult[]
  /** Current film frame and the explicit start frame determine running progress. */
  frame?: number
  startFrame?: number
  durationFrames?: number
  onRun?: () => void
  onRequestRelease?: () => void
  onOpenEvidence?: (scenarioId: string) => void
  film?: boolean
  className?: string
}

export function RegressionList({ phase = 'not-run', results = [], frame = 0, startFrame = 0, durationFrames = 90, onRun, onRequestRelease, onOpenEvidence, film = false, className }: RegressionListProps) {
  const expected = REGRESSION_PASS_RESULTS
  const resultsById = new Map<string, RegressionResult[]>()
  for (const result of results) {
    const matches = resultsById.get(result.id)
    if (matches) matches.push(result)
    else resultsById.set(result.id, [result])
  }
  const verdictFor = (id: string) => {
    const matches = resultsById.get(id)
    return matches?.length === 1 ? matches[0]?.verdict : undefined
  }
  const counts = expected.reduce((total, item) => {
    const verdict = verdictFor(item.id)
    if (verdict) total[verdict] += 1
    return total
  }, { passed: 0, safeEscalation: 0, failed: 0 })
  const completed = counts.passed + counts.safeEscalation + counts.failed
  const invalid = results.length - completed
  const allExpected = phase === 'complete' && expected.length === 34 && new Set(expected.map((item) => item.id)).size === 34 && invalid === 0 && expected.every((item) => verdictFor(item.id) === item.verdict)
  const progress = phase === 'running' ? Math.max(0, Math.min(1, (frame - startFrame) / Math.max(1, durationFrames))) : completed / expected.length
  const reason = phase !== 'complete' ? 'Complete all 34 scenarios before requesting release.' : invalid > 0 ? 'Remove unknown or duplicate results before requesting release.' : !allExpected ? 'Every outcome must meet its expected result before requesting release.' : !onRequestRelease ? 'Release action unavailable.' : undefined

  return (
    <section data-anchor="regression-list" data-phase={phase} aria-label="Regression suite SIM-AP-RECON-34" className={cn('w-full max-w-[464px] rounded border border-[#444] bg-[#171717] text-white', className)}>
      <header className="border-b border-[#444] px-3 py-1">
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Regression suite</h3><span className="type-data">{phase === 'not-run' ? 'Not Run' : phase === 'running' ? 'Running' : phase === 'partial' ? 'Incomplete' : allExpected ? 'Complete' : 'Failed'}</span></div>
        <p className="type-data text-[#c5c5c5]">SIM-AP-RECON-34 · 34 scenarios · 6 new regression cases</p>
      </header>
      <div role="progressbar" aria-label="Regression execution progress" aria-valuemin={0} aria-valuemax={34} aria-valuenow={Math.floor(progress * 34)} className="h-1 bg-[#444]"><div className={cn('h-full origin-left', phase === 'running' ? 'bg-[#2FD8FF]' : 'bg-[#aaa]')} style={{ transform: `scaleX(${progress})` }} /></div>
      <ul className="divide-y divide-[#444]">
        {REGRESSION_CASES.map((item) => {
          const verdict = verdictFor(item.id)
          const Icon = verdict === 'passed' ? Check : verdict === 'safeEscalation' ? ShieldAlert : verdict === 'failed' ? X : Circle
          const label = verdict === 'passed' ? 'Passed' : verdict === 'safeEscalation' ? 'Passed — Expected Safe Escalation' : verdict === 'failed' ? 'Failed' : (resultsById.get(item.id)?.length ?? 0) > 1 ? 'Duplicate results' : 'Not Run'
          return <li key={item.id} className="flex h-10 items-center gap-2 px-3"><Icon aria-hidden="true" className="size-4 shrink-0" /><div className={cn('min-w-0 flex-1 truncate', !film && 'transition-opacity duration-150 motion-reduce:transition-none')} title={item.description}><span className="type-data">{item.id}</span><span aria-hidden="true" className="ml-2 text-xs">{CASE_SUMMARIES[item.id]}</span><span className="sr-only"> — {item.description} — {label}</span></div>{onOpenEvidence && <button type="button" onClick={() => onOpenEvidence(item.id)} className="shrink-0 text-xs underline underline-offset-2" aria-label={`Open evidence for ${item.id}`}>Evidence</button>}</li>
        })}
      </ul>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#444] px-3 py-1"><p className="type-data min-w-0 flex-1">{counts.passed} Passed · {counts.safeEscalation} Passed — Expected Safe Escalation · {counts.failed} Failed{invalid > 0 && ` · ${invalid} Invalid result${invalid === 1 ? '' : 's'} (unknown or duplicate)`}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={phase === 'running' || !onRun} disabledReason={phase === 'running' ? 'Regression is running.' : 'Run action unavailable.'} onClick={onRun}>Run regression</Button><Button size="sm" disabled={!allExpected || !onRequestRelease} disabledReason={reason} onClick={onRequestRelease}>Request release</Button></div></footer>
    </section>
  )
}
