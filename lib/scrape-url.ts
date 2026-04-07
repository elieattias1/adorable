/**
 * Fetches a URL and extracts structured content for Claude to use as reference.
 * Returns null if the URL can't be fetched.
 */
export async function scrapeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const html = await res.text()

    // Extract title
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''

    // Extract meta description
    const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim()
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim()
      || ''

    // Extract OG tags
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const ogDesc  = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() || ''

    // Extract all headings
    const headings: string[] = []
    const hRegex = /<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi
    let hMatch
    while ((hMatch = hRegex.exec(html)) !== null && headings.length < 20) {
      const text = hMatch[1].trim()
      if (text) headings.push(text)
    }

    // Extract body text (strip tags, scripts, styles)
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)

    // Try to detect primary color from CSS
    const colorMatch = html.match(/(?:--primary|--color-primary|--brand)[^:]*:\s*(#[0-9a-f]{3,6}|rgb[^;]+)/i)
    const primaryColor = colorMatch?.[1]?.trim() || ''

    const parts = [
      `URL de référence : ${url}`,
      title       && `Titre : ${title}`,
      ogTitle     && ogTitle !== title && `OG Titre : ${ogTitle}`,
      desc        && `Description : ${desc}`,
      ogDesc      && ogDesc !== desc && `OG Description : ${ogDesc}`,
      primaryColor && `Couleur principale détectée : ${primaryColor}`,
      headings.length > 0 && `Titres de la page :\n${headings.map(h => `- ${h}`).join('\n')}`,
      bodyText    && `Contenu textuel :\n${bodyText}`,
    ].filter(Boolean)

    return parts.join('\n\n')
  } catch {
    return null
  }
}

/** Extracts the first HTTP(S) URL from a string */
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/i)
  return match?.[0] || null
}
