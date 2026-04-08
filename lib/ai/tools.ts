import type Anthropic from '@anthropic-ai/sdk'
import { scrapeUrl as scrapeUrlSimple, scrapeUrlPlaywright, formatScrapeForAgent } from '../scrape'
import type { ToolResult } from './types'

// ─── Tool schemas ──────────────────────────────────────────────────────────────

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'write_code',
    description: `Writes or rewrites the COMPLETE React page component (App.tsx).

⚠️  ONLY use this for:
- Creating the initial site (no existing code)
- Full redesigns: user says "recommence", "refais tout", "change complètement le style"
- Global theme changes (dark↔light, complete color palette swap)

🚫 NEVER use this for:
- Nav changes (add/remove/reorder links) → use edit_code
- Text/title/price changes → use edit_code
- Color tweaks → use edit_code
- Adding or removing a single element → use edit_code or add_section/remove_section
- Any targeted change → use edit_code

The code runs in a browser iframe with:
- React 18 + TypeScript
- Tailwind CSS CDN (all classes including arbitrary values like bg-[#0d0900])
- lucide-react icons
- Google Fonts pre-loaded: Inter and Playfair Display`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: `Complete React TSX. Rules:
1. export default function App() { ... }
2. All sub-components in the same file
3. Only external imports: React/hooks and lucide-react
4. Tailwind classes only for styling (including arbitrary values)
5. Realistic images: use Unsplash URLs like https://images.unsplash.com/photo-[id]?w=1200&q=80
6. Content 100% realistic and specific to this business — never Lorem Ipsum
7. Initial creation: up to 1000 lines. Edits: up to 600 lines. Use data arrays to avoid repetition`,
        },
        note: { type: 'string', description: 'One-sentence summary of what was built/changed.' },
      },
      required: ['code', 'note'],
    },
  },

  {
    name: 'edit_code',
    description: `Makes targeted search/replace edits to the existing code. This is your DEFAULT tool for modifications.

Use this for (non-exhaustive — when in doubt, use this):
- Navigation: adding, removing, reordering, renaming nav links or buttons
- Changing any text, title, price, label, description
- Swapping a color or Tailwind class
- Adding/removing a single element (button, badge, icon, link)
- Changing the order of items in a list or section
- Any layout or spacing tweak within a section
- Moving an element from one place to another

Each edit is a search/replace: find an exact string in the current code and replace it.
Use multiple edits in one call for related changes.`,
    input_schema: {
      type: 'object',
      properties: {
        edits: {
          type: 'array',
          description: 'Ordered list of search/replace operations',
          items: {
            type: 'object',
            properties: {
              search:  { type: 'string', description: 'Exact string to find (must appear exactly once)' },
              replace: { type: 'string', description: 'Replacement string' },
            },
            required: ['search', 'replace'],
          },
        },
        note: { type: 'string', description: 'One-sentence summary of changes.' },
      },
      required: ['edits', 'note'],
    },
  },

  {
    name: 'ask_user',
    description: `Asks the user ONE clarifying question when their request is genuinely ambiguous.
Use ONLY when you truly cannot infer intent.
Do NOT ask if you can make a reasonable creative decision.
Always offer 2–3 concrete options to make it easy to answer.`,
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask the user' },
        options:  { type: 'array', items: { type: 'string' }, description: '2-3 concrete answer options' },
      },
      required: ['question'],
    },
  },

  {
    name: 'remove_section',
    description: `Removes an entire named section component from the site.
Use when the user wants to delete a specific section (FAQ, gallery, testimonials, pricing, etc.).
Automatically removes BOTH the function definition AND its JSX usage in App().
Much faster than write_code for deletions — use this instead.`,
    input_schema: {
      type: 'object',
      properties: {
        component: {
          type: 'string',
          description: 'Exact function name of the component to remove (e.g. "TestimonialsSection", "FaqSection")',
        },
        note: { type: 'string', description: 'One-sentence summary of what was removed.' },
      },
      required: ['component', 'note'],
    },
  },

  {
    name: 'add_section',
    description: `Adds a new section to the site without rewriting the whole file.
Write ONLY the new component code (50–150 lines). It will be inserted before or after the specified anchor component in App().
Use for adding FAQ, pricing, gallery, features, CTA, newsletter sections, etc.
Much faster than write_code for additions — use this instead.`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Complete TSX for the new section component. Must be a named function: function NewSection() { return <section>...</section> }. No imports needed.',
        },
        anchor:   { type: 'string', description: 'Component name to insert near (e.g. "FooterSection").' },
        position: { type: 'string', enum: ['before', 'after'], description: 'Whether to insert before or after the anchor component' },
        note:     { type: 'string', description: 'One-sentence summary of what was added.' },
      },
      required: ['code', 'anchor', 'position', 'note'],
    },
  },

  {
    name: 'scrape_website',
    description: `Scrapes an external website and returns its content, structure, and design metadata.
Use when the user wants to copy/replicate a website or use it as visual reference.
IMPORTANT: If the user's message already contains "[Contenu extrait]" for a URL, that URL has already been scraped — do NOT call this tool for it again.
After scraping, use write_code to create a similar site inspired by the data.`,
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL to scrape. Will add https:// automatically if missing.' },
      },
      required: ['url'],
    },
  },

  {
    name: 'search_unsplash',
    description: `Searches Unsplash for relevant photos and returns their direct CDN URLs.
Use BEFORE swapping images with edit_code to get contextually correct photos.
Example: search "italian restaurant pasta interior" then use edit_code to swap the URLs.`,
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'English search query. Be specific (e.g. "yoga studio sunrise stretch" not just "yoga")' },
        count: { type: 'number', description: 'Number of photos to return, 1-6. Default: 4' },
      },
      required: ['query'],
    },
  },
]

// ─── Tool execution ────────────────────────────────────────────────────────────

function removeFunctionBody(code: string, name: string): string {
  const fnRegex = new RegExp(`\\n(?:export )?function ${name}[\\s(]`)
  const fnMatch = fnRegex.exec(code)
  if (!fnMatch) return code
  let depth = 0, i = fnMatch.index, foundOpen = false
  while (i < code.length) {
    if (code[i] === '{') { depth++; foundOpen = true }
    if (code[i] === '}') { depth-- }
    if (foundOpen && depth === 0) return code.slice(0, fnMatch.index) + code.slice(i + 1)
    i++
  }
  return code
}

export async function executeTool(
  toolName:    string,
  toolInput:   Record<string, unknown>,
  currentCode: string,
): Promise<ToolResult> {
  try {
    switch (toolName) {

      case 'write_code': {
        const code = toolInput.code
        if (!code || typeof code !== 'string') return { error: 'Code invalide ou manquant' }
        return { code: code.trim(), note: toolInput.note as string }
      }

      case 'edit_code': {
        if (!currentCode) return { error: 'Pas de code existant à modifier' }
        const edits = toolInput.edits as Array<{ search: string; replace: string }>
        if (!Array.isArray(edits) || edits.length === 0) return { error: 'Aucune modification fournie' }

        let result = currentCode
        const failures: string[] = []

        for (const edit of edits) {
          if (!edit.search || typeof edit.search !== 'string') continue
          if (!result.includes(edit.search)) {
            failures.push(`"${edit.search.slice(0, 60).replace(/\n/g, '↵')}…"`)
            continue
          }
          result = result.replace(edit.search, edit.replace ?? '')
        }

        if (failures.length > 0 && result === currentCode) {
          return { error: `Texte introuvable : ${failures.join(', ')}` }
        }
        const note = ((toolInput.note as string) || '') + (failures.length ? ` (${failures.length} édit(s) ignoré(s))` : '')
        return { code: result, note }
      }

      case 'ask_user':
        return { askQuestion: toolInput.question as string, askOptions: toolInput.options as string[] }

      case 'remove_section': {
        const component = toolInput.component as string
        if (!component) return { error: 'Nom du composant manquant' }
        if (!currentCode) return { error: 'Pas de code existant' }

        let result = removeFunctionBody(currentCode, component)
        result = result.replace(new RegExp(`[ \t]*<${component}[^>]*/>\n?`, 'g'), '')
        result = result.replace(new RegExp(`[ \t]*<${component}[^>]*>[\\s\\S]*?</${component}>\n?`, 'g'), '')

        if (result === currentCode) return { error: `Composant "${component}" introuvable. Vérifie le nom exact.` }
        return { code: result, note: toolInput.note as string }
      }

      case 'add_section': {
        const sectionCode = (toolInput.code as string)?.trim()
        const anchor      = toolInput.anchor as string
        const position    = (toolInput.position as 'before' | 'after') ?? 'before'
        if (!sectionCode) return { error: 'code requis' }
        if (!anchor)      return { error: 'anchor requis' }
        if (!currentCode) return { error: 'Pas de code existant' }

        const nameMatch = /function\s+(\w+)\s*[(<]/.exec(sectionCode)
        if (!nameMatch) return { error: 'Le code doit contenir une fonction nommée, ex: function NewSection() {...}' }
        const newName = nameMatch[1]

        const appMarker = '\nexport default function App('
        const appIdx    = currentCode.indexOf(appMarker)
        if (appIdx === -1) return { error: 'export default function App() introuvable dans le code' }

        let result = currentCode.slice(0, appIdx) + '\n\n' + sectionCode + currentCode.slice(appIdx)

        const anchorTag = `<${anchor}`
        const anchorIdx = result.indexOf(anchorTag, appIdx)
        if (anchorIdx === -1) return { error: `Anchor "${anchor}" introuvable dans le JSX de App()` }

        const newJSX = `\n              <${newName} />`
        if (position === 'before') {
          result = result.slice(0, anchorIdx) + newJSX + '\n              ' + result.slice(anchorIdx)
        } else {
          const lines = result.split('\n')
          let offset = 0, insertAfterLine = -1
          for (let li = 0; li < lines.length; li++) {
            if (offset + lines[li].length >= anchorIdx) {
              for (let lj = li; lj < Math.min(li + 20, lines.length); lj++) {
                if (lines[lj].includes('/>') || lines[lj].includes(`</${anchor}>`)) {
                  insertAfterLine = lj; break
                }
              }
              if (insertAfterLine === -1) insertAfterLine = li
              break
            }
            offset += lines[li].length + 1
          }
          if (insertAfterLine === -1) insertAfterLine = lines.findIndex(l => l.includes(anchorTag))
          lines.splice(insertAfterLine + 1, 0, `              <${newName} />`)
          result = lines.join('\n')
        }
        return { code: result, note: toolInput.note as string }
      }

      case 'scrape_website': {
        const rawUrl = (toolInput.url as string)?.trim()
        if (!rawUrl) return { error: 'URL manquante' }
        const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
        try { new URL(normalizedUrl) } catch { return { error: `URL invalide : "${rawUrl}"` } }

        // Simple HTTP fetch first (works in production)
        const simpleResult = await scrapeUrlSimple(normalizedUrl)
        if (simpleResult) {
          return { info: `${simpleResult}\n\n─────\nScraping terminé. Utilise write_code pour recréer ce site en t'inspirant du contenu, des titres et de la structure ci-dessus.` }
        }

        // Fallback: Playwright
        const playwrightResult = await scrapeUrlPlaywright(normalizedUrl)
        if (!playwrightResult.ok) return { error: `Impossible de scraper ${normalizedUrl} : ${playwrightResult.error}` }
        return { info: `${formatScrapeForAgent(playwrightResult, normalizedUrl)}\n\n─────\nScraping terminé. Utilise write_code pour recréer ce site en t'inspirant du contenu, des titres, des couleurs et de la structure ci-dessus.` }
      }

      case 'search_unsplash': {
        const query     = toolInput.query as string
        const count     = Math.min(Math.max(Number(toolInput.count ?? 4), 1), 6)
        const accessKey = process.env.UNSPLASH_ACCESS_KEY

        if (!accessKey) {
          return { info: `Clé Unsplash non configurée (UNSPLASH_ACCESS_KEY). Utilise les URLs du design system déjà fournies.` }
        }

        const resp = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${accessKey}` } }
        )
        if (!resp.ok) return { error: `Unsplash API error ${resp.status}` }

        const data   = await resp.json() as { results: Array<{ urls: { raw: string }; alt_description: string }> }
        const photos = data.results ?? []
        if (photos.length === 0) return { error: `Aucune photo trouvée pour "${query}"` }

        const lines = photos.map((p, i) => {
          const url = `${p.urls.raw}&w=1200&h=800&fit=crop&q=80`
          return `${i + 1}. ${url}${p.alt_description ? `  ← ${p.alt_description}` : ''}`
        })
        return { info: `Photos Unsplash pour "${query}" :\n${lines.join('\n')}\n\nUtilise edit_code pour remplacer les URLs existantes dans le code.` }
      }

      default:
        return { error: `Outil inconnu : ${toolName}` }
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ─── Tool display metadata ────────────────────────────────────────────────────

export function getToolMeta(toolName: string, input: Record<string, unknown>): { icon: string; label: string } {
  switch (toolName) {
    case 'write_code':    return { icon: '⚡',  label: `Écriture du code : ${input.note || 'site complet'}` }
    case 'edit_code':     return { icon: '✏️',  label: `Modification : ${input.note || (Array.isArray(input.edits) ? input.edits.length + ' edit(s)' : '')}` }
    case 'ask_user':      return { icon: '💬',  label: 'Question de clarification' }
    case 'scrape_website':return { icon: '🌐',  label: `Scraping : ${input.url}` }
    case 'remove_section':return { icon: '🗑️', label: `Suppression : ${input.component || 'section'}` }
    case 'add_section':   return { icon: '➕',  label: `Ajout section : ${input.note || 'nouvelle section'}` }
    case 'search_unsplash':return { icon: '🖼️', label: `Recherche photos : "${input.query}"` }
    default:              return { icon: '🔧',  label: toolName }
  }
}
