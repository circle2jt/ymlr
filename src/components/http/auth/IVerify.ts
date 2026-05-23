export interface IVerify {
  verify: (
    parentState: any,
    vars: any,
    utils: any,
    cons: any,
    env: any,
  ) => boolean | number | Promise<boolean | number>
}
