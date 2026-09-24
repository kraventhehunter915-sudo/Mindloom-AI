# Mindloom environment variables

Mindloom can run locally without additional environment values. For exported web, desktop, Android, and iOS builds, set the public API URL to the deployed HTTPS server:

```text
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

The GitHub Actions workflows read this as the repository variable `MINDLOOM_API_BASE_URL` and pass it into the Expo export/build process.

Optional OAuth values are provided by the deployment environment when authentication is enabled:

```text
EXPO_PUBLIC_OAUTH_PORTAL_URL=
EXPO_PUBLIC_OAUTH_SERVER_URL=
EXPO_PUBLIC_APP_ID=
EXPO_PUBLIC_OWNER_OPEN_ID=
EXPO_PUBLIC_OWNER_NAME=
```

Never commit provider API keys, `EXPO_TOKEN`, signing credentials, or `.env` files. User-entered OpenAI, Anthropic, Google AI, and Ollama keys are stored in the device secure store through the Settings screen.
