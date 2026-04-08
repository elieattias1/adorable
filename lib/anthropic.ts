// ─── Barrel re-export ─────────────────────────────────────────────────────────
// All logic lives in lib/ai/* — import from there for new code.

export { anthropic }                                from './ai/client'
export type { DesignTokens, SectionSpec, SiteManifest, ToolResult } from './ai/types'
export { getDesignPreset, getDesignPresetForManifest } from './ai/design-presets'
export { MANIFEST_TOOL, SECTION_TOOL, buildManifestPrompt, buildSectionPrompt, assembleSections } from './ai/manifest'
export { AGENT_TOOLS, executeTool, getToolMeta }    from './ai/tools'
export { buildAgentSystemPrompt, generateInitialSite } from './ai/agent'

// Backward-compat aliases (do not use in new code)
export { AGENT_TOOLS as SITE_TOOLS }                from './ai/tools'
export { buildAgentSystemPrompt as buildSystemPrompt } from './ai/agent'
