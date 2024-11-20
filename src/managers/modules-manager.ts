import { Module } from 'module'
import { join } from 'path'
import { name } from '../../package.json'

export const libName = `${name}/`
export const libDir = join(__dirname, '../..')
export const nodeModulesDir = join(__dirname, '../node_modules')

export async function loadESModule(name: string) {
  /* eslint no-new-func: "off" */
  return new Function(`return import('${name}')`)()
}

function registerModulePlatform() {
  const pattern = new RegExp(`^${libName}`)
  const caches = new Map<string, string>()
  const _require = Module.prototype.require
  // @ts-expect-error Overrided to load custimize modules
  Module.prototype.require = function (basePath: string) {
    if (pattern.test(basePath)) {
      const cache = caches.get(basePath)
      if (cache) {
        return _require.call(this, cache)
      }
      const newBasePath = libDir + basePath.substring(name.length)
      caches.set(basePath, newBasePath)
      return _require.call(this, newBasePath)
    }
    return _require.call(this, basePath)
  }
}

registerModulePlatform()
