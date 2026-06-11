# UptimeHub Frontend

React + Vite + TypeScript frontend for the UptimeHub real-time resource booking platform.

## Development

```bash
npm install
npm run dev
```

The local dev server uses Vite proxies to avoid browser CORS issues during development:

- `/gateway` proxies API gateway calls.
- `/keycloak` proxies the Keycloak token exchange while the sign-in redirect still goes to the real Keycloak login page.

## Environment

Documented defaults are in `.env.example`.

Keycloak is configured for:

```env
VITE_KEYCLOAK_URL=http://84.247.166.242:8080
VITE_KEYCLOAK_TOKEN_BASE_URL=http://84.247.166.242:8080
VITE_KEYCLOAK_REALM=booking-system
VITE_KEYCLOAK_CLIENT_ID=frontend-client
```

Local development uses `.env.development.local`, which is intentionally ignored by Git.
For local Vite development it sets `VITE_KEYCLOAK_TOKEN_BASE_URL=/keycloak`.

For a non-proxied deployment, the Keycloak client must allow the frontend origin in **Web Origins** and must allow the exact callback URL in **Valid Redirect URIs**.

## Verification

```bash
npm run build
npm run lint
npm test
```

## CI/CD

Pushes to `main` or `master` run `.github/workflows/deploy.yml`.

The workflow:

- installs dependencies with `npm ci`
- runs tests, lint, and production build
- builds an nginx Docker image for the frontend
- uploads the image to the server over SSH
- runs the container on Docker network `infra_booking-network`

Required GitHub Actions secrets:

```text
DEPLOY_HOST=84.247.166.242
DEPLOY_USER=root
DEPLOY_PORT=22
DEPLOY_SSH_KEY=<private deploy key>
FRONTEND_PORT=80
```

The production image serves the SPA from nginx and proxies:

- `/gateway/*` to `http://gateway:8899/*`
- `/keycloak/*` to `http://keycloak:8080/*`
