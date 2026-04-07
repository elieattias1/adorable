import { anthropic } from './anthropic'
import type { SiteSchema } from '@/types/site-schema'

// ─── System prompt ────────────────────────────────────────────────────────────

const CODE_SYSTEM_PROMPT = `Tu es un développeur React/Next.js senior expert en design.
Tu génères des pages web de qualité production à partir d'un schéma de données.

STACK :
- Next.js 14 App Router, TypeScript, Tailwind CSS
- lucide-react pour les icônes (import { IconName } from 'lucide-react')
- La couleur primaire est disponible via la classe Tailwind \`primary\` (ex: bg-primary, text-primary, border-primary)
- Les polices sont déjà configurées via CSS, utilise la classe \`font-sans\` ou \`font-serif\`

STRUCTURE DU FICHIER :
- 'use client' en haut
- Imports (react, lucide-react seulement)
- Un hook \`useInView\` pour les animations au scroll
- Un composant par section (Nav, Hero, Features, etc.)
- \`export default function Page()\` à la fin

RÈGLES DE QUALITÉ — OBLIGATOIRES :
1. Tailwind uniquement pour le layout et la typographie, \`style={{}}\` uniquement pour les couleurs dynamiques (primaryColor, bgColor)
2. Animations au scroll : chaque section utilise useInView() → classe \`opacity-0 translate-y-8\` → \`opacity-100 translate-y-0\` avec \`transition-all duration-700\`
3. Navbar sticky avec \`backdrop-blur-xl\` et \`bg-black/30\`
4. Hero : grand titre fluid (\`text-5xl md:text-7xl\`), sous-titre lisible (\`text-white/60\`), boutons avec hover scale
5. Cards features : hover border-primary/40 + bg-white/[0.06] transition
6. Témoignages : grid responsive avec quotes stylisées
7. Pricing : plan highlighted en bg-primary avec shadow colorée
8. Contact form : inputs stylisés avec focus:border-primary/60
9. Footer : sobre, liens hover text-primary
10. TOUT le contenu vient du schéma — aucun placeholder, aucune invention
11. Mobile-first, breakpoints md: et lg:
12. scroll-smooth sur html, ancres de navigation fonctionnelles

PATTERNS RÉUTILISABLES :
\`\`\`tsx
// Hook animation scroll
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// Section wrapper avec animation
<div ref={ref} className={\`transition-all duration-700 \${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}\`}>

// Badge
<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
      style={{ borderColor: \`\${primary}50\`, color: primary, background: \`\${primary}15\` }}>
  ✦ {badge}
</span>

// Feature card
<div className="group p-8 rounded-2xl border border-white/8 bg-white/[0.03] hover:border-primary/40 hover:bg-white/[0.05] transition-all duration-300 cursor-default">

// CTA button primary
<a href={href} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-100"
   style={{ background: primary, boxShadow: \`0 8px 32px \${primary}40\` }}>

// CTA button secondary
<a href={href} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition-all duration-200">
\`\`\`

Réponds UNIQUEMENT avec le code TSX dans un bloc \`\`\`tsx ... \`\`\`. Aucun texte avant ou après.`

// ─── Template files ────────────────────────────────────────────────────────────

export function buildNextjsTemplate(schema: SiteSchema): Record<string, string> {
  const primary = schema.meta.primaryColor || '#7c3aed'
  const bg = schema.meta.bgColor || (schema.meta.darkMode !== false ? '#0a0a0f' : '#ffffff')
  const text = schema.meta.textColor || (schema.meta.darkMode !== false ? '#f0f0f5' : '#111111')
  const isDark = schema.meta.darkMode !== false

  const fontImport = schema.meta.fontStyle === 'serif'
    ? `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700&display=swap');`
    : schema.meta.fontStyle === 'mono'
    ? `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;600;700&display=swap');`
    : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`

  const fontFamily = schema.meta.fontStyle === 'serif'
    ? `'Playfair Display', Georgia, serif`
    : schema.meta.fontStyle === 'mono'
    ? `'JetBrains Mono', 'Courier New', monospace`
    : `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

  return {
    'package.json': JSON.stringify({
      name: 'sitebot-site',
      version: '1.0.0',
      private: true,
      scripts: { build: 'next build', start: 'next start' },
      dependencies: {
        next: '14.2.5',
        react: '18.3.1',
        'react-dom': '18.3.1',
        'lucide-react': '0.400.0',
      },
      devDependencies: {
        tailwindcss: '3.4.4',
        autoprefixer: '10.4.19',
        postcss: '8.4.38',
        '@types/node': '20.14.9',
        '@types/react': '18.3.3',
        '@types/react-dom': '18.3.0',
        typescript: '5.5.3',
      },
    }, null, 2),

    'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
`,

    'tailwind.config.ts': `import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${primary}',
      },
      fontFamily: {
        sans: [${JSON.stringify(fontFamily)}],
      },
    },
  },
  plugins: [],
} satisfies Config
`,

    'postcss.config.mjs': `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
`,

    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: false,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2),

    'app/layout.tsx': `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${schema.meta.title.replace(/'/g, "\\'")}',
  description: '',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="${schema.meta.lang || 'fr'}" style={{ scrollBehavior: 'smooth' }}>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
`,

    'app/globals.css': `${fontImport}

@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  background: ${bg};
  color: ${text};
}

body {
  background: ${bg};
  color: ${text};
  font-family: ${fontFamily};
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

::selection {
  background: ${primary}40;
  color: ${isDark ? '#fff' : '#000'};
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${primary}60; border-radius: 99px; }
`,
  }
}

// ─── Claude code generation ───────────────────────────────────────────────────

export async function generateReactCode(schema: SiteSchema, siteName: string): Promise<string> {
  const prompt = `Génère la page complète pour ce site.

Nom du site : ${siteName}
Couleur primaire : ${schema.meta.primaryColor}
Mode : ${schema.meta.darkMode !== false ? 'sombre (dark)' : 'clair (light)'}
Fond : ${schema.meta.bgColor || (schema.meta.darkMode !== false ? '#0a0a0f' : '#ffffff')}
Texte : ${schema.meta.textColor || (schema.meta.darkMode !== false ? '#f0f0f5' : '#111111')}

Schéma complet :
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

Génère un page.tsx magnifique, de qualité production, avec :
- Toutes les sections du schéma rendues fidèlement
- Animations au scroll sur chaque section
- Design cohérent avec la couleur primaire ${schema.meta.primaryColor}
- Code clean et typé`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: CODE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract code from markdown code block
  const match = text.match(/```(?:tsx?|jsx?)\n([\s\S]+?)\n```/)
  if (match) return match[1].trim()

  // If Claude returned raw code without a block
  if (text.includes("'use client'") || text.includes('"use client"')) return text.trim()

  throw new Error('Claude did not return valid React code')
}
