export interface IVerify {
  verify: (parentState: Record<string, any>) => boolean | number | Promise<boolean | number>
}
