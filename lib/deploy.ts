/**
 * Deploys a generated HTML site to Vercel.
 * Each site gets its own Vercel project → unique subdomain.
 *
 * Docs: https://vercel.com/docs/rest-api/endpoints/deployments
 */

const VERCEL_API = 'https://api.vercel.com'
const TOKEN = process.env.VERCEL_ACCESS_TOKEN!
const TEAM  = process.env.VERCEL_TEAM_ID    // optional

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function teamQuery() {
  return TEAM ? `?teamId=${TEAM}` : ''
}

// ─── Deploy HTML to Vercel ─────────────────────────────────────────────────────
export async function deploySiteToVercel({
  siteId,
  siteName,
  html,
  existingProjectId,
}: {
  siteId: string
  siteName: string
  html: string
  existingProjectId?: string
}): Promise<{ url: string; deploymentId: string; projectId: string }> {
  // Sanitize site name for Vercel project naming
  const projectName = `sitebot-${siteId.slice(0, 8)}`

  // Create or get project
  let projectId = existingProjectId
  if (!projectId) {
    const proj = await createVercelProject(projectName)
    projectId = proj.id
  }

  // Create deployment
  const deployment = await createVercelDeployment(projectId!, projectName, html)

  // Wait for it to be ready (poll)
  await waitForDeployment(deployment.id)

  // Use the stable production alias (project name), not the per-deployment URL
  const url = `https://${projectName}.vercel.app`

  return {
    url,
    deploymentId: deployment.id,
    projectId: projectId!,
  }
}

async function createVercelProject(name: string) {
  const res = await fetch(`${VERCEL_API}/v9/projects${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, framework: null, publicSource: false }),
  })

  if (res.ok) return res.json()

  const err = await res.json()

  // Project already exists — fetch it by name instead
  const alreadyExists = err.error?.code === 'project_already_exists'
    || (err.error?.message as string | undefined)?.toLowerCase().includes('already exists')
  if (alreadyExists) {
    const getRes = await fetch(`${VERCEL_API}/v9/projects/${name}${teamQuery()}`, {
      headers: headers(),
    })
    if (getRes.ok) return getRes.json()
    const getErr = await getRes.json()
    throw new Error(`Vercel get project error: ${getErr.error?.message}`)
  }

  throw new Error(`Vercel project error: ${err.error?.message}`)
}

async function createVercelDeployment(projectId: string, projectName: string, html: string) {
  const res = await fetch(`${VERCEL_API}/v13/deployments${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: projectName,
      project: projectId,
      target: 'production',
      files: [
        {
          file: 'index.html',
          data: html,
          encoding: 'utf-8',
        },
      ],
      projectSettings: {
        framework: null,
        outputDirectory: '.',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Vercel deployment error: ${err.error?.message}`)
  }

  return res.json()
}

// ─── Deploy real Next.js project ──────────────────────────────────────────────

export async function deployNextjsSite({
  siteId,
  siteName,
  files,
}: {
  siteId: string
  siteName: string
  files: Record<string, string>
}): Promise<{ url: string; deploymentId: string; projectId: string }> {
  const projectName = `sitebot-${siteId.slice(0, 8)}`

  const proj = await createVercelProject(projectName)
  const projectId = proj.id

  // Upload all files
  const vercelFiles = Object.entries(files).map(([file, data]) => ({
    file,
    data,
    encoding: 'utf-8',
  }))

  const res = await fetch(`${VERCEL_API}/v13/deployments${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: projectName,
      project: projectId,
      target: 'production',
      files: vercelFiles,
      projectSettings: {
        framework: 'nextjs',
        installCommand: 'npm install',
        buildCommand: 'next build',
        outputDirectory: '.next',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Vercel deployment error: ${err.error?.message}`)
  }

  const deployment = await res.json()
  const url = `https://${projectName}.vercel.app`

  return {
    url,
    deploymentId: deployment.id,
    projectId,
  }
}

// ─── Check deployment status ───────────────────────────────────────────────────

export async function getDeploymentStatus(deploymentId: string): Promise<{
  status: 'building' | 'ready' | 'error'
  url?: string
}> {
  const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery()}`, {
    headers: headers(),
  })
  const data = await res.json()

  if (data.readyState === 'READY') return { status: 'ready', url: `https://${data.url}` }
  if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') return { status: 'error' }
  return { status: 'building' }
}

async function waitForDeployment(deploymentId: string, maxWait = 60000): Promise<string> {
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery()}`, {
      headers: headers(),
    })
    const data = await res.json()

    if (data.readyState === 'READY') {
      return `https://${data.url}`
    }
    if (data.readyState === 'ERROR') {
      throw new Error('Vercel deployment failed')
    }

    await new Promise(r => setTimeout(r, 2000))  // poll every 2s
  }

  throw new Error('Deployment timeout')
}

// ─── Add custom domain to a Vercel project ────────────────────────────────────
export async function addCustomDomain(projectId: string, domain: string) {
  const res = await fetch(`${VERCEL_API}/v9/projects/${projectId}/domains${teamQuery()}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: domain }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Domain error: ${err.error?.message}`)
  }
  return res.json()
}

// ─── Alternative: Netlify deploy (simpler for static) ─────────────────────────
// If you prefer Netlify over Vercel, here's the equivalent:
//
// export async function deploySiteToNetlify({ siteId, html }) {
//   // 1. Create site: POST https://api.netlify.com/api/v1/sites
//   // 2. Deploy:      POST https://api.netlify.com/api/v1/sites/{siteId}/deploys
//   // Auth header:    Authorization: Bearer NETLIFY_ACCESS_TOKEN
// }
