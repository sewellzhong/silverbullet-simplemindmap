export const asset: {
  readonly readAsset: (
    plugName: string,
    name: string,
    encoding?: "utf8" | "dataurl",
  ) => Promise<string>
}

export const editor: {
  readonly getCurrentPage: () => Promise<string>
  readonly showPanel: (
    id: "lhs" | "rhs" | "bhs" | "modal",
    mode: number,
    html: string,
    script?: string,
  ) => Promise<void>
}

export const space: {
  readonly readPage: (name: string) => Promise<string>
}

export const system: {
  readonly getConfig: (key: string, defaultValue: unknown) => Promise<unknown>
}
