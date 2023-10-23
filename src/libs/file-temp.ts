import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export class FileTemp {
  file: string
  dir: string
  get isExisted() {
    return existsSync(this.file)
  }

  constructor(private readonly ext?: string, dir?: string | true) {
    if (dir) {
      if (dir === true) {
        this.dir = join(tmpdir(), Math.random().toString())
      } else {
        this.dir = dir
      }
      if (!existsSync(this.dir)) {
        mkdirSync(this.dir)
      }
    } else {
      this.dir = tmpdir()
    }
    this.file = join(this.dir, Math.random().toString())
    if (ext) { this.file += ext }
  }

  newOne() {
    return new FileTemp(this.ext, this.dir)
  }

  create(content: string) {
    writeFileSync(this.file, content, 'utf-8')
  }

  remove() {
    if (this.isExisted) { unlinkSync(this.file) }
  }
}
