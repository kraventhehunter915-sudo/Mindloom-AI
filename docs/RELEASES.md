# Mindloom AI release plan

## Release train

| Release        | Status                | Android         | iOS                            | Web/PWA            | Windows           | macOS                | Linux           | Focus                                                            |
| -------------- | --------------------- | --------------- | ------------------------------ | ------------------ | ----------------- | -------------------- | --------------- | ---------------------------------------------------------------- |
| `v0.1.0-alpha` | Ready for internal QA | EAS preview APK | TestFlight build after signing | GitHub Pages       | NSIS + portable   | DMG + ZIP            | AppImage + DEB  | Core notes, graph, local storage, AI actions                     |
| `v0.2.0-beta`  | Planned               | Closed testing  | TestFlight                     | PWA install polish | Signed installers | Signed/notarized app | Signed packages | Import/export, Markdown preview, accessibility, crash reporting  |
| `v1.0.0`       | Planned               | Play Store      | App Store                      | Public PWA         | Stable installer  | Stable installer     | Stable packages | Cloud sync, backups, complete store metadata, production support |

## What is already prepared

The repository contains the Expo app, server AI router, local note store, graph view, responsive PC workspace, desktop shell, PWA manifest, EAS profiles, and GitHub Actions workflows. A tagged release can build desktop artifacts automatically and start EAS mobile builds.

## Pre-release checklist

- [ ] Review the generated Mindloom mark on physical Android/iOS launchers and adjust safe-area padding if store previews require it.
- [ ] Set a production HTTPS API URL as `MINDLOOM_API_BASE_URL`.
- [ ] Add `EXPO_TOKEN` to GitHub Actions secrets.
- [ ] Configure EAS Android signing and Google Play credentials.
- [ ] Configure EAS iOS signing, bundle identifier, App Store Connect credentials, and TestFlight metadata.
- [ ] Decide whether the first release is local-only or includes cloud sync and authentication.
- [ ] Add privacy policy, terms, support URL, and data deletion instructions to store metadata.
- [ ] Test notes persistence, graph navigation, AI failure states, deep links, and offline behavior on physical devices.
- [ ] Sign Windows, macOS, and Linux packages before public distribution.
- [ ] Create the GitHub release from a clean `v0.1.0` tag.

## First public release commands

```bash
git checkout -b main
git add .
git commit -m "Prepare Mindloom AI v0.1.0"
git push -u origin main

git tag v0.1.0
git push origin v0.1.0
```

The tag starts the desktop release workflow and mobile EAS workflow. Review the generated GitHub Release assets before publishing store submissions.
