export interface IVerify {
  verify: (userToken: string | undefined) => boolean | Promise<boolean>
}
