import assert from 'assert'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ElementProxy } from 'src/components/element-proxy'
import { Exec } from 'src/components/exec/exec'
import { Logger, LoggerLevel } from 'src/libs/logger'
import { ProgressBar } from 'src/libs/progress-bar'
import { nodeModulesDir } from './modules-manager'

const PackageManagerSupported = (process.env.PACKAGE_MANAGERS?.split(',') || ['yarn', 'npm', 'pnpm']) as Array<'npm' | 'yarn' | 'pnpm'>

export class PackagesManager {
  private static Bin?: 'pnpm' | 'npm' | 'yarn'
  private static get CmdInstall() {
    if (PackagesManager.Bin === 'pnpm') return ['pnpm', 'add', '--dir', `${join(nodeModulesDir, '..')}`]
    if (PackagesManager.Bin === 'yarn') return ['yarn', 'add', '--cwd', `${join(nodeModulesDir, '..')}`]
    return ['npm', 'add', '--prefix', `${join(nodeModulesDir, '..')}`]
  }

  private static get CmdUpgrade() {
    if (PackagesManager.Bin === 'pnpm') return ['pnpm', 'upgrade', '--save', '--dir', `${join(nodeModulesDir, '..')}`]
    if (PackagesManager.Bin === 'yarn') return ['yarn', 'upgrade', '--save', '--cwd', `${join(nodeModulesDir, '..')}`]
    return ['npm', 'upgrade', '--save', '--prefix', `${join(nodeModulesDir, '..')}`]
  }

  private static get CmdUninstall() {
    if (PackagesManager.Bin === 'pnpm') return ['pnpm', 'remove', '--dir', `${join(nodeModulesDir, '..')}`]
    if (PackagesManager.Bin === 'yarn') return ['yarn', 'remove', '--cwd', `${join(nodeModulesDir, '..')}`]
    return ['npm', 'uninstall', '--prefix', `${join(nodeModulesDir, '..')}`]
  }

  static get Dependencies() {
    const packageJSON = readFileSync(join(nodeModulesDir, '../package.json')).toString()
    return JSON.parse(packageJSON).dependencies || {}
  }

  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger.clone(PackagesManager.name)
    if (!PackagesManager.Bin) {
      PackagesManager.Bin = PackageManagerSupported.find((bin: string) => {
        try {
          const log = execSync(`${bin} -v`).toString()
          return !!log
        } catch { }
        return false
      })
      assert(PackagesManager.Bin, 'Could not found "npm" or "yarn" to install lack packages')
    }
  }

  async install(...packages: string[]) {
    const newPackages = this.getNotInstalledPackages(...packages)
    newPackages.length && await this.exec('Installing', PackagesManager.CmdInstall, newPackages)
  }

  async upgrade(...packages: string[]) {
    let existsPackages = this.getInstalledPackages(...packages)
    if (PackagesManager.Bin === 'yarn') {
      existsPackages = existsPackages.map(packageName => {
        const [name, version] = packageName.split('@')
        return `${name}@${version || 'latest'}`
      })
    }
    existsPackages.length && await this.exec('Upgrading', PackagesManager.CmdUpgrade, existsPackages)
  }

  async uninstall(...packages: string[]) {
    const existsPackages = this.getInstalledPackages(...packages)
    existsPackages.length && await this.exec('Uninstalling', PackagesManager.CmdUninstall, existsPackages)
  }

  async clean() {
    const modules = Object.keys(PackagesManager.Dependencies)
    await this.uninstall(...modules)
    return modules
  }

  getInstalledPackages(...packages: string[]) {
    return packages.filter(packageName => {
      const path = join(nodeModulesDir, packageName)
      return existsSync(path)
    })
  }

  getNotInstalledPackages(...packages: string[]) {
    return packages.filter(packageName => {
      const path = join(nodeModulesDir, packageName)
      return !existsSync(path)
    })
  }

  private async exec(des: string, cmds: string[], packages: string[]) {
    if (!packages.length) return
    const cmd = [...cmds, ...packages]
    const msg = `tags ${packages.map(e => `"${e}"`).join(', ')}`
    const bar = !this.logger.is(LoggerLevel.SILENT) ? new ProgressBar(this.logger) : undefined
    await bar?.start(`${des} ${msg}`)
    const exec = new ElementProxy(new Exec(cmd))
    exec.logger = this.logger
    try {
      await exec.exec()
      await bar?.stop()
      this.logger.info(`${des} ${msg} successfully`)
    } catch (err) {
      await bar?.stop()
      this.logger.error(`${des} ${msg} failed`)
      throw err
    } finally {
      await exec.dispose()
    }
  }
}
