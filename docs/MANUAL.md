# Mindloom AI Manual

Mindloom is a local-first notes workspace for connected thinking. It combines fast capture, linked notes, a knowledge graph, search, tags, pinning, autosave, and an optional AI writing partner.

## 1. Product overview

Mindloom is designed for:

- **Personal notes and journaling** — write quickly without setting up a database.
- **Project knowledge** — group notes into folders and connect related ideas.
- **Research and reading** — capture sources, tag them, and follow backlinks.
- **Desktop and mobile use** — the same Expo app can run in browsers/PWA, Electron desktop wrappers, Android, and iOS.
- **Privacy-conscious AI assistance** — use the managed assistant or connect your own provider key.

Mindloom is currently **local-first**. Notes and AI preferences persist on the current device. Cloud sync, backup, multi-user workspaces, and store publishing require additional production setup.

## 2. Getting started

### Browser or desktop

Open the web/PWA build or start the local development server:

```bash
pnpm install
pnpm dev
```

For a static web export:

```bash
pnpm export:web
```

The web build can be installed as a PWA on compatible Windows, macOS, Linux, ChromeOS, and mobile browsers.

### Mobile

Use Expo Go for development or EAS for installable Android/iOS builds:

```bash
pnpm dlx eas-cli login
pnpm dlx eas-cli build --platform android --profile preview
pnpm dlx eas-cli build --platform all --profile production
```

## 3. Notes library

The **Notes** screen is the main workspace.

### Create a note

1. Select the **+** button in the header.
2. Mindloom creates an untitled note and opens the editor.
3. Add a title and body.
4. Use the back button when you are done; the note is saved locally.

### Search

1. Select the magnifying-glass button.
2. Search by title, body text, folder, or tag.
3. Clear the query with the close button.
4. The list updates immediately as you type.

### Pin a note

Select the pin icon on a note card. Pinned notes are sorted above unpinned notes and remain easy to reach.

### Folders

Each note has a folder label. New notes default to **Inbox**. Seed content demonstrates **Getting started**, **Projects**, and **Inbox**. Folder editing UI can be expanded in a future release.

### Tags

Tags are shown on note cards and inside the editor. You can add explicit tags through note data and also write hashtags in content, for example:

```text
#reading #productivity
```

Hashtags are normalized to lowercase and merged with explicit tags when the note is saved.

## 4. Note editor

The editor includes:

- **Title field** — editable note title.
- **Body field** — multiline writing area.
- **Autosave** — changes are written locally after a short debounce.
- **Saved locally status** — confirms the local-first save state.
- **Word count** — updates while you write.
- **Tags** — extracted from hashtags and displayed below the note.
- **Backlinks** — notes that link to the current note appear under **Linked from**.
- **AI actions** — open the sparkle menu to summarize, continue, or outline the note.
- **Move to trash** — available in the more menu. This removes the note from the local list.

### Link notes together

Use double-bracket links in the body:

```text
Read this alongside [[Design system]] and [[Reading list]].
```

The link target is matched against another note's title, case-insensitively. Valid links become graph edges and backlinks.

## 5. Knowledge graph

Open **Graph** from the desktop rail, mobile tab bar, or the **Open graph** chip in the Notes screen.

- Each note is represented as a node.
- Each valid `[[Note title]]` reference creates a connection.
- Tap a node to select it.
- The selected-note card shows outgoing link and tag counts.
- Tap the selected-note card to open that note.
- If the graph is empty, add a `[[link]]` to a note and return to the graph.

The current graph layout is intentionally calm and readable. A future graph release can add zooming, pan gestures, filtering, clustering, and force-directed positioning.

## 6. AI assistant

AI is available from the sparkle button inside a note. Mindloom supports two routes.

### Managed Mindloom AI

This is the recommended default.

- No provider key is required in the app.
- The client calls the server procedure `ai.assist`.
- The server invokes the built-in LLM runtime.
- The server can also expose a live model catalog through `ai.models`.
- The selected model can be `auto` or a model ID returned by the catalog.
- The note content is sent only when the user taps an AI action.

Managed actions:

| Action        | Behavior                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| **Summarize** | Returns three concise bullets while preserving the author's intent.                    |
| **Continue**  | Writes one short paragraph in the note's tone without repeating existing text.         |
| **Outline**   | Converts the note into headings and concise bullets while preserving useful specifics. |

AI results are shown in an assistant panel. Select **Insert into note** to append the result to the current note; Mindloom never silently overwrites the note body.

### Bring your own key

Settings supports optional provider adapters for:

- **OpenAI** — Chat Completions-compatible request.
- **Anthropic** — Messages API request.
- **Google AI** — Gemini `generateContent` request.
- **Ollama** — local `http://localhost:11434/api/chat` request.

To configure one:

1. Open **Settings**.
2. Select the provider.
3. Enter the model ID.
4. Paste the provider API key, if required.
5. Select **Save**.
6. Select **Use this setup**.

Provider keys are written through Expo SecureStore under a Mindloom-specific key namespace. They are not placed in AsyncStorage, source files, or GitHub workflows. Ollama does not require a cloud API key, but the device must be able to reach the Ollama endpoint.

### AI safety and failure behavior

- Empty notes receive a request for more context.
- Missing or invalid provider keys show a safe error and leave the note unchanged.
- Managed assistant failures show a retry-friendly message and leave local content safe.
- AI output is not automatically treated as fact. Review it before inserting it into a note.
- Never commit provider keys, `.env` files, or store credentials to GitHub.

## 7. Settings

The Settings screen controls the AI writing partner.

- **Provider selector** — managed, OpenAI, Anthropic, Google AI, or Ollama.
- **Model field** — accepts `auto` or a provider-specific model ID.
- **Live catalog** — managed mode can show model IDs returned by the server.
- **Secure key field** — appears for external providers and uses secure text entry.
- **Use this setup** — persists the selected provider and model locally.

The app does not currently include a global cloud account switch, sync controls, export/import UI, or billing settings.

## 8. Storage and privacy

### Local data

The app stores notes in AsyncStorage under:

- `mindloom.notes.v1`
- `mindloom.ai-settings.v1`

These keys are implementation details and may change during migrations.

### Secure data

External provider keys are stored with Expo SecureStore under provider-specific keys such as:

```text
mindloom.ai.openai.key
mindloom.ai.anthropic.key
mindloom.ai.google.key
mindloom.ai.ollama.key
```

### Network behavior

- Notes do not need a network connection for local editing.
- Managed AI actions use the Mindloom server.
- External providers receive the note content only when their action is selected.
- Ollama traffic is sent to the configured local endpoint.
- The app should be given a production HTTPS API base URL before public distribution.

## 9. Desktop and PWA use

The responsive shell uses a desktop navigation rail on wider screens and a bottom tab bar on mobile-sized screens. The desktop wrapper loads the static Expo web export into Electron.

Build locally:

```bash
pnpm desktop:install
pnpm desktop:dev
pnpm desktop:package
```

Expected desktop outputs:

- Windows: NSIS installer and portable executable.
- macOS: DMG and ZIP.
- Linux: AppImage, Debian package, and tarball.

Desktop signing and notarization are not included by default. Configure signing credentials before public release.

## 10. GitHub deployment

The repository contains three workflows:

- `.github/workflows/web-pages.yml` — builds and deploys the PWA to GitHub Pages.
- `.github/workflows/desktop-release.yml` — builds desktop installers on version tags and attaches them to a GitHub Release.
- `.github/workflows/mobile-release.yml` — starts EAS Android and iOS production builds on version tags.

Required GitHub configuration:

| Setting                 | Type                | Purpose                                       |
| ----------------------- | ------------------- | --------------------------------------------- |
| `EXPO_TOKEN`            | Secret              | Authenticates EAS builds.                     |
| `MINDLOOM_API_BASE_URL` | Repository variable | Public HTTPS API URL used by exported builds. |
| Apple credentials       | EAS credentials     | Required for iOS distribution.                |
| Google Play credentials | EAS credentials     | Required for Android store distribution.      |

Recommended first release sequence:

```bash
git add .
git commit -m "Prepare Mindloom AI v0.1.0"
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

Review generated assets before publishing store submissions. The workflows build artifacts; they do not automatically submit apps to the Apple App Store or Google Play.

## 11. Troubleshooting

### Notes are not appearing

Wait for the local hydration state to finish. If storage contains malformed JSON, Mindloom falls back to the starter notes. Clearing app storage resets the local workspace.

### A link does not appear in the graph

Check that the target title matches exactly inside the brackets, ignoring only letter case:

```text
[[Design system]]
```

The target note must already exist.

### AI says no key is saved

Open Settings, select the matching provider, save the key again, then select **Use this setup**. Provider keys are device-local and are not shared between installations.

### Managed AI is unavailable

Verify the deployed API base URL, server health, and managed LLM availability. Local note editing remains available while AI is offline.

### Desktop package fails on Linux

AppImage and tarball packaging can work in a minimal environment. Debian packaging may require Linux packaging utilities such as `ar`; the GitHub Ubuntu runner supplies them. Use the GitHub desktop workflow for reproducible multi-platform artifacts.

## 12. Roadmap

Planned improvements include:

1. Markdown preview and richer editor formatting.
2. Import/export for Markdown, JSON, and plain text.
3. Cloud sync with conflict resolution and encrypted backups.
4. More graph interactions: zoom, pan, filters, and clusters.
5. AI chat over selected notes and graph neighborhoods.
6. Accessibility audit, crash reporting, and store metadata.
7. Signed and notarized installers for public distribution.
