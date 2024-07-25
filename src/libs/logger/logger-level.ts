import chalk from 'chalk'

export enum LoggerLevel {
  all = 1,
  trace = 2,
  debug = 4,
  info = 6,
  warn = 8,
  error = 10,
  fatal = 11,
  silent = 12
}

const LoggerLevelName = {
  1: 'all  ',
  2: chalk.magenta('trace'),
  4: chalk.gray('debug'),
  6: chalk.green('info '),
  8: chalk.yellow('warn '),
  10: chalk.redBright('error'),
  11: chalk.red('fatal'),
  12: 'silent'
} as any

export function GetLoggerLevel(name: string | number): LoggerLevel {
  return LoggerLevel[name as any] as any
}

export function GetLoggerLevelName(name: number) {
  return LoggerLevelName[name.toString()]
}
