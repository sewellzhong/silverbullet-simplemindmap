---
name: Library/sewellzhong/silverbullet-simplemindmap/PLUG
tags: meta/library
files:
  - simplemindmap.plug.js
---

# SilverBullet SimpleMindMap Plug

Readonly rendering for Obsidian Simple mind map `.smm.md` pages.

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
    autoPreview = true,
    height = 720,
    fit = true
  }
}
```
