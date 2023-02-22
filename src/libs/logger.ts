import chalk from 'chalk'

export enum LoggerLevel {
  ALL = 'trace',
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  SILENT = 'silent',
}

const Mapping = {
  all: 1,
  trace: 2,
  debug: 4,
  info: 6,
  warn: 8,
  error: 10,
  fatal: 11,
  silent: 12
}

const Icon = {
  info: chalk.green('✔'),
  warn: chalk.yellow('⚠️'),
  error: chalk.red('✘'),
  fatal: chalk.red('❌'),
  trace: chalk.magenta('˖'),
  debug: '',
  others: '╎ ',
  debugBlock: {
    begin: chalk.red.dim('┌'),
    end: chalk.red.dim('└')
  }
}

const MappingValue = Object.keys(Mapping).reduce<Record<number, LoggerLevel>>((sum, e: any) => {
  // @ts-expect-error
  const lvNum = Mapping[e]
  sum[lvNum] = e
  return sum
}, {})

export class Logger {
  private static _globalName = ''

  // eslint-disable-next-line accessor-pairs
  static set globalName(gname: string) {
    this._globalName = chalk.gray(` \t#${gname}`)
  }

  level = Mapping.all
  indentString = ''
  get levelName() {
    return MappingValue[this.level]
  }

  constructor(level: LoggerLevel | number, public context = '', public indent = 0) {
    this.setLevel(level)
    if (this.indent) this.updateIndent(this.indent)
  }

  is(level: LoggerLevel) {
    const lv = typeof level === 'number' ? level : Mapping[level]
    return lv !== Mapping.silent ? (this.level <= lv) : (this.level === lv)
  }

  clone(context?: string, level?: LoggerLevel) {
    return new Logger(level || this.level, context || this.context, this.indent)
  }

  updateIndent(indent: number) {
    this.indent = indent
    this.indentString = this.getIndentString(this.indent)
  }

  addIndent(indent = 1) {
    this.updateIndent(this.indent + indent)
  }

  removeIndent(indent = 1) {
    this.updateIndent(this.indent - indent)
  }

  getIndentString(indent: number) {
    const str = new Array(indent).fill(Icon.others).join('')
    return str && chalk.gray.dim(str)
  }

  formatWithoutIndent(msg: string, level?: LoggerLevel) {
    const sp = msg ? ' ' : ''
    switch (level) {
      case LoggerLevel.INFO:
        return `${Icon.info}${sp}${msg} ${Logger._globalName}`
      case LoggerLevel.WARN:
        return `${Icon.warn}${sp}${msg} ${Logger._globalName}`
      case LoggerLevel.ERROR:
        return `${Icon.error}${sp}${msg} ${Logger._globalName}`
      case LoggerLevel.FATAL:
        return `${Icon.fatal}${sp}${msg} ${Logger._globalName}`
      case LoggerLevel.TRACE:
        return `${Icon.trace}${sp}${chalk.magenta(msg)} ${Logger._globalName}`
      case LoggerLevel.DEBUG:
        return `${Icon.debug}${chalk.gray(`${msg}`)} ${Logger._globalName}`
    }
    return `${msg}`
  }

  format(msg: string, level?: LoggerLevel) {
    return `${this.indentString}${this.formatWithoutIndent(msg, level)}`
  }

  setLevel(level: LoggerLevel | number) {
    const lv = typeof level === 'number' ? level : Mapping[level]
    if (lv !== null && lv !== undefined) this.level = lv
  }

  print(...args: any) {
    console.log(...args)
  }

  debugBlock(isStart: boolean, msg = this.context || '', ...prms: any) {
    if (!this.is(LoggerLevel.DEBUG)) return
    if (isStart) {
      this.print(`${this.indentString}%s %s`, Icon.debugBlock.begin, chalk.bgRed.dim('▾ ' + msg), ...prms)
      this.addIndent()
    } else {
      this.removeIndent()
      this.print(`${this.indentString}%s`, Icon.debugBlock.end)
    }
  }

  log(msg: any, ...prms: any) {
    if (!this.is(LoggerLevel.SILENT)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string) => {
          this.print(`${this.indentString}${msg}`, ...prms)
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.indentString}${msg}`, ...prms)
      }
    }
    return this
  }

  info(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.INFO)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.INFO)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.INFO)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }

  debug(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.DEBUG)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.DEBUG)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.DEBUG)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }

  warn(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.WARN)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.WARN)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.WARN)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }

  trace(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.TRACE)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.TRACE)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.TRACE)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }

  error(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.ERROR)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.ERROR)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.ERROR)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }

  fatal(msg: any, ...prms: any) {
    if (this.is(LoggerLevel.ERROR)) {
      if (typeof msg === 'string') {
        msg.split('\n').forEach((msg: string, i: number) => {
          msg = (i === 0 ? '' : '  ') + msg
          this.print(`${this.format(msg, i !== 0 ? undefined : LoggerLevel.FATAL)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
        })
      } else {
        prms.splice(0, 0, msg)
        msg = '%j'
        this.print(`${this.format(msg, LoggerLevel.FATAL)}`, ...prms) //, (!this.context || !msg) ? '' : chalk.italic.gray.dim(`[${ this.context }]`))
      }
    }
    return this
  }
}
