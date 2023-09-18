export interface FileWriteProps {
  path: string
  content: any
  format?: 'json' | 'yaml'
  pretty?: boolean
}
