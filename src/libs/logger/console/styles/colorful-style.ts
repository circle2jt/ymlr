import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { type Level } from '../../level'
import { LevelFactory } from '../../level-factory'
import { type LogMetaData, type LogStyle } from './log-style'

export default class ColorfulStyle implements LogStyle {
  private getColorLevel(level: Level) {
    switch (level.name.toString()) {
      case 'trace':
        return level.iconColor
      case 'debug':
        return level.iconColor
      case 'info':
        return level.iconColor
      case 'pass':
        return level.iconColor
      case 'warn':
        return level.iconColor
      case 'fail':
        return level.iconColor
      case 'error':
        return level.iconColor
      case 'fatal':
        return level.iconColor
      case 'secret':
        return level.iconColor
      default:
        return level.iconColor
    }
  }

  print(printToConsole: (...args: any[]) => any, meta: LogMetaData, msg: string | any, ...prms: any) {
    const formater = LevelFactory.GetInstance(meta.level)
    const level = this.getColorLevel(formater)
    if (!meta.plainLog) {
      const threadID = meta.threadID ? `${chalk.gray.dim(meta.threadID)} ` : ''
      const timestamp = meta.timestamp ? `${chalk.gray(UtilityFunctionManager.Instance.format.date(meta.timestamp, 'YYYYMMDD hh:mm:ss.ms'))} ` : ''
      const indentString = meta.indent.indentString ? `${chalk.gray.dim(meta.indent.indentString)}` : ''
      if (typeof msg !== 'object') {
        const fullContextPath = meta.fullContextPath ? ` ${chalk.gray.dim.italic(meta.fullContextPath)}` : ''
        printToConsole(`${threadID}${timestamp}${level} ${indentString}${formater.format(msg)}`, ...prms, `\t${fullContextPath}`)
        return
      }
      const fullContextPath = meta.fullContextPath ? `${chalk.gray.dim.italic(meta.fullContextPath)}` : ''
      printToConsole(`${threadID}${timestamp}${level} ${indentString}${formater.format('%o')}`, msg, ...prms, `\t${fullContextPath}`)
      // printToConsole(`%s %s %s %s \t %s\n${formater.format('%o')}`,
      //   threadID,
      //   timestamp,
      //   level,
      //   indentString,
      //   fullContextPath,
      //   msg,
      //   ...prms)
      return
    }
    if (typeof msg === 'string') {
      printToConsole(formater.format(msg), ...prms)
      return
    }
    printToConsole(formater.format('%o'), msg, ...prms)
  }
}
