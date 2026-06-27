import type { MindMapDocument, PlugConfig, SmmParseError } from "./model.ts"
import { parseErrorMessage } from "./model.ts"

const READABLE_THEME_DEFAULTS = {
  root: { fontSize: 24 },
  second: { fontSize: 22 },
  node: { fontSize: 18 },
} satisfies Record<string, Record<string, unknown>>

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
const canvasColor =
  getParentCanvasColor() ??
  getComputedStyle(document.documentElement).getPropertyValue("--smm-canvas").trim();
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
  minZoomRatio: Math.round(options.minScale * 100),
  mousewheelAction: "zoom",
});
loading?.remove();
hideSourceSections();
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
  refitMap();
}, 0);
setTimeout(() => {
  refitMap();
}, 120);

function refitMap() {
  mindMap.resize();
  if (options.fit) {
    mindMap.view.fit();
    if (mindMap.view.scale < options.minScale) {
      mindMap.view.setScale(options.minScale);
      mindMap.renderer.setRootNodeCenter();
    }
  }
}

function getParentCanvasColor() {
  if (!window.frameElement) {
    return undefined;
  }
  try {
    const parentBackground = window.parent.getComputedStyle(window.parent.document.body).backgroundColor;
    if (!parentBackground || parentBackground === "rgba(0, 0, 0, 0)" || parentBackground === "transparent") {
      return undefined;
    }
    return isDarkColor(parentBackground) ? "#2f3438" : "#f7f8fa";
  } catch (_error) {
    return undefined;
  }
}

function isDarkColor(color) {
  const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
  if (!match) {
    return false;
  }
  const red = Number(match[1]);
  const green = Number(match[2]);
  const blue = Number(match[3]);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
}

function hideSourceSections() {
  if (!options.hideSourceSections || !window.frameElement) {
    return;
  }
  let parentDocument;
  try {
    parentDocument = window.parent.document;
  } catch (_error) {
    return;
  }
  const frame = window.frameElement;
  const root = findSourceRoot(parentDocument, frame);
  if (!root) {
    return;
  }
  const style = parentDocument.getElementById("smm-source-hide-style") || parentDocument.createElement("style");
  style.id = "smm-source-hide-style";
  style.textContent = ".smm-source-hidden{display:none!important}";
  parentDocument.head.appendChild(style);
  const sourceNodes = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,ul,ol,li,p,div.cm-line"));
  const startIndex = sourceNodes.findIndex((node) => isSectionHeader(node, "metadata"));
  if (startIndex === -1) {
    return;
  }
  for (let index = startIndex; index < sourceNodes.length; index += 1) {
    const node = sourceNodes[index];
    if (node === frame || node.contains(frame)) {
      continue;
    }
    if (isMindMapWidget(node)) {
      continue;
    }
    node.classList.add("smm-source-hidden");
  }
}

function findSourceRoot(parentDocument, frame) {
  let current = frame.parentElement;
  while (current && current !== parentDocument.body) {
    const text = current.textContent.toLowerCase();
    if (text.includes("svgdata") && text.includes("linkdata") && text.includes("textdata")) {
      return current;
    }
    current = current.parentElement;
  }
  return parentDocument.body;
}

function isSectionHeader(node, sectionName) {
  const text = node.textContent.trim().toLowerCase();
  return text === sectionName || text === "# " + sectionName;
}

function isMindMapWidget(node) {
  return node.querySelector("iframe") || node.classList.contains("smm-viewer");
}
`
}

function withConfigOverrides(document: MindMapDocument, config: PlugConfig): MindMapDocument {
  return {
    ...document,
    theme: {
      ...document.theme,
      template: config.theme ?? document.theme.template,
      config: withReadableThemeDefaults(document.theme.config),
    },
  }
}

function withReadableThemeDefaults(themeConfig: Record<string, unknown>): Record<string, unknown> {
  return {
    ...themeConfig,
    root: mergeThemeSection(READABLE_THEME_DEFAULTS.root, themeSection(themeConfig, "root")),
    second: mergeThemeSection(READABLE_THEME_DEFAULTS.second, themeSection(themeConfig, "second")),
    node: mergeThemeSection(READABLE_THEME_DEFAULTS.node, themeSection(themeConfig, "node")),
  }
}

function themeSection(
  themeConfig: Record<string, unknown>,
  section: keyof typeof READABLE_THEME_DEFAULTS,
): unknown {
  return themeConfig[section]
}

function mergeThemeSection(
  defaults: Record<string, unknown>,
  section: unknown,
): Record<string, unknown> {
  if (!isRecord(section)) {
    return defaults
  }
  return { ...defaults, ...section }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
