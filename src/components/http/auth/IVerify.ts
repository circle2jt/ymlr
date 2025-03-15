export interface IVerify {
  verify: (
    parentState: any,
    vars: any,
    utils: any,
    cons: any,
    env: any,
    ps: any,
    v: any,
    u: any,
    c: any,
    e: any,
  ) => boolean | number | Promise<boolean | number>
}
