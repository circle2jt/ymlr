import assert from 'assert'
import chalk from 'chalk'
import { program } from 'commander'
import { LoggerFactory } from 'src/libs/logger/logger-factory'
import { bin, description, homepage, name, version } from '../package.json'
import { App } from './app'
import ENVGlobal from './env-global'
import { Env } from './libs/env'
import { FileRemote } from './libs/file-remote'
import { StyleFactory } from './libs/logger/console/styles/style-factory'
import { LoggerLevel } from './libs/logger/logger-level'
import { PackagesManagerFactory } from './managers/packages-manager-factory'

export async function RunCLI() {
  await program.name(name)
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
    .option('-a, --auto-install', 'auto install lack packages in the running. Default is not auto install')
    .option('-f, --flow', 'display flows in the application')
    .option('-d, --debug [log_level]', 'set debug log level ("all", "trace", "debug", "info", "warn", "error", "fatal", "silent", "secret"). Default is "debug"')
    .option('-df, --debug-context-filter [context_path]', 'allow filter message by context path. It\'s regex pattern. Example: @group/')
    .option('-x, --tag-dirs <path...>', 'path to folder which includes external tags')
    .option('-e, --env <key=value...>', 'environment variables')
    .option('-ef, --env-file <path...>', 'environment variables files')
    .action(async (path: string, password?: string, opts: any = {}) => {
      const { debug, autoInstall, style = 'color16', flow, env = [], tagDirs, envFile = [], debugContextFilter } = opts
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
      env.forEach((line: string) => {
        const [key, value] = Env.ParseEnvLine(line, true)
        process.env[key] = value
      })
      if (debug) ENVGlobal.DEBUG = debug
      if (flow) ENVGlobal.MODE = 'flow'
      if (autoInstall) ENVGlobal.AUTO_INSTALL = '1'
      if (debugContextFilter) ENVGlobal.DEBUG_CONTEXT_FILTER = debugContextFilter

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
    })
    .addCommand(program
      .createCommand('add')
      .aliases(['install'])
      .description('add external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        assert(packages?.length, '"package(s)" is requried')
        const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
        const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
        await PackagesManagerFactory.GetInstance(appLogger).install(...packages)
      })
    )
    .addCommand(program
      .createCommand('up')
      .aliases(['upgrade', 'update'])
      .description('upgrade external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        assert(packages?.length, '"package(s)" is requried')
        const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
        const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
        await PackagesManagerFactory.GetInstance(appLogger).upgrade(...packages)
      })
    )
    .addCommand(program
      .createCommand('rm')
      .aliases(['remove', 'delete'])
      .description('remove external tags version')
      .argument('[package_name...]', 'packages in npm registry')
      .action(async (packages: string[]) => {
        assert(packages?.length, '"package(s)" is requried')
        const appLogger = LoggerFactory.NewLogger(LoggerLevel.all)
        const { PackagesManagerFactory } = await import('./managers/packages-manager-factory')
        await PackagesManagerFactory.GetInstance(appLogger).uninstall(...packages)
      })
    )
    .addHelpText('after', () => {
      const { dependencies = {} } = require('./package.json')
      const packageManagement = PackagesManagerFactory.GetInstance(LoggerFactory.NewLogger(LoggerLevel.silent))
      const msg = []
      msg.push(`Installed tags of ${chalk.green(name)}${chalk.gray(`@${version}`)} via ${chalk.cyan(packageManagement.name)}`)
      Object.keys(dependencies)
        .forEach((key) => msg.push(`  ${chalk.green(key)}${chalk.gray(dependencies[key])}\t${chalk.gray.dim(`https://www.npmjs.com/package/${key}`)}`))
      if (msg.length === 1) {
        msg.push(chalk.gray('  No tags'))
      }
      return msg.join('\n')
    })
    .addHelpText('after', `Configurable environment variables
  LOG_FORMAT=json                   Output log is json format
  DISABLE_LOG_COLOR=1               Disable color TTY in log
  DISABLE_LOG_TIMESTAMP=1           Disable timestamp in log
  DISABLE_LOG_CONTEXT=1             Disable context path in log
  DISABLE_LOG_INDENT=1              Disable indent in log
  DISABLE_LOG_THREAD=1              Disable thead id in log
  AUTO_INSTALL=1                    Auto install lack packages in the running
  SAND_SCENE_PASSWORD=...           Custom password when use encrypted scene file
  PACKAGE_MANAGERS=npm,yarn,pnpm    Manual use package manager (npm, yarn, pnpm). It's will try another when install failed
  `)
    .addHelpText('after', `More:
✔ Github project: ${homepage}
✔ Npm package   : https://www.npmjs.com/package/${name}
✔ Docker Image  : https://hub.docker.com/repository/docker/circle2jt/${name}
`)
    .parseAsync(process.argv)
}
