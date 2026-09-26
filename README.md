# Mindloom AI

Mindloom is an account-backed notes workspace for connected thinking. It combines a calm glass-inspired interface, linked notes, graph navigation, search, tags, autosave, synchronized web notes, and an extensible AI writing partner.

The website uses native email/password accounts only—no Google or Microsoft sign-in. The desktop workspace includes a source-grounded **Ask Mindloom** panel; protected AI requests resolve note sources server-side for the current account and return compact citations.

The app is built with Expo SDK 54, React Native, Expo Router, TypeScript, NativeWind, tRPC, and the Manus-managed server runtime. It is designed to run as:

- **Android and iOS apps** through Expo Application Services (EAS).
- **A browser app and installable PWA** on Windows, macOS, Linux, ChromeOS, and mobile browsers.
- **Desktop installers** for Windows, macOS, and Linux through Electron Builder.

## Start locally

```bash
pnpm install
pnpm dev
```

The browser preview uses the Expo web target. The website stores account notes through the authenticated database API while preserving local draft behavior; native clients remain local-first during this web-first release phase. The managed AI route runs through the server and should not be called directly with a client-side secret.

## Quality checks

```bash
pnpm check
pnpm test
pnpm lint
```

## Web and PWA release

```bash
pnpm export:web
```

The static build is emitted to `dist/`. Set `EXPO_PUBLIC_API_BASE_URL` when the exported app needs to reach a deployed Mindloom API rather than deriving the API host from the preview hostname.

## Android and iOS release

Install and authenticate with EAS, then create a preview APK or production build:

```bash
pnpm dlx eas-cli login
pnpm dlx eas-cli build --platform android --profile preview
pnpm dlx eas-cli build --platform all --profile production
```

The production profile is configured in `eas.json`. iOS distribution requires an Apple Developer account and signing credentials. Android store distribution requires a Google Play Console account and signing credentials.

## Desktop release

The desktop wrapper consumes the static Expo web build:

```bash
pnpm desktop:install
pnpm desktop:dev
pnpm desktop:package
```

Artifacts are written to `desktop/dist/`:

- Windows: NSIS installer and portable executable.
- macOS: DMG and ZIP.
- Linux: AppImage, Debian package, and tarball.

## GitHub Actions

The workflows in `.github/workflows/` are ready to copy into a GitHub repository:

- `web-pages.yml` exports and deploys the web/PWA build to GitHub Pages.
- `desktop-release.yml` builds Windows, macOS, and Linux installers on `v*.*.*` tags and attaches them to a GitHub Release.
- `mobile-release.yml` starts EAS Android and iOS production builds on `v*.*.*` tags.

Configure these repository values before enabling automated release builds:

| Name                        | Type            | Purpose                                      |
| --------------------------- | --------------- | -------------------------------------------- |
| `EXPO_TOKEN`                | Secret          | Authenticates EAS builds.                    |
| `MINDLOOM_API_BASE_URL`     | Variable        | Public HTTPS URL of the deployed API server. |
| Apple signing credentials   | EAS credentials | Required for iOS App Store builds.           |
| Google Play service account | EAS credentials | Required for Play Store submission.          |

The mobile workflow creates builds; it intentionally does not auto-submit them to app stores until store metadata, signing, privacy declarations, and release notes are reviewed.

## AI providers

Mindloom supports the managed server-side assistant and optional secure bring-your-own-key adapters for OpenAI, Anthropic, Google AI, and Ollama. Provider keys are stored in the device secure store. Never commit `.env` files or provider keys to GitHub.

## Suggested repository setup

1. Create a private GitHub repository named `mindloom-ai`.
2. Copy this project into it, preserving `.github/workflows`, `eas.json`, `desktop`, and `public`.
3. Set the GitHub Pages source to **GitHub Actions**.
4. Add `EXPO_TOKEN` and `MINDLOOM_API_BASE_URL` as repository secret/variable values.
5. Create a release tag such as `v0.1.0` to build desktop installers and mobile binaries.

See [`docs/RELEASES.md`](docs/RELEASES.md) for the staged release plan.

See [`docs/MANUAL.md`](docs/MANUAL.md) for the complete user and developer manual, including every current note, graph, AI, privacy, troubleshooting, and release feature.
