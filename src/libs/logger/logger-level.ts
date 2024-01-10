export enum LoggerLevel {
  log = -1,
  all = 1,
  trace = 2,
  debug = 4,
  info = 6,
  warn = 8,
  error = 10,
  fatal = 11,
  silent = 12
}

export function GetLoggerLevel(name: string | number): LoggerLevel {
  return LoggerLevel[name as any] as any
}
