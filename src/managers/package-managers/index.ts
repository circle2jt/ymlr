import chalk from 'chalk'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ElementProxy } from 'src/components/element-proxy'
import { Sh } from 'src/components/sh/sh'
import { type Logger } from 'src/libs/logger'
import { LoggerLevel } from 'src/libs/logger/logger-level'
import { nodeModulesDir } from '../modules-manager'

export abstract class PM {
  protected readonly logger: Logger
  protected get cmdInstall() {
    return [] as string[]
  }

  protected get cmdUpgrade() {
    return [] as string[]
  }

  protected get cmdUninstall() {
    return [] as string[]
  }

  get dependencies() {
    const packageJSON = readFileSync(join(nodeModulesDir, '../package.json')).toString()
    return JSON.parse(packageJSON).dependencies || {}
  }

  constructor(logger: Logger) {
    this.logger = logger.clone(this.constructor.name)
  }

  async install(...packages: string[]) {
    const newPackages = this.getNotInstalledPackages(...packages)
    if (newPackages.length) {
      await this.exec('Install', this.cmdInstall, newPackages)
    }
  }

  async upgrade(...packages: string[]) {
    const existsPackages = this.getInstalledPackages(...packages)
    if (existsPackages.length) {
      await this.exec('Upgrade', this.cmdUpgrade, existsPackages)
    }
  }

  async uninstall(...packages: string[]) {
    const existsPackages = this.getInstalledPackages(...packages)
    if (existsPackages.length) {
      await this.exec('Uninstall', this.cmdUninstall, existsPackages)
    }
  }

  async clean() {
    const modules = Object.keys(this.dependencies)
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

  protected async exec(des: string, cmds: string[], packages: string[]) {
    if (!packages.length) return
    const cmd = [...cmds, ...packages]
    const msg = `tags ${packages.map(e => `"${e}"`).join(', ')}`
    const exec = new ElementProxy(new Sh({
      script: cmd.join(' '),
      plainExecuteLog: true
    }), { _logger: this.logger })
    try {
      this.logger.info(`${des} ${msg}`)
      await exec.exec()
      this.logger.info(`${chalk.green('✔')} ${des}ed ${msg} successfully`, LoggerLevel.info)
    } catch (err) {
      this.logger.error(`${chalk.red('✘')} ${des}ed ${msg} failed`, LoggerLevel.error)?.trace(err)
      throw err
    } finally {
      await exec.dispose()
    }
  }
}
