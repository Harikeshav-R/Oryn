import type { ScreenId } from '@/state'
import { sceneOf } from './anchors'
import { CANVAS, SHELL } from './contract'
import type { ProductProps } from './contract'
import { CandidateReviewScreen } from './CandidateReviewScreen'
import { DesktopScreen } from './DesktopScreen'
import { DiscoveryScreen } from './DiscoveryScreen'
import { screenLabel } from './destinations'
import { EnrollmentScreen } from './EnrollmentScreen'
import { HomeScreen } from './HomeScreen'
import { IncidentScreen } from './IncidentScreen'
import { JobScreen } from './JobScreen'
import { JobSummaryScreen } from './JobSummaryScreen'
import { JobsScreen } from './JobsScreen'
import { FactoryScreen } from './FactoryScreen'
import { MeetingReviewScreen } from './MeetingReviewScreen'
import { PlaybookScreen } from './PlaybookScreen'
import { PrivacyScreen } from './PrivacyScreen'
import { ResultsScreen } from './ResultsScreen'
import { ScopeScreen } from './ScopeScreen'
import { SimulatorScreen } from './SimulatorScreen'
import { ReleaseScreen } from './ReleaseScreen'
import { RepairScreen } from './RepairScreen'
import { Shell } from './Shell'
import { TeachScreen } from './TeachScreen'
import { AuditScreen } from './AuditScreen'
import { CapabilitiesScreen } from './CapabilitiesScreen'
import { CommandScreen } from './CommandScreen'
import { MapScreen } from './MapScreen'
import { NotificationToast } from './NotificationToast'
import { NotificationsScreen } from './NotificationsScreen'
import { PolicyScreen } from './PolicyScreen'
import { VersionsScreen } from './VersionsScreen'

/**
 * One product canvas, 1280x720. The route (`state.route`) picks the screen; everything drawn is a
 * function of the reducer state, so the clickable app and the film capture agree by construction.
 */
function ScreenPending({ route }: { route: ScreenId }) {
  return (
    <div style={{ position: 'absolute', left: SHELL.content.x, top: SHELL.content.y, width: SHELL.content.width }}>
      <h1 className="type-title">{screenLabel(route)}</h1>
      <p className="mt-3 type-prose text-muted-foreground">{route} is not part of this build yet. Its route opens, but no content is drawn for it.</p>
    </div>
  )
}

export function ProductScreen(props: ProductProps) {
  const { state } = props
  const scene = sceneOf(state.route)
  return (
    <div data-product-screen={state.route} style={{ position: 'relative', width: CANVAS.width, height: CANVAS.height, overflow: 'hidden' }} className="bg-background text-foreground">
      {scene === 'enrollment' && <EnrollmentScreen {...props} />}
      {scene === 'desktop' && <DesktopScreen {...props} />}
      {scene === 'privacy' && (
        <Shell {...props}>
          <PrivacyScreen {...props} />
        </Shell>
      )}
      {scene === 'home' && (
        <Shell {...props}>
          <HomeScreen {...props} />
        </Shell>
      )}
      {scene === 'meeting-review' && (
        <Shell {...props}>
          <MeetingReviewScreen {...props} />
        </Shell>
      )}
      {scene === 'discovery' && (
        <Shell {...props}>
          <DiscoveryScreen {...props} />
        </Shell>
      )}
      {scene === 'candidate' && (
        <Shell {...props}>
          <CandidateReviewScreen {...props} />
        </Shell>
      )}
      {scene === 'playbook' && (
        <Shell {...props}>
          <PlaybookScreen {...props} />
        </Shell>
      )}
      {scene === 'factory' && (
        <Shell {...props}>
          <FactoryScreen {...props} />
        </Shell>
      )}
      {scene === 'scope' && (
        <Shell {...props}>
          <ScopeScreen {...props} />
        </Shell>
      )}
      {scene === 'simulator' && (
        <Shell {...props}>
          <SimulatorScreen {...props} />
        </Shell>
      )}
      {scene === 'results' && (
        <Shell {...props}>
          <ResultsScreen {...props} />
        </Shell>
      )}
      {scene === 'jobs' && (
        <Shell {...props}>
          <JobsScreen {...props} />
        </Shell>
      )}
      {scene === 'job' && (
        <Shell {...props}>
          <JobScreen {...props} />
        </Shell>
      )}
      {scene === 'job-summary' && (
        <Shell {...props}>
          <JobSummaryScreen {...props} />
        </Shell>
      )}
      {scene === 'incident' && (
        <Shell {...props}>
          <IncidentScreen {...props} />
        </Shell>
      )}
      {scene === 'teach' && (
        <Shell {...props}>
          <TeachScreen {...props} />
        </Shell>
      )}
      {scene === 'repair' && (
        <Shell {...props}>
          <RepairScreen {...props} />
        </Shell>
      )}
      {scene === 'release' && (
        <Shell {...props}>
          <ReleaseScreen {...props} />
        </Shell>
      )}
      {scene === 'map' && (
        <Shell {...props}>
          <MapScreen {...props} />
        </Shell>
      )}
      {scene === 'versions' && (
        <Shell {...props}>
          <VersionsScreen {...props} />
        </Shell>
      )}
      {scene === 'policy' && (
        <Shell {...props}>
          <PolicyScreen {...props} />
        </Shell>
      )}
      {scene === 'command' && (
        <Shell {...props}>
          <CommandScreen {...props} />
        </Shell>
      )}
      {scene === 'audit' && (
        <Shell {...props}>
          <AuditScreen {...props} />
        </Shell>
      )}
      {scene === 'notifications' && (
        <Shell {...props}>
          <NotificationsScreen {...props} />
        </Shell>
      )}
      {scene === 'capabilities' && (
        <Shell {...props}>
          <CapabilitiesScreen {...props} />
        </Shell>
      )}
      {scene === 'pending' && (
        <Shell {...props}>
          <ScreenPending route={state.route} />
        </Shell>
      )}
      {scene !== 'enrollment' && scene !== 'desktop' && <NotificationToast {...props} />}
      {state.rejection && (
        <p role="status" style={{ position: 'absolute', left: SHELL.content.x, top: 668, width: SHELL.content.width, height: 32 }} className="overflow-hidden type-micro text-muted-foreground">
          {state.rejection.reason}
        </p>
      )}
    </div>
  )
}
