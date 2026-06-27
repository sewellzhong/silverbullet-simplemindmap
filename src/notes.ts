import type { MindMapDocument, MindMapNode } from "./model.ts"

const NOTE_FIELD = "note"
const NOTE_HTML_FIELD = "noteHtml"

export type MarkdownRenderer = (markdownText: string) => Promise<string>

export async function renderNoteMarkdown(
  document: MindMapDocument,
  renderMarkdown: MarkdownRenderer,
): Promise<MindMapDocument> {
  return {
    ...document,
    root: await renderNodeNoteMarkdown(document.root, renderMarkdown),
  }
}

async function renderNodeNoteMarkdown(
  node: MindMapNode,
  renderMarkdown: MarkdownRenderer,
): Promise<MindMapNode> {
  const note = node.data[NOTE_FIELD]
  const data =
    typeof note === "string" && note.trim()
      ? { ...node.data, [NOTE_HTML_FIELD]: await renderMarkdown(note) }
      : node.data
  return {
    ...node,
    data,
    children: await Promise.all(
      node.children.map((child) => renderNodeNoteMarkdown(child, renderMarkdown)),
    ),
  }
}
