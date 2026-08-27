/**
 * Non-blocking webfont loading, without an inline event handler.
 *
 * The usual trick is `media="print" onload="this.media='all'"`, but an inline
 * handler is inline script: it would force 'unsafe-inline' into script-src and
 * gut the CSP that protects the localStorage-resident Supabase session. This
 * file does the same media flip from a real, same-origin script.
 *
 * It lives in public/ rather than src/ deliberately — bundled into the app
 * entry it would only run once ~400kB of framework had parsed, which is long
 * after the font stylesheet has finished downloading.
 */
(function activateDeferredFontStylesheets() {
  function flip() {
    var links = document.querySelectorAll('link[data-font-deferred]')
    for (var i = 0; i < links.length; i += 1) {
      if (links[i].media !== 'all') {
        links[i].media = 'all'
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', flip, { once: true })
  } else {
    flip()
  }
})()
