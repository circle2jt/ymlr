declare global {
  // eslint-disable-next-line no-var
  var inputIndent: string
  type Promisable<T> = Promise<T> | T
  function copyProps(object: any, ...sources: any[]): any
}

export { }
