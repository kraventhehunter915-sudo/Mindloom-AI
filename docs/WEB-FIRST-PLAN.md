# Mindloom AI — Website-First Product Plan

**Status:** Planning approved; mobile, desktop, and native release publishing remain frozen until the web quality gate passes.

**Primary product direction:** Mindloom becomes a private, account-based, AI-assisted knowledge workspace. The website is the canonical experience; Android, iOS, and desktop packages follow from the stable web foundation.

## 1. Current audit

The existing Mindloom project is a healthy Expo mobile application with:

- A working web preview and responsive shell.
- Local-first note persistence through browser/device storage.
- Notes, tags, backlinks, pinning, search, graph view, settings, and note-level AI actions.
- A server integration for managed AI actions.
- Existing release configuration for web, desktop, Android, and iOS.
- Passing TypeScript diagnostics and the current unit test suite.

It is **not yet sufficient as the canonical website** because:

- The data model is primarily local-first rather than account-scoped and synchronized.
- The existing auth conventions are based on the scaffold’s managed OAuth flow, not a Mindloom-native email/password account.
- The current web preview is visually functional but has too much unused space and clipping risk at desktop widths.
- The interface does not yet provide the NotebookLM-style source/context/AI workspace.
- Platform release workflows are not yet a reliable release gate.

## 2. Architecture decision

### Recommended: canonical full-stack web application

Create a dedicated full-stack web application for Mindloom using the database-backed WebDev web template. Keep the current Expo project and release workflows frozen as the mobile/desktop compatibility branch until the website is stable.

The website will own:

- Native Mindloom accounts.
- Account-scoped notes and notebooks.
- The desktop-first workspace.
- AI orchestration, provider health, model selection, and usage controls.
- The production web deployment.

The existing Expo app will later consume the same backend contracts or be rebuilt from the stabilized web behavior. This avoids forcing a mobile-first navigation model to carry a desktop knowledge-workspace product.

### Alternatives considered

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| **Dedicated full-stack web app — recommended** | Best desktop UX, clean email/password architecture, clear database ownership, easiest to test and deploy as a website. Requires later API sharing with mobile. | Moderate | Moderate |
| Extend the existing Expo project into the canonical website | Reuses current screens and branding, but mixes mobile navigation, local storage, and website account requirements. Higher risk of repeated layout/auth fixes. | Lower initially | High over time |
| Keep local-first web and add accounts later | Fastest visual demo, but weak synchronization, account isolation, and AI privacy foundation. Not suitable for a serious public product. | Low initially | High migration cost later |

## 3. Account and authentication plan

Mindloom will use a native account system with **email and password only**. No Google, Microsoft, Apple, or other social sign-in is required.

### Account behavior

- Normalize email addresses to lowercase and enforce one unique account per email.
- Hash passwords server-side using a strong Node-compatible password hash such as `crypto.scrypt` with a per-user salt.
- Never store plaintext passwords or provider API keys in the browser.
- Use opaque, random, revocable sessions in HttpOnly, Secure, SameSite cookies.
- Store only a hash of each session token in the database.
- Provide registration, login, logout, current-session lookup, and account deletion.
- Add password reset and email verification once the transactional email provider is configured.
- Rate-limit login, registration, reset, and AI endpoints.
- Return generic login errors so the UI does not reveal whether an email exists.

### Account-scoped data rule

Every note, notebook, tag, backlink, AI thread, and provider connection must be filtered by the authenticated user on the server. Client-side route guards are only a convenience; server authorization is mandatory.

### Proposed tables

- `users` — email, password hash, display name, timestamps, status.
- `sessions` — hashed session token, user ID, expiry, revocation timestamp.
- `email_verification_tokens` — one-time token hash and expiry.
- `password_reset_tokens` — one-time token hash and expiry.
- `notebooks` — user-owned notebook metadata.
- `notes` — notebook ID, title, content, status, pinned flag, timestamps.
- `note_links` — source note, target note, link label, unique constraint.
- `tags` and `note_tags` — normalized tag relationships.
- `ai_threads` and `ai_messages` — account-owned conversations and citations.
- `provider_connections` — provider, model, encrypted credential reference, health state.
- `usage_events` — model, action, duration, success/failure, and token metadata where available.

## 4. NotebookLM-style workspace

### Desktop layout

Use a four-zone workspace instead of the current sparse single-column presentation:

1. **Navigation rail** — Mindloom identity, notebooks, favorites, graph, search, settings, account menu.
2. **Source and note list** — current notebook, filters, tags, pinned notes, sort/search controls.
3. **Document canvas** — focused note editor with title, markdown-friendly content, backlinks, tags, autosave state, and source actions.
4. **AI workspace** — ask Mindloom, source chips/citations, suggested actions, conversation history, and model status.

The AI workspace can collapse into a right drawer on smaller desktop widths and become a dedicated sheet/tab on phones.

### Core interactions

- Create, rename, archive, pin, and delete notebooks.
- Create and edit notes with autosave and explicit save state.
- Link notes using `[[Note title]]` syntax and show backlinks.
- Search titles, content, tags, notebooks, and linked notes.
- Filter graph nodes by notebook, tag, or connection density.
- Click a graph node to open its note without losing workspace context.
- Ask AI about one note, a notebook, or selected source notes.
- Show citations that point back to note titles and relevant excerpts.
- Add keyboard shortcuts: `/` search, `N` new note, `Cmd/Ctrl+K` command menu, `Cmd/Ctrl+S` save, `Cmd/Ctrl+Enter` ask AI.

### Responsive behavior

- **Large desktop:** persistent navigation rail, note list, editor, and AI panel.
- **Tablet:** navigation rail collapses; note list and AI panel become resizable drawers.
- **Phone:** one primary surface at a time; navigation, editor, graph, and AI open as dedicated screens or sheets.
- Preserve touch targets, visible focus states, readable contrast, and reduced-motion support.

## 5. Visual and UX direction

The current Mindloom warm paper/forest language is a good foundation, but the next website pass should prioritize hierarchy and readability over decorative glass.

### Design principles

- Warm off-white or ink-dark canvas with a restrained emerald accent.
- Glass effects only on floating surfaces, command menus, and AI panels; never on long reading surfaces where contrast suffers.
- Strong typographic scale: compact navigation labels, clear notebook context, generous editor type.
- Soft shadows and subtle borders instead of heavy cards everywhere.
- Distinct selected, unsaved, syncing, offline, error, and AI-thinking states.
- Avoid large blank regions; use the available desktop width for source context and AI collaboration.
- Include skeleton states and meaningful empty states rather than placeholder metrics.

### Onboarding

1. Create a Mindloom account.
2. Create the first notebook.
3. Write or import the first note.
4. Link a second note.
5. Ask Mindloom a question and inspect the cited sources.

## 6. AI reliability plan

Mindloom will not claim that every provider or model is always available. It will expose a tested capability matrix and fail clearly when a provider is unavailable.

### Managed Mindloom AI

- Keep provider credentials server-side.
- Use the built-in server LLM integration for the initial managed experience.
- Define actions as typed server procedures: ask, summarize, rewrite, extract tasks, generate tags, find links, and create study material.
- Pass only the minimum account-authorized note context needed for each request.
- Return structured citations with note IDs, titles, and excerpt ranges.
- Stream responses where the server/runtime supports it; otherwise show a clear generating state.

### Bring Your Own Key

Support BYOK only after the managed path is stable:

- OpenAI-compatible providers.
- Anthropic.
- Google AI.
- Ollama or another explicitly configured compatible endpoint.

Keys must be encrypted at rest or stored through a server-side secret/credential mechanism. They must never be persisted in ordinary browser local storage or returned to the client after saving.

### Provider/model control plane

- Provider registry with model capability labels.
- Test-connection action in Settings.
- Health status and last successful check.
- Timeouts and bounded retries only for safe requests.
- Automatic fallback to a configured compatible model for read-only generation.
- Human-readable errors for invalid keys, quota limits, unsupported context, and outages.
- Usage event logging without storing note contents in logs.
- Context window limits and note-selection summaries before large requests.

### AI acceptance tests

- Correct account isolation: one user cannot ask AI about another user’s notes.
- Citation IDs always resolve to visible notes owned by the current user.
- Invalid provider credentials produce a clear recoverable error.
- Timeout and provider outage states do not lose the note draft.
- Model fallback is visible and does not silently change a user’s selected BYOK provider.
- AI actions remain usable with an empty notebook and with very long notes.

## 7. Implementation sequence

### Milestone A — Website foundation

- Create the dedicated full-stack web project.
- Establish the Mindloom web theme, fonts, app shell, route structure, and responsive tokens.
- Add a public landing/sign-in boundary and protected workspace route.
- Freeze platform release tags and do not trigger desktop/mobile builds.

### Milestone B — Native accounts

- Add user, password, session, verification, and reset schema.
- Implement registration, login, logout, session persistence, and account settings.
- Add server-side authorization helpers and account-isolation tests.
- Keep email delivery behind a documented environment variable until configured.

### Milestone C — Synchronized notes

- Add notebooks, notes, tags, links, and AI thread schema.
- Implement typed tRPC procedures and optimistic UI where safe.
- Migrate the editor from local-only persistence to server-backed drafts with offline recovery.
- Add search, graph, backlinks, and notebook filters.

### Milestone D — Workspace redesign

- Implement the desktop four-zone shell.
- Add command menu, keyboard shortcuts, responsive drawers, empty states, and polished loading/error states.
- Verify desktop, tablet, and phone previews before AI expansion.

### Milestone E — AI workspace

- Add selected-note and notebook context selection.
- Add ask, summarize, rewrite, tags, tasks, and link suggestions.
- Add citations, provider/model status, health checks, fallback, and usage events.
- Add BYOK only after managed AI tests pass.

### Milestone F — Web release gate

- TypeScript check.
- Unit tests and server integration tests.
- Auth and account-isolation tests.
- Production build/export from a clean install.
- Browser smoke tests for registration, login, note CRUD, search, graph, AI, logout, and session expiry.
- Desktop, tablet, and phone visual review.
- Accessibility review for keyboard navigation, labels, focus, contrast, and reduced motion.
- Deploy the website and verify the public production URL.

### Milestone G — Platform releases later

Only after Milestone F is green:

1. Repair and validate desktop packaging from the stabilized web bundle.
2. Add the Expo/EAS token and validate Android builds.
3. Validate iOS builds and signing configuration.
4. Publish release notes and artifacts only from passing tags.

## 8. Release policy while this plan is active

- No new Android, iOS, or desktop release tags during website implementation.
- Do not advertise the existing v0.1.x platform artifacts as production-ready.
- Keep failed workflow history for diagnosis, but do not repeatedly rerun failing jobs.
- Every future release tag must be created only after the web acceptance checklist and platform-specific build checks pass.

## 9. Definition of “ready”

Mindloom is ready for a public website release when a new user can independently:

1. Register with one email and password.
2. Sign in and remain signed in after refresh.
3. Create a notebook and multiple notes.
4. Search, tag, pin, link, and open notes from the graph.
5. Edit a note without losing drafts.
6. Ask AI about selected sources and see trustworthy citations.
7. Understand provider/model health and recover from an AI failure.
8. Sign out and confirm protected data is inaccessible afterward.
9. Use the experience comfortably on desktop and phone widths.
10. Repeat the full flow from a clean browser with no developer setup.
