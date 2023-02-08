import assert from 'assert'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { Scene } from 'src/components/scene/scene'

export class FileRemote {
  get isRemote() {
    return !!((this.uri.startsWith('http://') || this.uri.startsWith('https://')))
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
    const rs = await fetch(this.uri)
    const ab = await rs.arrayBuffer()
    return Buffer.from(new Uint8Array(ab))
  }

  async getTextContent() {
    if (!this.isRemote) {
      const buf = await readFile(this.uri)
      return buf.toString()
    }
    const rs = await fetch(this.uri)
    const txt = await rs.text()
    return txt
  }
}
