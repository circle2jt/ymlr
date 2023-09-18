import { type Scene } from 'src/components/scene/scene'

export class File {
  constructor(private readonly path: string, scene: Scene) {
    this.path = scene.getPath(path)
  }

  toString() {
    return `file://${this.path}`
  }

  toJSON() {
    return this.toString()
  }
}
