export type RequestType = 'json' | 'form' | 'raw' | 'multipart' | 'text'
export type ResponseType = 'json' | 'blob' | 'text' | 'buffer' | 'none' | 'pipe'
export interface Response { data?: any, headers?: any, status?: number, statusText?: string, ok?: boolean }
export interface UploadFile {
  path: string
  name?: string
}
