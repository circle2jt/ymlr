import assert from 'assert'
import chalk from 'chalk'
import merge from 'lodash.merge'
import { bin, description, homepage, name, version } from '../package.json'
import { FileRemote } from './libs/file-remote'
import { LoggerLevel } from './libs/logger/logger-level'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const t = cli()
  await t
})()

async function cli() {
  const { program } = require('commander')
  let t = Promise.resolve()
  program.name(name)
    .aliases(Object.keys(bin).filter(e => e !== name))
    .description(description)
    .version(version, '-v, --version')
    .argument('<file>', 'scenario path or file')
    .argument('[password]', 'password to decrypt scene file')
    .enablePositionalOptions(true)
    .passThroughOptions(true)
    .showHelpAfterError(true)
    .option('-t, --tty', 'allocate a pseudo-TTY')
    .option('-f, --flow', 'display flows in the application')
    .option('-d, --debug [log_level]', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent"). Default is "debug"')
    .option('-do, --debug-options [json_config]', 'Example: {"transport":{"options":{"colorize":true}}}. Ref: https://github.com/pinojs/pino')
    .option('-x, --tag-dirs <path...>', 'path to folder which includes external tags')
    .option('-e, --env <key=value...>', 'environment variables')
    .option('-ef, --env-file <path...>', 'environment variables files')
    .action(async (path: string, password?: string, opts: any = {}) => {
      // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
      t = new Promise(async (resolve, reject) => {
        try {
          const { debug, tty, flow, env = [], tagDirs, envFile = [], debugOptions = {} } = opts
          process.env.FORCE_COLOR = !tty ? '0' : '1'
          process.env.MODE = !flow ? '' : 'flow'

          if (envFile.length) {
            for (const efile of envFile) {
              const fileRemote = new FileRemote(efile, null)
              const envFileContent = await fileRemote.getTextContent()
              env.splice(0, 0, ...envFileContent
                .split('\n')
                .filter(e => e?.trim().length)
              )
            }
          }
          env.filter((keyValue: string) => keyValue.includes('='))
            .forEach((keyValue: string) => {
              const idx = keyValue.indexOf('=')
              const key = keyValue.substring(0, idx)
              const vl = keyValue.substring(idx + 1)
              process.env[key] = vl
            })
          if (debug) {
            process.env.DEBUG = debug
          }

          const { LoggerFactory } = await import('./libs/logger/logger-factory')
          LoggerFactory.Configure('', LoggerFactory.DEFAULT_LOGGER_CONFIG = merge({
            transport: {
              options: {
                colorize: tty ? chalk.supportsColor : false
              }
            }
          }, debugOptions))
          LoggerFactory.LoadFromEnv()
          const appLogger = LoggerFactory.NewLogger(LoggerFactory.DEBUG, undefined, undefined, undefined, LoggerFactory.DEFAULT_LOGGER_CONFIG.opts)
          appLogger.info('🚀 %s@%s\n--------------------------------------------------------', chalk.yellow(`${name}`), chalk.gray(`${version}`))
          const { App } = require('./app')
          const app = new App(appLogger, {
            path,
            password
          })
          if (tagDirs?.length) app.setDirTags(tagDirs)
          await app.exec()
          resolve(undefined)
        } catch (err) {
          reject(err)
        }
      })
    })
    .addCommand(program
      .createCommand('add')
      .aliases(['install'])
      .description('add external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
        t = new Promise(async (resolve, reject) => {
          try {
            assert(packages?.length, '"package(s)" is requried')
            const { LoggerFactory } = await import('./libs/logger/logger-factory')
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
            const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
            await PackagesManagerFactory.GetInstance(appLogger).install(...packages)
            resolve(undefined)
          } catch (err) {
            reject(err)
          }
        })
      })
    )
    .addCommand(program
      .createCommand('up')
      .aliases(['upgrade', 'update'])
      .description('upgrade external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
        t = new Promise(async (resolve, reject) => {
          try {
            assert(packages?.length, '"package(s)" is requried')
            const { LoggerFactory } = await import('./libs/logger/logger-factory')
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
            const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
            await PackagesManagerFactory.GetInstance(appLogger).upgrade(...packages)
            resolve(undefined)
          } catch (err) {
            reject(err)
          }
        })
      })
    )
    .addCommand(program
      .createCommand('rm')
      .aliases(['remove', 'delete'])
      .description('remove external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
        t = new Promise(async (resolve, reject) => {
          try {
            assert(packages?.length, '"package(s)" is requried')
            const { LoggerFactory } = await import('./libs/logger/logger-factory')
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
            const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
            await PackagesManagerFactory.GetInstance(appLogger).uninstall(...packages)
            resolve(undefined)
          } catch (err) {
            reject(err)
          }
        })
      })
    )
    .addHelpText('after', () => {
      const chalk = require('chalk')
      const { dependencies = {} } = require('./package.json')
      const msg = ['Sub modules version']
      Object.keys(dependencies).forEach(key => msg.push(`- ${chalk.green(key)}${chalk.gray(dependencies[key])}`))
      return msg.length > 1 ? msg.join('\n') : ''
    })
    .addHelpText('after', `More:
✔ Github project: ${homepage}
✔ Npm package   : https://www.npmjs.com/package/${name}
✔ Docker Image  : https://hub.docker.com/repository/docker/circle2jt/${name}
`)
    .parse(process.argv)
  await t
}
