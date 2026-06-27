import { describe, expect, it } from "bun:test"

import type { MindMapDocument } from "../src/model.ts"
import { renderNoteMarkdown } from "../src/notes.ts"

const NOTE_HTML_FIELD = "noteHtml"
const NOTE_FIELD = "note"

describe("renderNoteMarkdown", () => {
  it("renders node notes as markdown html while preserving the original note", async () => {
    const document: MindMapDocument = {
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
        template: "classic",
        config: {},
      },
      layout: "logicalStructure",
    }

    const rendered = await renderNoteMarkdown(
      document,
      async (markdownText) => `<ul><li>${markdownText.split("\n").join("</li><li>")}</li></ul>`,
    )

    const noteNode = rendered.root.children[0]
    expect(noteNode?.data[NOTE_FIELD]).toBe("* test\n* tt")
    expect(noteNode?.data[NOTE_HTML_FIELD]).toBe("<ul><li>* test</li><li>* tt</li></ul>")
  })
})
