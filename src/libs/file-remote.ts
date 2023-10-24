import assert from 'assert'
import { existsSync, statSync } from 'fs'
import { readFile } from 'fs/promises'
import { type Scene } from 'src/components/scene/scene'

export class FileRemote {
  get isRemote() {
    return !!((this.uri.startsWith('http://') || this.uri.startsWith('https://')))
  }

  get isDirectory() {
    if (this.isRemote) return undefined
    return statSync(this.uri).isDirectory()
  }

  constructor(public uri: string, scene: Scene) {
    if (!this.isRemote) {
      this.uri = scene.getPath(this.uri)
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
