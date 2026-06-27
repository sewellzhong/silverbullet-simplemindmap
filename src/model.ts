import { z } from "zod"

export const PlugConfigSchema = z.object({
  height: z.number().int().min(240).max(2000).default(720),
  fit: z.boolean().default(true),
  minScale: z.number().min(0.2).max(2).default(0.9),
  hideSourceSections: z.boolean().default(true),
  readabilityOverrides: z.boolean().default(false),
  theme: z.string().min(1).optional(),
})

export type PlugConfig = z.infer<typeof PlugConfigSchema>

export const MindMapNodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z
    .object({
      data: z
        .object({
          text: z.string().default(""),
        })
        .passthrough(),
      children: z.array(MindMapNodeSchema).default([]),
    })
    .passthrough(),
)

export type MindMapNode = {
  readonly data: {
    readonly text: string
    readonly [key: string]: unknown
  }
  readonly children: readonly MindMapNode[]
  readonly [key: string]: unknown
}

export const MindMapDocumentSchema = z.object({
  root: MindMapNodeSchema,
  theme: z
    .object({
      template: z.string().min(1).default("classic13"),
      config: z.record(z.string(), z.unknown()).default({}),
    })
    .default({ template: "classic13", config: {} }),
  layout: z.string().min(1).default("logicalStructure"),
})

export type MindMapDocument = z.infer<typeof MindMapDocumentSchema>

export type SmmSections = {
  readonly metadata: string
  readonly svgdata: string
  readonly linkdata: readonly string[]
  readonly textdata: string
}

export type SmmParseError =
  | { readonly kind: "missing_metadata" }
  | { readonly kind: "invalid_compression" }
  | { readonly kind: "invalid_json"; readonly message: string }
  | { readonly kind: "invalid_document"; readonly message: string }

export function parseErrorMessage(error: SmmParseError): string {
  switch (error.kind) {
    case "missing_metadata":
      return "This block does not contain SimpleMindMap metadata."
    case "invalid_compression":
      return "The SimpleMindMap metadata could not be decompressed."
    case "invalid_json":
      return `The decompressed SimpleMindMap data is not valid JSON: ${error.message}`
    case "invalid_document":
      return `The SimpleMindMap data is not a supported document: ${error.message}`
    default:
      return assertNever(error)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`)
}
