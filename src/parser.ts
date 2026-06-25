import { decompressFromBase64 } from "lz-string"
import type { ZodError } from "zod"

import type { MindMapDocument, SmmParseError, SmmSections } from "./model.ts"
import { MindMapDocumentSchema } from "./model.ts"
import type { Result } from "./result.ts"
import { err, ok } from "./result.ts"

const SECTION_HEADERS = {
  metadata: "# metadata",
  svgdata: "# svgdata",
  linkdata: "# linkdata",
  textdata: "# textdata",
} as const

type SectionName = keyof typeof SECTION_HEADERS

export function parseSmmSections(pageText: string): SmmSections {
  const lines = pageText.split(/\r?\n/)
  const sections: Record<SectionName, string[]> = {
    metadata: [],
    svgdata: [],
    linkdata: [],
    textdata: [],
  }
  let current: SectionName | undefined
  let inFence = false

  for (const line of lines) {
    const header = detectHeader(line)
    if (header) {
      current = header
      inFence = false
      continue
    }
    if (!current) {
      continue
    }
    if (line.startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (current === "linkdata" && line.startsWith("- ")) {
      sections.linkdata.push(line.slice(2).trim())
      continue
    }
    if (current === "metadata" || current === "svgdata") {
      if (inFence) {
        sections[current].push(line)
      }
      continue
    }
    sections[current].push(line)
  }

  return {
    metadata: sections.metadata.join("\n").trim(),
    svgdata: sections.svgdata.join("\n").trim(),
    linkdata: sections.linkdata,
    textdata: sections.textdata.join("\n").trim(),
  }
}

export function parseMindMapDocument(encoded: string): Result<MindMapDocument, SmmParseError> {
  if (!encoded.trim()) {
    return err({ kind: "missing_metadata" })
  }
  const decompressed = decompressFromBase64(encoded)
  if (!decompressed) {
    return err({ kind: "invalid_compression" })
  }
  const raw = parseJson(decompressed)
  if (!raw.ok) {
    return raw
  }
  const parsed = MindMapDocumentSchema.safeParse(raw.value)
  if (!parsed.success) {
    return err({ kind: "invalid_document", message: formatZodError(parsed.error) })
  }
  return ok(parsed.data)
}

export function parseSmmPage(pageText: string): Result<MindMapDocument, SmmParseError> {
  return parseMindMapDocument(parseSmmSections(pageText).metadata)
}

function detectHeader(line: string): SectionName | undefined {
  const trimmed = line.trim()
  for (const key of Object.keys(SECTION_HEADERS)) {
    const section = parseSectionName(key)
    if (trimmed === SECTION_HEADERS[section]) {
      return section
    }
  }
  return undefined
}

function parseSectionName(value: string): SectionName {
  switch (value) {
    case "metadata":
      return "metadata"
    case "svgdata":
      return "svgdata"
    case "linkdata":
      return "linkdata"
    case "textdata":
      return "textdata"
    default:
      throw new Error(`Unknown section: ${value}`)
  }
}

function parseJson(text: string): Result<unknown, SmmParseError> {
  try {
    const raw: unknown = JSON.parse(text)
    return ok(raw)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err({ kind: "invalid_json", message: error.message })
    }
    throw error
  }
}

function formatZodError(error: ZodError): string {
  const firstIssue = error.issues[0]
  if (!firstIssue) {
    return "unknown schema error"
  }
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : ""
  return `${path}${firstIssue.message}`
}
