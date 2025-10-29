# My Notes

Simple, pragmatic notes app built with Nuxt 3 and TypeScript. It includes a complete authentication flow and a CRUD notes experience, with a secure API proxy, route guards, and a modern UI.

## Overview

- Authentication: login, register, logout, forgot password, reset password, email verification, and resend verification.
- Notes: list, view detail, create, update, and delete notes with friendly toasts and loading/error states.
- Access control: global middleware redirects unauthenticated users to `'/sign-in'` and prevents authenticated users from visiting auth pages.
- API proxy: server-side proxy forwards requests from `'/api/*'` to a configured backend base URL and enforces `X-Requested-With: XMLHttpRequest`.
- Modern UI: built with `@nuxt/ui` components and Tailwind utility classes.
- Testing: Vitest unit/integration with MSW, plus Playwright E2E.

## Tech Stack

- Nuxt 3, TypeScript, Pinia, VueUse
- UI: `@nuxt/ui` with Tailwind (`@tailwind` directives in `assets/scss/main.scss`)
- Modules: `@nuxt/ui`, `@pinia/nuxt`, `@vueuse/nuxt`, `@nuxt/image`, `@nuxt/eslint`, `@nuxtjs/google-fonts`, `@nuxtjs/device`
- Styling: SCSS + Tailwind utility classes
- Fonts: Google Fonts (`Raleway`)
- Testing: Vitest, MSW, Playwright

## Architecture

- `pages/`: routes like `sign-in`, `sign-up`, `forgot-password`, `verify/[token]`, `reset-password/[token]`, `notes/index`, `notes/[id]`.
- `composables/api/`: `useApi` (fetch wrapper with headers/toasts), `useAuth`, `useNotes`.
- `stores/user.ts`: Pinia store for user profile and auth state.
- `middleware/auth.global.ts`: global route guard handling auth-only and app-only routes.
- `server/api/[...path].ts`: Nitro handler proxying `'/api/*'` to `runtimeConfig.apiBaseUrl + '/api'` and blocking non-AJAX requests.
- `components/`: Notes UI (List, Detail, Create), Auth forms, reusable dialogs.
- `schema/`: Zod validation for forms (login, register, notes, etc.).

## Configuration

- Node: use Node `v22` (see `.nvmrc`).
- Environment: set `NUXT_API_BASE_URL` to your backend base URL.

Example `.env`:

```bash
NUXT_API_BASE_URL=https://your-api.example.com
```

How the proxy works:
- Client calls `useApi('/api/...')` which adds `X-Requested-With: XMLHttpRequest` and JSON headers.
- `server/api/[...path].ts` forwards to `joinURL(apiBaseUrl, '/api', path)` with query parameters and rejects requests missing the header with `403`.

## Setup

Install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development

Start the dev server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Testing

- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e` (uses Playwright; auto-starts dev server)
- E2E UI mode: `npm run test:e2e:ui`
- Coverage: `npm run test:coverage`

Playwright is configured with `baseURL: 'http://localhost:3000'` and the same headers used by the app.

## Linting

- ESLint: `npm run lint` or `npm run lint:fix`

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Preview the production build locally:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Deployment: standard Nuxt 3 deployments (e.g., Vercel). See Nuxt’s [deployment docs](https://nuxt.com/docs/getting-started/deployment).
