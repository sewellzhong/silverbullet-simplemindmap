import { asset, markdown, system } from "@silverbulletmd/silverbullet/syscalls"
import type { CodeWidgetContent } from "@silverbulletmd/silverbullet/type/client"

import { PlugConfigSchema } from "./model.ts"
import { renderNoteMarkdown } from "./notes.ts"
import { parseMindMapDocument } from "./parser.ts"
import type { RenderAssets } from "./render.ts"
import { renderDocumentWidget, renderEmptyWidget, renderErrorWidget } from "./render.ts"

const PLUG_NAME = "simplemindmap"

export async function renderMetadata(
  bodyText: string,
  _pageName?: string,
): Promise<CodeWidgetContent | null> {
  const [assets, config] = await Promise.all([readAssets(), readConfig()])
  const result = parseMindMapDocument(bodyText)
  if (!result.ok) {
    if (result.error.kind === "missing_metadata") {
      return null
    }
    return renderErrorWidget(result.error, config.height, assets)
  }
  const document = await renderNoteMarkdown(result.value, markdown.markdownToHtml)
  return renderDocumentWidget(document, config, assets)
}

export async function renderSvgData(): Promise<CodeWidgetContent> {
  return renderEmptyWidget()
}

export async function renderSvgdata(): Promise<CodeWidgetContent> {
  return renderEmptyWidget()
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
