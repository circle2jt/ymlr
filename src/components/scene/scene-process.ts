import assert from 'assert'
import toPlainObject from 'lodash.toplainobject'
import { removeCircleRef } from 'src/libs/format'
import { Logger } from 'src/libs/logger'
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
        vars:                             # They will only overrides vars in the parents to this scene
                                          # - Global variables is always passed into this scene
          foo: scene bar                  # First is lowercase is vars which is used in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
          localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
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
      password: this.password,
      globalVars: removeCircleRef(toPlainObject(this.rootScene.localVars)),
      vars: this.vars
    }, {
      debug: this.proxy.debug
    }, {
      id: this.id,
      tagDirs: this.rootScene.tagsManager.tagDirs?.map(dir => this.rootScene.getPath(dir)),
      templates: this.rootScene.templatesManager.cached,
      loggerDebugContexts: Logger.DEBUG_CONTEXTS,
      loggerDebug: Logger.DEBUG
    })
  }

  async exec() {
    await this.processor.exec()
    return []
  }
}
