import { existsSync, mkdirSync, unlinkSync, type WriteFileOptions, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export class FileTemp {
  file: string
  dir: string
  get isExisted() {
    return existsSync(this.file)
  }

  get #random() {
    return 'rd_' + Math.random().toString().replaceAll('.', '_')
  }

  constructor(private readonly ext?: string, dir?: string | true) {
    if (dir) {
      if (dir === true) {
        this.dir = join(tmpdir(), this.#random)
      } else {
        this.dir = dir
      }
      if (!existsSync(this.dir)) {
        mkdirSync(this.dir)
      }
    } else {
      this.dir = tmpdir()
    }
    this.file = join(this.dir, this.#random)
    if (ext) { this.file += ext }
  }

  newOne() {
    return new FileTemp(this.ext, this.dir)
  }

  create(content: string, opts?: WriteFileOptions) {
    writeFileSync(this.file, content, {
      encoding: 'utf-8',
      ...opts as any
    })
  }

  remove() {
    if (this.isExisted) { unlinkSync(this.file) }
  }
}
