import { join } from 'path'
import { PM } from '.'
import { nodeModulesDir } from '../modules-manager'

export class Npm extends PM {
  override get cmdInstall() {
    return ['npm', 'install', '--save', '--prefix', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUpgrade() {
    return ['npm', 'update', '--save', '--prefix', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUninstall() {
    return ['npm', 'uninstall', '--prefix', `${join(nodeModulesDir, '..')}`]
  }
}
