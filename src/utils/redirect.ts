// Shared by src/plugins/router.ts (the post-login guard) and
// src/stores/auth.ts (which embeds the target in the magic-link callback
// URL). Lives outside both so neither has to import the other — router.ts
// already imports useAuthStore, and auth.ts importing back from router.ts
// would create a cycle.

// Accept only a same-origin, path-relative redirect target. Rejects
// protocol-relative ('//evil.com') and backslash-disguised ('/\evil.com')
// forms that browsers/some parsers treat as absolute — closes an
// open-redirect hole on the post-login redirect.
export function sanitizeRedirect(redirect: unknown): string {
  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/\\')
  ) {
    return redirect
  }
  return '/'
}
