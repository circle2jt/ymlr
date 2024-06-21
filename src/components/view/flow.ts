import assert from 'assert'
import { Console } from 'console'
import { createWriteStream } from 'fs'
import { readdir, writeFile } from 'fs/promises'
import { load } from 'js-yaml'
import { join } from 'path'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { YamlType } from '../scene/yaml-type'

export type TestProps = string | {
  check?: string
  script?: string
}

/** |**  view'flow
  View flows in a scene
  @example
  Quick test
  ```yaml
    - view'flow:
        file: ~/index.yaml        # Path of a scene file
        saveTo: /tmp/index.txt    # Save the result to file or console. Default is console (Optional)
  ```
*/
export class ViewFlow implements Element {
  readonly ignoreEvalProps = ['script']
  readonly proxy!: ElementProxy<this>

  file!: string
  saveTo!: string
  console!: Console

  constructor(props: TestProps) {
    if (typeof props === 'string') {
      props = {
        check: props
      }
    }
    Object.assign(this, props)
  }

  async exec() {
    assert(this.file)

    this.file = this.proxy.scene.getPath(this.file)

    if (this.saveTo) {
      this.saveTo = this.proxy.scene.getPath(this.saveTo)
      await writeFile(this.saveTo, '')
      const access = createWriteStream(this.saveTo, { flags: 'a', encoding: 'utf-8', autoClose: true })
      const error = createWriteStream(this.saveTo, { flags: 'a', encoding: 'utf-8', autoClose: true })
      this.console = new Console(access, error)
    } else {
      this.console = console
    }

    const yamlReader = new YamlReader(this.proxy)
    const elements = await yamlReader.read(this.file)

    for (const elem of elements) {
      await elem.print()
    }
    this.console.groupEnd()

    return true
  }

  dispose() { }
}

class YamlElement {
  public runs = [] as YamlElement[]
  public isAsync = false
  public isDetach = false
  public isScene = false
  public isSceneThread = false
  public name!: string
  public tagName?: string

  constructor(private readonly viewFlowProxy: ElementProxy<ViewFlow>, private readonly props = {} as any) {

  }

  async load(): Promise<YamlElement[] | undefined> {
    const tagName = this.viewFlowProxy.rootScene.getTagName(this.props)
    this.tagName = tagName || 'group'
    if (tagName === 'scene' || tagName === 'scene\'thread') {
      this.isScene = tagName === 'scene'
      this.isSceneThread = tagName === "scene'thread"
      const yamlReader = new YamlReader(this.viewFlowProxy)
      const elemProps = this.props[tagName]
      const path = this.viewFlowProxy.scene.getPath(elemProps?.file || elemProps?.path || elemProps)
      this.runs = await yamlReader.read(path)
      if (this.props?.name) {
        this.name = this.props.name
      }
    } else if (tagName === 'include') {
      const yamlReader = new YamlReader(this.viewFlowProxy)
      const elemProps = this.props[tagName]
      const path = this.viewFlowProxy.scene.getPath(elemProps?.file || elemProps?.path || elemProps)
      const includesItems = await yamlReader.read(path)
      return includesItems
    } else {
      let { name, async, runs = [], detach } = this.props
      this.name = name
      this.isAsync = async
      this.isDetach = detach
      runs = runs.filter((props: any) => !props.skip)
      if (runs.length) {
        this.runs = (await Promise.all((runs as any[])
          .map(async eprops => {
            const elem = new YamlElement(this.viewFlowProxy, eprops)
            const includesItems = await elem.load()
            if (includesItems) return includesItems
            return [elem]
          })
        )).flat(1)
      }
    }
    this.runs = this.runs.filter(r => r.runs.length || r.name)
    return undefined
  }

  async print() {
    if (this.isDetach) {
      this.viewFlowProxy.$.console.log('------')
    }
    if (this.name) {
      let icon = ''
      if (this.isDetach) {
        icon = '>'
      } else if (this.isScene) {
        icon = '+'
      } else if (this.isSceneThread) {
        icon = '+'
      } else {
        icon = this.isAsync ? '~' : '-'
      }
      this.viewFlowProxy.$.console.group(icon, this.name)
    }
    for (const e of this.runs) {
      await e.print()
    }
    if (this.name) {
      this.viewFlowProxy.$.console.groupEnd()
    }
  }
}

class YamlReader {
  constructor(private readonly viewFlowProxy: ElementProxy<ViewFlow>) {

  }

  async read(file: string) {
    const f = new FileRemote(file, this.viewFlowProxy.scene)
    const files = []
    if (f.isDirectory) {
      const listFiles = await readdir(f.uri)
      listFiles
        .sort((a, b) => a.localeCompare(b))
        .forEach(file => {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            files.push(new FileRemote(join(f.uri, file), this.viewFlowProxy.scene))
          }
        })
    } else {
      files.push(f)
    }
    this.viewFlowProxy.logger.debug('load file %s: %d', file, files.length)
    const result = await Promise.all(files.map(async f => {
      const content = await f.getTextContent()
      const yamlType = new YamlType(this.viewFlowProxy.scene)
      let runsProps = load(content, { schema: yamlType.spaceSchema }) as any
      if (Array.isArray(runsProps)) {
        runsProps = {
          runs: runsProps
        }
      } else {
        this.viewFlowProxy.rootScene.getTagName(runsProps)
      }
      if (runsProps.runs) {
        runsProps.runs = runsProps.runs.filter((props: any) => !props.skip)
      }
      const elem = new YamlElement(this.viewFlowProxy, runsProps)
      const includesItems = await elem.load()
      if (includesItems) return includesItems
      return elem.runs
    }))
    const runs = result.flat(1)
    return runs.filter(r => r.runs.length || r.name)
  }
}
