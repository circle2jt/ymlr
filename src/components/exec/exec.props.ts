import { type SpawnOptions } from 'child_process'

export type ExecProps = {
  commands: string[]
  opts?: SpawnOptions
  plainExecuteLog?: boolean
} | string[]
