import { describe, expect, it } from "bun:test"

import type { MindMapDocument, PlugConfig } from "../src/model.ts"
import { renderDocumentWidget } from "../src/render.ts"

const DOCUMENT: MindMapDocument = {
  root: {
    data: { text: "Root" },
    children: [],
  },
  theme: {
    template: "classic13",
    config: {},
  },
  layout: "logicalStructure",
}

const CONFIG: PlugConfig = {
  height: 520,
  fit: true,
}

describe("renderDocumentWidget", () => {
  it("falls back to the bundled default theme when Obsidian stores an unavailable theme", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain('"template":"default"')
    expect(widget.script).not.toContain("classic13")
  })
})
