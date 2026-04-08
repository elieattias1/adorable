import type Anthropic from '@anthropic-ai/sdk'
import type { SiteManifest, SectionSpec } from './types'

// ─── Tool schemas ──────────────────────────────────────────────────────────────

export const MANIFEST_TOOL: Anthropic.Tool = {
  name: 'create_manifest',
  description: 'Creates the complete design manifest and ordered section plan for the site.',
  input_schema: {
    type: 'object' as const,
    properties: {
      businessName: { type: 'string' },
      industry:     { type: 'string' },
      design: {
        type: 'object' as const,
        properties: {
          mode:        { type: 'string', enum: ['dark', 'light'] },
          bg:          { type: 'string', description: 'CSS hex — page background' },
          surface:     { type: 'string', description: 'CSS hex — card/panel background' },
          accent:      { type: 'string', description: 'CSS hex — primary CTA color' },
          accentHover: { type: 'string', description: 'CSS hex — hover state of accent' },
          headingText: { type: 'string', description: 'CSS hex — heading text color' },
          bodyText:    { type: 'string', description: 'CSS hex — body text color' },
          mutedText:   { type: 'string', description: 'CSS hex — secondary/muted text' },
          border:      { type: 'string', description: 'Tailwind border class, e.g. border-white/10' },
          headingFont: { type: 'string', enum: ['Playfair Display', 'Inter'] },
          radius:      { type: 'string', description: 'Tailwind radius class, e.g. rounded-2xl' },
          tone:        { type: 'string', description: '3 adjectives describing the visual style' },
        },
        required: ['mode','bg','surface','accent','accentHover','headingText','bodyText','mutedText','border','headingFont','radius','tone'],
      },
      sections: {
        type: 'array' as const,
        description: 'Ordered list of sections. Typically starts with NavSection and ends with FooterSection, but omit them if the design concept calls for a full-screen or immersive layout with no traditional nav. 5-8 total.',
        items: {
          type: 'object' as const,
          properties: {
            id:        { type: 'string' },
            component: { type: 'string', description: 'PascalCase component name, e.g. HeroSection' },
            spec:      { type: 'string', description: '1-2 sentences: layout, content, and purpose of this section' },
          },
          required: ['id', 'component', 'spec'],
        },
      },
      unsplashUrls: {
        type: 'array' as const,
        description: 'List of Unsplash URLs to use across all sections',
        items: { type: 'string' },
      },
    },
    required: ['businessName', 'industry', 'design', 'sections', 'unsplashUrls'],
  },
}

export const SECTION_TOOL: Anthropic.Tool = {
  name: 'write_section',
  description: 'Writes a single React section component.',
  input_schema: {
    type: 'object' as const,
    properties: {
      code: { type: 'string', description: 'Complete React component code for this section only.' },
    },
    required: ['code'],
  },
}

// ─── Prompts ───────────────────────────────────────────────────────────────────

export function buildManifestPrompt(designPreset: string, templateContext = ''): string {
  return `Tu es un expert en design de sites web. Tu analyses une demande et produis un manifest complet.

${designPreset}
${templateContext}
RÈGLES :
- businessName : extrait ou déduis le nom exact du business depuis la demande
- industry : catégorie courte en anglais (restaurant, saas, medical, etc.)
- design : respecte STRICTEMENT les valeurs du design system ci-dessus — couleurs, typographie, radius
- tone : 3 adjectifs décrivant précisément le style visuel (ex: "luxurieux, chaleureux, gastronomique")
- sections : 5 à 8 sections adaptées au type de business
  → NavSection en premier et FooterSection en dernier dans la plupart des cas
  → Pour les designs immersifs / full-screen / TYPO-GIANT, tu peux omettre la nav classique et utiliser une approche différente (logo flottant, sidebar, etc.)
  → spec : décrit précisément le layout (SPLIT/FULLSCREEN/EDITORIAL/BENTO/TYPO-GIANT), le contenu, et l'objectif
  → Choisis les sections les plus pertinentes pour CE business — pas une liste générique
- unsplashUrls : utilise les URLs validées du design system ci-dessus

Appelle create_manifest avec le manifest complet.`
}

export function buildSectionPrompt(
  manifest:     SiteManifest,
  section:      SectionSpec,
  previousCode: string,
  formEndpoint: string | null,
  syntaxError?: string | null,
): string {
  const d    = manifest.design
  const urls = manifest.unsplashUrls ?? []
  const photosLine = urls.length > 0 ? `Photos Unsplash : ${urls.join(' | ')}` : ''

  return `Tu es un expert React/Tailwind. Tu écris UNE SEULE section : ${section.component}.

━━ DESIGN SYSTEM (ne jamais dévier de ces valeurs) ━━
Mode          : ${d.mode}
Fond page     : ${d.bg}
Fond surfaces : ${d.surface}
Accent        : ${d.accent}  (hover: ${d.accentHover})
Texte titres  : ${d.headingText}
Texte corps   : ${d.bodyText}
Texte muted   : ${d.mutedText}
Bordures      : ${d.border}
Police titres : ${d.headingFont}
Police corps  : Inter
Border radius : ${d.radius}
Ton visuel    : ${d.tone}
${photosLine}

━━ SITE ━━
Business : ${manifest.businessName}
Industrie : ${manifest.industry}

━━ SPEC DE CETTE SECTION ━━
${section.spec}

${previousCode ? `━━ SECTIONS DÉJÀ ÉCRITES (copie exactement leur style — mêmes couleurs hex, même espacement, même cohérence) ━━
\`\`\`tsx
${previousCode}
\`\`\`` : ''}

${formEndpoint && (section.id === 'contact' || section.id === 'reservation' || section.id === 'booking') ? `━━ FORMULAIRE ━━
Utilise exactement : fetch('${formEndpoint}', { method: 'POST', ... })` : ''}

━━ RÈGLES ABSOLUES ━━
1. Exporte UNIQUEMENT : export function ${section.component}() { ... }
2. PAS de default export — PAS d'autres exports
3. Imports autorisés : import { useState, useEffect, useRef } from 'react' et/ou import { IconName } from 'lucide-react'
4. Tailwind uniquement pour le style (valeurs arbitraires autorisées ex: bg-[${d.bg}])
5. Max 180 lignes — utilise des tableaux inline pour les données répétées
6. Contenu 100% réaliste et spécifique à ${manifest.businessName} — jamais Lorem Ipsum
7. Avatars témoignages : https://i.pravatar.cc/80?img=[1-70]
8. Sections spacieuses : py-20 minimum
9. Responsive : 1 colonne mobile, 2-3 colonnes desktop

${syntaxError ? `━━ ERREUR DE SYNTAXE À CORRIGER (tentative précédente rejetée) ━━
${syntaxError}

⚠️  Le code ci-dessus a été REJETÉ par le parser. Réécris ${section.component} en corrigeant cette erreur.
Causes fréquentes : apostrophes dans des strings single-quotées (utilise des backticks \`...\` ou échappe avec \\'), virgules manquantes, JSX mal fermé.
` : ''}Appelle write_section avec le code complet de ${section.component}.`
}

// ─── Section assembler ────────────────────────────────────────────────────────
// Merges individual section components into a single valid App.tsx

export function assembleSections(
  completedSections: Array<{ component: string; code: string }>,
): string {
  if (completedSections.length === 0) return ''

  const reactNames  = new Set<string>()
  const lucideNames = new Set<string>()
  const codeBlocks: string[] = []

  for (const { code } of completedSections) {
    const lines = code.split('\n')
    const body: string[] = []

    for (const line of lines) {
      const t = line.trim()
      if (t.startsWith('import') && (t.includes("'react'") || t.includes('"react"'))) {
        const m = t.match(/\{([^}]+)\}/)
        if (m) m[1].split(',').forEach(s => reactNames.add(s.trim()))
      } else if (t.startsWith('import') && t.includes('lucide')) {
        const m = t.match(/\{([^}]+)\}/)
        if (m) m[1].split(',').forEach(s => lucideNames.add(s.trim()))
      } else if (t === '') {
        if (body.length > 0 && body[body.length - 1] !== '') body.push('')
      } else {
        body.push(line.replace(/^export\s+(function|const)\s+/, '$1 '))
      }
    }
    codeBlocks.push(body.join('\n').trimEnd())
  }

  const imports: string[] = []
  if (reactNames.size  > 0) imports.push(`import { ${[...reactNames].join(', ')} } from 'react'`)
  if (lucideNames.size > 0) imports.push(`import { ${[...lucideNames].join(', ')} } from 'lucide-react'`)

  const appBody = completedSections.map(s => `      <${s.component} />`).join('\n')

  return [
    ...imports,
    '',
    codeBlocks.join('\n\n'),
    '',
    'export default function App() {',
    '  return (',
    '    <div>',
    appBody,
    '    </div>',
    '  )',
    '}',
  ].join('\n')
}
