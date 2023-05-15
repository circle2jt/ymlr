import assert from 'assert'
import chalk from 'chalk'
import { program } from 'commander'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import 'src/managers/modules-manager'
import { bin, description, homepage, name, version } from '../package.json'
import { App } from './app'
import { Logger } from './libs/logger'
import { LevelNumber } from './libs/logger/level-number'
import { LoggerLevel } from './libs/logger/logger-level'
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
  .option('--debug [log_level]', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent"). Default is "debug"')
  .option('--debug-context <context=log_level...>', 'Force set log_level to tag context. Example: "context1=debug"')
  .option('--tag-dirs <path...>', 'path to folder which includes external tags')
  .option('-e, --env <key=value...>', 'environment variables')
  .option('-ef, --env-file <path...>', 'environment variables files')
  .action(async (path: string, password?: string, opts: any = {}) => {
    const { debug, env = [], tagDirs, envFile = [], debugContext } = opts
    envFile.forEach((envFile: string) => {
      const envFileContent = readFileSync(resolve(envFile)).toString()
      env.splice(0, 0, ...envFileContent
        .split('\n')
        .filter(e => e?.trim().length)
      )
    })
    env.filter((keyValue: string) => keyValue.includes('='))
      .forEach((keyValue: string) => {
        const idx = keyValue.indexOf('=')
        const key = keyValue.substring(0, idx)
        const vl = keyValue.substring(idx + 1)
        process.env[key] = vl
      })
    const appLogger = new Logger(LoggerLevel.INFO)
    let globalDebug = process.env.DEBUG as LoggerLevel | undefined | boolean
    if (debug) {
      globalDebug = debug
    }
    // Validate --debug
    if (globalDebug === true) {
      globalDebug = LoggerLevel.DEBUG
    } else if (globalDebug) {
      if (!LevelNumber[globalDebug]) {
        appLogger.warn(`--debug "${globalDebug}", Log level is not valid`)
      }
    }
    Logger.DEBUG = globalDebug as LoggerLevel | undefined

    // Validate --debug-context
    const globalDebugContext: string[] | undefined = process.env.DEBUG_CONTEXTS?.split(',').map(e => e.trim())
    const debugCtx = (debugContext || globalDebugContext)?.filter((keyValue: string) => keyValue.includes('='))
      .reduce((sum: Record<string, LoggerLevel>, keyValue: string) => {
        const idx = keyValue.indexOf('=')
        const key = keyValue.substring(0, idx)
        const vl = keyValue.substring(idx + 1) as LoggerLevel
        if (!LevelNumber[vl]) {
          appLogger.warn(`--debug-context "${key}=${vl}", Log level is not valid`)
        } else {
          sum[key] = vl
        }
        return sum
      }, {})
    if (debugCtx && Object.keys(debugCtx).length > 0) Logger.DEBUG_CONTEXTS = debugCtx

    appLogger.log('%s\t%s', chalk.yellow(`${name} 🚀`), chalk.gray(`${version}`))
    appLogger.log('')
    const app = new App(appLogger, {
      path,
      password
    })
    if (tagDirs?.length) app.setDirTags(tagDirs)
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
      assert(packages?.length, '"package(s)" is requried')
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
      assert(packages?.length, '"package(s)" is requried')
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
✔ Github project: ${homepage}
✔ Npm package   : https://www.npmjs.com/package/${name}
✔ Docker Image  : https://hub.docker.com/repository/docker/circle2jt/${name}
`)
  .parse(process.argv)
