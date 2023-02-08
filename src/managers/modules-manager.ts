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
  const _require = Module.prototype.require
  // @ts-expect-error
  Module.prototype.require = function (basePath: string) {
    if (basePath.startsWith(libName)) {
      basePath = libDir + basePath.substring(name.length)
    }
    return _require.call(this, basePath)
  }
}

registerModulePlatform()
