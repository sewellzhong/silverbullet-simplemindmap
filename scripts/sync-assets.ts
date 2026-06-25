import { copyFile, mkdir } from "node:fs/promises"

const ASSETS = [
  {
    from: "node_modules/simple-mind-map/dist/simpleMindMap.umd.min.js",
    to: "assets/simpleMindMap.umd.min.js",
  },
  {
    from: "node_modules/simple-mind-map/dist/simpleMindMap.esm.min.css",
    to: "assets/simpleMindMap.css",
  },
] as const

await mkdir("assets", { recursive: true })

for (const asset of ASSETS) {
  await copyFile(asset.from, asset.to)
}
