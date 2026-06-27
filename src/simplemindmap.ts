import { asset, system } from "@silverbulletmd/silverbullet/syscalls"
import type { CodeWidgetContent } from "@silverbulletmd/silverbullet/type/client"

import { PlugConfigSchema } from "./model.ts"
import { parseMindMapDocument } from "./parser.ts"
import type { RenderAssets } from "./render.ts"
import { renderDocumentWidget, renderErrorWidget } from "./render.ts"

const PLUG_NAME = "simplemindmap"

export async function renderMetadata(bodyText: string): Promise<CodeWidgetContent | null> {
  const [assets, config] = await Promise.all([readAssets(), readConfig()])
  const result = parseMindMapDocument(bodyText)
  if (!result.ok) {
    if (result.error.kind === "missing_metadata") {
      return null
    }
    return renderErrorWidget(result.error, config.height, assets)
  }
  return renderDocumentWidget(result.value, config, assets)
}

async function readAssets(): Promise<RenderAssets> {
  const [mindMapJs, mindMapCss, viewerCss] = await Promise.all([
    asset.readAsset(PLUG_NAME, "assets/simpleMindMap.umd.min.js"),
    asset.readAsset(PLUG_NAME, "assets/simpleMindMap.css"),
    asset.readAsset(PLUG_NAME, "assets/viewer.css"),
  ])
  return { mindMapJs, mindMapCss, viewerCss }
}

async function readConfig() {
  const raw = await system.getConfig(PLUG_NAME, {})
  return PlugConfigSchema.parse(raw)
}
