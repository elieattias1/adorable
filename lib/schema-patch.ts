import type { SiteSchema } from '@/types/site-schema'

export interface FieldPatch { path: string; value: string }

/**
 * Apply a dot-notation path update to a schema.
 * e.g. applyPatch(schema, 'sections.0.title', 'New Title')
 */
export function applyPatch(schema: SiteSchema, path: string, value: string): SiteSchema {
  // Guard: image fields must be valid URLs
  if (path.endsWith('.image') || path.endsWith('.imageUrl')) {
    if (value && !value.startsWith('http')) {
      console.warn(`[schema-patch] Rejected invalid image URL at ${path}: "${value}"`)
      return schema
    }
  }

  const clone = JSON.parse(JSON.stringify(schema))
  const parts = path.split('.')
  let cur: any = clone
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const n = Number(key)
    cur = isNaN(n) ? cur[key] : cur[n]
    if (cur == null) return schema // path doesn't exist, bail
  }
  const last = parts[parts.length - 1]
  const lastN = Number(last)

  // Coerce value to match the existing field's type (booleans, numbers)
  const existing = isNaN(lastN) ? cur[last] : cur[lastN]
  let coerced: any = value
  if (typeof existing === 'boolean') {
    coerced = value === 'true' || value === '1'
  } else if (typeof existing === 'number') {
    const n = Number(value)
    if (!isNaN(n)) coerced = n
  } else if (value === '' || value === 'null') {
    // Treat empty string or "null" as field removal
    coerced = undefined
  }

  if (isNaN(lastN)) cur[last] = coerced
  else cur[lastN] = coerced
  return clone
}

/** Apply an array of patches at once */
export function applyPatches(schema: SiteSchema, patches: FieldPatch[]): SiteSchema {
  return patches.reduce((s, p) => applyPatch(s, p.path, p.value), schema)
}
