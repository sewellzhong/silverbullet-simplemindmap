import { describe, expect, it } from "bun:test"

import { isSimpleMindMapPage } from "../src/page.ts"

describe("isSimpleMindMapPage", () => {
  it("detects pages tagged as simplemindmap", () => {
    const pageText = `---
tags:
  - simplemindmap
---
# metadata
\`\`\`metadata
encoded
\`\`\`
# svgdata
# linkdata
# textdata`

    expect(isSimpleMindMapPage(pageText)).toBe(true)
  })

  it("detects Obsidian SimpleMindMap section structure without a tag", () => {
    const pageText = `# metadata
\`\`\`metadata
encoded
\`\`\`
# svgdata
# linkdata
# textdata`

    expect(isSimpleMindMapPage(pageText)).toBe(true)
  })

  it("does not detect ordinary markdown", () => {
    expect(isSimpleMindMapPage("# Ordinary note")).toBe(false)
  })
})
