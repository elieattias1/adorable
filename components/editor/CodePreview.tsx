'use client'

import { useEffect, useRef, useCallback } from 'react'

// ─── Babel CDN — loaded once per page session ─────────────────────────────────
let _babelReady = false
let _babelPromise: Promise<void> | null = null

function ensureBabel(): Promise<void> {
  if (_babelReady) return Promise.resolve()
  if (_babelPromise) return _babelPromise
  _babelPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/@babel/standalone/babel.min.js'
    s.onload  = () => { _babelReady = true; resolve() }
    s.onerror = () => reject(new Error('Babel CDN failed to load'))
    document.head.appendChild(s)
  })
  return _babelPromise
}

// ─── CDN URLs used directly in module scripts (no importmap needed) ───────────
const CDN = {
  react:        'https://esm.sh/react@18',
  jsxRuntime:   'https://esm.sh/react@18/jsx-runtime',
  reactDom:     'https://esm.sh/react-dom@18/client',
  lucideReact:  'https://esm.sh/lucide-react?deps=react@18',
}

// ─── Compiled srcdoc cache — two layers ──────────────────────────────────────
// 1. Module-level Map: instant within-session (survives remounts, cleared on reload)
// 2. localStorage: survives page reload (keyed by djb2 hash of the source code)
const _memCache = new Map<string, string>()
const LS_PREFIX  = 'sb_prev_v22_'

function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}
function lsGet(key: string): string | null {
  try { return localStorage.getItem(LS_PREFIX + key) } catch { return null }
}
function lsSet(key: string, val: string): void {
  try { localStorage.setItem(LS_PREFIX + key, val) } catch {} // ignore quota
}

// ─── Navigation lock — injected as the very first <head> script ──────────────
// Must run before Tailwind, fonts, AND the React module so that all navigation
// APIs are patched before any user code executes.
const NAV_LOCK = `<script>
(function(){
  'use strict';
  var noop = function(){};

  // Kill all programmatic navigation APIs
  try { window.location.assign  = noop; } catch(e) {}
  try { window.location.replace = noop; } catch(e) {}
  try { window.location.reload  = noop; } catch(e) {}
  try {
    var _d = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
    if (_d && _d.set) {
      Object.defineProperty(Location.prototype, 'href', {
        configurable: true, enumerable: true, get: _d.get,
        set: function(v) {
          // Silently swallow all programmatic href assignments
        }
      });
    }
  } catch(e) {}
  if (window.history) {
    try { window.history.pushState    = noop; } catch(e) {}
    try { window.history.replaceState = noop; } catch(e) {}
  }
  window.open = noop;

  // ── THE KEY FIX ─────────────────────────────────────────────────────────────
  // Chrome resolves hash links (#contact) in srcdoc iframes relative to the
  // PARENT page URL (e.g. localhost:3000/editor/[id]#contact), which triggers
  // a real network request and loads a new page → white screen.
  //
  // Solution: intercept ALL anchor clicks with preventDefault() — including
  // hash links — and handle scrolling 100% in JS. Never let the browser
  // navigate the iframe for any reason.
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = (a.getAttribute('href') || '').trim();
    if (!href || href.startsWith('javascript:')) return;

    // Always prevent browser navigation — we handle everything
    e.preventDefault();
    // Do NOT stopPropagation — React onClick handlers (menu toggle etc.) must still fire

    if (href.charAt(0) === '#') {
      // Hash link: scroll to matching element
      var id = href.slice(1);
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Path link (/contact, /about etc.): find best-matching section by last segment
      var seg = href.split('?')[0].split('#')[0].replace(/\\/$/, '').split('/').filter(Boolean).pop();
      var target = seg && document.getElementById(seg);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  }, true);

  // Prevent form HTTP submission — no stopPropagation so React onSubmit still fires
  document.addEventListener('submit', function(e) {
    e.preventDefault();
  }, true);

})();
</script>`

// ─── Common iframe <head> ─────────────────────────────────────────────────────
const BASE_HEAD = `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;900&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: #0f0f13; }
  /* Offset anchor targets so they're not hidden under a fixed navbar */
  [id] { scroll-margin-top: 80px; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #7c3aed60; border-radius: 99px; }
</style>`

const EMPTY_SRCDOC = `<!DOCTYPE html>
<html><head>${NAV_LOCK}${BASE_HEAD}</head>
<body style="margin:0;background:#0f0f13;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui">
<div style="text-align:center;max-width:360px;padding:0 24px">
  <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#db2777);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px">⚡</div>
  <h2 style="color:#fff;font-size:18px;font-weight:800;margin:0 0 8px;letter-spacing:-0.3px">Ton site apparaîtra ici</h2>
  <p style="color:#555;font-size:13px;margin:0;line-height:1.6">Décris ton activité dans le chat<br>et Adorable génère ton site en quelques secondes.</p>
</div>
</body></html>`

// ─── Pre-processor: escape French apostrophes in single-quoted strings ────────
function fixApostrophes(code: string): string {
  return code.replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, "$1\\'$2")
}


// ─── Transform TSX → iframe srcdoc ───────────────────────────────────────────
async function codeToSrcdoc(tsxCode: string): Promise<string> {
  const key = djb2(tsxCode)

  // Fast path: in-memory cache (within same page session)
  const mem = _memCache.get(key)
  if (mem) return mem

  // Medium path: localStorage cache (survives page reload)
  const ls = lsGet(key)
  if (ls) { _memCache.set(key, ls); return ls }

  await ensureBabel()

  let js: string
  try {
    // @ts-ignore — Babel loaded via CDN script tag
    const Babel = (window as any).Babel
    // Preprocess: fix apostrophes + strip TS generics, then compile as plain JSX.
    const result = Babel.transform(fixApostrophes(tsxCode), {
      presets: [
        ['react', { runtime: 'automatic' }],
        ['typescript', { isTSX: true, allExtensions: true }],
      ],
      filename: 'App.tsx',
    })

    js = result.code
      // Remove export default so App is a named binding accessible in the module
      .replace(/export\s+default\s+(function|class)\s+App\b/, '$1 App')
      // Rewrite import specifiers to direct CDN URLs — avoids needing importmap
      .replace(/from\s+['"]react\/jsx-runtime['"]/g, `from '${CDN.jsxRuntime}'`)
      .replace(/from\s+['"]react['"]/g,              `from '${CDN.react}'`)
      .replace(/from\s+['"]react-dom\/client['"]/g,  `from '${CDN.reactDom}'`)
      // Lucide: convert named imports → namespace import + Proxy destructuring.
      // Named imports fail at module-link time if the icon doesn't exist in the
      // CDN version (e.g. "Instagram" was removed/renamed). Proxy returns () => null
      // for any missing key so the rest of the site still renders.
      .replace(
        /^import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?\s*$/gm,
        (_: string, names: string) =>
          `import * as _LucideAll from '${CDN.lucideReact}';\n` +
          `const { ${names.trim()} } = new Proxy(_LucideAll, { get: (t, k) => t[k] || (() => null) });`
      )
      // Drop any other bare imports that would fail (no bundler available)
      .replace(/^import\s+.*?from\s+['"][^h][^t][^t].*?['"];?\s*$/gm, '')

  } catch (err: any) {
    const msg = String(err.message).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<!DOCTYPE html><html><head>${BASE_HEAD}</head>
<body style="margin:0;background:#0f0f13">
<pre style="color:#f87171;padding:24px;font-size:12px;font-family:monospace;white-space:pre-wrap">Erreur de compilation :\n${msg}</pre>
</body></html>`
  }

  // This MUST be a regular script (not type=module) so it runs before ES module
  // imports are resolved. Module import failures abort the module before any
  // code executes — so putting onerror inside the module never catches them.
  const errorScript = `
window._re = function(kind, detail) {
  try { window.parent.postMessage({ type: 'preview-error', kind: kind, detail: String(detail).slice(0,400) }, '*'); } catch(e) {}
};
window.onerror = function(msg, src, line, col, err) {
  window._re('JS', err ? (err.stack || err.message) : msg);
  return true;
};
window.addEventListener('unhandledrejection', function(e) {
  window._re('Async', e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : 'Unhandled rejection');
});
// ES module load errors fire on the document in capture phase
window.addEventListener('error', function(e) {
  if (e.target && e.target.tagName === 'SCRIPT') {
    window._re('Import', 'Impossible de charger un module CDN. Vérifie ta connexion.');
  }
}, true);
// Fallback: IntersectionObserver unreliable in sandboxed iframes — force visible after 2s
setTimeout(function() {
  try {
    document.querySelectorAll('*').forEach(function(el) {
      try {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
        var s = window.getComputedStyle(el);
        if (s.opacity === '0') { el.style.cssText += ';opacity:1!important;transform:none!important;transition:opacity 0.4s'; }
      } catch(e2) {}
    });
  } catch(e) {}
}, 2000);
`

  const moduleScript = `
import React from '${CDN.react}';
import { createRoot } from '${CDN.reactDom}';
${js}

class _EB extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() { return this.state.err ? null : this.props.children; }
  componentDidCatch(e) { window._re('React', e.message || String(e)); }
}

try {
  createRoot(document.getElementById('root')).render(
    React.createElement(_EB, null, React.createElement(App))
  );
} catch (err) {
  window._re('Render', err.message || String(err));
}
`
  // postMessage fetch bridge — lets the sandboxed iframe (null origin, no cookies)
  // make API calls by asking the parent to fetch on its behalf (parent has auth cookies).
  // iframe sends {type:'fetch-request', id, url, method, headers, body}
  // parent replies {type:'fetch-response', id, status, body}
  const fetchProxy = `<script>
(function(){
  var _pending = {};
  window.addEventListener('message', function(e) {
    var d = e.data;
    if (!d || d.type !== 'fetch-response' || !_pending[d.id]) return;
    var resolve = _pending[d.id];
    delete _pending[d.id];
    resolve(new Response(JSON.stringify(d.body), {
      status: d.status || 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  });
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : input.url;
    // Only bridge /api/ calls — let CDN/font/etc calls go through normally
    if (url.charAt(0) !== '/') return fetch.apply(window, [input, init]);
    return new Promise(function(resolve) {
      var id = Math.random().toString(36).slice(2);
      _pending[id] = resolve;
      window.parent.postMessage({
        type:    'fetch-request',
        id:      id,
        url:     url,
        method:  (init && init.method) || 'GET',
        headers: (init && init.headers) || {},
        body:    (init && init.body)    || null,
      }, '*');
    });
  };
})();
</script>`

  const srcdoc = `<!DOCTYPE html>
<html lang="fr">
<head>${NAV_LOCK}${BASE_HEAD}</head>
<body>
<div id="root"></div>
${fetchProxy}
<script>${errorScript}</script>
<script type="module">${moduleScript}</script>
</body>
</html>`
  _memCache.set(key, srcdoc)
  lsSet(key, srcdoc)
  return srcdoc
}

// ─── Streaming code overlay ───────────────────────────────────────────────────
function StreamingOverlay({ code }: { code: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [code])

  const lines     = code.split('\n')
  const visible   = lines.slice(Math.max(0, lines.length - 28))
  const startLine = Math.max(1, lines.length - 27)

  return (
    <div className="absolute inset-0 z-10 bg-gray-950 flex flex-col font-mono text-xs overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 flex-shrink-0 bg-gray-900">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-gray-500 text-[11px] ml-2">App.tsx</span>
        <div className="ml-auto flex items-center gap-2 text-violet-400 text-[11px]">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          Génération…
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-hidden py-2">
        {visible.map((line, i) => (
          <div key={i} className="flex min-h-[1.5rem] leading-6">
            <span className="w-10 flex-shrink-0 text-right pr-3 text-gray-700 select-none">
              {startLine + i}
            </span>
            <span className="flex-1 pr-4 text-violet-200/80 whitespace-pre">
              {line}
              {i === visible.length - 1 && (
                <span className="inline-block w-[7px] h-[14px] bg-violet-400 ml-0.5 align-middle animate-pulse rounded-sm" />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/8 text-[10px] text-gray-600 flex-shrink-0 bg-gray-900">
        <span>{lines.length} lignes</span>
        <span>{code.length.toLocaleString()} caractères</span>
      </div>
    </div>
  )
}

// ─── CodePreview ─────────────────────────────────────────────────────────────
interface CodePreviewProps {
  code: string
  isGenerating: boolean
  isWaitingForGeneration?: boolean
  streamingCode?: string
  mode?: 'desktop' | 'mobile'
  onError?: (msg: string) => void
}

export default function CodePreview({ code, isGenerating, isWaitingForGeneration, streamingCode, mode = 'desktop', onError }: CodePreviewProps) {
  const iframeRef    = useRef<HTMLIFrameElement>(null)
  const loadedDocRef = useRef<string>('')
  const onErrorRef   = useRef(onError)
  useEffect(() => { onErrorRef.current = onError }, [onError])

  // Imperatively write srcdoc — bypasses React reconciliation so the iframe
  // is never touched unless we explicitly need to change its content.
  const applyDoc = useCallback((doc: string) => {
    if (doc === loadedDocRef.current) return
    loadedDocRef.current = doc
    if (iframeRef.current) iframeRef.current.srcdoc = doc
  }, [])

  // Listen for messages from the sandboxed iframe
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === 'preview-error') {
        const label = e.data.kind ? `[${e.data.kind}] ` : ''
        onErrorRef.current?.(`Preview: ${label}${e.data.detail}`)
        return
      }

      // Fetch bridge: iframe can't make authenticated API calls (null origin),
      // so it asks the parent to fetch on its behalf
      if (e.data?.type === 'fetch-request' && e.source === iframeRef.current?.contentWindow) {
        const { id, url, method, headers, body } = e.data
        try {
          const res  = await fetch(url, { method, headers, body: body || undefined, credentials: 'include' })
          const data = await res.json().catch(() => null)
          ;(e.source as Window).postMessage({ type: 'fetch-response', id, status: res.status, body: data }, '*')
        } catch {
          ;(e.source as Window).postMessage({ type: 'fetch-response', id, status: 500, body: null }, '*')
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Eagerly preload Babel as soon as this component mounts — don't wait for
  // code to arrive. By the time Supabase returns the site data, Babel will
  // already be loaded (or loading) and compilation starts immediately.
  useEffect(() => {
    ensureBabel().catch(() => {})
  }, [])

  // On mount, show cached content immediately or the loading spinner
  useEffect(() => {
    if (!code) { applyDoc(EMPTY_SRCDOC); return }
    const key = djb2(code)
    const cached = _memCache.get(key) ?? lsGet(key)
    applyDoc(cached ?? EMPTY_SRCDOC)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compile & apply whenever code changes
  useEffect(() => {
    if (!code) return
    const key = djb2(code)
    const cached = _memCache.get(key) ?? lsGet(key)
    if (cached) { applyDoc(cached); return }
    let cancelled = false
    codeToSrcdoc(code).then(doc => {
      if (cancelled) return
      applyDoc(doc)
      if (doc.includes('Erreur de compilation')) {
        // Extract first line of the error message for the toast
        const match = doc.match(/Erreur de compilation\s*:\n?([^\n<]{0,200})/)
        onErrorRef.current?.(`Compilation: ${match?.[1] ?? 'Babel error'}`)
      }
    })
    return () => { cancelled = true }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const showStreaming = isGenerating && !!streamingCode

  return (
    <div className="relative w-full h-full bg-gray-950 flex flex-col">
      {isGenerating && !showStreaming && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-violet-900/80 backdrop-blur-sm border border-violet-700/50 px-3 py-1.5 rounded-full text-xs text-violet-200 pointer-events-none">
          <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
          L'agent modifie le site…
        </div>
      )}

      {/* Initial generation in progress — full overlay with animated state */}
      {isWaitingForGeneration && !code && (
        <div className="absolute inset-0 z-10 bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/30">
              <span className="text-2xl">⚡</span>
            </div>
            <h2 className="text-white font-black text-lg mb-2">Génération en cours…</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">Adorable construit ton site.<br/>Ça prend environ 30 secondes.</p>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-violet-500"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`relative flex-1 min-h-0 ${mode === 'mobile' ? 'flex items-center justify-center bg-gray-900' : ''}`}>
        <div className={`relative h-full ${
          mode === 'mobile'
            ? 'w-[390px] max-h-[844px] rounded-3xl overflow-hidden border-4 border-gray-700 shadow-2xl'
            : 'w-full'
        }`}>
          {showStreaming && <StreamingOverlay code={streamingCode!} />}
          {/* srcdoc is managed imperatively via iframeRef — never set as a React prop
              so React's reconciliation can never trigger an unwanted iframe reload.
              No allow-same-origin: iframe gets null/opaque origin so it cannot send
              auth cookies or load authenticated pages if navigation escapes. */}
          <iframe
            ref={iframeRef}
            title="Site preview"
            sandbox="allow-scripts allow-forms"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      </div>
    </div>
  )
}
