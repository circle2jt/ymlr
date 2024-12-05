import assert from 'assert'
import { load } from 'js-yaml'
import merge from 'lodash.merge'
import { FileRemote } from 'src/libs/file-remote'
import { type ElementProxy } from '../element-proxy'
import { type Element } from '../element.interface'
import { type Include } from '../include/include'
import { type YmlrLoadProps } from './ymlr-load.props'

export class YmlrLoad implements Element {
  readonly proxy!: ElementProxy<this>

  path?: string
  content?: string
  saveTo?: string

  constructor(readonly opts?: YmlrLoadProps) {
    if (typeof opts === 'string') {
      Object.assign(this, { path: opts })
    } else {
      Object.assign(this, opts)
    }
  }

  async exec() {
    let content = this.content
    if (!content) {
      assert(this.path)

      const file = new FileRemote(this.path, this.proxy.scene)
      content = await file.getTextContent()
    }
    assert(content)

    const data = load(content)
    let result = await this.handle(data)
    result = await this.proxy.scene.getVars(result)

    if (this.saveTo) {
      await this.proxy.scene.createAndExecuteElement([], "file'write", {}, {
        path: this.saveTo,
        content: result,
        format: 'yaml'
      })
    }

    return result
  }

  dispose() { }

  private async handle(data: any) {
    if (!data) return data
    if (Array.isArray(data)) {
      const newData: any[] = await Promise.all<any>(data.map(async (item) => {
        const rs = await this.handle(item)
        // if (Array.isArray(rs)) {
        //   return rs.flat(1)
        // }
        return rs
      }))
      return newData.flat(1)
    }
    if (typeof data === 'object') {
      if (data.include) {
        const { include: opts, ...others } = data
        let props: any = {}
        if (typeof opts === 'string') {
          props = { files: [opts] }
        } else if (Array.isArray(opts)) {
          props = { files: opts }
        } else {
          props = opts
        }
        props._errorStack = false
        const elemProxy = await this.proxy.rootScene.createAndExecuteElement([], 'include', {}, props) as ElementProxy<Include>
        const newData: any = await this.handle(elemProxy?.result)
        data = merge(newData, others)
      }
      if (Array.isArray(data)) {
        const newData: any = await Promise.all(data.map(async item => {
          return await this.handle(item)
        }))
        return newData
      }
      const newData: any = {}
      await Promise.all(Object.keys(data).map(async key => {
        newData[key] = await this.handle(data[key])
      }))
      return newData
    }
    return data
  }
}
