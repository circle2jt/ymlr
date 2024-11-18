export enum LoggerCoreLevel {
  trace = 2,
  debug = 4,
  info = 6,
  pass = 7,
  warn = 8,
  error = 10,
  fail = 11,
  fatal = 12,
  secret = 14,
}

export enum LoggerLevel {
  all = 1,
  trace = LoggerCoreLevel.trace,
  debug = LoggerCoreLevel.debug,
  info = LoggerCoreLevel.info,
  pass = LoggerCoreLevel.pass,
  warn = LoggerCoreLevel.warn,
  error = LoggerCoreLevel.error,
  fail = LoggerCoreLevel.fail,
  fatal = LoggerCoreLevel.fatal,
  secret = LoggerCoreLevel.secret,
  silent = 16,
}

export function GetLoggerLevel(name: string | number) {
  const loggerLevel = (LoggerLevel as any)[name] as LoggerLevel
  if (!loggerLevel) {
    throw new Error(`Could not found logger level "${name}"`)
  }
  return loggerLevel
}
