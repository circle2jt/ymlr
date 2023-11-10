import assert from 'assert'
import toPlainObject from 'lodash.toplainobject'
import { removeCircleRef } from 'src/libs/format'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { type Worker } from 'src/managers/worker'
import { Scene } from './scene'
import { type SceneProcessProps } from './scene-process.props'

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
  private processor!: Worker

  constructor(eProps: SceneProcessProps | string) {
    if (typeof eProps === 'string') {
      eProps = { path: eProps }
    }
    const { id, ...props } = eProps
    super(props)
    Object.assign(this, { id })
    this.ignoreEvalProps.push('processor', 'id')
  }

  override async handleFile() {
    assert(this.path)
    this.path = this.scene.getPath(this.path)
    this.processor = this.rootScene.workerManager.createWorker({
      path: this.path,
      password: this.password,
      globalVars: removeCircleRef(toPlainObject(this.rootScene.localVars)),
      vars: this.vars
    }, {
      debug: this.proxy.logger.level?.level
    }, {
      tagDirs: this.rootScene.tagsManager.tagDirs?.map(dir => this.rootScene.getPath(dir)),
      templates: this.rootScene.templatesManager,
      loggerConfig: LoggerFactory.DEFAULT_LOGGER_CONFIG,
      loggerDebugContexts: LoggerFactory.DEBUG_CONTEXTS,
      loggerDebug: LoggerFactory.DEBUG
    })
  }

  override async exec() {
    await this.processor.exec()
    return []
  }
}
