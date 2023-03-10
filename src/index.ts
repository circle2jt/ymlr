import assert from 'assert'
import chalk from 'chalk'
import { program } from 'commander'
import 'src/managers/modules-manager'
import { bin, description, homepage, name, version } from '../package.json'
import { App } from './app'
import { Logger, LoggerLevel } from './libs/logger'
import { PackagesManager } from './managers/packages-manager'

program
  .name(name)
  .aliases(Object.keys(bin).filter(e => e !== name))
  .description(description)
  .version(version, '-v, --version')
  .argument('<file>', 'scenario path or file')
  .argument('[password]', 'password to decrypt scene file')
  .enablePositionalOptions(true)
  .passThroughOptions(true)
  .showHelpAfterError(true)
  .option('--debug <level>', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent")')
  .option('--tagDirs <path...>', 'path to folder which includes external tags')
  .option('-e, --env <key=value...>', 'environment variables')
  .action(async (source: string, password?: string, opts: any = {}) => {
    try { await fetch('') } catch { }
    let globalDebug: LoggerLevel = (process.env.DEBUG as LoggerLevel) || LoggerLevel.INFO
    const { debug, env, tagDirs } = opts
    env?.filter((keyValue: string) => keyValue.includes('='))
      .forEach((keyValue: string) => {
        const idx = keyValue.indexOf('=')
        const key = keyValue.substring(0, idx)
        const vl = keyValue.substring(idx + 1)
        process.env[key] = vl
      })
    if (debug) globalDebug = debug
    const appLogger = new Logger(globalDebug)
    const app = new App(appLogger, source, password)
    tagDirs?.length && app.setDirTags(tagDirs)
    await app.exec()
  })
  .addHelpText('after', () => {
    const { dependencies = {} } = require('./package.json')
    const msg = ['Sub modules version']
    Object.keys(dependencies).forEach(key => msg.push(`- ${chalk.green(key)}${chalk.gray(dependencies[key])}`))
    return msg.length > 1 ? msg.join('\n') : ''
  })
  .addCommand(program
    .createCommand('add')
    .aliases(['install'])
    .description('add external tags version')
    .argument('[package_name...]', 'packages in npm registry')
    .action(async (packages: string[]) => {
      const appLogger = new Logger(LoggerLevel.ALL)
      await new PackagesManager(appLogger).install(...packages)
      process.exit(0)
    })
  )
  .addCommand(program
    .createCommand('up')
    .aliases(['upgrade', 'update'])
    .description('upgrade external tags version')
    .argument('[package_name...]', 'packages in npm registry')
    .action(async (packages: string[]) => {
      const appLogger = new Logger(LoggerLevel.ALL)
      await new PackagesManager(appLogger).upgrade(...packages)
      process.exit(0)
    })
  )
  .addCommand(program
    .createCommand('rm')
    .aliases(['remove', 'delete'])
    .description('remove external tags version')
    .argument('[package_name...]', 'packages in npm registry')
    .action(async (packages: string[]) => {
      assert(packages?.length, '"package(s)" is requried')
      const appLogger = new Logger(LoggerLevel.ALL)
      await new PackagesManager(appLogger).uninstall(...packages)
      process.exit(0)
    })
  )
  .addHelpText('after', `More:
??? Github project: ${homepage}
??? Npm package   : https://www.npmjs.com/package/${name}
??? Docker Image  : https://hub.docker.com/repository/docker/circle2jt/${name}
`)
  .parse(process.argv)
