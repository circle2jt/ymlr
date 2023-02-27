import assert from 'assert'
import { Worker } from 'src/managers/worker'
import { Scene } from './scene'
import { SceneProcessProps } from './scene-process.props'

/** |**  scene'process
  Same "scene" but it run as a child process
  @example
  ```yaml
    - name: A scene run as a child process
      scene'process:
        id: proc01                        # process id which is how in log
        name: Scene name
        path: https://.../another.yaml    # path can be URL or local path
        password:                         # password to decode when the file is encrypted
        scope: local                      # Value in [local, share]. Default is local
                                          # - Global vars is always share, but scene vars is
                                          #   - local: Variables in the scene only apply in the scene
                                          #   - share: Variabes in the scene will be updated to all of scene
        vars:                             # They will only overrides "vars" in the scene
          foo: scene bar                  # First is lowercase is vars in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
  ```
*/
export class SceneProcess extends Scene {
  private static ID = 0
  private processor!: Worker
  private readonly id!: string

  constructor({ id, ...props }: SceneProcessProps) {
    super(props)
    Object.assign(this, { id })
    if (!this.id) this.id = (++SceneProcess.ID).toString()
    this.ignoreEvalProps.push('processor', 'id')
  }

  async handleFile() {
    assert(this.path)
    this.processor = this.rootScene.workerManager.createWorker({
      path: this.path,
      password: this.password,
      globalVars: this.rootScene.localVars,
      vars: this.vars
    }, {}, {
      id: this.id,
      tagDirs: this.rootScene.tagsManager.tagDirs?.map(dir => this.rootScene.getPath(dir))
    })
  }

  async exec() {
    await this.processor.exec()
    return []
  }
}
