# Desktop Runtime and Presentation Architecture

**Status:** accepted  
**Date:** 2026-11-08  
**Deciders:** Core Engineering Team  

## Context
The Desktop Shell serves as the primary employee-facing host on Windows 11 and macOS workstations, exposing user enrollment, persistent capture visibility, personal work history, guidance overlays, and human-in-the-loop consequential action approvals. The runtime must satisfy stringent resource limits ($\le 250\text{ MiB}$ idle process tree memory, $\le 1\%$ idle CPU), guarantee that capture status is never concealed, and run with unprivileged user permissions.

Multiple architectural forces conflict: cross-platform UI development speed versus binary footprint and memory consumption; rich web-based interaction views versus the need for rock-solid native status indicators (system tray and movable capture badge); and inter-process communication between the UI host and local background helper daemons without introducing local port listening vulnerabilities or unauthorized socket connections.

## Decision
We adopt **Tauri 2** with a native **Rust core** and an isolated **React / TypeScript** frontend rendered in the OS native web view (WebKit on macOS, WebView2 on Windows). Status indicators and overlay highlights are implemented using native platform APIs (**AppKit** on macOS, **Win32** on Windows) rather than pure web overlays or private OS transparency hacks.

The local privacy gate, evidence store, and retention engine execute in a separate unprivileged child process (`oryn-privacy-helper`). Communication between the desktop shell host and the helper occurs exclusively over **private inherited byte channels** (`socketpair` on macOS/Unix, anonymous pipe pairs with explicit child handle allowlisting on Windows). Public named pipes, localhost TCP sockets, and discoverable Unix domain filesystem sockets are strictly prohibited.

*(Scope Amendment — 2026-11-09): [ADR-0004](0004-browser-bridge-and-execution-boundaries.md) establishes a narrowly scoped rendezvous exception for browser extension attachment: the desktop shell native core hosts an authenticated OS-local endpoint (`~/Library/Application Support/Oryn/run/browser-bridge.sock` on macOS; `\\.\pipe\Oryn.BrowserBridge.<user-SID>.<logon-LUID>` on Windows) accessible strictly to the browser-launched `oryn-browser-host` executable with verified UID, PID, and publisher signatures. Communication with `oryn-privacy-helper` continues exclusively over private inherited channels, with a third inherited channel (`shell-browser.v1`) allocated for browser source traffic.*

## Rationale and Alternatives
We evaluated three primary alternatives:
1. **Electron:** While offering unified multi-platform UI tooling, Electron's bundled Chromium instances consume 300–500 MiB idle memory, violating our resource budget. Furthermore, managing privilege boundaries within Chromium processes introduces unnecessary attack surface.
2. **Dual-Native (Swift/AppKit on macOS and C#/WinUI 3 on Windows):** This maximizes native UI fidelity but requires duplicating complex business workflows (Enrollment, Personal History, Contribution Review, My Privacy, Approval Dialogs) across two completely separate codebases.
3. **Localhost HTTP / Discoverable IPC:** Using local web servers or filesystem sockets creates risks of local port scanning, eavesdropping by other unprivileged processes, and race conditions during socket cleanup.

Tauri 2 delivers the optimal balance: memory-safe Rust for OS lifecycle, windowing, and IPC, paired with modern TypeScript for complex review dialogs, all within a small memory footprint. Public native window APIs (AppKit `NSPanel` / Win32 `CreateWindowExW`) guarantee non-focus-stealing, reliable status surfaces even if the web renderer encounters an exception. Inherited file descriptors ensure that only the explicitly launched, cryptographically verified child process can communicate over the capture control channel.

## Consequences
- The desktop shell host process owns native window lifecycles, tray menus, global keyboard shortcuts, and helper process supervision.
- Status surfaces (system tray, movable capture badge) and click-through highlights are maintained via native platform adapters; no webview exists inside the capture badge.
- React views run under strict Content Security Policies without access to raw filesystem APIs, child process execution, or central authentication secrets.
- Central authentication tokens remain in Rust memory and OS credential vaults; they are never passed into the web renderer.
- All local child daemons must implement length-prefixed framing over inherited standard stream descriptors.
