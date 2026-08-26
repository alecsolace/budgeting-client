/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

/**
 * Injects a Content-Security-Policy <meta> into the built index.html.
 *
 * The Supabase session lives in localStorage, so any script that runs on this
 * origin can read it. CSP is the control that makes XSS-driven token theft
 * hard, which makes it load-bearing here rather than decorative.
 *
 * Build-only (`apply: 'build'`) on purpose: a static meta CSP with
 * script-src 'self' breaks the dev server, whose HMR client is inline script.
 * Dev therefore runs without CSP — acceptable, since dev is not a deployed
 * surface, but it does mean the policy must be verified against `dist/`.
 *
 * Two documented gaps:
 *  - style-src keeps 'unsafe-inline' because both Vue (scoped styles / :style
 *    bindings) and Vuetify inject inline styles at runtime. Removing it would
 *    require nonces on every runtime-injected <style>, which neither supports.
 *  - frame-ancestors is IGNORED in a <meta> CSP — it only works as a real
 *    response header. Clickjacking is therefore NOT covered by this tag; the
 *    host/CDN must send `Content-Security-Policy: frame-ancestors 'none'`
 *    (or X-Frame-Options: DENY) at deploy time. It is listed below so the
 *    intended policy is in one place, not so it can be assumed effective.
 */
function cspPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'lune-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const connectSources = ["'self'", env.VITE_SUPABASE_URL, env.VITE_API_BASE_URL]
        .filter((source): source is string => Boolean(source))
        .join(' ')

      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `connect-src ${connectSources}`,
        "img-src 'self' data:",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ].join('; ')

      const meta = `<meta http-equiv="Content-Security-Policy" content="${policy};" />`

      // Insert directly after the charset declaration: the policy wants to be
      // as early as possible, but not ahead of <meta charset>.
      const charset = /<meta\s+charset=["'][^"']*["']\s*\/?>/i
      if (charset.test(html)) {
        return html.replace(charset, (match) => `${match}\n    ${meta}`)
      }

      return html.replace(/<head>/i, (match) => `${match}\n    ${meta}`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [vue(), vuetify({ autoImport: true }), cspPlugin(env)],
    test: {
      globals: true,
      environment: 'jsdom',
      // Tests never reach a real Supabase project; these only satisfy the
      // fail-fast config check in src/plugins/supabase.ts.
      env: {
        VITE_API_BASE_URL: 'http://localhost:5000',
        VITE_SUPABASE_URL: 'https://test-project.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_PUBLIC_SITE_URL: 'http://localhost:5173',
      },
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
    },
  }
})
