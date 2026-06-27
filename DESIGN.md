# SilverBullet SimpleMindMap Design System

## 1. Atmosphere & Identity

A quiet document utility. The viewer should disappear behind the mind map, with restrained status states that feel native to SilverBullet instead of like a separate app.

## 2. Color

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --smm-surface | #ffffff | #111318 | Viewer background |
| Surface/secondary | --smm-surface-muted | #f7f8fa | #191c22 | Empty and error panels |
| Canvas | --smm-canvas | #f7f8fa | #2f3438 | Mind map canvas when the source file has no saved background |
| Text/primary | --smm-text | #1f2328 | #f4f6f8 | Status text |
| Text/secondary | --smm-text-muted | #667085 | #a5adba | Secondary text |
| Border/default | --smm-border | #d9dee7 | #343944 | Panel borders |
| Accent/primary | --smm-accent | #2f6fed | #6ea2ff | Focus and progress |
| Status/error | --smm-error | #b42318 | #ff8a7a | Parse/render errors |

## 3. Typography

Primary: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif. Mono is not used.

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Body | 14px | 400 | 1.5 | Default status copy |
| Label | 12px | 600 | 1.4 | Error labels |

## 4. Spacing & Layout

Base unit: 4px. Viewer padding uses 16px, compact gaps use 8px, and status panels use 24px. Full-page previews use the full panel height.

## 5. Components

### Viewer Shell
- Structure: one full-width iframe body with a resizable inline mind map container.
- States: loading, rendered, empty, error.
- Accessibility: status states use readable text; the mind map is a readonly visual preview.
- Fidelity: Obsidian-saved theme, node colors, rich text, and font sizes are preserved by default.

### Source Section Hiding
- Structure: DOM-only enhancement that hides Obsidian raw data sections in SilverBullet after the inline viewer renders.
- Fallback: if parent-page access fails, leave the page intact and keep the mind map visible.
- Fallback widget: empty `svgData` code widgets avoid large blank raw SVG panels when page-level hiding misses.

## 6. Motion & Interaction

Use only opacity transitions up to 150ms. Respect `prefers-reduced-motion`.

## 7. Depth & Surface

Strategy: borders-only. No shadows or decorative gradients.
