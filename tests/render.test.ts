import { describe, expect, it } from "bun:test"

import type { MindMapDocument, PlugConfig } from "../src/model.ts"
import { renderDocumentWidget } from "../src/render.ts"

const DOCUMENT: MindMapDocument = {
  root: {
    data: { text: "Root" },
    children: [
      {
        data: { text: "Branch", note: "* test\n* tt" },
        children: [],
      },
    ],
  },
  theme: {
    template: "classic13",
    config: {},
  },
  layout: "logicalStructure",
}

const CONFIG: PlugConfig = {
  height: 720,
  fit: true,
  minScale: 0.9,
  hideSourceSections: true,
  readabilityOverrides: false,
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

  it("adds Obsidian classic theme defaults when the saved document omits theme config", () => {
    const widget = renderDocumentWidget(
      {
        ...DOCUMENT,
        theme: {
          template: "classic",
          config: {},
        },
      },
      CONFIG,
      {
        mindMapJs: "",
        mindMapCss: "",
        viewerCss: "",
      },
    )

    expect(widget.script).toContain('"fillColor":"rgb(233, 223, 152)"')
    expect(widget.script).toContain('"fillColor":"rgb(164, 197, 192)"')
    expect(widget.script).toContain('"color":"#fff","fontWeight":"bold"')
  })

  it("preserves saved node styles by default", () => {
    const widget = renderDocumentWidget(
      {
        ...DOCUMENT,
        theme: {
          ...DOCUMENT.theme,
          config: {
            root: { fontSize: 30 },
            node: { color: "#333333" },
          },
        },
      },
      CONFIG,
      {
        mindMapJs: "",
        mindMapCss: "",
        viewerCss: "",
      },
    )

    expect(widget.script).toContain('"root":{"fontSize":30}')
    expect(widget.script).not.toContain('"second":{"fontSize":22}')
    expect(widget.script).toContain('"node":{"color":"#333333"}')
  })

  it("adds readable theme defaults only when configured", () => {
    const widget = renderDocumentWidget(
      {
        ...DOCUMENT,
        theme: {
          ...DOCUMENT.theme,
          config: {
            root: { fontSize: 30 },
            node: { color: "#333333" },
          },
        },
      },
      { ...CONFIG, readabilityOverrides: true },
      {
        mindMapJs: "",
        mindMapCss: "",
        viewerCss: "",
      },
    )

    expect(widget.script).toContain('"root":{"fontSize":30}')
    expect(widget.script).toContain('"second":{"fontSize":22}')
    expect(widget.script).toContain('"node":{"fontSize":18,"color":"#333333"}')
  })

  it("keeps the inline map readable after fitting", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.html).toContain("height: 720px")
    expect(widget.script).toContain("mindMap.view.setScale(options.minScale)")
    expect(widget.script).toContain("mindMap.renderer.setRootNodeCenter()")
    expect(widget.script).toContain("minZoomRatio: Math.round(options.minScale * 100)")
  })

  it("tries to hide Obsidian source sections from the SilverBullet page", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain("scheduleSourceHiding()")
    expect(widget.script).toContain("MutationObserver")
    expect(widget.script).toContain(".smm-source-hidden{display:none!important}")
    expect(widget.script).toContain('isSectionHeader(node, "metadata")')
    expect(widget.script).toContain("hideEmbeddedImageErrors")
    expect(widget.script).toContain(".smm-embed-image-files")
    expect(widget.script).toContain("Failed to parse url")
  })

  it("renders note metadata with a visible readonly note affordance", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain('"note":"* test\\n* tt"')
    expect(widget.script).toContain("noteIcon:")
    expect(widget.script).toContain("nodeNoteTooltipZIndex")
    expect(widget.html).toContain("smm-note-tooltip")
  })

  it("injects styles for rich text nodes rendered inside SVG foreignObject", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: ".smm-map foreignObject p { margin: 0; color: inherit; }",
    })

    expect(widget.html).toContain(".smm-map foreignObject p")
  })

  it("infers the canvas background from the SilverBullet page theme", () => {
    const widget = renderDocumentWidget(DOCUMENT, CONFIG, {
      mindMapJs: "",
      mindMapCss: "",
      viewerCss: "",
    })

    expect(widget.script).toContain("getParentCanvasColor()")
    expect(widget.script).toContain('return isDarkColor(parentBackground) ? "#2f3438" : "#f7f8fa"')
  })
})
