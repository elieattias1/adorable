import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CDN = {
  react:       'https://esm.sh/react@18',
  jsxRuntime:  'https://esm.sh/react@18/jsx-runtime',
  reactDom:    'https://esm.sh/react-dom@18/client',
  lucideReact: 'https://esm.sh/lucide-react?deps=react@18',
}

function isReactCode(content: string): boolean {
  const trimmed = content?.trim()
  if (!trimmed || trimmed.length < 10) return false
  return !trimmed.startsWith('{') && !trimmed.startsWith('[')
}

// ── Server-side preprocessors (applied before JSON.stringify so no escaping hell) ──

// Escape French apostrophes in single-quoted strings: L'Artisan → L\'Artisan
function fixApostrophes(code: string): string {
  return code.replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, "$1\\'$2")
}

// Strip TypeScript generic params from React hooks so React-only Babel preset works.
// We do NOT use the TypeScript Babel preset — it has a bug where it fails on
// template literals inside JSX attribute expressions (className={`... ${expr}`}).
// AI-generated code only has TypeScript as generic hooks (useState<T>); strip them.
function stripTypeScriptGenerics(code: string): string {
  return code
    .replace(/^import\s+type\s+.+$/gm, '')
    .replace(
      /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|useLayoutEffect|useImperativeHandle|createRef|createContext)\s*<[^<>()[\]{}]+>/g,
      '$1'
    )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const isPreview = req.nextUrl.searchParams.get('preview') === '1'

  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('id, name, html, is_published')
    .eq('id', id)
    .single()

  if (!site?.html) {
    return new NextResponse('Site introuvable', { status: 404 })
  }

  // Block unpublished sites (preview=1 bypasses for editor)
  if (!site.is_published && !isPreview) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Site hors ligne</title></head>
<body style="margin:0;background:#0f0f13;color:#666;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;font-size:14px;flex-direction:column;gap:8px">
  <span style="font-size:32px">🔒</span>
  <p style="margin:0;font-size:15px;color:#aaa">Ce site est hors ligne.</p>
</body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  // Increment view count (fire-and-forget)
  supabaseAdmin.rpc('increment_view_count', { site_id: id }).then(() => {})

  if (!isReactCode(site.html)) {
    const name = site.name.replace(/</g, '&lt;')
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title></head>
<body style="margin:0;background:#0f0f13;color:#666;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;font-size:14px">
Site en cours de migration — ouvre l'éditeur pour régénérer.
</body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const siteName = site.name.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  // Apply preprocessors server-side then JSON-stringify — avoids any escaping
  // conflicts when embedding JS inside the TypeScript template literal below.
  const processedCode = stripTypeScriptGenerics(fixApostrophes(site.html))
  const codeJson = JSON.stringify(processedCode)
  const cdnJson  = {
    react:      JSON.stringify(CDN.react),
    jsxRuntime: JSON.stringify(CDN.jsxRuntime),
    reactDom:   JSON.stringify(CDN.reactDom),
    lucide:     JSON.stringify(CDN.lucideReact),
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteName}</title>
  <script id="babel-script" src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: #0f0f13; }
    [id] { scroll-margin-top: 80px; }
    ${isPreview ? 'html, body { overflow: hidden; }' : '::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #7c3aed60; border-radius: 99px; }'}
    @keyframes spin { to { transform: rotate(360deg) } }
    #sitebot-loading { position:fixed;inset:0;background:#0f0f13;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;font-family:system-ui;z-index:9999 }
  </style>
</head>
<body>
  <div id="sitebot-loading">
    <div style="width:36px;height:36px;border:2px solid #7c3aed;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite"></div>
    <p style="color:#666;font-size:13px;margin:0">Chargement…</p>
  </div>
  <div id="root"></div>

  <script>
  (function () {
    var REACT       = ${cdnJson.react};
    var JSX_RUNTIME = ${cdnJson.jsxRuntime};
    var REACT_DOM   = ${cdnJson.reactDom};
    var LUCIDE      = ${cdnJson.lucide};

    function hideLoading() {
      var el = document.getElementById('sitebot-loading');
      if (el) el.remove();
    }

    function showError(msg) {
      hideLoading();
      document.body.style.cssText = 'margin:0;background:#0f0f13';
      document.getElementById('root').innerHTML =
        '<pre style="color:#f87171;padding:24px;font-size:12px;font-family:monospace;white-space:pre-wrap">' + msg + '</pre>';
    }

    function run() {
      var code = ${codeJson};
      var compiled;
      try {
        compiled = Babel.transform(code, {
          presets: [['react', { runtime: 'automatic' }]],
          filename: 'App.jsx',
        }).code;
      } catch (err) {
        showError('Erreur de compilation :\\n' + err.message);
        return;
      }

      // Rewrite imports to CDN URLs
      var js = compiled
        .replace(/export\\s+default\\s+(function|class)\\s+App\\b/, '$1 App')
        .replace(/from\\s+['"]react\\/jsx-runtime['"]/g, "from '" + JSX_RUNTIME + "'")
        .replace(/from\\s+['"]react['"]/g, "from '" + REACT + "'")
        .replace(/from\\s+['"]react-dom\\/client['"]/g, "from '" + REACT_DOM + "'")
        .replace(/from\\s+['"]lucide-react['"]/g, "from '" + LUCIDE + "'")
        .replace(/^import\\s+.*?from\\s+['"][^h][^t][^t].*?['"];?\\s*$/gm, '');

      // Named lucide imports: convert to namespace import + Proxy so missing icons
      // fall back to () => null instead of crashing the whole module.
      js = js.replace(
        /^import\\s+\\{([^}]+)\\}\\s+from\\s+'https:\\/\\/esm\\.sh\\/lucide-react[^']*';?\\s*$/gm,
        function(_, names) {
          return "import * as _LucideAll from '" + LUCIDE + "';\\nconst { " + names.trim() + " } = new Proxy(_LucideAll, { get: function(t,k){ return t[k] || function(){ return null; }; } });";
        }
      );

      var moduleSource = [
        "import React from '" + REACT + "';",
        "import { createRoot } from '" + REACT_DOM + "';",
        js,
        "try {",
        "  createRoot(document.getElementById('root')).render(React.createElement(App));",
        "} catch(err) { console.error(err); }",
      ].join('\\n');

      var blob = new Blob([moduleSource], { type: 'text/javascript' });
      var url  = URL.createObjectURL(blob);
      var s    = document.createElement('script');
      s.type   = 'module';
      s.src    = url;
      s.onload = function () { hideLoading(); URL.revokeObjectURL(url); };
      s.onerror = function () { showError('Erreur de rendu du module.'); URL.revokeObjectURL(url); };
      document.body.appendChild(s);
    }

    var babelScript = document.getElementById('babel-script');
    if (window.Babel) {
      run();
    } else {
      babelScript.addEventListener('load', run);
      babelScript.addEventListener('error', function () {
        showError('Impossible de charger Babel (vérifiez votre connexion).');
      });
    }
  })();
  </script>

  <style>.adorable-badge:hover{opacity:1!important}</style>
  <a href="https://adorable.click" target="_blank" rel="noopener noreferrer" class="adorable-badge"
    style="position:fixed;bottom:16px;left:16px;z-index:9998;display:flex;align-items:center;gap:5px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:#fff;text-decoration:none;font-size:11px;font-weight:600;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.15);opacity:0.75;transition:opacity 0.2s;font-family:system-ui,sans-serif">
    ⚡ Made with Adorable
  </a>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
