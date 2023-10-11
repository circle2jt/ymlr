import { join } from 'path'
import { PM } from '.'
import { nodeModulesDir } from '../modules-manager'

export class Bun extends PM {
  override get cmdInstall() {
    return ['bun', 'add', '--cwd', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUpgrade() {
    return ['bun', 'upgrade', '--save', '--cwd', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUninstall() {
    return ['bun', 'remove', '--cwd', `${join(nodeModulesDir, '..')}`]
  }
}
