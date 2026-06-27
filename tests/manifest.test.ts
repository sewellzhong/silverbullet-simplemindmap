import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const MANIFEST = readFileSync(join(import.meta.dir, "..", "simplemindmap.plug.yaml"), "utf8")

describe("simplemindmap plug manifest", () => {
  it("registers only the inline metadata code widget", () => {
    expect(MANIFEST).toContain("codeWidget: metadata")
    expect(MANIFEST).not.toContain("showPanel")
    expect(MANIFEST).not.toContain("editor:pageLoaded")
    expect(MANIFEST).not.toContain("editor:pageReloaded")
    expect(MANIFEST).not.toContain("Preview Current Page")
  })
})
