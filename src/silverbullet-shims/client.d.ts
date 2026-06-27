export type CodeWidgetContent = {
  readonly html?: string
  readonly script?: string
  readonly width?: number
  readonly height?: number
  readonly url?: string
}

export type CodeWidgetCallback = (
  bodyText: string,
  pageName: string,
) => Promise<CodeWidgetContent | null>
