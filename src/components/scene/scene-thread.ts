import assert from 'assert'
import toPlainObject from 'lodash.toplainobject'
import { removeCircleRef } from 'src/libs/format'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { type Worker } from 'src/managers/worker'
import { Scene } from './scene'
import { type SceneThreadProps } from './scene-thread.props'

/** |**  scene'thread
  Same "scene" but it run in a new thread
  @example
  ```yaml
    - name: A scene run in a new thread
      # scene'thread: ./another.yaml     # path can be URL or local path
      scene'thread:
        id: #newID                        # thread id (optional)
        name: Scene name
        path: https://.../another.yaml    # path can be URL or local path
        password:                         # password to decode when the file is encrypted
        vars:                             # They will only overrides vars in the parents to this scene
                                          # - Global variables is always passed into this scene
          foo: scene bar                  # First is lowercase is vars which is used in scenes
          Foo: Global bar                 # First is uppercase is global vars which is used in the program
          localVars: ${ $vars.parentVar } # This will get value of "$vars.parentVar" in the parent then pass it into "$vars.localVars" which is used in this scene
  ```

  Send data via global event between threads and each others. (Includes main thread)
  `main.yaml`
  ```yaml
    name: This is main thread
    runs:
      - name: Run in a new thread 1
        detach: true
        scene'thread:
          id: thread1
          path: ./new_thread.yaml
          vars:
            name: thread 1
      - name: Run in a new thread 2
        detach: true
        scene'thread:
          id: thread2
          path: ./new_thread.yaml
          vars:
            name: thread 2

      - sleep: 1s

      - name: Listen data from childs thread
        ~event'on:
          name: ${ $const.FROM_GLOBAL_EVENT }
        runs:
          - name: Received data from thread ID ${ $parentState.eventOpt.fromID }
            echo: ${ $parentState.eventData }

      - name: Emit data to childs threads
        ~event'emit:
          name: ${ $const.TO_GLOBAL_EVENT }
          data:
            name: this is data from main thread
  ```

  `new_thread.yaml`
  ```yaml
    vars:
      name: Thread name will be overried by parent scene
    runs:
      - event'on:
          name: ${ $const.FROM_GLOBAL_EVENT }
        runs:
          - name: Thread ${ $vars.name } is received data from thread ID ${ $parentState.eventOpt.fromID }
            echo: ${ $parentState.eventData }

          - name: Thead ${ $vars.name } sent data to global event
            event'emit:
              name: ${ $const.TO_GLOBAL_EVENT }
              data:
                name: this is data from thread ${ $vars.name }
              # opts:
              #  toIDs: ['thread1']             # Specific the thread ID to send. Default it send to all
          - sleep: 2s
          - stop:

  ```
*/
export class SceneThread extends Scene {
  #thread!: Worker
  #id?: string

  constructor(eProps: SceneThreadProps | string) {
    if (typeof eProps === 'string') {
      eProps = { path: eProps }
    }
    const { id, ...props } = eProps
    super(props)
    this.#id = id
  }

  override async handleFile() {
    assert(this.path)
    this.path = this.scene.getPath(this.path)
    this.#thread = this.rootScene.workerManager.createWorker({
      path: this.path,
      password: this.password,
      globalVars: removeCircleRef(toPlainObject(this.rootScene.localVars)),
      vars: this.vars
    }, {
      debug: this.proxy.logger.level?.level
    }, {
      id: this.#id,
      tagDirs: this.rootScene.tagsManager.tagDirs?.map(dir => this.rootScene.getPath(dir)),
      templates: this.rootScene.templatesManager,
      loggerConfig: LoggerFactory.DEFAULT_LOGGER_CONFIG,
      loggerDebugContexts: LoggerFactory.DEBUG_CONTEXTS,
      loggerDebug: LoggerFactory.DEBUG
    })
    if (!this.#id) {
      this.#id = this.#thread.id
    }
  }

  override async exec() {
    await this.#thread.exec()
    return []
  }
}
