import { describe, expect, it } from "bun:test"

import { PlugConfigSchema } from "../src/model.ts"

describe("PlugConfigSchema", () => {
  it("defaults to inline rendering without modal preview settings", () => {
    const config = PlugConfigSchema.parse({})

    expect(config).toEqual({
      height: 720,
      fit: true,
      minScale: 0.9,
      hideSourceSections: true,
      readabilityOverrides: false,
    })
    expect("autoPreview" in config).toBe(false)
  })
})
