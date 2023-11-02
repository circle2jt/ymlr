import 'src/managers/modules-manager'

import assert from 'assert'
import chalk from 'chalk'
import { resolve as resolvePath } from 'path'
import { bin, description, homepage, name, version } from '../package.json'
import { App } from './app'
import { LoggerFactory } from './libs/logger/logger-factory'
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
    .option('--debug [log_level]', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent"). Default is "debug"')
    .option('--debug-context <context=log_level...>', 'Force set log_level to tag context. Example: "context1=debug"')
    .option('--tag-dirs <path...>', 'path to folder which includes external tags')
    .option('-e, --env <key=value...>', 'environment variables')
    .option('-ef, --env-file <path...>', 'environment variables files')
    .action(async (path: string, password?: string, opts: any = {}) => {
      // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
      t = new Promise(async (resolve, reject) => {
        try {
          const { debug, env = [], tagDirs, envFile = [], debugContext } = opts
          if (envFile.length) {
            const { readFileSync } = await import('fs')
            for (const efile of envFile) {
              const envFileContent = readFileSync(resolvePath(efile)).toString()
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
          if (debugContext?.length > 0) {
            LoggerFactory.DEBUG_CONTEXTS = debugContext
          }
          LoggerFactory.LoadFromEnv()
          const appLogger = LoggerFactory.NewLogger(LoggerFactory.DEBUG)
          appLogger.log('%s\t%s', chalk.yellow(`${name} 🚀`), chalk.gray(`${version}`))
          appLogger.log('')
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
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.ALL)
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
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.ALL)
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
            const appLogger = LoggerFactory.NewLogger(LoggerLevel.ALL)
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
