---
name: Library/sewellzhong/silverbullet-simplemindmap/PLUG
tags: meta/library
files:
  - simplemindmap.plug.js
---

# SilverBullet SimpleMindMap Plug

Readonly inline rendering for Obsidian Simple Mind Map pages.

Install this library with `Library: Install`:

```text
https://github.com/sewellzhong/silverbullet-simplemindmap/blob/main/PLUG.md
```

Then run `Plugs: Update`.

If you install the plug directly from `CONFIG`, use this exact value:

```lua
config.set {
  plugs = {
    "github:sewellzhong/silverbullet-simplemindmap/simplemindmap.plug.js"
  }
}
```

Optional configuration:

```lua
config.set {
  simplemindmap = {
    height = 720,
    fit = true,
    minScale = 0.9,
    hideSourceSections = true,
    readabilityOverrides = false
  }
}
```
