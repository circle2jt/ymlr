import { existsSync, unlinkSync, writeFile } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export class FileTemp {
  file: string
  get isExisted() {
    return existsSync(this.file)
  }

  constructor(ext?: string) {
    this.file = join(tmpdir(), Math.random().toString())
    if (ext) { this.file += ext }
  }

  async create(content: string) {
    return await new Promise((resolve, reject) => {
      writeFile(this.file, content, 'utf-8', err => {
        if (err) { return reject(err) }
        resolve(undefined)
      })
    })
  }

  remove() {
    if (this.isExisted) { unlinkSync(this.file) }
  }
}
