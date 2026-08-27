import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Guards the two failure modes behind the "design system never reached the
// pixels" bug. Both are structural, so they hold regardless of what the
// components are redesigned into.
//
// Vuetify emits `theme.variables` as bare RGB triplets (`--v-text-muted:
// 115, 99, 83`), so reading one directly as a colour produces an invalid
// declaration that the browser silently drops. tokens.css wraps each one in
// rgb() as a `--lune-*` alias; these tests make sure that mapping stays
// complete and that nobody bypasses it.

const SRC = resolve(__dirname, '..')
const tokensCss = readFileSync(join(SRC, 'assets/styles/tokens.css'), 'utf-8')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(vue|css)$/.test(entry.name)) out.push(full)
  }
  return out
}

describe('design tokens reach the DOM', () => {
  it('every theme.variables key has a --lune-* alias in tokens.css', async () => {
    // Imported lazily so the failure above is a clean assertion rather than a
    // module-load error if vuetify.ts is mid-edit.
    const { default: vuetify } = await import('../plugins/vuetify')
    const theme = vuetify.theme as unknown as {
      themes: { value: Record<string, { variables: Record<string, unknown> }> }
    }
    const keys = Object.keys(theme.themes.value.luneLight.variables)

    // Vuetify merges its own base variables into every theme: the *-opacity
    // scale, `border-color`, and `theme-kbd`/`theme-code` (+ their on- pairs,
    // which live under `variables` rather than `colors`). All are consumed by
    // Vuetify's own CSS, so they need no alias. Anything else is ours.
    const VUETIFY_BASE = /opacity$|^border-color$|^theme-/
    const ours = keys.filter((key) => !VUETIFY_BASE.test(key))
    expect(ours.length).toBeGreaterThan(0)

    const missing = ours.filter((key) => !tokensCss.includes(`--lune-${key}:`))

    expect(
      missing,
      `theme.variables keys without a --lune-* alias in tokens.css: ${missing.join(', ')}. ` +
        `Reading --v-${missing[0]} directly yields an RGB triplet, not a colour.`,
    ).toEqual([])
  })

  it('no component reads a non-theme Vuetify variable directly', () => {
    // `--v-theme-*` (from theme.colors) is fine wrapped in rgb() at the call
    // site and is used that way widely. `--v-<anything-else>` is the trap.
    const offenders: string[] = []

    for (const file of walk(SRC)) {
      if (file.endsWith('tokens.css')) continue
      readFileSync(file, 'utf-8')
        .split('\n')
        .forEach((line, i) => {
          if (/var\(--v-(?!theme-)/.test(line)) {
            offenders.push(`${file.replace(SRC, 'src')}:${i + 1}  ${line.trim()}`)
          }
        })
    }

    expect(
      offenders,
      `Use the --lune-* alias instead — a bare --v-* theme variable is an RGB ` +
        `triplet and produces an invalid declaration:\n${offenders.join('\n')}`,
    ).toEqual([])
  })

  it('sets a global font-family so Vuetify controls are not left on Roboto', () => {
    // Inputs, selects, select menus and button labels carry no .text-* class,
    // so without this they inherit Vuetify's Roboto.
    expect(tokensCss).toMatch(/font-family:\s*'DM Sans'/)
    // VSelect menus portal out of the app root; a rule scoped to
    // .v-application alone misses them.
    expect(tokensCss).toContain('.v-overlay-container')
  })

  it('collapses the duration scale under prefers-reduced-motion', () => {
    expect(tokensCss).toContain('prefers-reduced-motion: reduce')
  })
})

describe('typography utilities do not collide with Vuetify', () => {
  // `.text-button` used to be one of ours AND one of Vuetify's Material
  // typography utilities. Vuetify's marks font-size, letter-spacing and
  // text-transform `!important`, so our same-named rule could never win them:
  // every button in the app rendered UPPERCASE at 14px with Material tracking,
  // and a component's own `text-transform: none` was silently dead.
  //
  // A collision is unwinnable and invisible, so assert there are none rather
  // than trusting review to catch the next one.
  const typographyCss = readFileSync(join(SRC, 'assets/styles/typography.css'), 'utf-8')
  const vuetifyCss = readFileSync(
    resolve(__dirname, '../../node_modules/vuetify/lib/styles/main.css'),
    'utf-8',
  )

  it('no class we define is also defined by Vuetify', () => {
    const ourClasses = [...typographyCss.matchAll(/^\.([\w-]+)\s*\{/gm)].map((m) => m[1])
    expect(ourClasses.length).toBeGreaterThan(0)

    const collisions = ourClasses.filter((cls) =>
      new RegExp(`(^|,|\\s)\\.${cls}\\s*[,{]`, 'm').test(vuetifyCss),
    )

    expect(
      collisions,
      `These class names are also Vuetify utilities: ${collisions.join(', ')}. ` +
        `Vuetify marks several of its typography properties !important, so ours ` +
        `cannot win. Namespace them (e.g. .lune-button).`,
    ).toEqual([])
  })

  it('button labels are not uppercased — the copy is spoken phrases', () => {
    expect(typographyCss).toMatch(/\.lune-button\s*\{[^}]*text-transform:\s*none/)
  })
})
