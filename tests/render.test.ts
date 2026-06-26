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
  autoPreview: true,
  height: 520,
  fit: true,
}

describe("renderDocumentWidget", () => {
  it("preserves the theme stored by Obsidian", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain('"template":"classic13"')
    expect(widget.script).not.toContain('"template":"default"')
  })

  it("uses the configured theme only when it is explicitly set", () => {
    const widget = renderDocumentWidget(
      DOCUMENT,
      { ...CONFIG, theme: "classic" },
      {
        mindMapJs: "",
        mindMapCss: "",
        viewerCss: "",
      },
    )

    expect(widget.script).toContain('"template":"classic"')
  })

  it("injects the viewer canvas background when the document has no background", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain(
      "backgroundColor: data.theme.config.backgroundColor ?? canvasColor",
    )
  })
})
