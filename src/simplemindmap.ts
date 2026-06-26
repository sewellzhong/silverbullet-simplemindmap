import { asset, editor, space, system } from "@silverbulletmd/silverbullet/syscalls"
import type { CodeWidgetContent } from "@silverbulletmd/silverbullet/type/client"

import { PlugConfigSchema } from "./model.ts"
import { isSimpleMindMapPage } from "./page.ts"
import { parseMindMapDocument, parseSmmPage } from "./parser.ts"
import type { RenderAssets } from "./render.ts"
import { renderDocumentWidget, renderErrorWidget } from "./render.ts"

const PLUG_NAME = "simplemindmap"
const PREVIEW_HEIGHT = 760

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

export async function autoPreviewPage(pageName?: string): Promise<void> {
  const currentPage = pageName ?? (await editor.getCurrentPage())
  const [assets, config, pageText] = await Promise.all([
    readAssets(),
    readConfig(),
    space.readPage(currentPage),
  ])
  if (!config.autoPreview || !isSimpleMindMapPage(pageText)) {
    return
  }
  await showPreview(pageText, assets, config)
}

export async function previewCurrentPage(): Promise<void> {
  const [pageName, assets, config] = await Promise.all([
    editor.getCurrentPage(),
    readAssets(),
    readConfig(),
  ])
  const pageText = await space.readPage(pageName)
  await showPreview(pageText, assets, config)
}

async function showPreview(
  pageText: string,
  assets: RenderAssets,
  config: Awaited<ReturnType<typeof readConfig>>,
): Promise<void> {
  const result = parseSmmPage(pageText)
  const previewConfig = { ...config, height: Math.max(config.height, PREVIEW_HEIGHT) }
  const content = result.ok
    ? renderDocumentWidget(result.value, previewConfig, assets)
    : renderErrorWidget(result.error, previewConfig.height, assets)

  await editor.showPanel("modal", 100, content.html, content.script)
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
