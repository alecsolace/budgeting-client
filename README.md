# budgeting-client

Vue 3 + Vuetify 3 + Vite web client for the Lune budgeting app.

Lune is a weekly budgeting ritual app built around a single weekly sit-down — not a live dashboard. The design system is defined in [`DESIGN.md`](../DESIGN.md) at the repo root.

## Stack

- **Vue 3** with Composition API + TypeScript
- **Vuetify 3** — custom Lune theme (light + dark), component defaults
- **Vite** — dev server + build
- **Pinia** — auth store (Supabase-ready stub)
- **Vue Router 4** — `/` WeeklyLog, `/login` Login, auth guard
- **Axios** — API client, reads `VITE_API_BASE_URL`
- **Vitest** + `@vue/test-utils` — unit + smoke tests

## Getting started

```bash
cp .env.example .env
npm install
npm run dev       # http://localhost:5173
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + Vite production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest run (all specs) |
| `npm run lint` | ESLint across `.vue` + `.ts` |

## Design tokens

CSS custom properties are loaded globally from `src/assets/styles/tokens.css`. All spacing, radius, easing, duration, and color values come from there. See [`DESIGN.md`](../DESIGN.md) for the rationale behind each token.
