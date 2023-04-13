import assert from 'assert'
import toPlainObject from 'lodash.toplainobject'
import { removeCircleRef } from 'src/libs/format'
import { Worker } from 'src/managers/worker'
import { Scene } from './scene'
import { SceneProcessProps } from './scene-process.props'

/** |**  scene'process
  Same "scene" but it run as a child process
  @example
  ```yaml
    - name: A scene run as a child process
      # scene'process: ./another.yaml     # path can be URL or local path
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

  constructor(eProps: SceneProcessProps | string) {
    if (typeof eProps === 'string') {
      eProps = { path: eProps }
    }
    const { id, ...props } = eProps
    super(props)
    Object.assign(this, { id })
    if (!this.id) this.id = (++SceneProcess.ID).toString()
    this.ignoreEvalProps.push('processor', 'id')
  }

  async handleFile() {
    assert(this.path)
    this.path = this.scene.getPath(this.path)
    this.processor = this.rootScene.workerManager.createWorker({
      path: this.path,
      scope: this.scope,
      password: this.password,
      globalVars: removeCircleRef(toPlainObject(this.rootScene.localVars)),
      vars: this.vars
    }, {
      debug: this.proxy.debug
    }, {
      id: this.id,
      tagDirs: this.rootScene.tagsManager.tagDirs?.map(dir => this.rootScene.getPath(dir)),
      templates: this.rootScene.templatesManager.cached
    })
  }

  async exec() {
    await this.processor.exec()
    return []
  }
}
