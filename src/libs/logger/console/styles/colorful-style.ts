import chalk from 'chalk'
import { UtilityFunctionManager } from 'src/managers/utility-function-manager'
import { LevelFactory } from '../../level-factory'
import { type LogMetaData, type LogStyle } from './log-style'

export default class ColorfulStyle implements LogStyle {
  print(printToConsole: (...args: any[]) => any, meta: LogMetaData, msg: string | any, ...prms: any) {
    const threadID = chalk.gray.dim(meta.threadID)
    const timestamp = chalk.gray(UtilityFunctionManager.Instance.format.date(meta.timestamp, 'hh:mm:ss.ms'))
    const level = LevelFactory.GetInstance(meta.level).icon
    const indentString = meta.indent.indentString
    const fullContextPath = chalk.gray.dim.italic(meta.fullContextPath)
    const formater = LevelFactory.GetInstance(meta.level)
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
  }
}
