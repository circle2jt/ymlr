import { existsSync, unlinkSync, writeFileSync } from 'fs'
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

  create(content: string) {
    writeFileSync(this.file, content, 'utf-8')
  }

  remove() {
    if (this.isExisted) { unlinkSync(this.file) }
  }
}
