const SIMPLEMINDMAP_TAGS = ["simplemindmap", "simple-mind-map"] as const
const REQUIRED_SECTIONS = ["# metadata", "# svgdata", "# linkdata", "# textdata"] as const

export function isSimpleMindMapPage(pageText: string): boolean {
  return hasSimpleMindMapTag(pageText) || hasSimpleMindMapSections(pageText)
}

function hasSimpleMindMapTag(pageText: string): boolean {
  const frontmatter = extractFrontmatter(pageText)
  if (!frontmatter) {
    return false
  }
  return SIMPLEMINDMAP_TAGS.some((tag) => frontmatter.includes(tag))
}

function extractFrontmatter(pageText: string): string | undefined {
  if (!pageText.startsWith("---\n")) {
    return undefined
  }
  const end = pageText.indexOf("\n---", 4)
  if (end === -1) {
    return undefined
  }
  return pageText.slice(4, end).toLowerCase()
}

function hasSimpleMindMapSections(pageText: string): boolean {
  const normalized = pageText.toLowerCase()
  return REQUIRED_SECTIONS.every((section) => normalized.includes(section))
}
