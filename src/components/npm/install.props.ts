import { ElementProps } from '../element.props'

export type PackageInstall = Record<string, string>
export type InstallProps = string | Array<string | PackageInstall> | {
  packages: Array<string | PackageInstall>
} & ElementProps
