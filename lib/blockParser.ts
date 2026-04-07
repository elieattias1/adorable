// ─── Block Parser ──────────────────────────────────────────────────────────────
// Splits generated React/TSX code into named sections (blocks) by detecting
// {/* Comment */} markers, then extracts editable texts and image URLs per block.

export interface EditableText {
  id: string
  original: string  // the exact string to find-and-replace in the code
  value: string     // current displayed value (trimmed)
}

export interface EditableImage {
  id: string
  original: string  // the exact src="..." or url(...) string
  url: string       // just the URL
}

export interface Block {
  id: string
  label: string
  code: string
  texts: EditableText[]
  images: EditableImage[]
  hidden: boolean
}

interface ParseResult {
  preamble: string   // everything before the first block comment
  blocks: Block[]
  postamble: string  // closing tags after the last block
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractTexts(code: string): EditableText[] {
  const results: EditableText[] = []
  const seen = new Set<string>()
  let id = 0

  // Match text nodes between JSX tags: >some text<
  // Excludes: pure whitespace, very short strings, numeric-only, JSX expressions
  const re = />([^<>{}\n\r]{4,120})</g
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    const raw = m[1]
    const trimmed = raw.trim()
    // Skip if: empty, looks like code/class, already seen, or pure punctuation
    if (!trimmed) continue
    if (seen.has(trimmed)) continue
    if (/^[\s\d\W]+$/.test(trimmed)) continue  // only symbols/numbers
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue
    seen.add(trimmed)
    results.push({ id: `t${id++}`, original: m[0], value: trimmed })
  }

  return results
}

function extractImages(code: string): EditableImage[] {
  const results: EditableImage[] = []
  const seen = new Set<string>()
  let id = 0

  // src="https://..."
  const srcRe = /src=["'](https?:\/\/[^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = srcRe.exec(code)) !== null) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    results.push({ id: `i${id++}`, original: m[0], url })
  }

  // backgroundImage: 'url(https://...)'
  const bgRe = /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/g
  while ((m = bgRe.exec(code)) !== null) {
    const url = m[1]
    if (seen.has(url)) continue
    seen.add(url)
    results.push({ id: `i${id++}`, original: m[0], url })
  }

  return results
}

function labelToId(label: string, index: number): string {
  return `block-${index}-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

// ─── Main parser ───────────────────────────────────────────────────────────────

export function parseBlocks(fullCode: string): ParseResult {
  // Split on JSX block comments: {/* ... */}
  // We use a regex that captures the comment itself
  const commentRe = /(\{\/\*[^*]*(?:\*(?!\/)[^*]*)*\*\/\})/g

  const parts: string[] = []
  const comments: string[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = commentRe.exec(fullCode)) !== null) {
    parts.push(fullCode.slice(lastIndex, m.index))
    comments.push(m[1])
    lastIndex = m.index + m[0].length
  }
  parts.push(fullCode.slice(lastIndex)) // remainder after last comment

  // If no comments found, treat the whole thing as one block
  if (comments.length === 0) {
    return {
      preamble: '',
      blocks: [{
        id: 'block-0-main',
        label: 'Page',
        code: fullCode,
        texts: extractTexts(fullCode),
        images: extractImages(fullCode),
        hidden: false,
      }],
      postamble: '',
    }
  }

  // parts[0] = preamble (before first comment)
  // parts[i] = content after comments[i-1]
  const preamble = parts[0]

  // Last part may contain closing tags like </div>\n  )\n}
  // We try to detect the postamble as the closing of the root return
  // For simplicity, treat the very end after the last block as postamble
  const blocks: Block[] = []
  for (let i = 0; i < comments.length; i++) {
    const label = comments[i]
      .replace(/^\{\/\*\s*/, '')
      .replace(/\s*\*\/\}$/, '')
      .trim()

    // Content: everything from after this comment to before next comment
    // (already in parts[i+1])
    const code = (parts[i + 1] || '').trimEnd()

    // Try to detect postamble in the last block: closing `  )\n}`
    // We'll handle this by keeping full content and stripping on reconstruct

    blocks.push({
      id: labelToId(label, i),
      label,
      code,
      texts: extractTexts(code),
      images: extractImages(code),
      hidden: false,
    })
  }

  return { preamble, blocks, postamble: '' }
}

// ─── Reconstruct ──────────────────────────────────────────────────────────────

export function reconstructCode(preamble: string, blocks: Block[]): string {
  const visibleBlocks = blocks.filter(b => !b.hidden)
  const blockParts = visibleBlocks.map(b => `{/* ${b.label} */}\n${b.code}`)
  return preamble + blockParts.join('')
}

// ─── Apply text edit ──────────────────────────────────────────────────────────

export function applyTextEdit(block: Block, textId: string, newValue: string): Block {
  const text = block.texts.find(t => t.id === textId)
  if (!text) return block

  // Replace in the block code: find the original match and substitute the new value
  // The original is ">old text<", we want ">new text<"
  const newOriginal = text.original.replace(text.value, newValue)
  const newCode = block.code.replace(text.original, newOriginal)

  return {
    ...block,
    code: newCode,
    texts: block.texts.map(t =>
      t.id === textId
        ? { ...t, value: newValue, original: newOriginal }
        : t
    ),
  }
}

// ─── Apply image edit ─────────────────────────────────────────────────────────

export function applyImageEdit(block: Block, imageId: string, newUrl: string): Block {
  const img = block.images.find(i => i.id === imageId)
  if (!img) return block

  const newOriginal = img.original.replace(img.url, newUrl)
  const newCode = block.code.replace(img.original, newOriginal)

  return {
    ...block,
    code: newCode,
    images: block.images.map(i =>
      i.id === imageId
        ? { ...i, url: newUrl, original: newOriginal }
        : i
    ),
  }
}
