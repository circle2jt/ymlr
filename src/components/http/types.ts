import { type ResponseType as AxiosResponseType } from 'axios'
export type RequestType = 'json' | 'form' | 'raw' | 'multipart' | 'text'
export type ResponseType = AxiosResponseType | 'none'
export interface Response { data?: any, headers?: any, status?: number, statusText?: string, ok?: boolean }
export interface UploadFile {
  path: string
  name?: string
}
