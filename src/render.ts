import type { MindMapDocument, PlugConfig, SmmParseError } from "./model.ts"
import { parseErrorMessage } from "./model.ts"

export type RenderAssets = {
  readonly mindMapJs: string
  readonly mindMapCss: string
  readonly viewerCss: string
}

export function renderDocumentWidget(
  document: MindMapDocument,
  config: PlugConfig,
  assets: RenderAssets,
): { readonly html: string; readonly script: string; readonly height: number } {
  const data = withConfigOverrides(document, config)
  return {
    html: viewerHtml(config.height, assets),
    script: viewerScript(data, config, assets.mindMapJs),
    height: config.height,
  }
}

export function renderErrorWidget(
  error: SmmParseError,
  height: number,
  assets: Pick<RenderAssets, "viewerCss">,
): { readonly html: string; readonly script: string; readonly height: number } {
  return {
    html: `${styleTag(assets.viewerCss)}<div class="smm-state smm-state-error"><strong>SimpleMindMap</strong><span>${escapeHtml(
      parseErrorMessage(error),
    )}</span></div>`,
    script: "",
    height,
  }
}

function viewerHtml(height: number, assets: RenderAssets): string {
  return `${styleTag(assets.mindMapCss)}${styleTag(assets.viewerCss)}<div class="smm-viewer" style="height: ${height}px"><div id="smm-map" class="smm-map"></div><div class="smm-state" id="smm-loading">Loading mind map...</div></div>`
}

function viewerScript(document: MindMapDocument, config: PlugConfig, mindMapJs: string): string {
  return `
${mindMapJs}
const data = ${JSON.stringify(document)};
const options = ${JSON.stringify(config)};
const container = document.getElementById("smm-map");
const loading = document.getElementById("smm-loading");
const MindMapCtor = globalThis.simpleMindMap?.default || globalThis.simpleMindMap;
if (!container || !MindMapCtor) {
  throw new Error("SimpleMindMap runtime failed to initialize");
}
const canvasColor = getComputedStyle(document.documentElement).getPropertyValue("--smm-canvas").trim();
const themeConfig = {
  ...data.theme.config,
  backgroundColor: data.theme.config.backgroundColor ?? canvasColor,
};
const mindMap = new MindMapCtor({
  el: container,
  data: data.root,
  layout: data.layout,
  theme: data.theme.template,
  themeConfig,
  readonly: true,
  fit: options.fit,
  mousewheelAction: "zoom",
});
loading?.remove();
const resizeObserver = new ResizeObserver(() => mindMap.resize());
resizeObserver.observe(container);
document.addEventListener("click", () => {
  api({ type: "blur" });
});
window.addEventListener("unload", () => {
  resizeObserver.disconnect();
  mindMap.destroy();
});
setTimeout(() => {
  mindMap.resize();
  if (options.fit) {
    mindMap.view.fit();
  }
}, 0);
setTimeout(() => {
  mindMap.resize();
  if (options.fit) {
    mindMap.view.fit();
  }
}, 120);
`
}

function withConfigOverrides(document: MindMapDocument, config: PlugConfig): MindMapDocument {
  return {
    ...document,
    theme: {
      ...document.theme,
      template: config.theme ?? document.theme.template,
    },
  }
}

function styleTag(css: string): string {
  return `<style>${css}</style>`
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
