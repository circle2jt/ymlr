import { join } from 'path'
import { PM } from '.'
import { nodeModulesDir } from '../modules-manager'

export class Yarn extends PM {
  override get cmdInstall() {
    return ['yarn', 'add', '--cwd', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUpgrade() {
    return ['yarn', 'upgrade', '--save', '--cwd', `${join(nodeModulesDir, '..')}`]
  }

  override get cmdUninstall() {
    return ['yarn', 'remove', '--cwd', `${join(nodeModulesDir, '..')}`]
  }

  async upgrade(...packages: string[]) {
    let existsPackages = this.getInstalledPackages(...packages)
    existsPackages = existsPackages.map(packageName => {
      const [name, version] = packageName.split('@')
      return `${name}@${version || 'latest'}`
    })
    existsPackages.length && await this.exec('Upgrade', this.cmdUpgrade, existsPackages)
  }
}
