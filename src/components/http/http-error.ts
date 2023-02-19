export class HttpError extends Error {
  constructor(public status?: number, msg?: string, public data?: any) {
    super(msg)
  }
}
