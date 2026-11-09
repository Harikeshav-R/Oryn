# Oryn Domain Glossary

The core domain terminology and boundary definitions for the Oryn platform, establishing shared language across product and engineering.

## Language

**Desktop Shell**:
The employee-facing local host application that manages Oryn windows, persistent status presentation, and user controls on employee workstations.
_Avoid_: Client agent, desktop daemon, native wrapper

**HUD**:
The nonintrusive contextual guidance surface that displays active task steps, peer resolutions, and highlight cues directly alongside employee work.
_Avoid_: Overlay manager, tooltip engine, assistant popup

**Background Observation**:
The permitted, policy-compliant observation of approved work applications that continues while the main desktop shell window is dismissed or closed.
_Avoid_: Headless capture, silent recording, stealth monitoring

**My Privacy**:
The employee-facing trust center view that displays active capture settings, excluded applications, data retention schedules, consent history, and deletion controls.
_Avoid_: Privacy dashboard, telemetry settings, user audit log

**Observation Surface**:
A specific application window or document context that can be independently permitted or excluded from work observation.
_Avoid_: Capture target, watched window

**Observation Gap**:
A known interval or portion of permitted work for which reliable evidence is unavailable; missing actions remain unknown.
_Avoid_: Reconstructed activity, assumed step

**Observation Capability**:
The declared kinds and limits of work evidence available for a particular application and platform; it grants no authority to observe or execute.
_Avoid_: Automation support, blanket compatibility

**Browser Work Context**:
An approved business account and page context within a browser application that may independently qualify for observation or assistance.
_Avoid_: Allowed website, browser session

**Reserved Execution Tab**:
An employee-visible browser workspace temporarily reserved for one authorized automation, distinct from the employee's ordinary browsing.
_Avoid_: Hidden worker tab, background bot session
