import { describe, expect, it } from "bun:test"

import { PlugConfigSchema } from "../src/model.ts"

describe("PlugConfigSchema", () => {
  it("defaults to inline rendering without modal preview settings", () => {
    const config = PlugConfigSchema.parse({})

    expect(config).toEqual({
      height: 720,
      fit: true,
      minScale: 1.35,
      hideSourceSections: true,
    })
    expect("autoPreview" in config).toBe(false)
  })
})
