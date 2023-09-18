export interface MDDocProps {
  saveTo: string
  includeDirs: string[]
  includePattern: RegExp
  excludeDirs: string[]
  prependMDs?: Array<string | { path: string }>
  appendMDs?: Array<string | { path: string }>
}
