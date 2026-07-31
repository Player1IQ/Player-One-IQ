# Post-launch checklist

Items to tackle after the initial **desktop web** launch. Keep the launch focused on core workflows, stability, and production readiness.

## App experience (Discord-style)

Goal: open Player One IQ in its own window with an app icon — not as a full browser tab.

### Phase 1 — PWA (fastest win)

- [ ] Add `manifest.webmanifest` with `display: "standalone"` (or `minimal-ui`)
- [ ] Add app icons (192, 512, maskable)
- [ ] Wire manifest in Next.js metadata / `app/layout.tsx`
- [ ] Add optional service worker (offline shell, faster repeat visits)
- [ ] Add in-app “Install Player One IQ” prompt for supported browsers
- [ ] Verify install flow on Chrome and Edge (Windows + macOS)
- [ ] Document install steps for creators in help/onboarding

**Outcome:** Users can install from the browser and launch from dock/taskbar.

### Phase 2 — Desktop wrapper (closest to Discord desktop)

- [ ] Choose shell: **Tauri** (lighter) or **Electron** (more common)
- [ ] Point wrapper at production URL (or bundle static assets if needed)
- [ ] Custom window: title bar, min size, remember window position
- [ ] App icon, dock/taskbar branding, auto-update strategy
- [ ] Deep links (`playeroneiq://`) for auth callbacks and notifications
- [ ] Code signing (Windows/macOS) for trustworthy installs
- [ ] Distribution: direct download and/or Microsoft Store / Mac App Store (desktop)

**Outcome:** Standalone desktop app without relying on “Install site” in the browser.

### Phase 3 — Mobile / store shells

- [ ] Evaluate **Capacitor** for iOS + Android (reuse existing web app)
- [ ] Native auth, push notifications, and store compliance review
- [ ] App Store + Play Store listing assets and review prep
- [ ] macOS App Store variant if separate from Phase 2 Tauri build

**Outcome:** Store-distributed apps that still share one web codebase.

---

## Platform and data (if not done before launch)

- [ ] Apply Supabase migration `068_creator_seasons.sql` in production (if not already applied)
- [ ] Confirm Creator Seasons XP events and tier progression in production
- [ ] Smoke-test role preview switcher only in non-production or allowlisted admin accounts

---

## Polish after core launch

- [ ] “+XP” or toast feedback when season points are awarded
- [ ] Keyboard shortcuts (e.g. global search `Cmd/Ctrl+K`)
- [ ] Performance pass on portal home (charts, coach, seasons on first load)
- [ ] E2E coverage for portal install-critical paths once PWA ships

---

## Notes

- **Launch scope:** desktop web in the browser first; native/PWA layers come after traction and stability.
- **Single codebase:** Phases 1–3 should wrap the same Next.js app — avoid a separate native UI rewrite unless requirements force it.
- **Reference:** Discord desktop is effectively a web app inside Electron; Player One IQ can follow the same pattern.
