import type { MindMapDocument, PlugConfig } from "./model.ts"

export function viewerScript(
  document: MindMapDocument,
  config: PlugConfig,
  mindMapJs: string,
): string {
  return `
${mindMapJs}
const data = ${JSON.stringify(document)};
const options = ${JSON.stringify(config)};
const container = document.getElementById("smm-map");
const loading = document.getElementById("smm-loading");
const noteTooltip = document.getElementById("smm-note-tooltip");
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
  noteIcon: {
    icon: "",
    style: {
      color: "#6a6d6c",
      size: 16,
    },
  },
  nodeNoteTooltipZIndex: 20,
  customNoteContentShow: {
    show(note, left, top, node) {
      if (!noteTooltip) {
        return;
      }
      const noteHtml = node?.getData("noteHtml");
      noteTooltip.classList.toggle("smm-note-tooltip-plain", typeof noteHtml !== "string" || !noteHtml);
      if (typeof noteHtml === "string" && noteHtml) {
        noteTooltip.innerHTML = noteHtml;
      } else {
        noteTooltip.textContent = note;
      }
      noteTooltip.style.left = left + "px";
      noteTooltip.style.top = top + "px";
      noteTooltip.classList.add("smm-note-tooltip-visible");
    },
    hide() {
      if (!noteTooltip) {
        return;
      }
      noteTooltip.classList.remove("smm-note-tooltip-visible", "smm-note-tooltip-plain");
      noteTooltip.textContent = "";
    },
  },
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
  hideEmbeddedImageErrors(root, frame);
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
  hideEmbeddedImageErrors(root, frame);
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

function hideEmbeddedImageErrors(root, frame) {
  const nodes = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6,pre,ul,ol,li,p,blockquote,div,.cm-line,.sb-line"));
  for (const node of nodes) {
    if (node === frame || node.contains(frame) || isMindMapWidget(node)) {
      continue;
    }
    const text = node.textContent.trim();
    if (!text.includes(".smm-embed-image-files") && !text.includes("Failed to parse url")) {
      continue;
    }
    node.classList.add("smm-source-hidden");
    const parent = node.parentElement;
    if (parent && parent !== root && !parent.contains(frame) && parent.textContent.trim() === text) {
      parent.classList.add("smm-source-hidden");
    }
  }
}
`
}
