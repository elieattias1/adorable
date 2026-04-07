/**
 * Unsplash image fetcher.
 * Set UNSPLASH_ACCESS_KEY in .env.local (free tier = 50 req/hour)
 * https://unsplash.com/developers
 */

const BASE = 'https://api.unsplash.com'

export async function fetchUnsplashImage(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const url = `${BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=${orientation}&client_id=${key}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.urls?.regular ?? null
  } catch {
    return null
  }
}

/**
 * Enrich a generated schema with real Unsplash images.
 * Called after Claude generates the initial schema.
 */
export async function enrichSchemaWithImages(schema: any, siteType: string, siteName: string): Promise<any> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return schema

  const enriched = structuredClone(schema)

  // Parallel fetches for all image slots
  const tasks: Promise<void>[] = []

  for (let i = 0; i < enriched.sections?.length; i++) {
    const section = enriched.sections[i]

    // Hero — add a background image if none
    if (section.type === 'hero' && !section.image) {
      const query = `${siteName} ${siteType} professional`
      tasks.push(
        fetchUnsplashImage(query, 'landscape').then(url => {
          if (url) enriched.sections[i].image = url
        })
      )
    }

    // Gallery items — fetch per label
    if (section.type === 'gallery') {
      for (let j = 0; j < section.items?.length; j++) {
        const item = section.items[j]
        if (!item.image && item.label) {
          const query = `${item.label} ${siteType}`
          tasks.push(
            fetchUnsplashImage(query, 'squarish').then(url => {
              if (url) enriched.sections[i].items[j].image = url
            })
          )
        }
      }
    }

    // Team members — fetch portrait photos
    if (section.type === 'team') {
      for (let j = 0; j < section.members?.length; j++) {
        const member = section.members[j]
        if (!member.image) {
          const gender = j % 2 === 0 ? 'man' : 'woman'
          tasks.push(
            fetchUnsplashImage(`professional ${gender} portrait`, 'squarish').then(url => {
              if (url) enriched.sections[i].members[j].image = url
            })
          )
        }
      }
    }
  }

  await Promise.all(tasks)
  return enriched
}
