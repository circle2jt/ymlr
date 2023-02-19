import { InputProps } from './input.props'

export type InputMultiSelectProps = {
  default?: any[]
  choices: Array<{ title: any, value: any }>
} & InputProps
