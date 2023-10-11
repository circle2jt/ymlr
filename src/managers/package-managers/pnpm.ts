import { join } from 'path'
import { PM } from '.'
import { nodeModulesDir } from '../modules-manager'

export class Pnpm extends PM {
  override get cmdInstall() {
    return ['pnpm', 'add', '--dir', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUpgrade() {
    return ['pnpm', 'upgrade', '--save', '--dir', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUninstall() {
    return ['pnpm', 'remove', '--dir', `${join(nodeModulesDir, '..')}`]
  }
}
