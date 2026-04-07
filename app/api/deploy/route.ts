import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { deployNextjsSite, getDeploymentStatus } from '@/lib/deploy'
import { sendSiteLiveEmail } from '@/lib/email'
import type { Tables } from '@/types/supabase'

export const maxDuration = 120

// ─── Build a minimal Next.js project from the generated React TSX ─────────────
function buildNextjsFiles(tsxCode: string, siteName: string): Record<string, string> {
  // The generated code uses React hooks → must be a Client Component
  const withDirective = tsxCode.trimStart().startsWith("'use client'")
    ? tsxCode
    : `'use client'\n\n${tsxCode}`

  // Next.js pages export a default function — rename App → Page for convention
  const pageCode = withDirective.replace(
    /export\s+default\s+function\s+App\b/,
    'export default function Page'
  )

  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site'

  return {
    'package.json': JSON.stringify({
      name: slug,
      version: '0.1.0',
      private: true,
      scripts: { build: 'next build', start: 'next start', dev: 'next dev' },
      dependencies: {
        next: '14.2.29',
        react: '^18.3.0',
        'react-dom': '^18.3.0',
        'lucide-react': '^0.344.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
      },
    }, null, 2),

    'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = { output: 'standalone' }
module.exports = nextConfig
`,

    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'es5',
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
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    }, null, 2),

    'tailwind.config.ts': `import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
export default config
`,

    'postcss.config.js': `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
`,

    'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
[id] { scroll-margin-top: 80px; }
`,

    'app/layout.tsx': `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: '${siteName.replace(/'/g, "\\'")}' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
`,

    'app/page.tsx': pageCode,
  }
}

// ─── POST /api/deploy ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { siteId } = await req.json()

    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single() as { data: Tables<'sites'> | null; error: unknown }

    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    if (!site.html) return NextResponse.json({ error: 'No content to deploy' }, { status: 400 })

    console.log('[deploy] Building Next.js project for', site.name)
    const files = buildNextjsFiles(site.html, site.name)

    console.log('[deploy] Starting Vercel deployment')
    const { url, deploymentId, projectId } = await deployNextjsSite({
      siteId: site.id,
      siteName: site.name,
      files,
    })

    await supabaseAdmin
      .from('sites')
      .update({ deployed_url: url, is_published: true })
      .eq('id', siteId)

    console.log('[deploy] Deployment started:', deploymentId, url)

    return NextResponse.json({ url, deploymentId, projectId, building: true })

  } catch (err: any) {
    console.error('[deploy]', err)
    return NextResponse.json({ error: err.message || 'Deployment failed' }, { status: 500 })
  }
}

// ─── GET /api/deploy?deploymentId=xxx&siteId=xxx ──────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const deploymentId = req.nextUrl.searchParams.get('deploymentId')
    const siteId       = req.nextUrl.searchParams.get('siteId')
    if (!deploymentId) return NextResponse.json({ error: 'Missing deploymentId' }, { status: 400 })

    const result = await getDeploymentStatus(deploymentId)

    // When build completes, send site-live email (client stops polling after this → fires once)
    if (result.status === 'ready' && siteId && user.email) {
      const { data: site } = await supabaseAdmin
        .from('sites').select('name, deployed_url').eq('id', siteId).single()
      if (site?.deployed_url) {
        sendSiteLiveEmail(user.email, site.name, site.deployed_url).catch(console.error)
      }
    }

    return NextResponse.json(result)

  } catch (err: any) {
    console.error('[deploy/status]', err)
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 })
  }
}
