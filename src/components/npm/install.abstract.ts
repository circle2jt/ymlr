import assert from 'assert'
import { existsSync } from 'fs'
import { join } from 'path'
import { nodeModulesDir } from 'src/managers/modules-manager'
import { ElementShadow } from '../element-shadow'
import { InstallProps } from './install.props'

export abstract class InstallAbstract extends ElementShadow {
  private packages: Record<string, string> = {}

  constructor(eprops: InstallProps) {
    super()
    let _packages: any[]
    if (Array.isArray(eprops)) {
      _packages = eprops
    } else if (typeof eprops === 'string') {
      _packages = eprops.split(',').map(e => e.trim().split(' ').map(e => e.trim())).flat().filter(e => e)
    } else {
      const { packages, ...props } = eprops
      _packages = packages
      Object.assign(this, props)
    }
    _packages?.forEach((pack: any) => {
      if (typeof pack === 'string') {
        this.packages[pack] = pack
      } else if (typeof pack === 'object') {
        const [name] = Object.keys(pack)
        this.packages[name] = pack[name]
      }
    })
  }

  async exec() {
    const packs = Object.keys(this.packages || {})
    assert(packs.length, 'Packages are required to install')
    const packsInstall = packs.reduce<string[]>((sum: string[], name: string) => {
      if (!existsSync(join(nodeModulesDir, name))) {
        if (name !== this.packages[name]) {
          sum.push(`${name}@${this.packages[name]}`)
        } else {
          sum.push(`${name}`)
        }
      }
      return sum
    }, [])
    if (!packsInstall.length) return false
    const logger = this.logger.clone()
    if (this.title) logger.addIndent()
    try {
      await this.action(...packsInstall)
    } finally {
      if (this.title) logger.removeIndent()
    }
    return true
  }

  abstract action(...packsInstall: string[]): any
}
