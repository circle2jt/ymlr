import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { type Level } from '../../level'
import { LevelFactory } from '../../level-factory'
import { type LogMetaData, type LogStyle } from './log-style'

export default class ColorfulStyle implements LogStyle {
  #getColorLevel(level: Level) {
    switch (level.name.toString()) {
      case 'trace':
        return chalk.magenta(level.icon)
      case 'debug':
        return chalk.gray(level.icon)
      case 'info':
        return chalk.green(level.icon)
      case 'pass':
        return chalk.green(level.icon)
      case 'warn':
        return chalk.yellow(level.icon)
      case 'fail':
        return chalk.red(level.icon)
      case 'error':
        return chalk.red(level.icon)
      case 'fatal':
        return chalk.bgRed(level.icon)
      case 'secret':
        return chalk.cyan(level.icon)
      default:
        return level.icon
    }
  }

  print(printToConsole: (...args: any[]) => any, meta: LogMetaData, msg: string | any, ...prms: any) {
    const formater = LevelFactory.GetInstance(meta.level)
    const level = this.#getColorLevel(formater)
    if (!meta.plainLog) {
      const threadID = chalk.gray.dim(meta.threadID)
      const timestamp = chalk.gray(UtilityFunctionManager.Instance.format.date(meta.timestamp, 'hh:mm:ss.ms'))
      const indentString = chalk.gray.dim(meta.indent.indentString)
      const fullContextPath = meta.fullContextPath ? chalk.gray.dim.italic(meta.fullContextPath) : ''
      if (typeof msg === 'string') {
        printToConsole(`%s %s %s %s${formater.format(msg)} \t %s`,
          threadID,
          timestamp,
          level,
          indentString,
          ...prms,
          fullContextPath)
        return
      }
      printToConsole(`%s %s %s %s \t %s\n${formater.format('%o')}`,
        threadID,
        timestamp,
        level,
        indentString,
        fullContextPath,
        msg,
        ...prms)
      return
    }
    if (typeof msg === 'string') {
      printToConsole(formater.format(msg), ...prms)
      return
    }
    printToConsole(formater.format('%o'), msg, ...prms)
  }
}
