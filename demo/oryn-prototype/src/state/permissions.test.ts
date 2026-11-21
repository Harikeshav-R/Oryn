import { describe, expect, test } from 'bun:test'
import { APPROVAL_EXCEEDS_THRESHOLD, APPROVAL_INVOICE, APPROVER_AUTHORITY } from '@/data/approval'
import { APPROVAL_REQUIRED_LABEL, ROLES } from '@/data/labels'
import { PEOPLE, TIER3_REASON, type PersonId } from '@/data/people'
import {
  CANONICAL_SCRIPT,
  COPY,
  DEFAULT_GRANTS,
  STATE_IDS,
  accessibleEvidence,
  activeNotification,
  authorize,
  createInitialState,
  currentRole,
  exceedsThreshold,
  reconstruct,
  replayStrict,
  scriptTo,
  thresholdHundredths,
  visibleNotifications,
  type AuthRequest,
} from '@/state'
import { act, expectRejected, withGrant } from '@/state/test-helpers'

const APPROVE_VARIANCE: Omit<AuthRequest, 'actorId'> = { action: 'approve-variance', tier: 3, object: 'INV-48219', scope: 'AP East' }

describe('RT-02 exact labels', () => {
  test('role, authority and policy copy match the inventory byte for byte', () => {
    expect([...COPY.roles]).toEqual(['Employee', 'Workflow Owner', 'Approver', 'Admin'])
    expect(COPY.roles).toBe(ROLES)
    expect(COPY.approverAuthority).toBe('Daniel Okafor \u00b7 Tier 3')
    expect(COPY.approverAuthority).toBe(APPROVER_AUTHORITY)
    expect(COPY.tier3Required).toBe('Requires Tier 3 approval - Daniel Okafor')
    expect(COPY.tier3Required).toBe(APPROVAL_REQUIRED_LABEL)
    expect(COPY.tier3Required).toBe(TIER3_REASON)
    expect(COPY.correctionIsEvidence).toBe('Correction is evidence, not new policy')
    expect(COPY.resubmissionUnavailable).toBe('Resubmission unavailable')
  })

  test('the current role carries the person\u2019s role label; the authority label needs a valid delegation', () => {
    const state = createInitialState()
    expect(currentRole(state)).toMatchObject({ name: 'Priya Nair', role: 'Employee', authorityLabel: null })
    const daniel = act(state, { type: 'SELECT_ACTOR', personId: 'daniel' })
    expect(currentRole(daniel)).toMatchObject({ name: 'Daniel Okafor', role: 'Approver', authorityLabel: 'Daniel Okafor \u00b7 Tier 3' })
    const expired = { ...daniel, authority: { grants: withGrant('delegation-daniel-tier3', { status: 'expired' }) } }
    expect(currentRole(expired).authorityLabel).toBeNull()
    expect(currentRole(act(state, { type: 'SELECT_ACTOR', personId: 'tomas' }))).toMatchObject({ role: 'Admin', authorityLabel: null })
    expect(currentRole(act(state, { type: 'SELECT_ACTOR', personId: 'marcus' })).role).toBe('Workflow Owner')
    expect(currentRole(act(state, { type: 'SELECT_ACTOR', personId: 'elena' })).role).toBe('SME')
  })
})

describe('RT-02 authority', () => {
  const state = createInitialState()

  test('Daniel\u2019s delegation covers exactly one invoice, scope, tier and policy', () => {
    expect(authorize(state, { actorId: 'daniel', ...APPROVE_VARIANCE })).toEqual({ allowed: true, grantId: 'delegation-daniel-tier3' })
    const cases: [string, Partial<AuthRequest>, string][] = [
      ['object', { object: 'INV-48220' }, 'object'],
      ['scope', { scope: 'AP West' }, 'scope'],
      ['tier', { tier: 3 }, 'tier'],
    ]
    for (const [label, patch, guard] of cases) {
      const grants = label === 'tier' ? withGrant('delegation-daniel-tier3', { maxTier: 2 }) : DEFAULT_GRANTS
      const decision = authorize({ ...state, authority: { grants } }, { actorId: 'daniel', ...APPROVE_VARIANCE, ...patch })
      expect(decision.allowed).toBe(false)
      if (!decision.allowed) {
        expect(decision.guard).toBe(guard as 'object' | 'scope' | 'tier')
        expect(decision.reason.startsWith(TIER3_REASON)).toBe(true)
      }
    }
  })

  test('a delegation that is expired, revoked or issued under another threshold does not authorize', () => {
    for (const status of ['expired', 'revoked'] as const) {
      const decision = authorize({ ...state, authority: { grants: withGrant('delegation-daniel-tier3', { status }) } }, { actorId: 'daniel', ...APPROVE_VARIANCE })
      expect(decision).toMatchObject({ allowed: false, guard: 'status' })
    }
    const stale = authorize({ ...state, policy: { ...state.policy, threshold: '1.50%' } }, { actorId: 'daniel', ...APPROVE_VARIANCE })
    expect(stale).toMatchObject({ allowed: false, guard: 'policy' })
    if (!stale.allowed) expect(stale.reason).toContain('2.00% threshold; current policy is 1.50%')
  })

  test('an Admin who is not a finance approver cannot approve, and the reason says so', () => {
    const decision = authorize(state, { actorId: 'tomas', ...APPROVE_VARIANCE })
    expect(decision).toMatchObject({ allowed: false, guard: 'grant' })
    if (!decision.allowed) {
      expect(decision.reason).toContain(TIER3_REASON)
      expect(decision.reason).toContain('Tomas Reyes (Admin) holds no finance approval grant')
    }
    const atApproval = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'tomas' })
    const rejection = expectRejected(atApproval, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority')
    expect(rejection.reason).toContain('holds no finance approval grant')
    expect(atApproval.job.outcomes['INV-48219']).toBe('approval')
  })

  test('the external supplier representative has no internal authority and no viewpoint', () => {
    expect(authorize(state, { actorId: 'dana', ...APPROVE_VARIANCE })).toMatchObject({ allowed: false, guard: 'external' })
    expect(authorize(state, { actorId: 'dana', action: 'export-audit', tier: 0, object: 'audit-pack', scope: 'AP East' })).toMatchObject({ allowed: false, guard: 'external' })
    expectRejected(state, { type: 'SELECT_ACTOR', personId: 'dana' }, 'actor')
    expect(PEOPLE.find((person) => person.id === 'dana')?.role).toBeNull()
  })

  test('every person other than Daniel is refused Tier 3, whatever role is selected', () => {
    const atApproval = reconstruct('ST11')
    for (const personId of ['priya', 'jamal', 'marcus', 'elena', 'tomas'] as const) {
      const selected = act(atApproval, { type: 'SELECT_ACTOR', personId })
      expectRejected(selected, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority')
      expectRejected(selected, { type: 'REJECT', invoice: 'INV-48219' }, 'authority')
      expectRejected(selected, { type: 'REQUEST_CHANGES', invoice: 'INV-48219' }, 'authority')
    }
  })

  test('wrong-scope, expired and stale Daniel delegations are refused in the reducer with their own reason', () => {
    const atApproval = (grants: typeof DEFAULT_GRANTS, threshold?: string) =>
      act(replayStrict(scriptTo('ST11'), { grants, threshold }), { type: 'SELECT_ACTOR', personId: 'daniel' })
    const wrongScope = atApproval(withGrant('delegation-daniel-tier3', { scope: 'AP West' }))
    expect(expectRejected(wrongScope, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority').reason).toContain('covers AP West, not AP East')
    const wrongObject = atApproval(withGrant('delegation-daniel-tier3', { object: 'INV-48210' }))
    expect(expectRejected(wrongObject, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority').reason).toContain('covers INV-48210, not INV-48219')
    const expired = atApproval(withGrant('delegation-daniel-tier3', { status: 'expired' }))
    expect(expectRejected(expired, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority').reason).toContain('has expired')
    const stale = atApproval(DEFAULT_GRANTS, '1.50%')
    expect(expectRejected(stale, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority').reason).toContain('issued under a 2.00% threshold; current policy is 1.50%')
    // A rejected delegation changes nothing: the case still waits for approval.
    expect(wrongScope.approval.decision).toBe('pending')
  })

  test('selecting a viewpoint never creates, widens or copies a delegation', () => {
    const atApproval = reconstruct('ST11')
    let state = atApproval
    for (const personId of ['priya', 'tomas', 'marcus', 'elena', 'jamal', 'daniel', 'tomas'] as PersonId[]) {
      state = act(state, { type: 'SELECT_ACTOR', personId })
      expect(state.authority).toBe(atApproval.authority)
      expect(state.authority.grants).toHaveLength(DEFAULT_GRANTS.length)
      expect(state.authority.grants.filter((grant) => grant.action === 'approve-variance')).toHaveLength(1)
    }
    expect(state.actorId).toBe('tomas')
    expectRejected(state, { type: 'APPROVE', invoice: 'INV-48219' }, 'authority')
  })

  test('one grant is not blanket approval: the job grant and the variance delegation do not cross over', () => {
    const grants = (action: string) => DEFAULT_GRANTS.filter((grant) => grant.action === action).map((grant) => grant.holderId)
    expect(grants('approve-variance')).toEqual(['daniel'])
    expect(grants('start-job')).toEqual(['marcus'])
    expect(grants('apply-discount')).toEqual([])
    const blocked = authorize(state, { actorId: 'daniel', action: 'apply-discount', tier: 3, object: 'discount-12pct', scope: 'AP East' })
    expect(blocked).toMatchObject({ allowed: false, guard: 'grant' })
    if (!blocked.allowed) expect(blocked.reason).toContain(TIER3_REASON)
  })
})

describe('exact variance comparison', () => {
  test('2.00% is compared in integer cents: equality auto-accepts, one cent over needs approval', () => {
    expect(thresholdHundredths('2.00%')).toBe(200)
    expect(exceedsThreshold(102_000, 100_000, 200)).toBe(false)
    expect(exceedsThreshold(102_001, 100_000, 200)).toBe(true)
    expect(exceedsThreshold(101_999, 100_000, 200)).toBe(false)
    // Negative variance within the threshold is accepted; beyond it is not.
    expect(exceedsThreshold(98_000, 100_000, 200)).toBe(false)
    expect(exceedsThreshold(97_999, 100_000, 200)).toBe(true)
  })

  test('the approval fixture crosses the threshold at 2.45% and agrees with the data module', () => {
    expect(APPROVAL_INVOICE.poAmountCents).toBe(1_798_000)
    expect(exceedsThreshold(APPROVAL_INVOICE.amountCents, 1_798_000, 200)).toBe(true)
    expect(exceedsThreshold(APPROVAL_INVOICE.amountCents, 1_798_000, 200)).toBe(APPROVAL_EXCEEDS_THRESHOLD)
    // 1.50% (the later policy) is stricter still, never looser.
    expect(exceedsThreshold(APPROVAL_INVOICE.amountCents, 1_798_000, thresholdHundredths('1.50%'))).toBe(true)
  })

  test('only integer cents and a known positive PO are comparable', () => {
    expect(() => exceedsThreshold(100.5, 100, 200)).toThrow()
    expect(() => exceedsThreshold(100, 0, 200)).toThrow()
    expect(() => thresholdHundredths('2%')).toThrow()
  })

  test('an approval inside the threshold is refused as unnecessary, not granted', () => {
    const atApproval = act(reconstruct('ST11'), { type: 'SELECT_ACTOR', personId: 'daniel' })
    // 1842000 against a 1798000 PO is 2.45%; with a 3.00% policy the case needs no Tier 3 approval.
    const looser = { ...atApproval, policy: { ...atApproval.policy, threshold: '3.00%' }, authority: { grants: withGrant('delegation-daniel-tier3', { policyThreshold: '3.00%' }) } }
    const rejection = expectRejected(looser, { type: 'APPROVE', invoice: 'INV-48219' }, 'threshold')
    expect(rejection.reason).toContain('within the 3.00% threshold')
  })
})

describe('role-specific evidence', () => {
  const viewers: PersonId[] = ['priya', 'jamal', 'marcus', 'elena', 'daniel', 'tomas', 'dana']

  test('raw private capture is visible to its owner only, at every step of the run', () => {
    let state = createInitialState()
    const check = () => {
      for (const viewer of viewers) {
        for (const item of accessibleEvidence(state, viewer)) {
          if (item.kind === 'rawCapture' || item.kind === 'meetingCapture') expect(item.ownerId as string | null).toBe(viewer)
        }
      }
    }
    check()
    for (const action of CANONICAL_SCRIPT) {
      state = act(state, action)
      check()
    }
  })

  test('another employee, the owner and the Admin never see Priya\u2019s raw capture', () => {
    const state = reconstruct('ST04')
    expect(accessibleEvidence(state, 'priya').filter((item) => item.kind === 'rawCapture').map((item) => item.id)).toEqual(['raw-D1', 'raw-D2'])
    for (const viewer of ['jamal', 'marcus', 'elena', 'daniel', 'tomas', 'dana'] as PersonId[]) {
      expect(accessibleEvidence(state, viewer).filter((item) => item.kind === 'rawCapture' || item.kind === 'meetingCapture')).toEqual([])
    }
    // Selecting the Admin viewpoint changes nothing about what the Admin may see.
    const admin = act(state, { type: 'SELECT_ACTOR', personId: 'tomas' })
    expect(accessibleEvidence(admin)).toEqual([])
  })

  test('denied or paused consent means there is no capture to show, even to its owner', () => {
    const state = reconstruct('ST04')
    expect(accessibleEvidence(act(state, { type: 'PAUSE_OBSERVATION' }), 'priya').filter((item) => item.kind === 'rawCapture')).toEqual([])
    const declined = act(state, { type: 'DECLINE_NOTICE' })
    expect(accessibleEvidence(declined, 'priya').filter((item) => item.kind === 'rawCapture' || item.kind === 'meetingCapture')).toEqual([])
    const jamal = act(state, { type: 'SELECT_ACTOR', personId: 'jamal' })
    expect(accessibleEvidence(jamal, 'jamal')).toEqual([])
  })

  test('meeting capture exists only with per-meeting consent', () => {
    const observing = reconstruct('ST02')
    expect(accessibleEvidence(observing, 'priya').some((item) => item.kind === 'meetingCapture')).toBe(false)
    const granted = act(observing, { type: 'GRANT_MEETING_CONSENT', meetingId: 'zoom-kestrel' })
    expect(accessibleEvidence(granted, 'priya').some((item) => item.id === 'raw-zoom-kestrel')).toBe(true)
    expect(accessibleEvidence(granted, 'marcus').some((item) => item.id === 'raw-zoom-kestrel')).toBe(false)
  })

  test('sanitized and case evidence follow object access, and appear only once their step is reached', () => {
    const end = replayStrict(CANONICAL_SCRIPT)
    expect(accessibleEvidence(end, 'marcus').map((item) => item.id)).toEqual(expect.arrayContaining(['D1', 'D2', 'D3', 'INV-48219', 'E-0042-01']))
    expect(accessibleEvidence(end, 'tomas')).toEqual([])
    expect(accessibleEvidence(reconstruct('ST10'), 'daniel').some((item) => item.id === 'INV-48219')).toBe(false)
    expect(accessibleEvidence(reconstruct('ST11'), 'daniel').some((item) => item.id === 'INV-48219')).toBe(true)
    expect(accessibleEvidence(reconstruct('ST11'), 'elena')).toEqual([])
  })
})

describe('notifications follow lifecycle and recipient', () => {
  test('N-01 reaches Daniel only while the approval waits', () => {
    const waiting = reconstruct('ST11')
    expect(visibleNotifications(waiting, 'daniel')).toEqual(['N-01'])
    expect(visibleNotifications(waiting, 'marcus')).toEqual([])
    expect(visibleNotifications(waiting, 'tomas')).toEqual([])
    expect(visibleNotifications(reconstruct('ST10'), 'daniel')).toEqual([])
    const decided = act(waiting, { type: 'SELECT_ACTOR', personId: 'daniel' }, { type: 'APPROVE', invoice: 'INV-48219' })
    expect(visibleNotifications(decided, 'daniel')).toEqual([])
  })

  test('N-03 follows Priya\u2019s confirmation; Marcus gets N-02, N-04 and N-05 as each step is reached', () => {
    expect(visibleNotifications(reconstruct('ST03'), 'priya')).toEqual([])
    expect(visibleNotifications(reconstruct('ST04'), 'priya')).toEqual(['N-03'])
    expect(visibleNotifications(reconstruct('ST12'), 'marcus')).toEqual([])
    const contained = act(reconstruct('ST12'), { type: 'SELECT_ACTOR', personId: 'marcus' }, { type: 'CONTAIN_INCIDENT', caseIds: ['INV-48231', 'INV-48233', 'INV-48236'] })
    expect(visibleNotifications(contained, 'marcus')).toEqual(['N-02'])
    const repair = reconstruct('ST14')
    expect(visibleNotifications(repair, 'marcus')).toEqual(['N-02'])
    const tested = act(repair, { type: 'RUN_REGRESSION' }, { type: 'COMPLETE_REGRESSION', results: CANONICAL_SCRIPT.flatMap((action) => (action.type === 'COMPLETE_REGRESSION' ? [...action.results] : [])) })
    expect(visibleNotifications(tested, 'marcus')).toEqual(['N-02', 'N-04'])
    expect(visibleNotifications(reconstruct('ST15'), 'marcus')).toEqual(['N-02', 'N-04', 'N-05'])
  })

  test('dismissing changes the notice only, and only its recipient can dismiss it', () => {
    const state = reconstruct('ST15')
    expectRejected(act(state, { type: 'SELECT_ACTOR', personId: 'tomas' }), { type: 'DISMISS_NOTIFICATION', id: 'N-02' }, 'actor')
    expectRejected(state, { type: 'DISMISS_NOTIFICATION', id: 'N-03' }, 'actor')
    const marcus = act(state, { type: 'DISMISS_NOTIFICATION', id: 'N-02' })
    expect(visibleNotifications(marcus, 'marcus')).toEqual(['N-04', 'N-05'])
    expect({ ...marcus, notificationsDismissed: state.notificationsDismissed, step: state.step }).toEqual(state)
  })

  test('only one notice is the active toast, never a stack', () => {
    const state = reconstruct('ST15')
    expect(visibleNotifications(state, 'marcus')).toHaveLength(3)
    expect(activeNotification(state, 'marcus')).toBe('N-02')
    expect(activeNotification(state, 'tomas')).toBeUndefined()
  })
})

describe('the run keeps its own states reachable', () => {
  test('every state is reconstructable with the audit it should have', () => {
    const expectedAudit: Record<string, number> = { ST01: 0, ST02: 1, ST05: 3, ST10: 5, ST12: 7, ST13: 9, ST15: 12, ST16: 14 }
    for (const id of STATE_IDS) {
      const state = reconstruct(id)
      expect(state.phase).toBe(id)
      const wanted = expectedAudit[id]
      if (wanted !== undefined) expect(state.audit).toHaveLength(wanted)
    }
  })
})
