// Core types for the sequential generation pipeline

export type DesignTokens = {
  mode:        'dark' | 'light'
  bg:          string   // page background
  surface:     string   // card / panel bg
  accent:      string   // primary CTA color
  accentHover: string
  headingText: string
  bodyText:    string
  mutedText:   string
  border:      string
  headingFont: 'Playfair Display' | 'Inter'
  radius:      string   // e.g. "rounded-2xl"
  tone:        string   // e.g. "luxurious, warm, Michelin"
}

export type SectionSpec = {
  id:        string   // "hero"
  component: string   // "HeroSection"
  spec:      string   // natural language description
}

export type SiteManifest = {
  businessName: string
  industry:     string
  design:       DesignTokens
  sections:     SectionSpec[]
  unsplashUrls: string[]
}

// Agent tool execution result
export type ToolResult = {
  code?:        string
  note?:        string
  askQuestion?: string
  askOptions?:  string[]
  error?:       string
  info?:        string
}
