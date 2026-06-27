import type { MindMapDocument, PlugConfig, SmmParseError } from "./model.ts"
import { parseErrorMessage } from "./model.ts"

const READABLE_THEME_DEFAULTS = {
  root: { fontSize: 24 },
  second: { fontSize: 22 },
  node: { fontSize: 18 },
} satisfies Record<string, Record<string, unknown>>

const OBSIDIAN_THEME_DEFAULTS = {
  classic: {
    lineColor: "#fff",
    lineWidth: 3,
    generalizationLineWidth: 3,
    generalizationLineColor: "#fff",
    backgroundColor: "rgb(58, 65, 68)",
    backgroundImage:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRob2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYSVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzYgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MEM4OUE0NDQ4RDc4MTFFMzhDRkRBOEE4NEQ4M0U2QzciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MEM4OUE0NDU4RDc4MTFFMzhDRkRBOEE4NEQ4M0U2QzciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDMDhENTQ0RjhENzcxMUUzOENGREE4QTg0RDgzRTZDNyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDMDhENTQ1MDhENzcxMUUzOENGREE4QTg0RDgzRTZDNyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PnvT99wAAAAJUklEQVR42KycrRh5AIJDD/v/j+/AhEWeBUOwcHBGQIABAAB2xBrZKEJv8AAAAASUVORK5CYII=",
    backgroundRepeat: "repeat",
    backgroundSize: "auto",
    root: {
      fillColor: "rgb(233, 223, 152)",
      color: "#333",
      fontSize: 24,
      borderRadius: 21,
    },
    second: {
      fillColor: "rgb(164, 197, 192)",
      borderColor: "transparent",
      color: "#333",
      fontSize: 16,
      borderRadius: 10,
    },
    node: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "bold",
    },
    generalization: {
      fillColor: "#fff",
      borderColor: "transparent",
      color: "#333",
    },
  },
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

export function renderEmptyWidget(): {
  readonly html: string
  readonly script: string
  readonly height: number
} {
  return {
    html: "<style>html,body{margin:0;height:0;overflow:hidden;background:transparent}</style>",
    script: "",
    height: 1,
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
  enableFreeDrag: false,
});
loading?.remove();
scheduleSourceHiding();
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
    if (options.minScale > 0 && mindMap.view.scale < options.minScale) {
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

function scheduleSourceHiding() {
  hideSourceSections();
  setTimeout(hideSourceSections, 80);
  setTimeout(hideSourceSections, 320);
  if (!options.hideSourceSections || !window.frameElement) {
    return;
  }
  let parentDocument;
  try {
    parentDocument = window.parent.document;
  } catch (_error) {
    return;
  }
  const observer = new MutationObserver(() => hideSourceSections());
  observer.observe(parentDocument.body, { childList: true, subtree: true });
  window.addEventListener("unload", () => observer.disconnect(), { once: true });
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
  style.textContent = ".smm-source-hidden{display:none!important}.smm-widget-visible{display:block!important}";
  parentDocument.head.appendChild(style);
  const sourceNodes = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,ul,ol,li,p,blockquote,div.cm-line,.cm-line,.sb-line,.markdown-rendered > *,.markdown-preview-view > *"));
  const startIndex = sourceNodes.findIndex((node) => isSectionHeader(node, "metadata"));
  if (startIndex === -1) {
    hideKnownRawBlocks(root, frame);
    return;
  }
  for (let index = startIndex; index < sourceNodes.length; index += 1) {
    const node = sourceNodes[index];
    if (node === frame || node.contains(frame) || isFrameShell(node, frame)) {
      node.classList.add("smm-widget-visible");
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
    if (text.includes("metadata") && text.includes("svgdata") && text.includes("textdata")) {
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

function isFrameShell(node, frame) {
  return node.querySelector("iframe") === frame || node.classList.contains("sb-code-widget");
}

function hideKnownRawBlocks(root, frame) {
  const nodes = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,ul,ol,li,p,blockquote"));
  for (const node of nodes) {
    if (node === frame || node.contains(frame) || isMindMapWidget(node)) {
      continue;
    }
    const text = node.textContent.trim().toLowerCase();
    if (text === "svgdata" || text === "linkdata" || text === "textdata" || text.startsWith("请勿修改除yaml外")) {
      node.classList.add("smm-source-hidden");
      continue;
    }
    const previous = node.previousElementSibling;
    if (previous && previous.classList.contains("smm-source-hidden")) {
      node.classList.add("smm-source-hidden");
    }
  }
}
`
}

function withConfigOverrides(document: MindMapDocument, config: PlugConfig): MindMapDocument {
  const themeConfig = mergeThemeConfig(
    themeDefaults(document.theme.template),
    document.theme.config,
  )
  return {
    ...document,
    theme: {
      ...document.theme,
      template: config.theme ?? document.theme.template,
      config: config.readabilityOverrides ? withReadableThemeDefaults(themeConfig) : themeConfig,
    },
  }
}

function themeDefaults(template: string): Record<string, unknown> {
  switch (template) {
    case "classic":
      return OBSIDIAN_THEME_DEFAULTS.classic
    default:
      return {}
  }
}

function mergeThemeConfig(
  defaults: Record<string, unknown>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...defaults,
    ...config,
    root: mergeThemeSection(themeSection(defaults, "root"), themeSection(config, "root")),
    second: mergeThemeSection(themeSection(defaults, "second"), themeSection(config, "second")),
    node: mergeThemeSection(themeSection(defaults, "node"), themeSection(config, "node")),
    generalization: mergeThemeSection(
      themeSection(defaults, "generalization"),
      themeSection(config, "generalization"),
    ),
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
  section: "root" | "second" | "node" | "generalization",
): unknown {
  return themeConfig[section]
}

function mergeThemeSection(defaults: unknown, section: unknown): Record<string, unknown> {
  const defaultRecord = isRecord(defaults) ? defaults : {}
  if (!isRecord(section)) {
    return defaultRecord
  }
  return { ...defaultRecord, ...section }
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
