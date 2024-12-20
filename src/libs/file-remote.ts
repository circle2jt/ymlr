import assert from 'assert'
import { existsSync, statSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { type ElementProxy } from 'src/components/element-proxy'
import { type Element } from 'src/components/element.interface'

const REGEX_REMOTE_URI = /^https?:\/\//

export class FileRemote {
  get isRemote() {
    return REGEX_REMOTE_URI.test(this.uri)
  }

  get isDirectory() {
    if (this.isRemote) return undefined
    return statSync(this.uri).isDirectory()
  }

  constructor(public uri: string, proxy: ElementProxy<Element> | null) {
    if (!this.isRemote) {
      if (proxy) {
        this.uri = proxy.getPath(this.uri)
      } else {
        this.uri = resolve(this.uri)
      }
    }
    assert(this.uri, 'File is required')
  }

  get existed() {
    if (this.isRemote) return undefined
    return existsSync(this.uri)
  }

  async getContent() {
    if (!this.isRemote) {
      const buf = await readFile(this.uri)
      return buf
    }
    const resp = await fetch(this.uri)
    const data = await resp.arrayBuffer()
    return Buffer.from(new Uint8Array(data))
  }

  async getTextContent() {
    if (!this.isRemote) {
      const buf = await readFile(this.uri)
      return buf.toString()
    }
    const resp = await fetch(this.uri)
    const data = await resp.text()
    return data
  }
}
