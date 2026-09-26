# Mindloom AI website-first tracking

## Current status

- **Website-first direction:** approved.
- **Native platform releases:** frozen until the web quality gate passes.
- **Existing mobile project:** healthy preview and TypeScript diagnostics; not yet the canonical account-based web architecture.
- **Current platform release status:** v0.1.x history is preserved; desktop/mobile workflows are not treated as production-ready.

## Milestones

- [x] Audit current Mindloom project and web foundation.
- [ ] Decide and scaffold the canonical full-stack website.
- [ ] Implement Mindloom-native email/password accounts and secure sessions.
- [ ] Add account-scoped notebooks, notes, tags, backlinks, and graph data.
- [ ] Build the NotebookLM-style desktop workspace and responsive mobile layout.
- [ ] Add managed AI actions with citations and provider/model health.
- [ ] Add secure BYOK provider connections after managed AI is stable.
- [ ] Add auth, data-isolation, note, graph, AI, and failure-mode tests.
- [ ] Pass clean production web export and desktop/tablet/phone visual review.
- [ ] Deploy the website and verify the public production URL.
- [ ] Resume desktop, Android, and iOS release work only after the website gate is green.

## Known blockers to resolve later

- The current project is Expo/mobile-first rather than a canonical web-db-user application.
- Native email/password auth is not yet implemented.
- Existing AI provider flows need account-scoped context, citations, health checks, and stronger error handling.
- Desktop packaging previously failed because the Electron lockfile requires pnpm 11.24.0 while the root workflow uses pnpm 9.12.0; this fix remains frozen with the platform release work.
- EAS mobile builds require the repository `EXPO_TOKEN` secret before they can run.
