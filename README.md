# budgeting-client

The Lune budgeting app — Vue 3 + Vuetify 3 + Vite.

Built on the [Lune design system](../DESIGN.md): warm linen aesthetic, Fraunces display type, DM Sans body, organic motion.

## Stack

- [Vue 3](https://vuejs.org/) with `<script setup>` + TypeScript
- [Vuetify 3](https://vuetifyjs.com/) — Material component library with custom Lune theme
- [Vite](https://vitejs.dev/) — dev server and bundler
- [Pinia](https://pinia.vuejs.org/) — state management
- [Vue Router 4](https://router.vuejs.org/) — client-side routing
- [Axios](https://axios-http.com/) — HTTP client

## Development

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at localhost:5173 |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint across .vue, .ts, .js files |

## Design

See [`DESIGN.md`](../DESIGN.md) for the full Lune design system: colors, typography, spacing, motion tokens, and the product principles behind every decision.
