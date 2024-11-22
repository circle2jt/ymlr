import assert from 'assert'
import chalk from 'chalk'
import { program } from 'commander'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { bin, description, homepage, name, version } from '../package.json'
import { App } from './app'
import { FileRemote } from './libs/file-remote'
import { StyleFactory } from './libs/logger/console/styles/style-factory'
import { LoggerLevel } from './libs/logger/logger-level'

export async function RunCLI() {
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
    .option('-s, --style <style>', `Style to print to console. Default is "color16"
  "json" : Output to json format
  "color0" : Pretty format with no color
  "color16" : Pretty format with basic color (16 colors)
  "color256" : Pretty format with 256 color support
  "color16M" : Pretty format with Truecolor support (16 million colors)
      `)
    .option('-f, --flow', 'display flows in the application')
    .option('-d, --debug [log_level]', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent", "secret"). Default is "debug"')
    .option('-df, --debug-context-filter [context_path]', 'allow filter message by context path. It\'s regex pattern. Example: @group/')
    .option('-x, --tag-dirs <path...>', 'path to folder which includes external tags')
    .option('-e, --env <key=value...>', 'environment variables')
    .option('-ef, --env-file <path...>', 'environment variables files')
    .action(async (path: string, password?: string, opts: any = {}) => {
      // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
      t = new Promise(async (resolve, reject) => {
        try {
          const { debug, style = 'color16', flow, env = [], tagDirs, envFile = [], debugContextFilter } = opts
          if (envFile.length) {
            for (const efile of envFile) {
              const fileRemote = new FileRemote(efile, null)
              const envFileContent = await fileRemote.getTextContent()
              env.splice(0, 0, ...envFileContent
                .split('\n')
                .filter((e: string) => e?.trim().length)
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
          if (debug) process.env.DEBUG = debug
          if (flow) process.env.MODE = 'flow'
          if (debugContextFilter) process.env.DEBUG_CONTEXT_FILTER = debugContextFilter

          LoggerFactory.LoadFromEnv()
          StyleFactory.SetLogStyle(style)

          const appLogger = LoggerFactory.NewLogger(LoggerFactory.DEBUG?.level)
          appLogger.info(`🚀 ${chalk.yellow(`${name}`)}${chalk.gray(`@${version}`)}`)
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
      const { dependencies = {} } = require('./package.json')
      const msg = []
      msg.push(`Installed tags of ${chalk.green(name)}${chalk.gray(`@${version}`)}`)
      Object.keys(dependencies).forEach(key => msg.push(`- ${chalk.green(key)}${chalk.gray(dependencies[key])}\t${chalk.gray.dim(`https://www.npmjs.com/package/${key}`)}`))
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
