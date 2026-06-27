export const asset: {
  readonly readAsset: (
    plugName: string,
    name: string,
    encoding?: "utf8" | "dataurl",
  ) => Promise<string>
}

export const system: {
  readonly getConfig: (key: string, defaultValue: unknown) => Promise<unknown>
}
